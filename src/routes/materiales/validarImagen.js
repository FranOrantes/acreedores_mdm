const { Router } = require('express');
const prisma = require('../../lib/prisma');
const { ejecutarGuardado } = require('../integraciones');

const router = Router();

// Validación de imágenes vía integración "Rixie — Validar Imagen".
// Toda la lógica (URL, X-API-Key, body, interpretación de respuesta) vive en el
// módulo Integraciones → colección "Materiales" (editable sin tocar código).
const INTEGRACION_RIXIE = 'Rixie — Validar Imagen';

// POST /api/materiales/validar-imagen { adjuntoId }
router.post('/validar-imagen', async (req, res) => {
  try {
    const { adjuntoId } = req.body;
    if (!adjuntoId) return res.status(400).json({ error: 'adjuntoId requerido' });

    const temp = await prisma.documentoTemporal.findUnique({ where: { id: adjuntoId } });
    const doc = temp || await prisma.documento.findUnique({ where: { id: adjuntoId } });
    if (!doc) {
      return res.json({ resultado: 'Error', detalles: [`No se encontró el adjunto: ${adjuntoId}`] });
    }

    try {
      const resp = await ejecutarGuardado(INTEGRACION_RIXIE, {
        image: doc.contenidoBase64,
        mimetype: doc.mimeType,
        filename: doc.nombreArchivo,
      });
      // body ya viene transformado por el scriptRespuesta de la integración
      const body = typeof resp.body === 'object' && resp.body !== null && 'resultado' in resp.body
        ? resp.body
        : { resultado: 'Error', detalles: ['Respuesta inesperada del servicio'] };
      return res.json({ ...body, crudo: resp.body });
    } catch (err) {
      return res.json({ resultado: 'Error', detalles: [`Ocurrió un error al validar la imagen: ${err.message}`] });
    }
  } catch (err) {
    console.error('[Materiales] Error validando imagen:', err);
    res.status(500).json({ error: 'Error al validar imagen' });
  }
});

module.exports = router;
