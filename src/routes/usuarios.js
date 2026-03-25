const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar usuarios
router.get('/', async (req, res) => {
  try {
    const data = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { aprobaciones: true, membresiaGrupos: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Usuarios] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      include: {
        membresiaGrupos: {
          include: { grupo: { select: { id: true, nombre: true } } },
        },
        _count: { select: { aprobaciones: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  try {
    const { email, nombre, username, rolInterno } = req.body;
    if (!email || !nombre) {
      return res.status(400).json({ error: 'email y nombre son requeridos' });
    }

    const ssoId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const data = await prisma.usuario.create({
      data: {
        ssoId,
        email,
        nombre,
        username: username || email.split('@')[0],
        rolInterno: rolInterno || 'usuario',
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Usuarios] Error al crear:', e);
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Actualizar usuario
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, email, username, rolInterno, activo } = req.body;
    const data = await prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(email !== undefined && { email }),
        ...(username !== undefined && { username }),
        ...(rolInterno !== undefined && { rolInterno }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
