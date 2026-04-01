const express = require('express');
const prisma = require('../lib/prisma');
const { registrarActividad } = require('../lib/auditoria');
const router = express.Router();

// Listar todas las aprobaciones (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { estado, solicitudId } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (solicitudId) where.solicitudId = solicitudId;

    const data = await prisma.aprobacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: {
        solicitud: {
          select: { id: true, folio: true, razonSocial: true, solicitanteNombre: true, estado: true, creadoEn: true },
        },
        aprobador: {
          select: { id: true, nombre: true, email: true, username: true },
        },
        grupoAsignado: {
          select: { id: true, nombre: true },
        },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Aprobaciones] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Estadísticas de aprobaciones (DEBE ir antes de /:id para evitar conflicto de rutas)
router.get('/stats/resumen', async (req, res) => {
  try {
    const [solicitado, aprobado, rechazado, no_requerido] = await Promise.all([
      prisma.aprobacion.count({ where: { estado: 'solicitado' } }),
      prisma.aprobacion.count({ where: { estado: 'aprobado' } }),
      prisma.aprobacion.count({ where: { estado: 'rechazado' } }),
      prisma.aprobacion.count({ where: { estado: 'no_requerido' } }),
    ]);
    res.json({ solicitado, aprobado, rechazado, no_requerido, total: solicitado + aprobado + rechazado + no_requerido });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener aprobación por ID (con datos completos de la solicitud)
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.aprobacion.findUnique({
      where: { id: req.params.id },
      include: {
        solicitud: {
          include: {
            sucursal: true,
            tipoAcreedor: true,
            grupoCuentas: true,
            condicionPago: true,
            contactos: { orderBy: { orden: 'asc' } },
            documentos: true,
          },
        },
        aprobador: {
          select: { id: true, nombre: true, email: true, username: true },
        },
        grupoAsignado: {
          select: { id: true, nombre: true, descripcion: true },
        },
      },
    });
    if (!data) return res.status(404).json({ error: 'Aprobación no encontrada' });
    res.json(data);
  } catch (e) {
    console.error('[Aprobaciones] Error al obtener:', e);
    res.status(500).json({ error: e.message });
  }
});

