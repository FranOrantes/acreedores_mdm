const express = require('express');
const prisma = require('../lib/prisma');
const { ejecutarBusinessRules } = require('../lib/scriptEngine');

const router = express.Router();

// ── Formularios dinámicos: CRUD + envío ──

// GET /api/formularios — listar (filtros: modulo, activo)
router.get('/', async (req, res) => {
  try {
    const { modulo } = req.query;
    const where = {};
    if (modulo) where.modulo = { in: [modulo, 'todos'] };
    const data = await prisma.formulario.findMany({
      where,
      select: { id: true, clave: true, modulo: true, nombre: true, descripcion: true, icono: true, tipo: true, orden: true, activo: true, actualizadoEn: true },
      orderBy: [{ modulo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/formularios/:id — detalle con definición
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.formulario.findUnique({ where: { id: req.params.id } });
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/formularios/clave/:clave — por clave+módulo (para el renderer)
router.get('/clave/:clave', async (req, res) => {
  try {
    const { modulo } = req.query;
    const data = await prisma.formulario.findFirst({
      where: { clave: req.params.clave, activo: true, ...(modulo ? { modulo: { in: [modulo, 'todos'] } } : {}) },
      orderBy: { modulo: 'desc' }, // el específico del módulo gana sobre 'todos'
    });
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/formularios — crear
router.post('/', async (req, res) => {
  try {
    const { clave, modulo, nombre, descripcion, icono, tipo, orden, definicion, dominioId } = req.body;
    if (!clave || !nombre || !definicion) return res.status(400).json({ error: 'clave, nombre y definicion son requeridos' });
    const data = await prisma.formulario.create({
      data: { clave, modulo: modulo || 'todos', nombre, descripcion, icono, tipo: tipo || 'simple', orden: orden ?? 0, definicion, dominioId },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/formularios/:id
router.put('/:id', async (req, res) => {
  try {
    const { clave, modulo, nombre, descripcion, icono, tipo, orden, activo, definicion, dominioId } = req.body;
    const data = await prisma.formulario.update({
      where: { id: req.params.id },
      data: {
        ...(clave !== undefined && { clave }),
        ...(modulo !== undefined && { modulo }),
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(icono !== undefined && { icono }),
        ...(tipo !== undefined && { tipo }),
        ...(orden !== undefined && { orden }),
        ...(activo !== undefined && { activo }),
        ...(definicion !== undefined && { definicion }),
        ...(dominioId !== undefined && { dominioId }),
      },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.formulario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/formularios/:clave/enviar — envío genérico: crea Solicitud + dispara business rules
// Body: { datos, solicitanteNombre?, solicitanteArea? }
router.post('/:clave/enviar', async (req, res) => {
  try {
    const form = await prisma.formulario.findFirst({
      where: { clave: req.params.clave, activo: true },
      orderBy: { modulo: 'desc' },
    });
    if (!form) return res.status(404).json({ error: 'Formulario no encontrado o inactivo' });

    const { datos = {}, solicitanteNombre, solicitanteArea } = req.body;
    const count = await prisma.solicitud.count({ where: { modulo: form.modulo === 'todos' ? 'acreedores' : form.modulo } });
    const prefijo = (form.definicion?.config?.folioPrefix || form.clave || 'FRM').toUpperCase().slice(0, 4);

    const solicitud = await prisma.solicitud.create({
      data: {
        folio: `${prefijo}-${String(count + 1).padStart(4, '0')}`,
        modulo: form.modulo === 'todos' ? 'acreedores' : form.modulo,
        tipo: 'alta',
        estado: 'enviada',
        solicitanteNombre: solicitanteNombre || null,
        solicitanteArea: solicitanteArea || null,
        dominioId: req.dominioId || null,
        camposExtra: { formularioClave: form.clave, datos },
      },
    });

    // Business Rules: after_create (entidad = clave del formulario)
    ejecutarBusinessRules({
      entidad: form.clave,
      evento: 'after_create',
      datos: { ...datos, solicitudId: solicitud.id, folio: solicitud.folio },
      modulo: form.modulo,
      dominioId: solicitud.dominioId,
    }).catch((err) => console.error('[BusinessRules] after_create formulario:', err.message));

    res.status(201).json({ ok: true, folio: solicitud.folio, id: solicitud.id });
  } catch (e) {
    console.error('[Formularios] Error al enviar:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
