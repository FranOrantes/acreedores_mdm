const express = require('express');
const prisma = require('../lib/prisma');
const engine = require('../lib/scriptEngine');

const router = express.Router();

// ── Business Rules: CRUD + prueba ──

// GET /api/business-rules — listar (filtros: entidad, evento, modulo)
router.get('/', async (req, res) => {
  try {
    const { entidad, evento, modulo } = req.query;
    const where = {};
    if (entidad) where.entidad = entidad;
    if (evento) where.evento = evento;
    if (modulo) where.modulo = { in: [modulo, 'todos'] };
    const data = await prisma.businessRule.findMany({
      where,
      select: { id: true, nombre: true, descripcion: true, entidad: true, evento: true, condiciones: true, logica: true, orden: true, activo: true, modulo: true, actualizadoEn: true, script: true },
      orderBy: [{ entidad: 'asc' }, { evento: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.businessRule.findUnique({ where: { id: req.params.id } });
    if (!data) return res.status(404).json({ error: 'No encontrada' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/business-rules — crear
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, entidad, evento, condiciones, logica, script, orden, modulo, dominioId } = req.body;
    if (!nombre || !entidad || !evento) return res.status(400).json({ error: 'nombre, entidad y evento son requeridos' });
    const data = await prisma.businessRule.create({
      data: { nombre, descripcion, entidad, evento, condiciones, logica: logica || 'AND', script, orden: orden ?? 0, modulo: modulo || 'todos', dominioId },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/business-rules/:id
router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, entidad, evento, condiciones, logica, script, orden, activo, modulo, dominioId } = req.body;
    const data = await prisma.businessRule.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(entidad !== undefined && { entidad }),
        ...(evento !== undefined && { evento }),
        ...(condiciones !== undefined && { condiciones }),
        ...(logica !== undefined && { logica }),
        ...(script !== undefined && { script }),
        ...(orden !== undefined && { orden }),
        ...(activo !== undefined && { activo }),
        ...(modulo !== undefined && { modulo }),
        ...(dominioId !== undefined && { dominioId }),
      },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.businessRule.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/business-rules/probar — simular ejecución contra datos de prueba
// Body: { entidad, evento, datos, modulo? } — ejecuta las reglas activas y devuelve logs + datos resultantes
router.post('/probar', async (req, res) => {
  try {
    const { entidad, evento, datos, modulo } = req.body;
    if (!entidad || !evento) return res.status(400).json({ error: 'entidad y evento son requeridos' });
    const resultado = await engine.ejecutarBusinessRules({ entidad, evento, datos: datos || {}, modulo });
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
