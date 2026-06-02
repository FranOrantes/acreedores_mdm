const express = require('express');
const axios = require('axios');
const router = express.Router();

const COPOMEX_TOKEN = process.env.COPOMEX_TOKEN || 'pruebas';

router.get('/:cp', async (req, res) => {
  const { cp } = req.params;
  if (!cp || !/^\d{4,5}$/.test(cp)) {
    return res.status(400).json({ error: 'Código postal inválido' });
  }
  try {
    const { data } = await axios.get(
      `https://api.copomex.com/query/info_cp/${cp}?type=simplified&token=${COPOMEX_TOKEN}`,
      { timeout: 8000 }
    );
    if (data.error) {
      return res.status(404).json({ error: data.error_message || 'CP no encontrado' });
    }
    const entries = Array.isArray(data.response) ? data.response : [data.response];
    if (!entries.length || !entries[0]) {
      return res.status(404).json({ error: 'CP no encontrado' });
    }
    res.json({
      cp,
      estado: entries[0].estado,
      municipio: entries[0].municipio,
      ciudad: entries[0].ciudad || entries[0].municipio,
      colonias: [...new Set(entries.map((e) => e.asentamiento).filter(Boolean))],
    });
  } catch (e) {
    console.error('[SEPOMEX] Error:', e.message);
    res.status(502).json({ error: 'No se pudo consultar el código postal' });
  }
});

module.exports = router;
