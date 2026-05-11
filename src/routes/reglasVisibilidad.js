const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/reglas-visibilidad — listar reglas activas (para el formulario)
router.get('/', async (req, res) => {
  try {
    const { formulario } = req.query;
    const where = { activo: true };
    if (formulario) {
      where.OR = [{ formulario }, { formulario: 'ambos' }];
    }
    const data = await prisma.reglaVisibilidadCampo.findMany({
      where,
      orderBy: [{ campo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    console.error('[ReglasVisibilidad] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reglas-visibilidad/all — listar TODAS (admin, incluye inactivas)
router.get('/all', async (req, res) => {
  try {
    const data = await prisma.reglaVisibilidadCampo.findMany({
      orderBy: [{ campo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reglas-visibilidad — crear regla
router.post('/', async (req, res) => {
  try {
    const { campo, condiciones, accion, obligatorio, formulario, orden } = req.body;
    if (!campo || !condiciones) {
      return res.status(400).json({ error: 'campo y condiciones son requeridos' });
    }
    const data = await prisma.reglaVisibilidadCampo.create({
      data: {
        campo,
        condiciones,
        accion: accion || 'mostrar',
        obligatorio: obligatorio || false,
        formulario: formulario || 'alta',
        orden: orden || 0,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[ReglasVisibilidad] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/reglas-visibilidad/:id — actualizar regla
router.patch('/:id', async (req, res) => {
  try {
    const { campo, condiciones, accion, obligatorio, formulario, orden, activo } = req.body;
    const updateData = {};
    if (campo !== undefined) updateData.campo = campo;
    if (condiciones !== undefined) updateData.condiciones = condiciones;
    if (accion !== undefined) updateData.accion = accion;
    if (obligatorio !== undefined) updateData.obligatorio = obligatorio;
    if (formulario !== undefined) updateData.formulario = formulario;
    if (orden !== undefined) updateData.orden = orden;
    if (activo !== undefined) updateData.activo = activo;

    const data = await prisma.reglaVisibilidadCampo.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/reglas-visibilidad/:id — eliminar regla
router.delete('/:id', async (req, res) => {
  try {
    await prisma.reglaVisibilidadCampo.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
