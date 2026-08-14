const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

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
    const { nombre, descripcion, variables } = req.body;
    const col = await prisma.integracionColeccion.create({
      data: {
        nombre: nombre || 'Nueva Colección',
        descripcion: descripcion || null,
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
    ['nombre', 'descripcion', 'variables', 'orden'].forEach((f) => {
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
    const { coleccionId, nombre, metodo, url, headers, body, bodyTipo, authTipo, authConfig } = req.body;
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
    ['nombre', 'metodo', 'url', 'headers', 'body', 'bodyTipo', 'authTipo', 'authConfig', 'orden', 'coleccionId'].forEach((f) => {
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

// POST /api/integraciones/ejecutar
router.post('/ejecutar', async (req, res) => {
  try {
    const { metodo, url, headers = [], body, bodyTipo, authTipo, authConfig, variables = {} } = req.body;

    // Replace {{variables}} in URL and headers
    const replaceVars = (str) => {
      if (!str) return str;
      return str.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] !== undefined ? variables[key] : `{{${key}}}`);
    };

    const finalUrl = replaceVars(url);

    // Build headers object
    const headersObj = {};
    (Array.isArray(headers) ? headers : []).forEach((h) => {
      if (h.activo !== false && h.key) {
        headersObj[replaceVars(h.key)] = replaceVars(h.value || '');
      }
    });

    // Auth
    if (authTipo === 'bearer' && authConfig?.token) {
      headersObj['Authorization'] = `Bearer ${replaceVars(authConfig.token)}`;
    } else if (authTipo === 'basic' && authConfig?.user) {
      const encoded = Buffer.from(`${replaceVars(authConfig.user)}:${replaceVars(authConfig.pass || '')}`).toString('base64');
      headersObj['Authorization'] = `Basic ${encoded}`;
    }

    // Set content-type if body
    if (['POST', 'PUT', 'PATCH'].includes(metodo?.toUpperCase()) && bodyTipo === 'json' && body) {
      headersObj['Content-Type'] = headersObj['Content-Type'] || 'application/json';
    }

    // Execute request using native fetch
    const startTime = Date.now();
    const fetchOptions = {
      method: metodo?.toUpperCase() || 'GET',
      headers: headersObj,
    };

    if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method) && body) {
      fetchOptions.body = body;
    }

    const response = await fetch(finalUrl, fetchOptions);
    const elapsed = Date.now() - startTime;

    // Read response
    const contentType = response.headers.get('content-type') || '';
    let responseBody;
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Collect response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time: elapsed,
      size: JSON.stringify(responseBody).length,
    });
  } catch (e) {
    res.json({
      status: 0,
      statusText: 'Error',
      headers: {},
      body: { error: e.message },
      time: 0,
      size: 0,
    });
  }
});

module.exports = router;