// Crear aprobación: grupal (grupoAsignadoId) O individual (aprobadorId)
router.post('/', async (req, res) => {
  try {
    const { solicitudId, aprobadorId, descripcionCorta, grupoAsignadoId } = req.body;

    if (!solicitudId) {
      return res.status(400).json({ error: 'solicitudId es requerido' });
    }
    if (!grupoAsignadoId && !aprobadorId) {
      return res.status(400).json({ error: 'Debe enviar grupoAsignadoId o aprobadorId' });
    }

    // Si hay grupoAsignadoId → crear N aprobaciones (una por miembro del grupo)
    if (grupoAsignadoId) {
      const miembros = await prisma.miembroGrupo.findMany({
        where: { grupoId: grupoAsignadoId },
        include: { usuario: true },
      });

      if (miembros.length === 0) {
        return res.status(400).json({ error: 'El grupo no tiene miembros' });
      }

      const aprobaciones = await prisma.$transaction(
        miembros.map((m) =>
          prisma.aprobacion.create({
            data: {
              solicitudId,
              aprobadorId: m.usuarioId,
              descripcionCorta: descripcionCorta || null,
              grupoAsignadoId,
              estado: 'solicitado',
            },
            include: {
              aprobador: { select: { id: true, nombre: true, email: true } },
              grupoAsignado: { select: { id: true, nombre: true } },
            },
          })
        )
      );

      return res.status(201).json(aprobaciones);
    }

    // Aprobación individual (aprobadorId obligatorio en este caso)
    const data = await prisma.aprobacion.create({
      data: {
        solicitudId,
        aprobadorId,
        descripcionCorta: descripcionCorta || null,
        estado: 'solicitado',
      },
      include: {
        aprobador: { select: { id: true, nombre: true, email: true } },
        solicitud: { select: { id: true, folio: true } },
      },
    });

    res.status(201).json(data);
  } catch (e) {
    console.error('[Aprobaciones] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Aprobar
router.post('/:id/aprobar', async (req, res) => {
  try {
    const { comentario } = req.body;
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: req.params.id },
    });

    if (!aprobacion) return res.status(404).json({ error: 'Aprobación no encontrada' });
    if (aprobacion.estado !== 'solicitado') {
      return res.status(400).json({ error: `No se puede aprobar una aprobación en estado "${aprobacion.estado}"` });
    }

    // Actualizar esta aprobación a "aprobado"
    const updated = await prisma.aprobacion.update({
      where: { id: req.params.id },
      data: {
        estado: 'aprobado',
        comentario: comentario || null,
        fechaResolucion: new Date(),
      },
    });

    // Si es aprobación grupal → marcar las demás del mismo grupo+solicitud como "no_requerido"
    if (aprobacion.grupoAsignadoId) {
      await prisma.aprobacion.updateMany({
        where: {
          solicitudId: aprobacion.solicitudId,
          grupoAsignadoId: aprobacion.grupoAsignadoId,
          estado: 'solicitado',
          id: { not: aprobacion.id },
        },
        data: {
          estado: 'no_requerido',
          fechaResolucion: new Date(),
        },
      });
    }

    // Registrar actividad de aprobación
    const aprobador = await prisma.usuario.findUnique({ where: { id: aprobacion.aprobadorId }, select: { nombre: true, email: true } });
    await registrarActividad('aprobacion', req.params.id, 'cambio_estado',
      `La aprobación ha sido aprobada${aprobacion.grupoAsignadoId ? ' (grupal)' : ''}.${comentario ? ' Comentario: ' + comentario : ''}`,
      { autorNombre: aprobador?.nombre, autorEmail: aprobador?.email, campoModificado: 'Estado', valorAnterior: 'solicitado', valorNuevo: 'aprobado' }
    );
    // Also log on the solicitud
    await registrarActividad('solicitud', aprobacion.solicitudId, 'sistema',
      `La aprobación de ${aprobacion.grupoAsignadoId ? 'grupo' : 'usuario'} ha sido aprobada por ${aprobador?.nombre || aprobador?.email || 'el aprobador'}${comentario ? '. Comentario: ' + comentario : ''}.`,
      { autorNombre: aprobador?.nombre, autorEmail: aprobador?.email }
    );

    res.json(updated);
  } catch (e) {
    console.error('[Aprobaciones] Error al aprobar:', e);
    res.status(400).json({ error: e.message });
  }
});

// Rechazar
router.post('/:id/rechazar', async (req, res) => {
  try {
    const { comentario } = req.body;
    const aprobacion = await prisma.aprobacion.findUnique({
      where: { id: req.params.id },
    });

    if (!aprobacion) return res.status(404).json({ error: 'Aprobación no encontrada' });
    if (aprobacion.estado !== 'solicitado') {
      return res.status(400).json({ error: `No se puede rechazar una aprobación en estado "${aprobacion.estado}"` });
    }

    const updated = await prisma.aprobacion.update({
      where: { id: req.params.id },
      data: {
        estado: 'rechazado',
        comentario: comentario || null,
        fechaResolucion: new Date(),
      },
    });

    // Registrar actividad de rechazo
    const aprobador = await prisma.usuario.findUnique({ where: { id: aprobacion.aprobadorId }, select: { nombre: true, email: true } });
    await registrarActividad('aprobacion', req.params.id, 'cambio_estado',
      `La aprobación ha sido rechazada.${comentario ? ' Comentario: ' + comentario : ''}`,
      { autorNombre: aprobador?.nombre, autorEmail: aprobador?.email, campoModificado: 'Estado', valorAnterior: 'solicitado', valorNuevo: 'rechazado' }
    );
    await registrarActividad('solicitud', aprobacion.solicitudId, 'sistema',
      `La aprobación de ${aprobacion.grupoAsignadoId ? 'grupo' : 'usuario'} ha sido rechazada por ${aprobador?.nombre || aprobador?.email || 'el aprobador'}${comentario ? '. Comentario: ' + comentario : ''}.`,
      { autorNombre: aprobador?.nombre, autorEmail: aprobador?.email }
    );

    res.json(updated);
  } catch (e) {
    console.error('[Aprobaciones] Error al rechazar:', e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
