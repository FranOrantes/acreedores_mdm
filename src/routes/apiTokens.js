const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { contextoSesion } = require('../lib/sesion');

const router = express.Router();

// Tokens de aplicaciones (acceso de sistemas externos a las Scripted REST APIs)
// Solo admins los gestionan.

async function soloAdmin(req, res, next) {
  const ctx = await contextoSesion(req);
  if (ctx.usuario && (ctx.usuario.rolInterno === 'admin' || ctx.usuario.esSuperAdmin)) return next();
  res.status(403).json({ error: 'Solo administradores' });
}

router.use(soloAdmin);

router.get('/', async (req, res) => {
  const data = await prisma.apiToken.findMany({ orderBy: { creadoEn: 'desc' } });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { nombre, expiraEn } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
  const ctx = await contextoSesion(req);
  const token = 'mdm_' + crypto.randomBytes(32).toString('hex');
  const data = await prisma.apiToken.create({
    data: { nombre, token, expiraEn: expiraEn ? new Date(expiraEn) : null, creadoPor: ctx.usuario?.id },
  });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { nombre, activo, expiraEn } = req.body;
  const data = await prisma.apiToken.update({
    where: { id: req.params.id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(activo !== undefined && { activo }),
      ...(expiraEn !== undefined && { expiraEn: expiraEn ? new Date(expiraEn) : null }),
    },
  });
  res.json(data);
});

router.post('/:id/rotar', async (req, res) => {
  const token = 'mdm_' + crypto.randomBytes(32).toString('hex');
  const data = await prisma.apiToken.update({ where: { id: req.params.id }, data: { token } });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await prisma.apiToken.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
