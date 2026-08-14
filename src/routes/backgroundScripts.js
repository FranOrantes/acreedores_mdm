const express = require('express');
const prisma = require('../lib/prisma');
const { runScript, callScriptInclude, cargarInclude } = require('../lib/scriptEngine');
const { contextoSesion, construirGs } = require('../lib/sesion');
const { logSistema, reqInfo } = require('../lib/logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Background Scripts (playground admin estilo ServiceNow "Scripts - Background")
// Solo admins. Ejecuta en el SERVIDOR con todo el sandbox: gs, glideRecord,
// incluir, callScriptInclude, prisma, fetch. Cada corrida queda en logs.
// ─────────────────────────────────────────────────────────────────────────────

async function esAdmin(req) {
  const ctx = await contextoSesion(req);
  return { ctx, ok: !!ctx.usuario && (ctx.usuario.rolInterno === 'admin' || ctx.usuario.esSuperAdmin) };
}

// POST /api/scripts/ejecutar — ejecuta script en servidor (solo admin)
router.post('/ejecutar', async (req, res) => {
  const { ctx, ok } = await esAdmin(req);
  if (!ok) return res.status(403).json({ error: 'Solo administradores pueden ejecutar background scripts' });

  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'script requerido' });

  const inicio = Date.now();
  const logsCaptura = [];
  try {
    const { resultado, logs } = await runScript(script, {
      prisma,
      fetch,
      callScriptInclude,
      glideRecord: require('../lib/scriptEngine').glideRecord,
      incluir: cargarInclude,
      gs: construirGs(ctx, logsCaptura),
      logsCaptura,
      datos: req.body.datos || {},
    });
    // logs del sandbox (console/gs.log escriben en el mismo array)
    const ms = Date.now() - inicio;
    logSistema('script', 'Background script ejecutado', {
      detalle: `${script.length} chars · ${ms}ms`,
      usuarioId: ctx.usuario?.id, usuarioEmail: ctx.usuario?.email, usuarioNombre: ctx.usuario?.nombre,
      metadata: { script: script.slice(0, 2000), resultado: JSON.stringify(resultado)?.slice(0, 2000), logs: logs.slice(0, 100) },
      ...reqInfo(req),
    });
    res.json({ ok: true, resultado, logs: logsCaptura, ms });
  } catch (e) {
    logSistema('script', 'Background script falló', {
      detalle: e.message, nivel: 'error',
      usuarioId: ctx.usuario?.id, usuarioEmail: ctx.usuario?.email, usuarioNombre: ctx.usuario?.nombre,
      metadata: { script: script.slice(0, 2000) },
      ...reqInfo(req),
    });
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
