const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/sucursales', async (req, res) => {
  const data = await prisma.catSucursal.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } });
  res.json(data);
});

router.get('/tipos-acreedor', async (req, res) => {
  const data = await prisma.catTipoAcreedor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/grupos-cuentas', async (req, res) => {
  const data = await prisma.catGrupoCuentas.findMany({ where: { activo: true }, orderBy: { clave: 'asc' } });
  res.json(data);
});

router.get('/cuentas-asociadas', async (req, res) => {
  const { grupoCuentasId } = req.query;
  const where = { activo: true };
  if (grupoCuentasId) where.grupoCuentasId = grupoCuentasId;
  const data = await prisma.catCuentaAsociada.findMany({ where, orderBy: { codigo: 'asc' } });
  res.json(data);
});

router.get('/condiciones-pago', async (req, res) => {
  const data = await prisma.catCondicionPago.findMany({ where: { activo: true }, orderBy: { clave: 'asc' } });
  res.json(data);
});

router.get('/tipos-documento', async (req, res) => {
  const data = await prisma.catTipoDocumento.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } });
  res.json(data);
});

router.get('/servicios-especiales', async (req, res) => {
  const data = await prisma.catServiciosEspeciales.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/casos-especiales', async (req, res) => {
  const data = await prisma.catCasosEspeciales.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/moneda-pago', async (req, res) => {
  const data = await prisma.catMonedaPago.findMany({ where: { activo: true }, orderBy: { clave: 'asc' } });
  res.json(data);
});

router.get('/via-pago', async (req, res) => {
  const data = await prisma.catViaPago.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/moneda-pedido', async (req, res) => {
  const data = await prisma.catMonedaPedido.findMany({ where: { activo: true }, orderBy: { clave: 'asc' } });
  res.json(data);
});

router.get('/clasificacion-acreedor', async (req, res) => {
  const data = await prisma.catClasificacionAcreedor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/localizacion', async (req, res) => {
  const data = await prisma.catLocalizacion.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.get('/bancos', async (req, res) => {
  const data = await prisma.catBanco.findMany({ where: { activo: true }, orderBy: { clave: 'asc' } });
  res.json(data);
});

module.exports = router;
