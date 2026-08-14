const { Router } = require('express');
const axios = require('axios');
const prisma = require('../../lib/prisma');
const config = require('./configService');
const { callScriptInclude } = require('../../lib/scriptEngine');

const router = Router();

// Réplica de la integración "MDM Imagen Rixie" de ServiceNow.
// URL, API key, position y timeout: módulo Configuración.
// Interpretación de la respuesta: Script Include "MDM_Rixie".interpretar.

// POST /api/materiales/validar-imagen { adjuntoId }
// Réplica de jj_MDM_Utils_Client.rixie_Imagen
router.post('/validar-imagen', async (req, res) => {
  try {
    const { adjuntoId } = req.body;
    if (!adjuntoId) return res.status(400).json({ error: 'adjuntoId requerido' });

    const temp = await prisma.documentoTemporal.findUnique({ where: { id: adjuntoId } });
    const doc = temp || await prisma.documento.findUnique({ where: { id: adjuntoId } });
    if (!doc) {
      return res.json({ resultado: 'Error', detalles: [`No se encontró el adjunto: ${adjuntoId}`] });
    }

    let recordData;
    try {
      const [url, apiKey, position, timeout] = await Promise.all([
        config.get('integracion.rixie.url'),
        config.get('integracion.rixie.api_key'),
        config.get('integracion.rixie.position'),
        config.get('integracion.rixie.timeout_ms'),
      ]);
      // validateStatus: como el RESTMessageV2 de SN, leemos el body aunque el status no sea 2xx
      const { data } = await axios.post(
        url,
        { image: doc.contenidoBase64, mimetype: doc.mimeType, filename: doc.nombreArchivo, position: position || 'frontal' },
        {
          headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}) },
          timeout: Number(timeout) || 30000,
          validateStatus: () => true,
        }
      );
      recordData = data;
    } catch (err) {
      return res.json({ resultado: 'Error', detalles: [`Ocurrió un error al validar la imagen: ${err.message}`] });
    }

    // Interpretación vía Script Include MDM_Rixie (editable sin tocar código)
    const interpretacion = await callScriptInclude('MDM_Rixie', 'interpretar', recordData);
    return res.json({ ...interpretacion, crudo: recordData });
  } catch (err) {
    console.error('[Materiales] Error validando imagen:', err);
    res.status(500).json({ error: 'Error al validar imagen' });
  }
});

module.exports = router;
