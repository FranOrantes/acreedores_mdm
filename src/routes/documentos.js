const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// Subir documento
router.post('/:solicitudId', upload.single('archivo'), async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { tipoDocumento } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No se envió archivo' });

    const doc = await prisma.documento.create({
      data: {
        solicitudId,
        tipoDocumento,
        nombreArchivo: file.originalname,
        rutaArchivo: `/uploads/${file.filename}`,
        tamanio: file.size,
        mimeType: file.mimetype,
      },
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Listar documentos de una solicitud
router.get('/:solicitudId', async (req, res) => {
  const docs = await prisma.documento.findMany({
    where: { solicitudId: req.params.solicitudId },
    orderBy: { creadoEn: 'asc' },
  });
  res.json(docs);
});

// Eliminar documento
router.delete('/archivo/:id', async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    const filePath = path.join(__dirname, '..', '..', doc.rutaArchivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.documento.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
