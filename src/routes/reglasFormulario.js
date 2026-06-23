const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/reglas-formulario — listar reglas activas (para el formulario)
router.get('/', async (req, res) => {
  try {
    const { formulario, modulo } = req.query;
    const where = { activo: true };
    if (formulario) {
      where.OR = [{ formulario }, { formulario: 'ambos' }];
    }
    if (modulo) {
      // Combine with existing OR using AND
      const moduloFilter = { modulo: { in: [modulo, 'ambos'] } };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, moduloFilter];
        delete where.OR;
      } else {
        Object.assign(where, moduloFilter);
      }
    }
    if (req.dominioId) where.dominioId = req.dominioId;
    const data = await prisma.reglaFormularioCampo.findMany({
      where,
      orderBy: [{ campo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    console.error('[ReglasFormulario] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reglas-formulario/all — listar TODAS (admin, incluye inactivas)
router.get('/all', async (req, res) => {
  try {
    const where = {};
    if (req.dominioId) where.dominioId = req.dominioId;
    const data = await prisma.reglaFormularioCampo.findMany({
      where,
      orderBy: [{ campo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reglas-formulario — crear regla
router.post('/', async (req, res) => {
  try {
    const { campo, condiciones, logica, accionVisible, accionObligatorio, accionReadOnly, reverseIfFalse, formulario, modulo, orden } = req.body;
    if (!campo || !condiciones) {
      return res.status(400).json({ error: 'campo y condiciones son requeridos' });
    }
    const data = await prisma.reglaFormularioCampo.create({
      data: {
        campo,
        condiciones,
        logica: logica || 'AND',
        accionVisible: accionVisible || 'no_cambiar',
        accionObligatorio: accionObligatorio || 'no_cambiar',
        accionReadOnly: accionReadOnly || 'no_cambiar',
        reverseIfFalse: reverseIfFalse || false,
        formulario: formulario || 'alta',
        modulo: modulo || 'acreedores',
        orden: orden || 0,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[ReglasFormulario] Error al crear:', e);
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/reglas-formulario/:id — actualizar regla
router.patch('/:id', async (req, res) => {
  try {
    const { campo, condiciones, logica, accionVisible, accionObligatorio, accionReadOnly, reverseIfFalse, formulario, modulo, orden, activo } = req.body;
    const updateData = {};
    if (campo !== undefined) updateData.campo = campo;
    if (condiciones !== undefined) updateData.condiciones = condiciones;
    if (logica !== undefined) updateData.logica = logica;
    if (accionVisible !== undefined) updateData.accionVisible = accionVisible;
    if (accionObligatorio !== undefined) updateData.accionObligatorio = accionObligatorio;
    if (accionReadOnly !== undefined) updateData.accionReadOnly = accionReadOnly;
    if (reverseIfFalse !== undefined) updateData.reverseIfFalse = reverseIfFalse;
    if (formulario !== undefined) updateData.formulario = formulario;
    if (modulo !== undefined) updateData.modulo = modulo;
    if (orden !== undefined) updateData.orden = orden;
    if (activo !== undefined) updateData.activo = activo;

    const data = await prisma.reglaFormularioCampo.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/reglas-formulario/:id — eliminar regla
router.delete('/:id', async (req, res) => {
  try {
    await prisma.reglaFormularioCampo.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
