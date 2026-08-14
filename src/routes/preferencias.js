const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

// Preferencias por usuario (paginación, columnas, vistas) — persistidas en BD.
// Identifica al usuario por la cookie de sesión; sin sesión usa 'anon'.

function usuarioDeRequest(req) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return 'anon';
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId || decoded.email || 'anon';
  } catch {
    return 'anon';
  }
}

// GET /api/preferencias — todas las del usuario actual
router.get('/', async (req, res) => {
  const usuarioId = usuarioDeRequest(req);
  const data = await prisma.preferenciaUsuario.findMany({ where: { usuarioId } });
  res.json(Object.fromEntries(data.map((p) => [p.clave, p.valor])));
});

// GET /api/preferencias/:clave
router.get('/:clave', async (req, res) => {
  const usuarioId = usuarioDeRequest(req);
  const pref = await prisma.preferenciaUsuario.findUnique({
    where: { usuarioId_clave: { usuarioId, clave: req.params.clave } },
  });
  res.json(pref ? pref.valor : null);
});

// PUT /api/preferencias/:clave  { valor }
router.put('/:clave', async (req, res) => {
  const usuarioId = usuarioDeRequest(req);
  const { valor } = req.body;
  if (valor === undefined) return res.status(400).json({ error: 'valor requerido' });
  const data = await prisma.preferenciaUsuario.upsert({
    where: { usuarioId_clave: { usuarioId, clave: req.params.clave } },
    update: { valor },
    create: { usuarioId, clave: req.params.clave, valor },
  });
  res.json({ ok: true, clave: data.clave });
});

module.exports = router;
