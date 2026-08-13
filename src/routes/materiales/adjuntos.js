const { Router } = require('express');
const multer = require('multer');
const prisma = require('../../lib/prisma');
const config = require('./configService');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // tope duro; el límite real se valida contra Configuración
});

// Réplica de validarExtencionIMG / validarExtencionPDF / validarExtencionSize (parametrizable)
async function validarAdjunto(file, esImagen) {
  const [extImg, extDoc, maxMb] = await Promise.all([
    config.get('validacion.adjuntos.ext_imagenes'),
    config.get('validacion.adjuntos.ext_documentos'),
    config.get('validacion.adjuntos.max_mb'),
  ]);
  const ext = (file.originalname.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  const permitidas = esImagen ? extImg : extDoc;
  if (!permitidas.includes(ext)) {
    return `Extension no permitida para ${esImagen ? 'imagen' : 'documento'} (${permitidas.join(' ')})`;
  }
  if (file.size > (Number(maxMb) || 25) * 1024 * 1024) {
    return `El archivo excede el tamaño máximo de ${maxMb} MB`;
  }
  return null;
}

// POST /api/materiales/adjuntos?tipo=<clave>&session=<sessionKey>&imagen=1
// Guarda en DocumentoTemporal (equivalente al attachment temporal + random de ServiceNow)
router.post('/adjuntos', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio archivo' });
    const { tipo = 'generico', session, imagen } = req.body;
    if (!session) return res.status(400).json({ error: 'session requerida' });
    const errorValidacion = await validarAdjunto(req.file, imagen === '1');
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });

    const doc = await prisma.documentoTemporal.create({
      data: {
        sessionKey: session,
        tipoDocumento: tipo,
        nombreArchivo: req.file.originalname,
        contenidoBase64: req.file.buffer.toString('base64'),
        tamanio: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
    res.json({ id: doc.id, nombreArchivo: doc.nombreArchivo, tamanio: doc.tamanio, mimeType: doc.mimeType });
  } catch (err) {
    console.error('[Materiales] Error subiendo adjunto:', err);
    res.status(500).json({ error: 'Error al subir adjunto' });
  }
});

// GET /api/materiales/adjuntos/:id — sirve el binario (temporal o definitivo)
router.get('/adjuntos/:id', async (req, res) => {
  try {
    const temp = await prisma.documentoTemporal.findUnique({ where: { id: req.params.id } });
    const doc = temp || await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc || !doc.contenidoBase64) return res.status(404).json({ error: 'No encontrado' });
    const buffer = Buffer.from(doc.contenidoBase64, 'base64');
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.nombreArchivo)}"`);
    res.send(buffer);
  } catch (err) {
    console.error('[Materiales] Error sirviendo adjunto:', err);
    res.status(500).json({ error: 'Error al obtener adjunto' });
  }
});

// DELETE /api/materiales/adjuntos/:id — quita un adjunto temporal
router.delete('/adjuntos/:id', async (req, res) => {
  try {
    await prisma.documentoTemporal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: 'No encontrado' });
  }
});

module.exports = router;
