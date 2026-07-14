const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Subir documento temporal (base64)
router.post('/temp', async (req, res) => {
  try {
    const { sessionKey, tipoDocumento, nombreArchivo, contenidoBase64, tamanio, mimeType } = req.body;
    if (!sessionKey || !tipoDocumento || !contenidoBase64) {
      return res.status(400).json({ error: 'sessionKey, tipoDocumento y contenidoBase64 son requeridos' });
    }
    const doc = await prisma.documentoTemporal.create({
      data: {
        sessionKey,
        tipoDocumento,
        nombreArchivo: nombreArchivo || 'archivo',
        contenidoBase64,
        tamanio: tamanio || 0,
        mimeType: mimeType || 'application/octet-stream',
      },
    });
    // Return without base64 content for lighter response
    res.status(201).json({ id: doc.id, tipoDocumento: doc.tipoDocumento, nombreArchivo: doc.nombreArchivo, tamanio: doc.tamanio, mimeType: doc.mimeType });
  } catch (e) {
    console.error('[DocsBase64] Error al subir temp:', e);
    res.status(400).json({ error: e.message });
  }
});

// Listar documentos temporales por sessionKey
router.get('/temp/:sessionKey', async (req, res) => {
  try {
    const docs = await prisma.documentoTemporal.findMany({
      where: { sessionKey: req.params.sessionKey },
      select: { id: true, tipoDocumento: true, nombreArchivo: true, tamanio: true, mimeType: true, creadoEn: true },
      orderBy: { creadoEn: 'asc' },
    });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar documento temporal
router.delete('/temp/:id', async (req, res) => {
  try {
    await prisma.documentoTemporal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Confirmar documentos: mover de temp a permanente (llamado al enviar solicitud)
router.post('/confirmar', async (req, res) => {
  try {
    const { sessionKey, solicitudId } = req.body;
    if (!sessionKey || !solicitudId) {
      return res.status(400).json({ error: 'sessionKey y solicitudId son requeridos' });
    }
    const temps = await prisma.documentoTemporal.findMany({ where: { sessionKey } });
    if (temps.length === 0) return res.json({ ok: true, count: 0 });

    // Create permanent documents
    const created = await Promise.all(
      temps.map((t) =>
        prisma.documento.create({
          data: {
            solicitudId,
            tipoDocumento: t.tipoDocumento,
            nombreArchivo: t.nombreArchivo,
            contenidoBase64: t.contenidoBase64,
            tamanio: t.tamanio,
            mimeType: t.mimeType,
          },
        })
      )
    );

    // Delete temp docs
    await prisma.documentoTemporal.deleteMany({ where: { sessionKey } });

    res.json({ ok: true, count: created.length });
  } catch (e) {
    console.error('[DocsBase64] Error al confirmar:', e);
    res.status(400).json({ error: e.message });
  }
});

// Descargar documento permanente (base64 → binary)
router.get('/descargar/:id', async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    if (doc.contenidoBase64) {
      const buffer = Buffer.from(doc.contenidoBase64, 'base64');
      res.set('Content-Type', doc.mimeType);
      const disposition = req.query.preview === '1' ? 'inline' : 'attachment';
      res.set('Content-Disposition', `${disposition}; filename="${doc.nombreArchivo}"`);
      return res.send(buffer);
    }

    // Fallback: legacy file path
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
// ENDPOINTS PARA n8n (protegidos por webhook secret, no requieren JWT)
// ══════════════════════════════════════════════════

const N8N_DOCS_SECRET = process.env.N8N_DOCS_SECRET || process.env.LOGS_WEBHOOK_SECRET || '';

function validarN8NSecret(req, res, next) {
  if (!N8N_DOCS_SECRET) {
    return res.status(500).json({ error: 'N8N_DOCS_SECRET no configurado en el servidor' });
  }
  const secret = req.headers['x-webhook-secret'];
  if (secret !== N8N_DOCS_SECRET) {
    return res.status(401).json({ error: 'Webhook secret inválido' });
  }
  next();
}

// GET /api/docs/n8n/solicitud/:solicitudId — Listar docs de una solicitud (metadata sin base64)
router.get('/n8n/solicitud/:solicitudId', validarN8NSecret, async (req, res) => {
  try {
    const docs = await prisma.documento.findMany({
      where: { solicitudId: req.params.solicitudId },
      select: {
        id: true,
        tipoDocumento: true,
        nombreArchivo: true,
        tamanio: true,
        mimeType: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'asc' },
    });
    res.json({ solicitudId: req.params.solicitudId, total: docs.length, documentos: docs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/docs/n8n/archivo/:id — Obtener un documento con su base64 (para n8n)
router.get('/n8n/archivo/:id', validarN8NSecret, async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    res.json({
      id: doc.id,
      solicitudId: doc.solicitudId,
      tipoDocumento: doc.tipoDocumento,
      nombreArchivo: doc.nombreArchivo,
      mimeType: doc.mimeType,
      tamanio: doc.tamanio,
      contenidoBase64: doc.contenidoBase64 || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/docs/n8n/solicitud/:solicitudId/todos — Todos los docs con base64 (pesado, usar con cuidado)
router.get('/n8n/solicitud/:solicitudId/todos', validarN8NSecret, async (req, res) => {
  try {
    const docs = await prisma.documento.findMany({
      where: { solicitudId: req.params.solicitudId },
      orderBy: { creadoEn: 'asc' },
    });
    res.json({
      solicitudId: req.params.solicitudId,
      total: docs.length,
      documentos: docs.map((d) => ({
        id: d.id,
        tipoDocumento: d.tipoDocumento,
        nombreArchivo: d.nombreArchivo,
        mimeType: d.mimeType,
        tamanio: d.tamanio,
        contenidoBase64: d.contenidoBase64 || null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
