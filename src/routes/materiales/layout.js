const { Router } = require('express');
const path = require('path');
const fs = require('fs');

const router = Router();

// Layout oficial de Alta: el archivo KEY real de ServiceNow
// (hoja "Info - Correcto" + catálogos de referencia), sin filas de ejemplo.
const LAYOUT_PATH = path.join(__dirname, 'data', 'Layout_Alta_KEY.xlsx');

// GET /api/materiales/layout — descarga el layout KEY de Alta
router.get('/layout', (req, res) => {
  if (!fs.existsSync(LAYOUT_PATH)) {
    return res.status(500).json({ error: 'Layout no disponible en el servidor' });
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Layout_MDM_Material_Alta_KEY.xlsx"');
  fs.createReadStream(LAYOUT_PATH).pipe(res);
});

module.exports = router;
