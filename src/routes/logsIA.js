const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Agente interno de auditoría (solo módulo Logs): pregunta en español →
// filtros estructurados → consulta indexada → resumen + evidencia + sugerencias.
// Sin dependencias externas (deterministico, rápido, auditable).
// ─────────────────────────────────────────────────────────────────────────────

const MODULOS_SISTEMA = {
  acreedores: 'Alta/actualización de acreedores (solicitudes, documentos fiscales, SAP)',
  proveedores: 'Gestión de proveedores (flujo, aprobaciones)',
  clientes: 'Clientes (tareas)',
  materiales: 'Materiales MDM (alta con layout Excel, validaciones, catálogo sincronizado desde ServiceNow, integración Rixie de imágenes, matriz de aprobadores)',
};

const SUGERENCIAS = [
  { patron: /credenciales|password|contrase|login fallido/i, texto: 'Fallos de login: verifica si son intentos repetidos de la misma IP (posible fuerza bruta). Considera bloquear al usuario o revisar si alguien olvidó su contraseña.' },
  { patron: /integracion|integraciones|rixie|concordia|api/i, texto: 'Errores de integración: revisa en el módulo Integraciones la colección afectada y prueba el endpoint con el botón "Probar". Si es 401, la API key cambió; si es timeout, el servicio externo está lento/caído.' },
  { patron: /sap/i, texto: 'Errores SAP: revisa la solicitud afectada; suele ser dato faltante (cuenta asociada, condición de pago) o SAP caído. Reenviar con el botón de la solicitud tras corregir.' },
  { patron: /servicenow|sync/i, texto: 'Errores de sync ServiceNow: revisa /materiales/sync/estado. Si es auth, las credenciales en Configuración → Integraciones caducaron.' },
  { patron: /excel|layout|validar/i, texto: 'Errores de validación de layout Excel: el usuario subió un archivo que no cumple las reglas de columnas del formulario mt_alta. Revisar "Excel Informacion" de esa solicitud.' },
  { patron: /timeout|tiempo/i, texto: 'Timeouts: servicio externo lento. Revisar salud de Concordia/ServiceNow y considerar reintentos.' },
];

function parsearPregunta(pregunta) {
  const q = pregunta.toLowerCase();
  const where = {};
  const ahora = new Date();
  const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);

  // Fechas
  if (/hoy/.test(q)) where.creadoEn = { gte: hoy };
  else if (/ayer/.test(q)) { const d = new Date(hoy); d.setDate(d.getDate() - 1); where.creadoEn = { gte: d, lt: hoy }; }
  else if (/semana/.test(q)) { const d = new Date(hoy); d.setDate(d.getDate() - 7); where.creadoEn = { gte: d }; }
  else if (/mes/.test(q)) { const d = new Date(hoy); d.setDate(d.getDate() - 30); where.creadoEn = { gte: d }; }
  else where.creadoEn = { gte: hoy }; // default: hoy

  // Nivel
  if (/error(es)?\b|fallo|fallaron/.test(q)) where.nivel = 'error';
  else if (/warning|warn|advertencia/.test(q)) where.nivel = 'warn';

  // Módulo
  for (const m of Object.keys(MODULOS_SISTEMA)) if (q.includes(m)) where.modulo = m;

  // Usuario por email
  const email = q.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) where.OR = [{ usuarioEmail: { contains: email[0], mode: 'insensitive' } }, { usuarioNombre: { contains: email[0].split('@')[0], mode: 'insensitive' } }];

  // Tipo
  if (/login|inicio de sesi/.test(q)) where.tipo = 'login';
  else if (/export/i.test(q)) where.tipo = 'tabla_dinamica';
  else if (/auditoria|edici|modific|cambi/.test(q) && /campo|registro|valor/.test(q)) where.tipo = 'auditoria';

  // Texto libre (buscar) — frase significativa restante
  const stopwords = ['de', 'del', 'la', 'el', 'los', 'las', 'en', 'que', 'hubo', 'hay', 'con', 'por', 'para', 'quien', 'quién', 'cuando', 'cuándo', 'hoy', 'ayer', 'semana', 'mes', 'error', 'errores', 'warning', 'muestrame', 'muéstrame', 'dime', 'busca', 'auditoria', 'auditoría', 'modulo', 'módulo', 'sistema', 'registro', 'registros'];
  const palabras = pregunta.replace(/[¿?¡!,.;:]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stopwords.includes(w.toLowerCase()) && !Object.keys(MODULOS_SISTEMA).includes(w.toLowerCase()));
  if (palabras.length && !email) {
    where.AND = [...(where.AND || []), { OR: [
      { accion: { contains: palabras[0], mode: 'insensitive' } },
      { detalle: { contains: palabras[0], mode: 'insensitive' } },
      { metadata: { contains: palabras[0], mode: 'insensitive' } },
    ] }];
  }
  return where;
}

// POST /api/logs/ai — agente de auditoría
router.post('/ai', async (req, res) => {
  try {
    const { pregunta } = req.body;
    if (!pregunta) return res.status(400).json({ error: 'pregunta requerida' });

    let where = parsearPregunta(pregunta);
    let total = await prisma.logSistema.count({ where });
    // Segundo pase: si el texto libre no trajo nada (acentos ES), reintentar sin él
    if (total === 0 && where.AND) {
      const { AND, ...sinTexto } = where;
      where = sinTexto;
      total = await prisma.logSistema.count({ where });
    }
    const [muestra, porNivel, porTipo, porUsuario] = await Promise.all([
      prisma.logSistema.findMany({ where, orderBy: { creadoEn: 'desc' }, take: 15 }),
      prisma.logSistema.groupBy({ by: ['nivel'], where, _count: true }),
      prisma.logSistema.groupBy({ by: ['tipo'], where, _count: true, orderBy: { _count: { tipo: 'desc' } } }),
      prisma.logSistema.groupBy({ by: ['usuarioNombre'], where: { ...where, usuarioNombre: { not: null } }, _count: true, orderBy: { _count: { usuarioNombre: 'desc' } } }),
    ]);

    // Sugerencias según patrones de la pregunta + errores hallados
    const sugerencias = [];
    for (const s of SUGERENCIAS) if (s.patron.test(pregunta)) sugerencias.push(s.texto);
    const hayErrores = porNivel.find((n) => n.nivel === 'error')?._count > 0;
    if (hayErrores && !sugerencias.length) {
      const tipos = porTipo.slice(0, 3).map((t) => t.tipo).join(', ');
      sugerencias.push(`Los errores se concentran en: ${tipos}. Revisa primero el tipo más frecuente y su detalle.`);
    }

    res.json({
      pregunta,
      interpretacion: where,
      total,
      resumen: {
        porNivel: Object.fromEntries(porNivel.map((n) => [n.nivel, n._count])),
        porTipo: porTipo.slice(0, 5).map((t) => ({ tipo: t.tipo, n: t._count })),
        topUsuarios: porUsuario.slice(0, 5).map((u) => ({ usuario: u.usuarioNombre, n: u._count })),
      },
      evidencia: muestra.map((l) => ({
        id: l.id, cuando: l.creadoEn, nivel: l.nivel, tipo: l.tipo, modulo: l.modulo,
        accion: l.accion, detalle: l.detalle?.slice(0, 300), usuario: l.usuarioNombre || l.usuarioEmail, ip: l.ipAddress,
        metadata: (() => { try { return JSON.parse(l.metadata || 'null'); } catch { return l.metadata?.slice(0, 300); } })(),
      })),
      sugerencias,
      modulosConocidos: MODULOS_SISTEMA,
    });
  } catch (e) {
    console.error('[LogsIA] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
