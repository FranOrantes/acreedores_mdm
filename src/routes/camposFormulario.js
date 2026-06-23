const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/campos-formulario — listar campos activos del dominio actual
router.get('/', async (req, res) => {
  try {
    if (!req.dominioId) {
      return res.json([]);
    }
    const where = { dominioId: req.dominioId, activo: true };
    if (req.query.formulario) {
      where.formulario = req.query.formulario;
    }
    if (req.query.seccion) {
      where.seccion = req.query.seccion;
    }
    if (req.query.modulo) {
      where.modulo = { in: [req.query.modulo, 'todos'] };
    }
    const data = await prisma.campoFormulario.findMany({
      where,
      orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    console.error('[CamposFormulario] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/campos-formulario/all — listar TODOS los campos del dominio (admin, incluye inactivos)
router.get('/all', async (req, res) => {
  try {
    if (!req.dominioId) {
      return res.json([]);
    }
    const data = await prisma.campoFormulario.findMany({
      where: { dominioId: req.dominioId },
      orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/campos-formulario/:id — obtener campo por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.campoFormulario.findUnique({
      where: { id: req.params.id },
    });
    if (!data) return res.status(404).json({ error: 'Campo no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/campos-formulario — crear campo dinámico
router.post('/', async (req, res) => {
  try {
    if (!req.dominioId) {
      return res.status(400).json({ error: 'Se requiere un dominio activo para crear campos' });
    }
    const { modulo, formulario, seccion, clave, etiqueta, tipo, requerido, orden, opciones, validacion, placeholder, tooltip } = req.body;
    if (!clave || !etiqueta) {
      return res.status(400).json({ error: 'clave y etiqueta son requeridos' });
    }

    const data = await prisma.campoFormulario.create({
      data: {
        dominioId: req.dominioId,
        modulo: modulo || 'todos',
        formulario: formulario || 'alta',
        seccion: seccion || 'custom',
        clave,
        etiqueta,
        tipo: tipo || 'text',
        requerido: requerido || false,
        orden: orden || 0,
        opciones: opciones || null,
        validacion: validacion || null,
        placeholder: placeholder || null,
        tooltip: tooltip || null,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un campo con esa clave en este dominio' });
    }
    console.error('[CamposFormulario] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/campos-formulario/:id — actualizar campo
router.patch('/:id', async (req, res) => {
  try {
    const { modulo, formulario, seccion, clave, etiqueta, tipo, requerido, orden, opciones, validacion, placeholder, tooltip, activo } = req.body;
    const data = await prisma.campoFormulario.update({
      where: { id: req.params.id },
      data: {
        ...(modulo !== undefined && { modulo }),
        ...(formulario !== undefined && { formulario }),
        ...(seccion !== undefined && { seccion }),
        ...(clave !== undefined && { clave }),
        ...(etiqueta !== undefined && { etiqueta }),
        ...(tipo !== undefined && { tipo }),
        ...(requerido !== undefined && { requerido }),
        ...(orden !== undefined && { orden }),
        ...(opciones !== undefined && { opciones }),
        ...(validacion !== undefined && { validacion }),
        ...(placeholder !== undefined && { placeholder }),
        ...(tooltip !== undefined && { tooltip }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un campo con esa clave en este dominio' });
    }
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/campos-formulario/reordenar — reordenar campos (batch) [MUST be before /:id]
router.patch('/reordenar', async (req, res) => {
  try {
    const { campos } = req.body; // [{id, orden}]
    if (!Array.isArray(campos)) {
      return res.status(400).json({ error: 'campos debe ser un array de {id, orden}' });
    }
    await prisma.$transaction(
      campos.map((c) =>
        prisma.campoFormulario.update({
          where: { id: c.id },
          data: { orden: c.orden },
        })
      )
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/campos-formulario/:id — eliminar campo
router.delete('/:id', async (req, res) => {
  try {
    await prisma.campoFormulario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
