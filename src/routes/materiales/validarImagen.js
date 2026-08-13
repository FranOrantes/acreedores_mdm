const { Router } = require('express');
const axios = require('axios');
const prisma = require('../../lib/prisma');

const router = Router();

// Réplica de la integración "MDM Imagen Rixie" de ServiceNow
// (REST Message: POST https://concordia.nadro.dev/api/validate)
const RIXIE_URL = process.env.RIXIE_VALIDATE_URL || 'https://concordia.nadro.dev/api/validate';
const RIXIE_API_KEY = process.env.RIXIE_API_KEY; // header X-API-Key (misma que el REST Message de SN)
const CHECKS = ['Formato', 'Tamaño', 'Dimensiones', 'Fondo'];

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
      // validateStatus: como el RESTMessageV2 de SN, leemos el body aunque el status no sea 2xx
      const { data } = await axios.post(
        RIXIE_URL,
        { image: doc.contenidoBase64, mimetype: doc.mimeType, filename: doc.nombreArchivo, position: 'frontal' },
        {
          headers: { 'Content-Type': 'application/json', ...(RIXIE_API_KEY ? { 'X-API-Key': RIXIE_API_KEY } : {}) },
          timeout: 30000,
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
