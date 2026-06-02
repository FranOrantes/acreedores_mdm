const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar tareas de una solicitud (ordenadas por "orden")
router.get('/:solicitudId', async (req, res) => {
  try {
    const tareas = await prisma.tareaSolicitud.findMany({
      where: { solicitudId: req.params.solicitudId },
      orderBy: { orden: 'asc' },
    });
    res.json(tareas);
  } catch (e) {
    console.error('[TareasSolicitud] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Crear una tarea (n8n llama este endpoint)
// Body: { solicitudId, titulo, estado?, detalle?, subtexto?, orden? }
router.post('/', async (req, res) => {
  try {
    const { solicitudId, titulo, estado, detalle, subtexto, orden } = req.body;

    if (!solicitudId || !titulo) {
      return res.status(400).json({ error: 'solicitudId y titulo son requeridos' });
    }

    const tarea = await prisma.tareaSolicitud.create({
      data: {
        solicitudId,
        titulo,
        estado: estado || 'pendiente',
        detalle: detalle || null,
        subtexto: subtexto || null,
        orden: orden ?? 0,
      },
    });

    res.status(201).json(tarea);
  } catch (e) {
    console.error('[TareasSolicitud] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Actualizar una tarea por ID (n8n llama este endpoint para cambiar estado/detalle)
// Body: { estado?, detalle?, subtexto?, titulo?, orden? }
router.patch('/:id', async (req, res) => {
  try {
    const { estado, detalle, subtexto, titulo, orden } = req.body;
    const data = {};
    if (estado !== undefined) data.estado = estado;
    if (detalle !== undefined) data.detalle = detalle;
    if (subtexto !== undefined) data.subtexto = subtexto;
    if (titulo !== undefined) data.titulo = titulo;
    if (orden !== undefined) data.orden = orden;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const tarea = await prisma.tareaSolicitud.update({
      where: { id: req.params.id },
      data,
    });

    res.json(tarea);
  } catch (e) {
    console.error('[TareasSolicitud] Error al actualizar:', e);
    res.status(400).json({ error: e.message });
  }
});

// Crear o actualizar múltiples tareas de una solicitud (bulk upsert para n8n)
// Body: { solicitudId, tareas: [{ titulo, estado, detalle?, subtexto?, orden }] }
router.put('/:solicitudId', async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { tareas } = req.body;

    if (!tareas || !Array.isArray(tareas)) {
      return res.status(400).json({ error: 'tareas debe ser un array' });
    }

    // Eliminar tareas existentes y recrear (reemplazo total)
    await prisma.tareaSolicitud.deleteMany({ where: { solicitudId } });

    const created = await prisma.$transaction(
      tareas.map((t, idx) =>
        prisma.tareaSolicitud.create({
          data: {
            solicitudId,
            titulo: t.titulo,
            estado: t.estado || 'pendiente',
            detalle: t.detalle || null,
            subtexto: t.subtexto || null,
            orden: t.orden ?? idx,
          },
        })
      )
    );

    res.json(created);
  } catch (e) {
    console.error('[TareasSolicitud] Error en PUT bulk:', e);
    res.status(400).json({ error: e.message });
  }
});

// Eliminar una tarea
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tareaSolicitud.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('[TareasSolicitud] Error al eliminar:', e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
