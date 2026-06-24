const express = require('express');
const prisma = require('../lib/prisma');
const { enviarPushAUsuario } = require('../lib/pushNotifications');
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

    // Push: notificar al solicitante cuando alguien comenta en su solicitud
    if (entidadTipo === 'solicitud') {
      try {
        const solicitud = await prisma.solicitud.findUnique({ where: { id: entidadId }, select: { solicitanteNombre: true, folio: true } });
        if (solicitud?.solicitanteNombre) {
          const solicitante = await prisma.usuario.findFirst({ where: { nombre: { contains: solicitud.solicitanteNombre } }, select: { id: true } });
          if (solicitante && solicitante.id !== req.userId) {
            enviarPushAUsuario(solicitante.id, {
              title: `Nuevo comentario en ${solicitud.folio}`,
              body: contenido.substring(0, 100),
              url: `/solicitudes/${entidadId}`,
              tag: `comentario-${entidadId}`,
            });
          }
        }
      } catch (pushErr) {
        console.error('[Push] Error en comentario:', pushErr.message);
      }
    }

    res.status(201).json(actividad);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
