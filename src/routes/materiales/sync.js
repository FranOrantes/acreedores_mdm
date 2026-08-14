const { Router } = require('express');
const cron = require('node-cron');
const prisma = require('../../lib/prisma');
const config = require('./configService');
const syncService = require('./syncService');

const router = Router();

// ── Sync del catálogo de materiales desde ServiceNow ──

// POST /api/materiales/sync/run { tipo: 'full' | 'delta' } — dispara en background
router.post('/sync/run', async (req, res) => {
  try {
    const tipo = req.body?.tipo === 'delta' ? 'delta' : 'full';
    const log = await syncService.runSync(tipo);
    res.status(202).json({ ok: true, logId: log.id, tipo });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// GET /api/materiales/sync/estado — corridas recientes + si hay una corriendo
router.get('/sync/estado', async (req, res) => {
  try {
    const [ultimas, total] = await Promise.all([
      prisma.materialesSyncLog.findMany({ orderBy: { inicio: 'desc' }, take: 10 }),
      prisma.materialesRegistro.count(),
    ]);
    res.json({ corriendo: syncService.estadoCorriendo(), totalCatalogo: total, ultimas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materiales/registros — catálogo sincronizado (paginado + búsqueda)
router.get('/registros', async (req, res) => {
  try {
    const { buscar, estatus, page = 1, limit = 50 } = req.query;
    const where = {};
    if (estatus) where.estatus = estatus;
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { noMateria: { contains: buscar } },
        { eanPi: { contains: buscar } },
        { razonSocial: { contains: buscar, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.materialesRegistro.findMany({
        where,
        orderBy: { noMateria: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: { sysId: true, noMateria: true, nombre: true, estatus: true, eanPi: true, razonSocial: true, sysUpdatedOn: true },
      }),
      prisma.materialesRegistro.count({ where }),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materiales/registros/:sysId — detalle completo (raw 293 campos)
router.get('/registros/:sysId', async (req, res) => {
  try {
    const data = await prisma.materialesRegistro.findUnique({ where: { sysId: req.params.sysId } });
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Scheduler: upsert completo 11pm diario + delta cada hora (configurable) ──
let tareas = [];
async function programar() {
  tareas.forEach((t) => t.stop());
  tareas = [];
  const [fullCron, deltaCron] = await Promise.all([
    config.get('sync.full_cron'),
    config.get('sync.delta_cron'),
  ]);
  if (cron.validate(fullCron)) {
    tareas.push(cron.schedule(fullCron, () => syncService.runSync('full').catch((e) => console.error('[Sync]', e.message))));
    console.log(`[Sync Materiales] full programado: ${fullCron}`);
  }
  if (cron.validate(deltaCron)) {
    tareas.push(cron.schedule(deltaCron, () => syncService.runSync('delta').catch((e) => console.error('[Sync]', e.message))));
    console.log(`[Sync Materiales] delta programado: ${deltaCron}`);
  }
}
programar().catch((e) => console.error('[Sync Materiales] scheduler:', e.message));

// POST /api/materiales/sync/reprogramar — releer crons de Configuración sin reiniciar
router.post('/sync/reprogramar', async (req, res) => {
  await programar();
  res.json({ ok: true });
});

module.exports = router;
