const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// ── Mapa de modelos Prisma por nombre de catálogo ──
const CATALOGS = {
  sucursales:              { model: 'catSucursal',              fields: ['codigo', 'nombre'],                                         label: 'Sucursales' },
  'tipos-acreedor':        { model: 'catTipoAcreedor',          fields: ['clave', 'nombre'],                                          label: 'Tipos de Acreedor' },
  'grupos-cuentas':        { model: 'catGrupoCuentas',           fields: ['clave', 'nombre'],                                          label: 'Grupos de Cuentas' },
  'cuentas-asociadas':     { model: 'catCuentaAsociada',         fields: ['codigo', 'nombre', 'valorSap'],    label: 'Cuentas Asociadas', include: { gruposCuentas: true }, m2m: { gruposCuentasIds: { relation: 'gruposCuentas', field: 'id' } } },
  retenciones:               { model: 'catRetencion',              fields: ['cuentaAsociadaId', 'grupoCuentasId', 'esquemaResico', 'tipoRetencion', 'indicadorRetencionCuentas', 'aplicaFisica', 'aplicaMoral'], label: 'Retenciones', include: { cuentaAsociada: true, grupoCuentas: true } },
  'condiciones-pago':      { model: 'catCondicionPago',          fields: ['clave', 'nombre'],                                          label: 'Condiciones de Pago' },
  'tipos-documento':       { model: 'catTipoDocumento',          fields: ['clave', 'nombre', 'descripcion', 'obligatorio', 'condicional', 'extensiones', 'maxSizeMb', 'maxArchivos', 'orden', 'icono', 'condiciones'], label: 'Tipos de Documento' },
  'servicios-especiales':  { model: 'catServiciosEspeciales',    fields: ['clave', 'nombre'],                                          label: 'Servicios Especiales' },
  'casos-especiales':      { model: 'catCasosEspeciales',        fields: ['clave', 'nombre'],                                          label: 'Casos Especiales' },
  'areas-solicitantes':    { model: 'catAreaSolicitante',         fields: ['clave', 'nombre'],                                          label: 'Áreas Solicitantes' },
  'acreedores-no-especializados': { model: 'catAcreedorNoEspecializado', fields: ['clave', 'nombre'],                                   label: 'Acreedores No Especializados' },
  'moneda-pago':           { model: 'catMonedaPago',             fields: ['clave', 'nombre'],                                          label: 'Moneda de Pago' },
  'via-pago':              { model: 'catViaPago',                fields: ['clave', 'nombre'],                                          label: 'Vía de Pago' },
  'moneda-pedido':         { model: 'catMonedaPedido',           fields: ['clave', 'nombre'],                                          label: 'Moneda Pedido' },
  'clasificacion-acreedor':{ model: 'catClasificacionAcreedor',  fields: ['clave', 'nombre'],                                          label: 'Clasificación del Acreedor' },
  localizacion:            { model: 'catLocalizacion',           fields: ['clave', 'nombre'],                                          label: 'Localización' },
  bancos:                  { model: 'catBanco',                  fields: ['clave', 'nombre'],                                          label: 'Bancos' },
};

// GET /api/admin/catalogos — lista de catálogos disponibles
router.get('/', (req, res) => {
  const list = Object.entries(CATALOGS).map(([key, val]) => ({ key, label: val.label, fields: val.fields }));
  res.json(list);
});

// ══════════════════════════════════════════════════
// Catalog-Module visibility config (MUST be before /:catalog routes)
// Stored as a single ConfiguracionModulo record with clave='catalogos.visibilidad'
// ══════════════════════════════════════════════════

const DEFAULT_CATALOG_VISIBILITY = Object.fromEntries(
  Object.entries(CATALOGS).map(([key]) => [key, ['acreedores', 'proveedores']])
);
DEFAULT_CATALOG_VISIBILITY['sucursales'] = ['acreedores', 'proveedores', 'materiales'];
DEFAULT_CATALOG_VISIBILITY['tipos-documento'] = ['acreedores', 'proveedores', 'materiales'];

