const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

function getUserFromToken(req) {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Campos del layout CSV para carga masiva de solicitudes tipo "alta"
const LAYOUT_COLUMNS = [
  'bpPartner',
  'rfc',
  'razonSocial',
  'nombreComercial',
  'tipoPersona',
  'clasificacionAcreedor',
  'nombrePila',
  'apellidoPaterno',
  'apellidoMaterno',
  'conceptoBusqueda',
  'bienServicio',
  'empresaReconocida',
  'localizacion',
  'monedaPago',
  'viaPago',
  'monedaPedido',
  'cuentaClabe',
  'nombreBanco',
  'calle',
  'numeroExterior',
  'numeroInterior',
  'codigoPostal',
  'colonia',
  'estado_dir',
  'municipio',
  'regionExt',
  'paisExt',
];

// Descargar layout CSV
router.get('/layout', (req, res) => {
  const user = getUserFromToken(req);
  if (!user || user.rolInterno !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden descargar el layout' });
  }

  const header = LAYOUT_COLUMNS.join(',');
  const exampleRow = [
    'BP-00001',
    'ABC123456XYZ',
    'EMPRESA DEMO SA DE CV',
    'EMPRESA DEMO',
    'moral',
    'persona_moral',
    '',
    '',
    '',
    'EMPDEMO',
    'Servicios de consultoría',
    'si',
    'nacional',
    'MXN',
    'transferencia',
    'MXN',
    '012345678901234567',
    'BBVA BANCOMER',
    'AV. REFORMA',
    '100',
    'PISO 3',
    '06600',
    'JUÁREZ',
    'Ciudad de México',
    'Cuauhtémoc',
    '',
    '',
  ].join(',');

  const csv = `${header}\n${exampleRow}`;

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="layout_acreedores.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8
});

// Carga masiva (CSV como texto en body)
router.post('/upload', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user || user.rolInterno !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden realizar carga masiva' });
  }

  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent es requerido' });
    }

    // Parse CSV
    const lines = csvContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => l.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'El archivo debe tener al menos una fila de encabezado y una de datos' });
    }

    const headers = lines[0].split(',').map((h) => h.trim());

    // Validate headers
    const missing = LAYOUT_COLUMNS.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Columnas faltantes: ${missing.join(', ')}` });
    }

    const results = { created: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) {
        results.errors.push({ row: i + 1, error: 'Número insuficiente de columnas' });
        continue;
      }

      const rowData = {};
      headers.forEach((h, idx) => {
        const val = values[idx]?.trim();
        if (val && LAYOUT_COLUMNS.includes(h)) {
          rowData[h] = val;
        }
      });

      if (!rowData.rfc && !rowData.razonSocial) {
        results.errors.push({ row: i + 1, error: 'RFC o Razón Social son requeridos' });
        continue;
      }

      try {
        const count = await prisma.solicitud.count();
        const folio = `SOL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        await prisma.solicitud.create({
          data: {
            folio,
            tipo: 'alta',
            estado: 'registrado',
            pasoActual: 4,
            solicitanteNombre: user.nombre || 'Carga Masiva',
            ...rowData,
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push({ row: i + 1, error: err.message.substring(0, 120) });
      }
    }

    res.json(results);
  } catch (e) {
    console.error('[CargaMasiva] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

module.exports = router;
