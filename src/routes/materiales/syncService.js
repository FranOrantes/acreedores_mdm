const prisma = require('../../lib/prisma');
const config = require('./configService');

// ─────────────────────────────────────────────────────────────────────────────
// Sync del catálogo de materiales desde ServiceNow (u_mdm_registros).
// SOLO LECTURA en SN. full = re-lee todo (upsert); delta = solo sys_updated_on
// posteriores al último sync exitoso.
// ─────────────────────────────────────────────────────────────────────────────

// Tablas sincronizadas de ServiceNow (SOLO GET). full/delta comparten scheduler y bitácora.
const TABLAS_SYNC = [
  {
    clave: 'registros',
    tablaSN: 'u_mdm_registros',
    query: 'u_mt_tipo_de_solicitud=Alta^u_mt_no_materia!=NULL',
    modelo: 'materialesRegistro',
    mapear: (r, u) => ({
      sysId: u(r.sys_id),
      noMateria: String(u(r.u_mt_no_materia)),
      nombre: u(r.u_mt_nombre) || null,
      estatus: u(r.u_mt_estatus) || null,
      tipoSolicitud: u(r.u_mt_tipo_de_solicitud) || null,
      eanPi: u(r.u_mt_pi_ean) || null,
      razonSocial: u(r.u_lab_razon_social) || null,
    }),
  },
  {
    clave: 'options',
    tablaSN: 'u_mdm_options',
    query: '',
    modelo: 'materialesOption',
    mapear: (r, u) => ({
      sysId: u(r.sys_id),
      clave: String(u(r.u_key)),
      valor: u(r.u_value) || null,
      etiqueta: u(r.u_labe) || null,
    }),
  },
  {
    clave: 'matriz',
    tablaSN: 'u_matriz_area_aprobadores',
    query: 'u_proyecto=MDM',
    modelo: 'materialesMatrizAprobador',
    mapear: (r, u) => ({
      sysId: u(r.sys_id),
      comprador: u(r.u_comprador) || null,
      negociador: u(r.u_negociador) || null,
      dga: u(r.u_dga) || null,
      proyecto: u(r.u_proyecto) || null,
    }),
  },
];

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
    raw: aplanar(r), // plano: clave → display value
  };
}

async function extraerPagina(cred, tablaSN, query, offset) {
  const params = new URLSearchParams({
    sysparm_query: (query ? query + '^' : '') + 'ORDERBYsys_id',
    sysparm_limit: String(cred.pageSize),
    sysparm_offset: String(offset),
    sysparm_display_value: 'true', // display value directo cuando es legible (con ACL de solo link)
  });
  const resp = await fetch(`${cred.baseUrl}/api/now/table/${tablaSN}?${params}`, {
    headers: { Accept: 'application/json', Authorization: cred.auth },
  });
  if (!resp.ok) throw new Error(`SN HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  return (await resp.json()).result || [];
}

// Aplana el registro SN: raw[clave] = display_value || value (texto legible para filtros/lista)
function aplanar(r) {
  const plano = {};
  for (const [k, v] of Object.entries(r)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      plano[k] = v.display_value ?? v.value ?? (v.link ? v.link.split('/').pop() : '');
    }
    else plano[k] = v ?? '';
  }
  return plano;
}

async function runSync(tipo) {
  if (corriendo) throw new Error(`Ya hay un sync corriendo (${corriendo.tipo}, página ${corriendo.pagina})`);

  const log = await prisma.materialesSyncLog.create({ data: { tipo } });
  const estado = { logId: log.id, tipo, pagina: 0, tabla: '' }; // estado por corrida (no compartido)
  corriendo = estado;

  // Fire and forget
  (async () => {
    const cred = await credenciales();
    let totalGlobal = 0;

    for (const cfg of TABLAS_SYNC) {
      estado.tabla = cfg.clave;
      let offset = 0;
      let query = cfg.query;

      if (tipo === 'delta') {
        const ultimo = await prisma.materialesSyncLog.findFirst({
          where: { estado: 'ok' },
          orderBy: { inicio: 'desc' },
        });
        const desde = ultimo?.inicio || new Date(0);
        const f = desde.toISOString().replace('T', ' ').slice(0, 19);
        query = (query ? query + '^' : '') + `sys_updated_on>${f}`;
      }

      while (true) {
        const rows = await extraerPagina(cred, cfg.tablaSN, query, offset);
        if (rows.length === 0) break;
        estado.pagina = offset / cred.pageSize + 1;

        const ahora = new Date().toISOString();
        const u = (v) => (v && typeof v === 'object' ? (v.value ?? v.display_value ?? '') : (v ?? ''));
        const lote = rows.map((r) => {
          const m = cfg.mapear(r, u);
          const fecha = new Date(u(r.sys_updated_on) || '');
          return {
            ...m,
            sysUpdatedOn: isNaN(fecha) ? ahora : fecha.toISOString(),
            raw: aplanar(r),
            creadoEn: ahora,
            actualizadoEn: ahora,
          };
        }).filter((m) => m.sysId);
        // Upsert genérico por sysId vía jsonb_populate_recordset
        if (lote.length) {
          const tabla = cfg.modelo === 'materialesRegistro' ? 'materiales_registros'
            : cfg.modelo === 'materialesOption' ? 'materiales_options'
            : 'materiales_matriz_aprobadores';
          const cols = Object.keys(lote[0]);
          const colsSql = cols.map((c) => `"${c}"`).join(', ');
          const updateCols = cols.filter((c) => !['sysId', 'creadoEn'].includes(c));
          const setSql = updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');
          await prisma.$executeRawUnsafe(
            `INSERT INTO "${tabla}" (${colsSql}) SELECT * FROM jsonb_populate_recordset(null::"${tabla}", $1::jsonb) ON CONFLICT ("sysId") DO UPDATE SET ${setSql}`,
            JSON.stringify(lote)
          );
        }
        totalGlobal += rows.length;
        await prisma.materialesSyncLog.update({ where: { id: log.id }, data: { registros: totalGlobal } });
        if (rows.length < cred.pageSize) break;
        offset += cred.pageSize;
      }
    }

    await prisma.materialesSyncLog.update({
      where: { id: log.id },
      data: { estado: 'ok', registros: totalGlobal, fin: new Date() },
    });
    console.log(`[Sync Materiales] ${tipo} terminado: ${totalGlobal} registros (todas las tablas)`);
  })()
    .catch(async (err) => {
      console.error('[Sync Materiales] Error:', err.message);
      await prisma.materialesSyncLog.update({
        where: { id: log.id },
        data: { estado: 'error', error: err.message, fin: new Date() },
      }).catch(() => {});
    })
    .finally(() => { if (corriendo === estado) corriendo = null; });

  return log;
}


module.exports = { runSync, estadoCorriendo: () => corriendo };
