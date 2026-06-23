const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/dominios — listar todos los dominios activos
router.get('/', async (req, res) => {
  try {
    const data = await prisma.dominio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        clave: true,
        nombre: true,
        logoUrl: true,
        activo: true,
        creadoEn: true,
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Dominios] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dominios/usuario/:userId — dominios del usuario [MUST be before /:id]
router.get('/usuario/:userId', async (req, res) => {
  try {
    const data = await prisma.usuarioDominio.findMany({
      where: { usuarioId: req.params.userId },
      include: {
        dominio: { select: { id: true, clave: true, nombre: true, logoUrl: true, activo: true } },
      },
    });
    res.json(data.map((ud) => ({ ...ud.dominio, rol: ud.rol })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/dominios/cambiar — cambiar dominio activo del usuario [MUST be before /:id]
router.patch('/cambiar', async (req, res) => {
  try {
    const { userId, dominioId } = req.body;
    if (!userId || !dominioId) {
      return res.status(400).json({ error: 'userId y dominioId son requeridos' });
    }

    // Verificar que el usuario tenga acceso a ese dominio
    const acceso = await prisma.usuarioDominio.findFirst({
      where: { usuarioId: userId, dominioId },
    });
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { esSuperAdmin: true },
    });

    if (!acceso && !usuario?.esSuperAdmin) {
      return res.status(403).json({ error: 'No tiene acceso a ese dominio' });
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { dominioActualId: dominioId },
    });

    res.json({ ok: true, dominioId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/dominios/:id — obtener dominio por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.dominio.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { solicitudes: true, usuarios: true, camposFormulario: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Dominio no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dominios — crear dominio (solo superAdmin)
router.post('/', async (req, res) => {
  try {
    const { clave, nombre, logoUrl } = req.body;
    if (!clave || !nombre) {
      return res.status(400).json({ error: 'clave y nombre son requeridos' });
    }
    const data = await prisma.dominio.create({
      data: { clave, nombre, logoUrl: logoUrl || null },
    });
    res.status(201).json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un dominio con esa clave' });
    }
    console.error('[Dominios] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/dominios/:id — actualizar dominio
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, logoUrl, activo } = req.body;
    const data = await prisma.dominio.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/dominios/:id/usuarios — asignar usuario a dominio
router.post('/:id/usuarios', async (req, res) => {
  try {
    const { usuarioId, rol } = req.body;
    if (!usuarioId) return res.status(400).json({ error: 'usuarioId es requerido' });

    const data = await prisma.usuarioDominio.create({
      data: {
        dominioId: req.params.id,
        usuarioId,
        rol: rol || 'usuario',
      },
    });
    res.status(201).json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'El usuario ya está asignado a este dominio' });
    }
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/dominios/:id/usuarios/:usuarioId — remover usuario de dominio
router.delete('/:id/usuarios/:usuarioId', async (req, res) => {
  try {
    await prisma.usuarioDominio.deleteMany({
      where: { dominioId: req.params.id, usuarioId: req.params.usuarioId },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
