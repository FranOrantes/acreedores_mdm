const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar ubicaciones
router.get('/', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        branchOfficeManager: { select: { id: true, nombre: true, email: true } },
        _count: { select: { usuarios: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Ubicaciones] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Listar solo ubicaciones que son sucursales (para cobertura)
router.get('/sucursales', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findMany({
      where: { activo: true, esSucursal: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener ubicación por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findUnique({
      where: { id: req.params.id },
      include: {
        branchOfficeManager: { select: { id: true, nombre: true, email: true } },
        usuarios: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Ubicación no encontrada' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear ubicación
router.post('/', async (req, res) => {
  try {
    const { nombre, calle, ciudad, estadoProvincia, codigoPostal, pais, ventaNarcoticos, esSucursal, telefono, latitud, longitud, branchOffice, branchOfficeManagerId, supplyCenter } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'nombre es requerido' });
    }
    const data = await prisma.ubicacion.create({
      data: {
        nombre,
        calle: calle || null,
        ciudad: ciudad || null,
        estadoProvincia: estadoProvincia || null,
        codigoPostal: codigoPostal || null,
        pais: pais || 'MX',
        ventaNarcoticos: ventaNarcoticos || false,
        esSucursal: esSucursal || false,
        telefono: telefono || null,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        branchOffice: branchOffice || null,
        branchOfficeManagerId: branchOfficeManagerId || null,
        supplyCenter: supplyCenter || null,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Ubicaciones] Error al crear:', e);
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Actualizar ubicación
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, calle, ciudad, estadoProvincia, codigoPostal, pais, ventaNarcoticos, esSucursal, telefono, latitud, longitud, branchOffice, branchOfficeManagerId, supplyCenter, activo } = req.body;
    const data = await prisma.ubicacion.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(calle !== undefined && { calle: calle || null }),
        ...(ciudad !== undefined && { ciudad: ciudad || null }),
        ...(estadoProvincia !== undefined && { estadoProvincia: estadoProvincia || null }),
        ...(codigoPostal !== undefined && { codigoPostal: codigoPostal || null }),
        ...(pais !== undefined && { pais: pais || null }),
        ...(ventaNarcoticos !== undefined && { ventaNarcoticos }),
        ...(esSucursal !== undefined && { esSucursal }),
        ...(telefono !== undefined && { telefono: telefono || null }),
        ...(latitud !== undefined && { latitud: latitud ? parseFloat(latitud) : null }),
        ...(longitud !== undefined && { longitud: longitud ? parseFloat(longitud) : null }),
        ...(branchOffice !== undefined && { branchOffice: branchOffice || null }),
        ...(branchOfficeManagerId !== undefined && { branchOfficeManagerId: branchOfficeManagerId || null }),
        ...(supplyCenter !== undefined && { supplyCenter: supplyCenter || null }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Eliminar ubicación
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ubicacion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
