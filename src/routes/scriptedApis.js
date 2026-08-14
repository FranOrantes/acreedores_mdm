const express = require('express');
const prisma = require('../lib/prisma');
const { runScript, callScriptInclude, cargarInclude, glideRecord } = require('../lib/scriptEngine');
const { contextoSesion, construirGs } = require('../lib/sesion');
const { logSistema, reqInfo } = require('../lib/logger');

const router = express.Router();
const adminRouter = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Scripted REST APIs (estilo ServiceNow): exponen /api/ext/<path> con un script.
// Auth: header X-App-Token (ApiToken) o ninguno, según authTipo de cada API.
// ─────────────────────────────────────────────────────────────────────────────

// CRUD admin (solo admins)
adminRouter.use(async (req, res, next) => {
  const ctx = await contextoSesion(req);
  if (ctx.usuario && (ctx.usuario.rolInterno === 'admin' || ctx.usuario.esSuperAdmin)) return next();
  res.status(403).json({ error: 'Solo administradores' });
});

adminRouter.get('/', async (req, res) => {
  res.json(await prisma.scriptedApi.findMany({ orderBy: { creadoEn: 'desc' } }));
});

adminRouter.post('/', async (req, res) => {
  const { nombre, metodo, path, script, authTipo } = req.body;
  if (!nombre || !path || !script) return res.status(400).json({ error: 'nombre, path y script son requeridos' });
  const limpio = path.replace(/^\/+/, '').replace(/\/+$/, '');
  try {
    const data = await prisma.scriptedApi.create({ data: { nombre, metodo: metodo || 'GET', path: limpio, script, authTipo: authTipo || 'token' } });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

adminRouter.put('/:id', async (req, res) => {
  const { nombre, metodo, path, script, authTipo, activo } = req.body;
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (metodo !== undefined) data.metodo = metodo;
  if (path !== undefined) data.path = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (script !== undefined) data.script = script;
  if (authTipo !== undefined) data.authTipo = authTipo;
  if (activo !== undefined) data.activo = activo;
  res.json(await prisma.scriptedApi.update({ where: { id: req.params.id }, data }));
});

adminRouter.delete('/:id', async (req, res) => {
  await prisma.scriptedApi.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Ejecutor dinámico: /api/ext/<path>
router.all('/{*path}', async (req, res) => {
  const ruta = (req.params.path || []).join('/');
  const api = await prisma.scriptedApi.findFirst({ where: { path: ruta, metodo: req.method, activo: true } });
  if (!api) return res.status(404).json({ error: `API no encontrada: ${req.method} /api/ext/${ruta}` });

  // Auth por token de aplicación
  let tokenUsado = null;
  if (api.authTipo === 'token') {
    const t = req.headers['x-app-token'];
    if (!t) return res.status(401).json({ error: 'X-App-Token requerido' });
    tokenUsado = await prisma.apiToken.findFirst({ where: { token: t, activo: true } });
    if (!tokenUsado) return res.status(401).json({ error: 'Token inválido' });
    if (tokenUsado.expiraEn && tokenUsado.expiraEn < new Date()) return res.status(401).json({ error: 'Token expirado' });
    prisma.apiToken.update({ where: { id: tokenUsado.id }, data: { ultimoUso: new Date() } }).catch(() => {});
  }

  const ctx = await contextoSesion(req);
  try {
    const { resultado, logs } = await runScript(api.script, {
      query: req.query,
      body: req.body || {},
      params: { ruta },
      headers: req.headers,
      aplicacion: tokenUsado ? { id: tokenUsado.id, nombre: tokenUsado.nombre } : null,
      prisma,
      fetch,
      callScriptInclude,
      glideRecord,
      incluir: cargarInclude,
      gs: construirGs(ctx, null),
    });
    logSistema('api_externa', `${api.nombre} (${req.method} /api/ext/${ruta})`, {
      detalle: `Aplicación: ${tokenUsado?.nombre || 'sin token'}`,
      usuarioId: ctx.usuario?.id, usuarioEmail: ctx.usuario?.email,
      metadata: { logs: logs.slice(0, 50) },
      ...reqInfo(req),
    });
    if (resultado && typeof resultado === 'object' && 'status' in resultado && 'body' in resultado) {
      return res.status(resultado.status).json(resultado.body);
    }
    res.json(resultado ?? { ok: true });
  } catch (e) {
    logSistema('api_externa', `Error en ${api.nombre}`, { detalle: e.message, nivel: 'error', ...reqInfo(req) });
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, adminRouter };
