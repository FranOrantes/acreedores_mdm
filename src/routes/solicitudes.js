const express = require('express');
const prisma = require('../lib/prisma');
const { registrarCambios, registrarActividad } = require('../lib/auditoria');
const router = express.Router();

// Listar solicitudes
router.get('/', async (req, res) => {
  const data = await prisma.solicitud.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      sucursal: true,
      tipoAcreedor: true,
      grupoCuentas: true,
      condicionPago: true,
    },
  });
  res.json(data);
});

// Obtener solicitud por ID
router.get('/:id', async (req, res) => {
  const data = await prisma.solicitud.findUnique({
    where: { id: req.params.id },
    include: {
      sucursal: true,
      tipoAcreedor: true,
      grupoCuentas: true,
      condicionPago: true,
      contactos: { orderBy: { orden: 'asc' } },
      documentos: true,
    },
  });
  if (!data) return res.status(404).json({ error: 'Solicitud no encontrada' });
  res.json(data);
});

// Crear solicitud nueva (con contactos embebidos)
router.post('/', async (req, res) => {
  try {
    const { contactos, ...solicitudData } = req.body;
    const count = await prisma.solicitud.count();
    const folio = `SOL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Limpiar campos de relación vacíos para evitar errores de FK
    const fkFields = ['sucursalId', 'tipoAcreedorId', 'grupoCuentasId', 'condicionPagoId'];
    for (const fk of fkFields) {
      if (!solicitudData[fk]) delete solicitudData[fk];
    }

    const data = await prisma.solicitud.create({
      data: {
        folio,
        estado: 'enviada',
        pasoActual: 4,
        ...solicitudData,
        contactos: contactos && contactos.length > 0 ? {
          create: contactos.map((c, idx) => ({
            orden: idx + 1,
            nombre: c.nombre || '',
            correo: c.correo || '',
            puesto: c.puesto || '',
            telefono: c.telefono || '',
            extension: c.extension || null,
            cdr: c.cdr || '',
          })),
        } : undefined,
      },
      include: {
        sucursal: true,
        tipoAcreedor: true,
        grupoCuentas: true,
        condicionPago: true,
        contactos: { orderBy: { orden: 'asc' } },
        documentos: true,
      },
    });
    // Registrar actividad de creación
    await registrarActividad('solicitud', data.id, 'sistema', `Solicitud creada con folio ${data.folio}`, {
      autorNombre: data.solicitanteNombre,
    });

    res.status(201).json(data);
  } catch (e) {
    console.error('[Solicitudes] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Actualizar solicitud (parcial) — con auditoría
router.patch('/:id', async (req, res) => {
  try {
    // Obtener estado anterior para auditoría
    const anterior = await prisma.solicitud.findUnique({ where: { id: req.params.id } });
    if (!anterior) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const data = await prisma.solicitud.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        sucursal: true,
        tipoAcreedor: true,
        grupoCuentas: true,
        condicionPago: true,
        documentos: true,
      },
    });

    // Registrar cambios de campo
    await registrarCambios('solicitud', req.params.id, anterior, data, {
      autorNombre: req.body._autorNombre || anterior.solicitanteNombre,
      autorEmail: req.body._autorEmail || null,
    });

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Enviar solicitud
router.post('/:id/enviar', async (req, res) => {
  try {
    const anterior = await prisma.solicitud.findUnique({ where: { id: req.params.id } });
    const data = await prisma.solicitud.update({
      where: { id: req.params.id },
      data: { estado: 'enviada' },
    });

    await registrarActividad('solicitud', req.params.id, 'cambio_estado', `Estado: ${anterior?.estado || 'borrador'} → enviada`, {
      campoModificado: 'Estado',
      valorAnterior: anterior?.estado || 'borrador',
      valorNuevo: 'enviada',
      autorNombre: anterior?.solicitanteNombre,
    });

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
