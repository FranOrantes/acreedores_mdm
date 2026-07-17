const express = require('express');
const prisma = require('../lib/prisma');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ══════════════════════════════════════════════════
// GET /api/datalake/acreedores
// Lista todos los RFC únicos (acreedores/proveedores) que tienen documentos
// ══════════════════════════════════════════════════
router.get('/acreedores', async (req, res) => {
  try {
    const modulo = req.query.modulo || 'acreedores';

    // Obtener solicitudes con documentos para este módulo
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        modulo,
        documentos: { some: {} },
        rfc: { not: null },
      },
      select: {
        rfc: true,
        razonSocial: true,
        nombrePila: true,
        apellidoPaterno: true,
        tipoPersona: true,
        bpPartner: true,
        _count: { select: { documentos: true } },
      },
      distinct: ['rfc'],
      orderBy: { razonSocial: 'asc' },
    });

    // Agrupar por RFC y sumar docs
    const rfcMap = {};
    for (const sol of solicitudes) {
      if (!sol.rfc) continue;
      if (!rfcMap[sol.rfc]) {
        const nombre = sol.tipoPersona === 'fisica'
          ? [sol.nombrePila, sol.apellidoPaterno].filter(Boolean).join(' ')
          : sol.razonSocial;
        rfcMap[sol.rfc] = {
          rfc: sol.rfc,
          nombre: nombre || sol.rfc,
          bpPartner: sol.bpPartner,
          totalDocumentos: 0,
        };
      }
      rfcMap[sol.rfc].totalDocumentos += sol._count.documentos;
    }

    res.json(Object.values(rfcMap));
  } catch (e) {
    console.error('[DataLake] Error listando acreedores:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// GET /api/datalake/:rfc/documentos
// Lista documentos y carpetas de un acreedor por RFC
// Query: ?modulo=acreedores&carpetaId=null (root) o ?carpetaId=xxx
// ══════════════════════════════════════════════════
router.get('/:rfc/documentos', async (req, res) => {
  try {
    const { rfc } = req.params;
    const modulo = req.query.modulo || 'acreedores';
    const carpetaId = req.query.carpetaId || null; // null = root

    // Obtener carpetas en este nivel
    const carpetas = await prisma.carpetaDataLake.findMany({
      where: { rfc, modulo, parentId: carpetaId },
      include: {
        _count: { select: { documentos: true, hijos: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    // Obtener documentos en este nivel (carpeta actual)
    // Si carpetaId es null, traer docs sin carpeta asignada
    const solicitudes = await prisma.solicitud.findMany({
      where: { rfc, modulo },
      select: { id: true },
    });
    const solicitudIds = solicitudes.map((s) => s.id);

    const whereDoc = {
      solicitudId: { in: solicitudIds },
      carpetaId: carpetaId, // null para docs en raíz, o el id de la carpeta
    };

    const documentos = await prisma.documento.findMany({
      where: whereDoc,
      select: {
        id: true,
        tipoDocumento: true,
        nombreArchivo: true,
        tamanio: true,
        mimeType: true,
        carpetaId: true,
        creadoEn: true,
        solicitud: { select: { folio: true, id: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    // Info del acreedor
    const acreedor = await prisma.solicitud.findFirst({
      where: { rfc, modulo },
      select: { rfc: true, razonSocial: true, nombrePila: true, apellidoPaterno: true, tipoPersona: true, bpPartner: true },
      orderBy: { creadoEn: 'desc' },
    });

    res.json({
      rfc,
      modulo,
      carpetaActual: carpetaId,
      acreedor: acreedor ? {
        nombre: acreedor.tipoPersona === 'fisica'
          ? [acreedor.nombrePila, acreedor.apellidoPaterno].filter(Boolean).join(' ')
          : acreedor.razonSocial,
        bpPartner: acreedor.bpPartner,
      } : null,
      carpetas: carpetas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        parentId: c.parentId,
        totalDocumentos: c._count.documentos,
        totalSubcarpetas: c._count.hijos,
        creadoEn: c.creadoEn,
      })),
      documentos,
    });
  } catch (e) {
    console.error('[DataLake] Error listando documentos:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// GET /api/datalake/:rfc/todos
// Lista TODOS los documentos de un acreedor (flat, sin importar carpeta)
// ══════════════════════════════════════════════════
router.get('/:rfc/todos', async (req, res) => {
  try {
    const { rfc } = req.params;
    const modulo = req.query.modulo || 'acreedores';

    const solicitudes = await prisma.solicitud.findMany({
      where: { rfc, modulo },
      select: { id: true },
    });

    const documentos = await prisma.documento.findMany({
      where: { solicitudId: { in: solicitudes.map((s) => s.id) } },
      select: {
        id: true,
        tipoDocumento: true,
        nombreArchivo: true,
        tamanio: true,
        mimeType: true,
        carpetaId: true,
        creadoEn: true,
        solicitud: { select: { folio: true, id: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.json({ rfc, modulo, total: documentos.length, documentos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// POST /api/datalake/:rfc/carpetas
// Crear una carpeta para un acreedor
// ══════════════════════════════════════════════════
router.post('/:rfc/carpetas', async (req, res) => {
  try {
    const { rfc } = req.params;
    const { nombre, modulo = 'acreedores', parentId = null } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la carpeta es requerido' });
    }

    const carpeta = await prisma.carpetaDataLake.create({
      data: { rfc, modulo, nombre: nombre.trim(), parentId },
    });

    res.status(201).json(carpeta);
  } catch (e) {
    console.error('[DataLake] Error creando carpeta:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// PUT /api/datalake/carpetas/:id
// Renombrar carpeta
// ══════════════════════════════════════════════════
router.put('/carpetas/:id', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const carpeta = await prisma.carpetaDataLake.update({
      where: { id: req.params.id },
      data: { nombre: nombre.trim() },
    });
    res.json(carpeta);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// DELETE /api/datalake/carpetas/:id
// Eliminar carpeta (mueve docs a raíz)
// ══════════════════════════════════════════════════
router.delete('/carpetas/:id', async (req, res) => {
  try {
    // Mover documentos de esta carpeta a raíz
    await prisma.documento.updateMany({
      where: { carpetaId: req.params.id },
      data: { carpetaId: null },
    });
    // Mover subcarpetas a raíz (huérfanas → parentId null)
    await prisma.carpetaDataLake.updateMany({
      where: { parentId: req.params.id },
      data: { parentId: null },
    });
    await prisma.carpetaDataLake.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// PUT /api/datalake/documentos/:id/mover
// Mover un documento a una carpeta (o a raíz con carpetaId: null)
// ══════════════════════════════════════════════════
router.put('/documentos/:id/mover', async (req, res) => {
  try {
    const { carpetaId } = req.body; // null para mover a raíz
    const doc = await prisma.documento.update({
      where: { id: req.params.id },
      data: { carpetaId: carpetaId || null },
    });
    res.json({ ok: true, carpetaId: doc.carpetaId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// GET /api/datalake/documentos/:id/preview
// Descargar/preview un documento (inline o attachment)
// ══════════════════════════════════════════════════
router.get('/documentos/:id/preview', async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    if (doc.contenidoBase64) {
      const buffer = Buffer.from(doc.contenidoBase64, 'base64');
      res.set('Content-Type', doc.mimeType);
      res.set('Content-Disposition', `inline; filename="${doc.nombreArchivo}"`);
      return res.send(buffer);
    }

    if (doc.rutaArchivo) {
      const path = require('path');
      const filePath = path.join(__dirname, '..', '..', doc.rutaArchivo);
      return res.sendFile(filePath);
    }

    res.status(404).json({ error: 'No hay contenido disponible' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// GET /api/datalake/documentos/:id/descargar
// Forzar descarga de un documento
// ══════════════════════════════════════════════════
router.get('/documentos/:id/descargar', async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    if (doc.contenidoBase64) {
      const buffer = Buffer.from(doc.contenidoBase64, 'base64');
      res.set('Content-Type', doc.mimeType);
      res.set('Content-Disposition', `attachment; filename="${doc.nombreArchivo}"`);
      return res.send(buffer);
    }

    if (doc.rutaArchivo) {
      const path = require('path');
      const filePath = path.join(__dirname, '..', '..', doc.rutaArchivo);
      return res.download(filePath, doc.nombreArchivo);
    }

    res.status(404).json({ error: 'No hay contenido disponible' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// POST /api/datalake/:rfc/upload
// Subir un documento directamente al DataLake (se crea una solicitud-placeholder si no existe)
// ══════════════════════════════════════════════════
router.post('/:rfc/upload', upload.single('archivo'), async (req, res) => {
  try {
    const { rfc } = req.params;
    const { modulo = 'acreedores', carpetaId = null, tipoDocumento = 'otro' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    // Buscar la solicitud más reciente de este acreedor para vincular el doc
    let solicitud = await prisma.solicitud.findFirst({
      where: { rfc, modulo },
      orderBy: { creadoEn: 'desc' },
      select: { id: true },
    });

    if (!solicitud) {
      return res.status(400).json({ error: 'No existe ninguna solicitud para este RFC. Primero debe existir al menos una solicitud.' });
    }

    const base64 = req.file.buffer.toString('base64');
    const doc = await prisma.documento.create({
      data: {
        solicitudId: solicitud.id,
        tipoDocumento,
        nombreArchivo: req.file.originalname,
        contenidoBase64: base64,
        tamanio: req.file.size,
        mimeType: req.file.mimetype,
        carpetaId: carpetaId || null,
      },
    });

    res.status(201).json({
      id: doc.id,
      nombreArchivo: doc.nombreArchivo,
      tamanio: doc.tamanio,
      mimeType: doc.mimeType,
      carpetaId: doc.carpetaId,
    });
  } catch (e) {
    console.error('[DataLake] Error en upload:', e.message);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
