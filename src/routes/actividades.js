const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/actividades?entidadTipo=solicitud&entidadId=xxx
router.get('/', async (req, res) => {
  const { entidadTipo, entidadId } = req.query;
  if (!entidadTipo || !entidadId) {
    return res.status(400).json({ error: 'entidadTipo y entidadId son requeridos' });
  }
  try {
    const data = await prisma.actividad.findMany({
      where: { entidadTipo, entidadId },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/actividades — crear comentario
router.post('/', async (req, res) => {
  const { entidadTipo, entidadId, contenido, visibleCliente, autorNombre, autorEmail } = req.body;
  if (!entidadTipo || !entidadId || !contenido) {
    return res.status(400).json({ error: 'entidadTipo, entidadId y contenido son requeridos' });
  }
  try {
    const actividad = await prisma.actividad.create({
      data: {
        entidadTipo,
        entidadId,
        tipo: 'comentario',
        contenido,
        visibleCliente: visibleCliente || false,
        autorNombre: autorNombre || null,
        autorEmail: autorEmail || null,
      },
    });
    res.status(201).json(actividad);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
