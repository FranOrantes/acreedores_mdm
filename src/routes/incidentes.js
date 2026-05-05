const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

// Helper: extract user from JWT cookie
function getUserFromToken(req) {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Listar incidentes (filtrado por rol)
router.get('/', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const where = {};
    // solicitante/aprobador solo ven sus propios incidentes
    if (user.rolInterno !== 'admin' && user.rolInterno !== 'owner') {
      where.reportadoPorId = user.userId;
    }

    if (req.query.estado) where.estado = req.query.estado;

    const data = await prisma.incidente.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: {
        reportadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Incidentes] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Stats
router.get('/stats', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const where = {};
    if (user.rolInterno !== 'admin' && user.rolInterno !== 'owner') {
      where.reportadoPorId = user.userId;
    }

    const [total, nuevo, en_progreso, resuelto] = await Promise.all([
      prisma.incidente.count({ where }),
      prisma.incidente.count({ where: { ...where, estado: 'nuevo' } }),
      prisma.incidente.count({ where: { ...where, estado: 'en_progreso' } }),
      prisma.incidente.count({ where: { ...where, estado: 'resuelto' } }),
    ]);
    res.json({ total, nuevo, en_progreso, resuelto });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener incidente por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.incidente.findUnique({
      where: { id: req.params.id },
      include: {
        reportadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Incidente no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear incidente
router.post('/', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { categoria, prioridad, modulo, descripcion } = req.body;
    if (!categoria || !descripcion) {
      return res.status(400).json({ error: 'Categoría y descripción son requeridos' });
    }

    const count = await prisma.incidente.count();
    const folio = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const data = await prisma.incidente.create({
      data: {
        folio,
        categoria,
        prioridad: prioridad || 'media',
        modulo: modulo || null,
        descripcion,
        reportadoPorId: user.userId,
      },
      include: {
        reportadoPor: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Incidentes] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Actualizar estado (solo admin)
router.patch('/:id', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    if (user.rolInterno !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado' });
    }

    const { estado, comentarioResolucion, asignadoAId } = req.body;
    const updateData = {};
    if (estado !== undefined) updateData.estado = estado;
    if (comentarioResolucion !== undefined) updateData.comentarioResolucion = comentarioResolucion;
    if (asignadoAId !== undefined) updateData.asignadoAId = asignadoAId || null;

    const data = await prisma.incidente.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        reportadoPor: { select: { id: true, nombre: true, email: true } },
        asignadoA: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Incidentes] Error al actualizar:', e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
