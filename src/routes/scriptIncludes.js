const express = require('express');
const prisma = require('../lib/prisma');
const engine = require('../lib/scriptEngine');

const router = express.Router();

// ── Script Includes: CRUD + ejecución ──

// GET /api/script-includes — listar (sin script completo)
router.get('/', async (req, res) => {
  try {
    const data = await prisma.scriptInclude.findMany({
      select: { id: true, nombre: true, descripcion: true, modulo: true, activo: true, actualizadoEn: true, actualizadoPor: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/script-includes/:id — detalle con script
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.scriptInclude.findUnique({ where: { id: req.params.id } });
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/script-includes — crear
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, script, modulo, usuario } = req.body;
    if (!nombre || !script) return res.status(400).json({ error: 'nombre y script son requeridos' });
    const data = await prisma.scriptInclude.create({
      data: { nombre, descripcion, script, modulo: modulo || 'todos', creadoPor: usuario || null },
    });
    engine.invalidarInclude(nombre);
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/script-includes/:id — actualizar (invalida caché → aplica al momento)
router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, script, modulo, activo, usuario } = req.body;
    const data = await prisma.scriptInclude.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(script !== undefined && { script }),
        ...(modulo !== undefined && { modulo }),
        ...(activo !== undefined && { activo }),
        actualizadoPor: usuario || null,
      },
    });
    engine.invalidarInclude(data.nombre);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/script-includes/:id
router.delete('/:id', async (req, res) => {
  try {
    const data = await prisma.scriptInclude.delete({ where: { id: req.params.id } });
    engine.invalidarInclude(data.nombre);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/script-includes/probar — ejecutar script sin guardar (consola de pruebas)
// Body: { script, params? }
router.post('/probar', async (req, res) => {
  try {
    const { script, params } = req.body;
    if (!script) return res.status(400).json({ error: 'script requerido' });
    const { resultado, logs } = await engine.runScript(script, {
      params: params || {},
      prisma,
      callScriptInclude: engine.callScriptInclude,
    });
    res.json({ ok: true, resultado, logs });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// POST /api/script-includes/llamar/:nombre/:metodo — invocar include guardado
// Body: { params? }
router.post('/llamar/:nombre/:metodo', async (req, res) => {
  try {
    const resultado = await engine.callScriptInclude(req.params.nombre, req.params.metodo, req.body?.params || {});
    res.json({ ok: true, resultado });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;
