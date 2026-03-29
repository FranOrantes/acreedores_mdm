const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/tipos-aprobacion — listar todos (con relaciones)
router.get('/', async (req, res) => {
  try {
    const data = await prisma.tipoAprobacion.findMany({
      include: {
        grupoAsignado: { select: { id: true, nombre: true } },
        aprobadorAsignado: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { orden: 'asc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tipos-aprobacion/:id — obtener uno
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.tipoAprobacion.findUnique({
      where: { id: req.params.id },
      include: {
        grupoAsignado: { select: { id: true, nombre: true } },
        aprobadorAsignado: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tipos-aprobacion — crear (auto-calcula orden)
router.post('/', async (req, res) => {
  try {
    const { nombre, tipo, grupoAsignadoId, aprobadorAsignadoId } = req.body;
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'nombre y tipo son obligatorios' });
    }

    // Auto-calcular orden: último orden + 100, o 100 si no hay registros
    const last = await prisma.tipoAprobacion.findFirst({ orderBy: { orden: 'desc' } });
    const orden = last ? last.orden + 100 : 100;

    const data = await prisma.tipoAprobacion.create({
      data: {
        nombre,
        tipo,
        grupoAsignadoId: tipo === 'grupal' ? grupoAsignadoId : null,
        aprobadorAsignadoId: tipo === 'individual' ? aprobadorAsignadoId : null,
        orden,
      },
      include: {
        grupoAsignado: { select: { id: true, nombre: true } },
        aprobadorAsignado: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/tipos-aprobacion/:id — actualizar
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, tipo, grupoAsignadoId, aprobadorAsignadoId, orden, activo } = req.body;
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (orden !== undefined) updateData.orden = Number(orden);
    if (activo !== undefined) updateData.activo = activo;

    // Limpiar relación según tipo
    const finalTipo = tipo || (await prisma.tipoAprobacion.findUnique({ where: { id: req.params.id } }))?.tipo;
    if (finalTipo === 'grupal') {
      if (grupoAsignadoId !== undefined) updateData.grupoAsignadoId = grupoAsignadoId;
      updateData.aprobadorAsignadoId = null;
    } else if (finalTipo === 'individual') {
      if (aprobadorAsignadoId !== undefined) updateData.aprobadorAsignadoId = aprobadorAsignadoId;
      updateData.grupoAsignadoId = null;
    }

    const data = await prisma.tipoAprobacion.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        grupoAsignado: { select: { id: true, nombre: true } },
        aprobadorAsignado: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/tipos-aprobacion/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tipoAprobacion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
