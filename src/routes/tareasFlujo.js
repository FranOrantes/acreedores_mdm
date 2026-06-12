const express = require('express');
const axios = require('axios');
const prisma = require('../lib/prisma');
const { registrarActividad } = require('../lib/auditoria');
const router = express.Router();

// Listar tareas de flujo (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { estado, solicitudId } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (solicitudId) where.solicitudId = solicitudId;

    const data = await prisma.tareaFlujo.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: {
        solicitud: {
          select: { id: true, folio: true, razonSocial: true, solicitanteNombre: true, estado: true, creadoEn: true },
        },
        grupoAsignado: {
          select: { id: true, nombre: true },
        },
        miembroAsignado: {
          select: { id: true, nombre: true, email: true },
        },
        aprobador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[TareasFlujo] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener tarea de flujo por ID (con solicitud completa)
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.tareaFlujo.findUnique({
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
        grupoAsignado: {
          include: {
            miembros: {
              include: {
                usuario: { select: { id: true, nombre: true, email: true, username: true } },
              },
            },
          },
        },
        miembroAsignado: {
          select: { id: true, nombre: true, email: true },
        },
        aprobador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });
    if (!data) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(data);
  } catch (e) {
    console.error('[TareasFlujo] Error al obtener:', e);
    res.status(500).json({ error: e.message });
  }
});

// Crear tarea de flujo (llamada desde n8n)
// Body: { solicitudId, titulo, descripcion?, grupoAsignadoId?, miembroAsignadoId?, resumeUrl? }
router.post('/', async (req, res) => {
  try {
    const { solicitudId, titulo, descripcion, grupoAsignadoId, miembroAsignadoId, resumeUrl } = req.body;

    if (!solicitudId || !titulo) {
      return res.status(400).json({ error: 'solicitudId y titulo son requeridos' });
    }

    const tarea = await prisma.tareaFlujo.create({
      data: {
        solicitudId,
        titulo,
        descripcion: descripcion || null,
        grupoAsignadoId: grupoAsignadoId || null,
        miembroAsignadoId: miembroAsignadoId || null,
        resumeUrl: resumeUrl || null,
      },
      include: {
        solicitud: { select: { folio: true } },
        grupoAsignado: { select: { nombre: true } },
      },
    });

    // Registrar actividad en la solicitud
    await registrarActividad('solicitud', solicitudId, 'sistema',
      `Tarea de flujo creada: "${titulo}"${tarea.grupoAsignado ? ` (Grupo: ${tarea.grupoAsignado.nombre})` : ''}`,
      { autorNombre: 'n8n / Sistema' }
    );

    res.status(201).json(tarea);
  } catch (e) {
    console.error('[TareasFlujo] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Cerrar tarea de flujo (usuario selecciona aprobador y cierra)
// Body: { aprobadorId, _autorNombre? }
router.post('/:id/cerrar', async (req, res) => {
  try {
    const { aprobadorId, _autorNombre } = req.body;

    if (!aprobadorId) {
      return res.status(400).json({ error: 'El campo "aprobadorId" es requerido para cerrar la tarea' });
    }

    const tarea = await prisma.tareaFlujo.findUnique({
      where: { id: req.params.id },
      include: { solicitud: { select: { folio: true } } },
    });
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    if (tarea.estado === 'cerrada') {
      return res.status(400).json({ error: 'La tarea ya se encuentra cerrada' });
    }

    // Validar que el aprobador existe
    const aprobador = await prisma.usuario.findUnique({
      where: { id: aprobadorId },
      select: { id: true, nombre: true, email: true },
    });
    if (!aprobador) return res.status(400).json({ error: 'Aprobador no encontrado' });

    // Actualizar tarea
    const updated = await prisma.tareaFlujo.update({
      where: { id: req.params.id },
      data: {
        estado: 'cerrada',
        aprobadorId,
        fechaCierre: new Date(),
      },
      include: {
        solicitud: { select: { id: true, folio: true } },
        grupoAsignado: { select: { nombre: true } },
        aprobador: { select: { id: true, nombre: true, email: true } },
      },
    });

    // Registrar actividad
    await registrarActividad('solicitud', tarea.solicitudId, 'sistema',
      `Tarea "${tarea.titulo}" cerrada. Aprobador asignado: ${aprobador.nombre || aprobador.email}`,
      { autorNombre: _autorNombre || 'Administrador' }
    );

    // Llamar resume_url de n8n (Wait on Webhook)
    if (tarea.resumeUrl) {
      try {
        await axios.post(tarea.resumeUrl, {
          tareaFlujoId: tarea.id,
          solicitudId: tarea.solicitudId,
          estado: 'cerrada',
          aprobadorId: aprobador.id,
          aprobadorNombre: aprobador.nombre,
          aprobadorEmail: aprobador.email,
        }, { timeout: 10000 });
        console.log(`[n8n] resume_url llamada OK para tarea flujo ${tarea.id}`);
      } catch (err) {
        console.error(`[n8n] Error al llamar resume_url para tarea flujo ${tarea.id}:`, err.message);
      }
    }

    res.json(updated);
  } catch (e) {
    console.error('[TareasFlujo] Error al cerrar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Actualizar tarea de flujo (parcial)
router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = ['titulo', 'descripcion', 'estado', 'grupoAsignadoId', 'miembroAsignadoId', 'aprobadorId', 'resumeUrl'];
    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const tarea = await prisma.tareaFlujo.update({
      where: { id: req.params.id },
      data,
    });

    res.json(tarea);
  } catch (e) {
    console.error('[TareasFlujo] Error al actualizar:', e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