router.get('/visibilidad-modulos', async (req, res) => {
  try {
    const config = await prisma.configuracionModulo.findFirst({
      where: { modulo: 'sistema', clave: 'catalogos.visibilidad' },
    });
    const visibility = config ? config.valor : DEFAULT_CATALOG_VISIBILITY;
    const merged = { ...DEFAULT_CATALOG_VISIBILITY, ...(typeof visibility === 'object' ? visibility : {}) };
    res.json(merged);
  } catch (e) {
    console.error('Error GET visibilidad-modulos:', e);
    res.status(500).json({ error: e.message });
  }
});

router.put('/visibilidad-modulos', async (req, res) => {
  try {
    const { visibilidad } = req.body;
    if (!visibilidad || typeof visibilidad !== 'object') {
      return res.status(400).json({ error: 'Se requiere un objeto visibilidad' });
    }
    const existing = await prisma.configuracionModulo.findFirst({
      where: { modulo: 'sistema', clave: 'catalogos.visibilidad' },
    });
    let config;
    if (existing) {
      config = await prisma.configuracionModulo.update({
        where: { id: existing.id },
        data: { valor: visibilidad },
      });
    } else {
      config = await prisma.configuracionModulo.create({
        data: {
          modulo: 'sistema',
          clave: 'catalogos.visibilidad',
          valor: visibilidad,
          tipo: 'json',
          grupo: 'General',
          descripcion: 'Visibilidad de catálogos por módulo',
        },
      });
    }
    res.json({ ok: true, data: config.valor });
  } catch (e) {
    console.error('Error PUT visibilidad-modulos:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/catalogos/:catalog — listar todos los registros (incluye inactivos)
router.get('/:catalog', async (req, res) => {
  const cfg = CATALOGS[req.params.catalog];
  if (!cfg) return res.status(404).json({ error: 'Catálogo no encontrado' });
  try {
    const query = { orderBy: { id: 'asc' } };
    if (cfg.include) query.include = cfg.include;
    const data = await prisma[cfg.model].findMany(query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/catalogos/:catalog — crear registro
router.post('/:catalog', async (req, res) => {
  const cfg = CATALOGS[req.params.catalog];
  if (!cfg) return res.status(404).json({ error: 'Catálogo no encontrado' });
  try {
    const data = {};
    cfg.fields.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    // Handle M2M relations
    if (cfg.m2m) {
      Object.entries(cfg.m2m).forEach(([bodyKey, { relation }]) => {
        const ids = req.body[bodyKey];
        if (Array.isArray(ids)) {
          data[relation] = { connect: ids.map((id) => ({ id })) };
        }
      });
    }
    const query = { data };
    if (cfg.include) query.include = cfg.include;
    const created = await prisma[cfg.model].create(query);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/admin/catalogos/:catalog/:id — actualizar registro
router.patch('/:catalog/:id', async (req, res) => {
  const cfg = CATALOGS[req.params.catalog];
  if (!cfg) return res.status(404).json({ error: 'Catálogo no encontrado' });
  try {
    const data = {};
    [...cfg.fields, 'activo'].forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    // Handle M2M relations
    if (cfg.m2m) {
      Object.entries(cfg.m2m).forEach(([bodyKey, { relation }]) => {
        const ids = req.body[bodyKey];
        if (Array.isArray(ids)) {
          data[relation] = { set: ids.map((id) => ({ id })) };
        }
      });
    }
    const query = { where: { id: req.params.id }, data };
    if (cfg.include) query.include = cfg.include;
    const updated = await prisma[cfg.model].update(query);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/admin/catalogos/:catalog/:id — eliminar registro
router.delete('/:catalog/:id', async (req, res) => {
  const cfg = CATALOGS[req.params.catalog];
  if (!cfg) return res.status(404).json({ error: 'Catálogo no encontrado' });
  try {
    await prisma[cfg.model].delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
