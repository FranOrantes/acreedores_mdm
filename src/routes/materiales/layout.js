const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('./configService');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Layout del Alta: por defecto el oficial PROD V20 empaquetado; reemplazable en caliente
// desde el builder (se guarda en ConfiguracionModulo clave layout.archivo).
const LAYOUT_PATH = path.join(__dirname, 'data', 'Layout_Alta_KEY.xlsx');
const CLAVE_LAYOUT = 'layout.archivo';

// GET /api/materiales/layout — descarga el layout vigente (subido o empaquetado)
router.get('/layout', async (req, res) => {
  try {
    const guardado = await config.get(CLAVE_LAYOUT);
    if (guardado?.contenidoBase64) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${guardado.nombreArchivo || 'Layout_MDM_Material_Alta.xlsx'}"`);
      return res.send(Buffer.from(guardado.contenidoBase64, 'base64'));
    }
  } catch { /* cae al empaquetado */ }
  if (!fs.existsSync(LAYOUT_PATH)) {
    return res.status(500).json({ error: 'Layout no disponible en el servidor' });
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Layout_MDM_Material_Alta_V20.xlsx"');
  fs.createReadStream(LAYOUT_PATH).pipe(res);
});

// POST /api/materiales/layout — subir/reemplazar el layout vigente (admin, desde el builder)
router.post('/layout', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'archivo requerido' });
    if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Solo .xlsx' });
    }
    await config.set(CLAVE_LAYOUT, {
      nombreArchivo: req.file.originalname,
      contenidoBase64: req.file.buffer.toString('base64'),
      tamanio: req.file.size,
      actualizadoEn: new Date().toISOString(),
    }, req.body.usuario || 'builder');
    res.json({ ok: true, nombreArchivo: req.file.originalname, tamanio: req.file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/materiales/layout/info — qué layout está vigente
router.get('/layout/info', async (req, res) => {
  const guardado = await config.get(CLAVE_LAYOUT);
  res.json(guardado?.contenidoBase64
    ? { origen: 'subido', nombreArchivo: guardado.nombreArchivo, actualizadoEn: guardado.actualizadoEn }
    : { origen: 'empaquetado', nombreArchivo: 'Layout Alta - 2026-07-23 V20 .xlsx' });
});

module.exports = router;
