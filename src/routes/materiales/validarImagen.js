const { Router } = require('express');
const axios = require('axios');
const prisma = require('../../lib/prisma');
const config = require('./configService');

const router = Router();

// Réplica de la integración "MDM Imagen Rixie" de ServiceNow.
// URL, API key, position y timeout son parametrizables (módulo Configuración).

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

    // Misma lógica que SN: si el mensaje no es el de rechazo → Correcto
    if (recordData.message !== 'La imagen no cumple con todos los requisitos técnicos.') {
      return res.json({ resultado: 'Correcto', detalles: [], crudo: recordData });
    }

    const detalles = [];
    const vd = recordData.validation_details?.[0] || {};
    for (const check of Object.keys(vd)) {
      const [ok, motivo] = String(vd[check] || '').split(' / ');
      if (ok === 'false') detalles.push(`${check}: ${motivo}`);
    }
    return res.json({ resultado: 'Error', detalles, crudo: recordData });
  } catch (err) {
    console.error('[Materiales] Error validando imagen:', err);
    res.status(500).json({ error: 'Error al validar imagen' });
  }
});

module.exports = router;
