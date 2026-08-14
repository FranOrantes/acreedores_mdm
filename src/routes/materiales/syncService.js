const prisma = require('../../lib/prisma');
const config = require('./configService');

// ─────────────────────────────────────────────────────────────────────────────
// Sync del catálogo de materiales desde ServiceNow (u_mdm_registros).
// SOLO LECTURA en SN. full = re-lee todo (upsert); delta = solo sys_updated_on
// posteriores al último sync exitoso.
// ─────────────────────────────────────────────────────────────────────────────

const QUERY_BASE = 'u_mt_tipo_de_solicitud=Alta^u_mt_no_materia!=NULL';
let corriendo = null; // { logId, tipo, pagina }

async function credenciales() {
  const [baseUrl, user, password, pageSize] = await Promise.all([
    config.get('integracion.servicenow.base_url'),
    config.get('integracion.servicenow.user'),
    config.get('integracion.servicenow.password'),
    config.get('sync.page_size'),
  ]);
  if (!user || !password) throw new Error('Credenciales de ServiceNow no configuradas (módulo Configuración → Integraciones)');
  return {
    baseUrl,
    auth: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'),
    pageSize: Number(pageSize) || 500,
  };
}

function mapear(r) {
  const u = (v) => (v && typeof v === 'object' ? (v.value ?? v.display_value ?? '') : (v ?? ''));
  return {
    sysId: u(r.sys_id),
    noMateria: String(u(r.u_mt_no_materia)),
    nombre: u(r.u_mt_nombre) || null,
    estatus: u(r.u_mt_estatus) || null,
    tipoSolicitud: u(r.u_mt_tipo_de_solicitud) || null,
    eanPi: u(r.u_mt_pi_ean) || null,
    razonSocial: u(r.u_lab_razon_social) || null,
    sysUpdatedOn: new Date(u(r.sys_updated_on)),
    raw: r,
  };
}

async function extraerPagina(cred, query, offset) {
  const params = new URLSearchParams({
    sysparm_query: query + '^ORDERBYsys_id',
    sysparm_limit: String(cred.pageSize),
    sysparm_offset: String(offset),
  });
  const resp = await fetch(`${cred.baseUrl}/api/now/table/u_mdm_registros?${params}`, {
    headers: { Accept: 'application/json', Authorization: cred.auth },
  });
  if (!resp.ok) throw new Error(`SN HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  return (await resp.json()).result || [];
}

async function runSync(tipo) {
  if (corriendo) throw new Error(`Ya hay un sync corriendo (${corriendo.tipo}, página ${corriendo.pagina})`);

  const log = await prisma.materialesSyncLog.create({ data: { tipo } });
  corriendo = { logId: log.id, tipo, pagina: 0 };

  // Fire and forget
  (async () => {
    const cred = await credenciales();
    let total = 0;
    let offset = 0;
    let query = QUERY_BASE;

    if (tipo === 'delta') {
      const ultimo = await prisma.materialesSyncLog.findFirst({
        where: { estado: 'ok' },
        orderBy: { inicio: 'desc' },
      });
      const desde = ultimo?.inicio || new Date(0);
      const f = desde.toISOString().replace('T', ' ').slice(0, 19);
      query += `^sys_updated_on>${f}`;
    }

    while (true) {
      const rows = await extraerPagina(cred, query, offset);
      if (rows.length === 0) break;
      corriendo.pagina = offset / cred.pageSize + 1;

      // Upsert en lote (1 query por página — ON CONFLICT)
      const mapeados = rows.map(mapear);
      await prisma.$executeRaw`
        INSERT INTO "materiales_registros" ("sysId", "noMateria", "nombre", "estatus", "tipoSolicitud", "eanPi", "razonSocial", "sysUpdatedOn", "raw", "actualizadoEn")
        SELECT * FROM UNNEST(
          ${mapeados.map((m) => m.sysId)}::text[],
          ${mapeados.map((m) => m.noMateria)}::text[],
          ${mapeados.map((m) => m.nombre)}::text[],
          ${mapeados.map((m) => m.estatus)}::text[],
          ${mapeados.map((m) => m.tipoSolicitud)}::text[],
          ${mapeados.map((m) => m.eanPi)}::text[],
          ${mapeados.map((m) => m.razonSocial)}::text[],
          ${mapeados.map((m) => m.sysUpdatedOn)}::timestamp[],
          ${mapeados.map((m) => JSON.stringify(m.raw))}::jsonb[],
          ${mapeados.map(() => new Date())}::timestamp[]
        )
        ON CONFLICT ("sysId") DO UPDATE SET
          "noMateria" = EXCLUDED."noMateria",
          "nombre" = EXCLUDED."nombre",
          "estatus" = EXCLUDED."estatus",
          "tipoSolicitud" = EXCLUDED."tipoSolicitud",
          "eanPi" = EXCLUDED."eanPi",
          "razonSocial" = EXCLUDED."razonSocial",
          "sysUpdatedOn" = EXCLUDED."sysUpdatedOn",
          "raw" = EXCLUDED."raw",
          "actualizadoEn" = EXCLUDED."actualizadoEn"
      `
      total += rows.length;
      await prisma.materialesSyncLog.update({ where: { id: log.id }, data: { registros: total } });
      if (rows.length < cred.pageSize) break;
      offset += cred.pageSize;
    }

    await prisma.materialesSyncLog.update({
      where: { id: log.id },
      data: { estado: 'ok', registros: total, fin: new Date() },
    });
    console.log(`[Sync Materiales] ${tipo} terminado: ${total} registros`);
  })()
    .catch(async (err) => {
      console.error('[Sync Materiales] Error:', err.message);
      await prisma.materialesSyncLog.update({
        where: { id: log.id },
        data: { estado: 'error', error: err.message, fin: new Date() },
      }).catch(() => {});
    })
    .finally(() => { corriendo = null; });

  return log;
}

module.exports = { runSync, estadoCorriendo: () => corriendo };
