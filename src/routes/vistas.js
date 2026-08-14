const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Vistas de formulario (estilo SN form views): layout por nombre, por tabla o formulario.

// GET /api/vistas?tablaId= | formularioClave=
router.get('/', async (req, res) => {
  const { tablaId, formularioClave } = req.query;
  const where = {};
  if (tablaId) where.tablaId = tablaId;
  if (formularioClave) where.formularioClave = formularioClave;
  const data = await prisma.vistaFormulario.findMany({ where, orderBy: { creadoEn: 'asc' } });
  res.json(data);
});

// POST /api/vistas
router.post('/', async (req, res) => {
  const { tablaId, formularioClave, nombre, layout, esDefault, roles } = req.body;
  if (!nombre || !layout) return res.status(400).json({ error: 'nombre y layout son requeridos' });
  if (esDefault) {
    await prisma.vistaFormulario.updateMany({
      where: { OR: [{ tablaId: tablaId || undefined }, { formularioClave: formularioClave || undefined }] },
      data: { esDefault: false },
    });
  }
  const data = await prisma.vistaFormulario.create({
    data: { tablaId, formularioClave, nombre, layout, esDefault: !!esDefault, roles: roles || [] },
  });
  res.status(201).json(data);
});

// PUT /api/vistas/:id
router.put('/:id', async (req, res) => {
  const { nombre, layout, esDefault, roles } = req.body;
  const actual = await prisma.vistaFormulario.findUnique({ where: { id: req.params.id } });
  if (!actual) return res.status(404).json({ error: 'No encontrada' });
  if (esDefault) {
    await prisma.vistaFormulario.updateMany({
      where: { OR: [{ tablaId: actual.tablaId || undefined }, { formularioClave: actual.formularioClave || undefined }], NOT: { id: actual.id } },
      data: { esDefault: false },
    });
  }
  const data = await prisma.vistaFormulario.update({
    where: { id: req.params.id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(layout !== undefined && { layout }),
      ...(esDefault !== undefined && { esDefault }),
      ...(roles !== undefined && { roles }),
    },
  });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.vistaFormulario.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
