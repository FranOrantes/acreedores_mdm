const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Table Builder (réplica del de ServiceNow): tablas custom por módulo,
// dictionary entries (columnas), vista lista con filtros, preview de formulario.
// Storage "json" → custom_registros (JSONB). Storage "materiales_registros" → tabla física.
// ─────────────────────────────────────────────────────────────────────────────

const CLAVE_OK = /^[a-z][a-z0-9_]*$/;

// ── Tablas ──

// GET /api/tablas?modulo=
router.get('/', async (req, res) => {
  try {
    const { modulo } = req.query;
    const where = {};
    if (modulo) where.modulo = { in: [modulo, 'todos'] };
    const data = await prisma.tablaCustom.findMany({
      where,
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
      orderBy: [{ modulo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tablas/menu?modulo= — tablas con acceso en menú para el sidebar
router.get('/menu', async (req, res) => {
  try {
    const { modulo } = req.query;
    const data = await prisma.tablaCustom.findMany({
      where: { menuVisible: true, activa: true, ...(modulo ? { modulo: { in: [modulo, 'todos'] } } : {}) },
      select: { id: true, clave: true, label: true, modulo: true, menuLabel: true, menuIcono: true, menuPadre: true, icono: true },
      orderBy: { orden: 'asc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { orderBy: { orden: 'asc' } } },
    });
    if (!data) return res.status(404).json({ error: 'No encontrada' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { clave, label, modulo, icono, descripcion, autoNumber, permisos } = req.body;
    if (!clave || !label) return res.status(400).json({ error: 'clave y label son requeridos' });
    if (!CLAVE_OK.test(clave)) return res.status(400).json({ error: 'clave debe ser snake_case (a-z, 0-9, _)' });
    const data = await prisma.tablaCustom.create({
      data: { clave, label, modulo: modulo || 'todos', icono, descripcion, autoNumber, permisos },
      include: { columnas: true },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const campos = ['clave', 'label', 'modulo', 'icono', 'descripcion', 'activa', 'autoNumber', 'permisos', 'orden'];
    const data = {};
    campos.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const tabla = await prisma.tablaCustom.update({ where: { id: req.params.id }, data });
    res.json(tabla);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id } });
    if (tabla?.storage === 'json') {
      await prisma.customRegistro.deleteMany({ where: { tablaId: req.params.id } });
    }
    await prisma.tablaCustom.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// ── Columnas (dictionary entries) ──

router.post('/:id/columnas', async (req, res) => {
  try {
    const { clave, etiqueta, tipo, opciones, referencia, maxLength, defaultValue, display, requerido, orden } = req.body;
    if (!clave || !etiqueta) return res.status(400).json({ error: 'clave y etiqueta son requeridos' });
    if (!CLAVE_OK.test(clave)) return res.status(400).json({ error: 'clave debe ser snake_case' });
    const data = await prisma.columnaCustom.create({
      data: { tablaId: req.params.id, clave, etiqueta, tipo: tipo || 'string', opciones, referencia, maxLength, defaultValue, display: !!display, requerido: !!requerido, orden: orden ?? 0 },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id/columnas/:colId', async (req, res) => {
  try {
    const campos = ['clave', 'etiqueta', 'tipo', 'opciones', 'referencia', 'maxLength', 'defaultValue', 'display', 'requerido', 'orden', 'activo'];
    const data = {};
    campos.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const col = await prisma.columnaCustom.update({ where: { id: req.params.colId }, data });
    res.json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id/columnas/:colId', async (req, res) => {
  try {
    await prisma.columnaCustom.delete({ where: { id: req.params.colId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Preview: genera una definición de formulario desde las columnas ──
// (compatible con el FormRenderer del form builder)
router.get('/:id/preview', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });

    const TIPO_A_CAMPO = {
      string: 'texto', text: 'textarea', integer: 'numerico', float: 'flotante',
      boolean: 'booleano', choice: 'choices', date: 'fecha', datetime: 'fecha',
      attachment: 'attachment', reference: 'texto',
    };
    const campos = {};
    const claves = [];
    for (const col of tabla.columnas) {
      campos[col.clave] = {
        clave: col.clave,
        etiqueta: col.etiqueta,
        tipo: TIPO_A_CAMPO[col.tipo] || 'texto',
        requerido: col.requerido,
        opciones: Array.isArray(col.opciones) ? col.opciones.join(',') : '',
        placeholder: col.defaultValue || '',
      };
      claves.push(col.clave);
    }
    // Layout: filas de 2 columnas
    const layout = [];
    for (let i = 0; i < claves.length; i += 2) {
      layout.push({ columnas: 2, campos: claves.slice(i, i + 2) });
    }
    res.json({
      clave: `preview_${tabla.clave}`,
      nombre: `Preview: ${tabla.label}`,
      tipo: 'simple',
      modulo: tabla.modulo,
      definicion: { pasos: [{ titulo: tabla.label, tipo: 'campos', layout }], campos, clientScripts: [], uiActions: [] },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Datos (vista lista con filtros) ──

// GET /api/tablas/:id/registros?page&limit&filtros(JSON {clave:valor})&buscar
router.get('/:id/registros', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let filtros = {};
    try { filtros = JSON.parse(req.query.filtros || '{}'); } catch { filtros = {}; }

    // Tabla física existente (materiales_registros)
    if (tabla.storage === 'materiales_registros') {
      const where = {};
      for (const [k, v] of Object.entries(filtros)) {
        if (v === '' || v === undefined) continue;
        const col = tabla.columnas.find((c) => c.clave === k);
        if (!col) continue;
        where[k] = ['integer', 'float'].includes(col.tipo) ? Number(v) : { contains: String(v), mode: 'insensitive' };
      }
      const [data, total] = await Promise.all([
        prisma.materialesRegistro.findMany({ where, orderBy: { noMateria: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.materialesRegistro.count({ where }),
      ]);
      return res.json({ data: data.map((r) => ({ id: r.sysId, ...Object.fromEntries(tabla.columnas.map((c) => [c.clave, r[c.clave] ?? null])) })), total, page, limit });
    }

    // Storage JSON: filtrar con JSONB
    const where = { tablaId: tabla.id };
    for (const [k, v] of Object.entries(filtros)) {
      if (v === '' || v === undefined) continue;
      where.datos = { path: [k], string_contains: String(v) };
    }
    const [data, total] = await Promise.all([
      prisma.customRegistro.findMany({ where, orderBy: { creadoEn: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.customRegistro.count({ where }),
    ]);
    res.json({ data: data.map((r) => ({ id: r.id, ...r.datos })), total, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tablas/:id/registros — crear registro (storage json)
router.post('/:id/registros', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });
    if (tabla.storage !== 'json') return res.status(400).json({ error: 'Tabla de solo lectura (storage físico)' });

    const clavesValidas = new Set(tabla.columnas.map((c) => c.clave));
    const datos = Object.fromEntries(Object.entries(req.body.datos || {}).filter(([k]) => clavesValidas.has(k)));
    // Requeridos
    for (const col of tabla.columnas) {
      if (col.requerido && (datos[col.clave] === undefined || datos[col.clave] === '')) {
        return res.status(400).json({ error: `${col.etiqueta} es requerido` });
      }
    }
    const data = await prisma.customRegistro.create({ data: { tablaId: tabla.id, datos } });
    res.status(201).json({ id: data.id, ...data.datos });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/tablas/:id/registros/:regId
router.put('/:id/registros/:regId', async (req, res) => {
  try {
    const reg = await prisma.customRegistro.findUnique({ where: { id: req.params.regId } });
    if (!reg || reg.tablaId !== req.params.id) return res.status(404).json({ error: 'No encontrado' });
    const datos = { ...reg.datos, ...(req.body.datos || {}) };
    const data = await prisma.customRegistro.update({ where: { id: reg.id }, data: { datos } });
    res.json({ id: data.id, ...data.datos });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id/registros/:regId', async (req, res) => {
  try {
    await prisma.customRegistro.delete({ where: { id: req.params.regId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
