const express = require('express');
const prisma = require('../lib/prisma');
const engine = require('../lib/scriptEngine');
const router = express.Router();

// ── Ejecutor reutilizable (también usado programáticamente por otros módulos) ──

// Sustituye {{variables}} en un string
function replaceVars(str, variables) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (variables[key] !== undefined ? variables[key] : `{{${key}}}`));
}

// Ejecuta una definición de request (metodo, url, headers, body, auth) con variables.
// Si trae scriptRespuesta, lo corre con el scriptEngine (contexto: status, body, headers, callScriptInclude)
// y el return del script reemplaza el body de salida.
async function ejecutarRequest(def, variables = {}) {
  const headersObj = {};
  (Array.isArray(def.headers) ? def.headers : []).forEach((h) => {
    if (h.activo !== false && h.key) {
      headersObj[replaceVars(h.key, variables)] = replaceVars(h.value || '', variables);
    }
  });

  if (def.authTipo === 'bearer' && def.authConfig?.token) {
    headersObj['Authorization'] = `Bearer ${replaceVars(def.authConfig.token, variables)}`;
  } else if (def.authTipo === 'basic' && def.authConfig?.user) {
    const encoded = Buffer.from(`${replaceVars(def.authConfig.user, variables)}:${replaceVars(def.authConfig.pass || '', variables)}`).toString('base64');
    headersObj['Authorization'] = `Basic ${encoded}`;
  }

  const metodo = (def.metodo || 'GET').toUpperCase();
  let bodyFinal = def.body ? replaceVars(def.body, variables) : undefined;
  if (['POST', 'PUT', 'PATCH'].includes(metodo) && (def.bodyTipo === 'json' || !def.bodyTipo) && bodyFinal) {
    headersObj['Content-Type'] = headersObj['Content-Type'] || 'application/json';
  }

  const startTime = Date.now();
  const response = await fetch(replaceVars(def.url, variables), {
    method: metodo,
    headers: headersObj,
    body: ['POST', 'PUT', 'PATCH'].includes(metodo) ? bodyFinal : undefined,
  });
  const elapsed = Date.now() - startTime;

  const contentType = response.headers.get('content-type') || '';
  let responseBody = contentType.includes('application/json') ? await response.json() : await response.text();

  const responseHeaders = {};
  response.headers.forEach((value, key) => { responseHeaders[key] = value; });

  // Script post-respuesta (estilo Postman "Tests"): puede transformar/validar el body
  let scriptLogs = [];
  if (def.scriptRespuesta) {
    try {
      const { resultado, logs } = await engine.runScript(def.scriptRespuesta, {
        status: response.status,
        body: responseBody,
        headers: responseHeaders,
        callScriptInclude: engine.callScriptInclude,
        prisma,
      });
      scriptLogs = logs;
      if (resultado !== undefined) responseBody = resultado;
    } catch (err) {
      scriptLogs = [`[scriptRespuesta] Error: ${err.message}`];
    }
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseBody,
    time: elapsed,
    size: JSON.stringify(responseBody)?.length || 0,
    scriptLogs,
  };
}

// Ejecuta un request guardado por nombre (o id) dentro de una colección.
// Uso desde otros módulos: require('../integraciones').ejecutarGuardado('Rixie — Validar Imagen', { image, ... })
async function ejecutarGuardado(nombreOId, variables = {}) {
  const req = await prisma.integracionRequest.findFirst({
    where: { OR: [{ id: nombreOId }, { nombre: nombreOId }] },
    include: { coleccion: true },
  });
  if (!req) throw new Error(`Integración no encontrada: ${nombreOId}`);
  // variables de la colección como base, las del caller encima
  const merged = { ...(req.coleccion?.variables || {}), ...variables };
  return ejecutarRequest(req, merged);
}

// ── Colecciones ──

// GET /api/integraciones/colecciones
router.get('/colecciones', async (req, res) => {
  try {
    const colecciones = await prisma.integracionColeccion.findMany({
      include: { requests: { orderBy: { orden: 'asc' } } },
      orderBy: { orden: 'asc' },
    });
    res.json(colecciones);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/integraciones/colecciones
router.post('/colecciones', async (req, res) => {
  try {
    const { nombre, descripcion, variables, modulo } = req.body;
    const col = await prisma.integracionColeccion.create({
      data: {
        nombre: nombre || 'Nueva Colección',
        descripcion: descripcion || null,
        modulo: modulo || 'todos',
        variables: variables || {},
      },
      include: { requests: true },
    });
    res.status(201).json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/integraciones/colecciones/:id
router.patch('/colecciones/:id', async (req, res) => {
  try {
    const data = {};
    ['nombre', 'descripcion', 'variables', 'orden', 'modulo'].forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const col = await prisma.integracionColeccion.update({
      where: { id: req.params.id },
      data,
      include: { requests: { orderBy: { orden: 'asc' } } },
    });
    res.json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/integraciones/colecciones/:id
router.delete('/colecciones/:id', async (req, res) => {
  try {
    await prisma.integracionColeccion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Requests ──

// POST /api/integraciones/requests
router.post('/requests', async (req, res) => {
  try {
    const { coleccionId, nombre, metodo, url, headers, body, bodyTipo, authTipo, authConfig, scriptRespuesta } = req.body;
    const request = await prisma.integracionRequest.create({
      data: {
        coleccionId,
        nombre: nombre || 'New Request',
        metodo: metodo || 'GET',
        url: url || '',
        headers: headers || [],
        body: body || null,
        bodyTipo: bodyTipo || 'json',
        authTipo: authTipo || 'none',
        authConfig: authConfig || null,
        scriptRespuesta: scriptRespuesta || null,
      },
    });
    res.status(201).json(request);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/integraciones/requests/:id
router.patch('/requests/:id', async (req, res) => {
  try {
    const data = {};
    ['nombre', 'metodo', 'url', 'headers', 'body', 'bodyTipo', 'authTipo', 'authConfig', 'scriptRespuesta', 'orden', 'coleccionId'].forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const request = await prisma.integracionRequest.update({
      where: { id: req.params.id },
      data,
    });
    res.json(request);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/integraciones/requests/:id
router.delete('/requests/:id', async (req, res) => {
  try {
    await prisma.integracionRequest.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Ejecutar request (proxy) ──

// POST /api/integraciones/ejecutar — ejecuta una definición ad-hoc (desde la UI)
router.post('/ejecutar', async (req, res) => {
  try {
    res.json(await ejecutarRequest(req.body, req.body.variables || {}));
  } catch (e) {
    res.json({
      status: 0, statusText: 'Error', headers: {},
      body: { error: e.message }, time: 0, size: 0,
    });
  }
});

// POST /api/integraciones/ejecutar-guardado — ejecuta un request guardado por nombre/id
// Body: { nombreOId, variables? }
router.post('/ejecutar-guardado', async (req, res) => {
  try {
    const { nombreOId, variables } = req.body;
    if (!nombreOId) return res.status(400).json({ error: 'nombreOId requerido' });
    res.json(await ejecutarGuardado(nombreOId, variables || {}));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
module.exports.ejecutarRequest = ejecutarRequest;
module.exports.ejecutarGuardado = ejecutarGuardado;
