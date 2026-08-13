const { Router } = require('express');
const axios = require('axios');
const config = require('./configService');

const router = Router();

const MASK = '••••••••';

// GET /api/materiales/configuracion — lista la config (secrets enmascarados)
router.get('/configuracion', async (req, res) => {
  try {
    const valores = await config.getAll();
    const items = config.DEFAULTS.map((def) => ({
      clave: def.clave,
      tipo: def.tipo,
      grupo: def.grupo,
      descripcion: def.descripcion,
      sensible: !!def.sensible,
      valor: def.sensible
        ? (valores[def.clave] ? MASK : '')
        : valores[def.clave],
      tieneValor: !!valores[def.clave],
    }));
    res.json(items);
  } catch (err) {
    console.error('[Materiales][Config] Error al listar:', err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /api/materiales/configuracion/:clave — actualiza un valor (aplica al momento)
// Body: { valor, usuario? } — para secrets: solo se reemplaza si viene valor nuevo
router.put('/configuracion/:clave', async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor, usuario } = req.body;
    if (valor === undefined) return res.status(400).json({ error: 'valor requerido' });

    const def = config.DEFAULTS.find((d) => d.clave === clave);
    if (!def) return res.status(404).json({ error: `Clave desconocida: ${clave}` });

    // Validación por tipo (server-side)
    if (def.tipo === 'number' && Number.isNaN(Number(valor))) {
      return res.status(400).json({ error: 'El valor debe ser numérico' });
    }
    if (def.tipo === 'url' && !/^https?:\/\/.+/.test(String(valor))) {
      return res.status(400).json({ error: 'El valor debe ser una URL http(s) válida' });
    }
    if (def.tipo === 'json' && typeof valor === 'string') {
      try { JSON.parse(valor); } catch { return res.status(400).json({ error: 'JSON inválido' }); }
    }

    const valorFinal = def.tipo === 'number' ? Number(valor) : (def.tipo === 'json' && typeof valor === 'string' ? JSON.parse(valor) : valor);
    await config.set(clave, valorFinal, usuario);
    res.json({ ok: true, clave, aplicado: 'inmediato' });
  } catch (err) {
    console.error('[Materiales][Config] Error al guardar:', err);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// POST /api/materiales/configuracion/probar/:clave — prueba viva de una integración
router.post('/configuracion/probar/:clave', async (req, res) => {
  try {
    const { clave } = req.params;

    if (clave === 'integracion.rixie.url' || clave === 'integracion.rixie.api_key') {
      const [url, apiKey, position, timeout] = await Promise.all([
        config.get('integracion.rixie.url'),
        config.get('integracion.rixie.api_key'),
        config.get('integracion.rixie.position'),
        config.get('integracion.rixie.timeout_ms'),
      ]);
      // PNG 1x1 de muestra para probar conectividad + auth
      const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const inicio = Date.now();
      const resp = await axios.post(
        url,
        { image: png1x1, mimetype: 'image/png', filename: 'test_conexion.png', position },
        {
          headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}) },
          timeout: Number(timeout) || 30000,
          validateStatus: () => true,
        }
      );
      const ms = Date.now() - inicio;
      return res.json({
        ok: resp.status < 500,
        httpStatus: resp.status,
        latenciaMs: ms,
        mensaje: resp.data?.message || null,
        resultado: resp.data?.resultado ?? null,
      });
    }

    return res.status(400).json({ error: `No hay prueba implementada para "${clave}"` });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
