const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// ── Mapa de modelos Prisma por nombre de catálogo ──
const CATALOGS = {
  sucursales:              { model: 'catSucursal',              fields: ['codigo', 'nombre'],                                         label: 'Sucursales' },
  'tipos-acreedor':        { model: 'catTipoAcreedor',          fields: ['clave', 'nombre'],                                          label: 'Tipos de Acreedor' },
  'grupos-cuentas':        { model: 'catGrupoCuentas',           fields: ['clave', 'nombre'],                                          label: 'Grupos de Cuentas' },
  'cuentas-asociadas':     { model: 'catCuentaAsociada',         fields: ['codigo', 'nombre', 'grupoCuentasId'],                       label: 'Cuentas Asociadas' },
  'condiciones-pago':      { model: 'catCondicionPago',          fields: ['clave', 'nombre'],                                          label: 'Condiciones de Pago' },
  'tipos-documento':       { model: 'catTipoDocumento',          fields: ['clave', 'nombre', 'descripcion', 'obligatorio', 'condicional', 'extensiones', 'maxSizeMb', 'maxArchivos', 'orden', 'icono'], label: 'Tipos de Documento' },
  'servicios-especiales':  { model: 'catServiciosEspeciales',    fields: ['clave', 'nombre'],                                          label: 'Servicios Especiales' },
  'casos-especiales':      { model: 'catCasosEspeciales',        fields: ['clave', 'nombre'],                                          label: 'Casos Especiales' },
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

// GET /api/admin/catalogos/:catalog — listar todos los registros (incluye inactivos)
router.get('/:catalog', async (req, res) => {
  const cfg = CATALOGS[req.params.catalog];
  if (!cfg) return res.status(404).json({ error: 'Catálogo no encontrado' });
  try {
    const data = await prisma[cfg.model].findMany({ orderBy: { id: 'asc' } });
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
    const created = await prisma[cfg.model].create({ data });
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
    const updated = await prisma[cfg.model].update({ where: { id: req.params.id }, data });
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
