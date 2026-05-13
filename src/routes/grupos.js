const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar grupos
router.get('/', async (req, res) => {
  try {
    const data = await prisma.grupoAprobacion.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        miembros: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true, username: true } },
          },
        },
        _count: { select: { aprobaciones: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Grupos] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener grupo por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.grupoAprobacion.findUnique({
      where: { id: req.params.id },
      include: {
        miembros: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true, username: true } },
          },
        },
      },
    });
    if (!data) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear grupo
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, roles } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre del grupo es requerido' });

    const data = await prisma.grupoAprobacion.create({
      data: { nombre, descripcion: descripcion || null, roles: roles || '[]' },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Grupos] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// Actualizar grupo
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, activo, roles } = req.body;
    const data = await prisma.grupoAprobacion.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo }),
        ...(roles !== undefined && { roles }),
      },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Eliminar grupo
router.delete('/:id', async (req, res) => {
  try {
    await prisma.grupoAprobacion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Grupos] Error al eliminar:', e);
    res.status(400).json({ error: e.message });
  }
});

// Agregar miembro al grupo
router.post('/:id/miembros', async (req, res) => {
  try {
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ error: 'usuarioId es requerido' });

    const data = await prisma.miembroGrupo.create({
      data: { grupoId: req.params.id, usuarioId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Grupos] Error al agregar miembro:', e);
    res.status(400).json({ error: e.message });
  }
});

// Eliminar miembro del grupo
router.delete('/:id/miembros/:miembroId', async (req, res) => {
  try {
    await prisma.miembroGrupo.delete({
      where: { id: req.params.miembroId },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Listar usuarios disponibles (para seleccionar aprobadores/miembros)
router.get('/usuarios/lista', async (req, res) => {
  try {
    const data = await prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, email: true, username: true, rolInterno: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener roles efectivos de un usuario (heredados de sus grupos)
router.get('/usuarios/:usuarioId/roles-efectivos', async (req, res) => {
  try {
    const membresías = await prisma.miembroGrupo.findMany({
      where: { usuarioId: req.params.usuarioId },
      include: { grupo: { select: { roles: true, activo: true, nombre: true } } },
    });
    const rolesSet = new Set();
    const detalle = [];
    membresías.forEach((m) => {
      if (!m.grupo.activo) return;
      let grupoRoles = [];
      try { grupoRoles = JSON.parse(m.grupo.roles || '[]'); } catch { grupoRoles = []; }
      grupoRoles.forEach((r) => rolesSet.add(r));
      if (grupoRoles.length > 0) detalle.push({ grupo: m.grupo.nombre, roles: grupoRoles });
    });
    res.json({ roles: [...rolesSet], detalle });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
