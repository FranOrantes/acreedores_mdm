const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar ubicaciones
router.get('/', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        branchOfficeManager: { select: { id: true, nombre: true, email: true } },
        _count: { select: { usuarios: true } },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Ubicaciones] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// Buscar ubicaciones por código postal (reemplazo de SEPOMEX)
router.get('/buscar-cp/:cp', async (req, res) => {
  try {
    const { cp } = req.params;
    if (!cp || !/^\d{4,5}$/.test(cp)) {
      return res.status(400).json({ error: 'Código postal inválido' });
    }

    const ubicaciones = await prisma.ubicacion.findMany({
      where: { codigoPostal: cp, activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, ciudad: true, estadoProvincia: true, codigoPostal: true },
    });

    if (ubicaciones.length === 0) {
      return res.status(404).json({ error: 'No se encontraron ubicaciones con ese código postal' });
    }

    // Return a format compatible with the frontend CP lookup
    const first = ubicaciones[0];
    res.json({
      cp,
      estado: first.estadoProvincia || '',
      municipio: first.ciudad || '',
      colonias: ubicaciones.map((u) => u.nombre),
    });
  } catch (e) {
    console.error('[Ubicaciones] Error en buscar-cp:', e);
    res.status(500).json({ error: e.message });
  }
});

// Listar solo ubicaciones que son sucursales (para cobertura)
router.get('/sucursales', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findMany({
      where: { activo: true, esSucursal: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CARGA MASIVA DE UBICACIONES (debe ir ANTES de /:id)
// ═══════════════════════════════════════════════════════════════

const UBICACION_LAYOUT_COLUMNS = [
  'nombre',
  'calle',
  'ciudad',
  'estadoProvincia',
  'codigoPostal',
  'pais',
  'esSucursal',
  'telefono',
  'branchOffice',
  'branchOfficeManagerEmail',
  'supplyCenter',
];

// Descargar layout CSV para carga masiva de ubicaciones
router.get('/carga-masiva/layout', (req, res) => {
  const header = UBICACION_LAYOUT_COLUMNS.join(',');
  const exampleRow = [
    'Oficina CDMX Centro',
    'Av. Reforma 100',
    'Ciudad de México',
    'CDMX',
    '06600',
    'MX',
    'true',
    '5512345678',
    'Sucursal Centro',
    'gerente@empresa.com',
    'SC-001',
  ].join(',');

  const csv = `${header}\n${exampleRow}`;

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="layout_ubicaciones.csv"');
  res.send('\uFEFF' + csv);
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

// Carga masiva de ubicaciones (CSV como texto en body)
router.post('/carga-masiva/upload', async (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent es requerido' });
    }

    const lines = csvContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => l.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'El archivo debe tener al menos una fila de encabezado y una de datos' });
    }

    const headers = lines[0].split(',').map((h) => h.trim());

    const required = ['nombre'];
    const missing = required.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Columnas faltantes: ${missing.join(', ')}` });
    }

    // Pre-fetch managers for resolution
    const allManagers = await prisma.usuario.findMany({ select: { id: true, email: true } });
    const managerMap = Object.fromEntries(allManagers.map((m) => [m.email.toLowerCase(), m.id]));

    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData = {};
      headers.forEach((h, idx) => {
        const val = values[idx]?.trim();
        if (val) rowData[h] = val;
      });

      if (!rowData.nombre) {
        results.errors.push({ row: i + 1, error: 'nombre es requerido' });
        continue;
      }

      // Resolve branchOfficeManagerEmail
      let branchOfficeManagerId = null;
      if (rowData.branchOfficeManagerEmail) {
        branchOfficeManagerId = managerMap[rowData.branchOfficeManagerEmail.toLowerCase()] || null;
      }

      const esSucursal = ['true', '1', 'si', 'sí', 'yes'].includes((rowData.esSucursal || '').toLowerCase());

      try {
        const existing = await prisma.ubicacion.findUnique({ where: { nombre: rowData.nombre } });

        if (existing) {
          await prisma.ubicacion.update({
            where: { id: existing.id },
            data: {
              calle: rowData.calle || existing.calle,
              ciudad: rowData.ciudad || existing.ciudad,
              estadoProvincia: rowData.estadoProvincia || existing.estadoProvincia,
              codigoPostal: rowData.codigoPostal || existing.codigoPostal,
              pais: rowData.pais || existing.pais,
              esSucursal: rowData.esSucursal ? esSucursal : existing.esSucursal,
              telefono: rowData.telefono || existing.telefono,
              branchOffice: rowData.branchOffice || existing.branchOffice,
              branchOfficeManagerId: branchOfficeManagerId || existing.branchOfficeManagerId,
              supplyCenter: rowData.supplyCenter || existing.supplyCenter,
            },
          });
          results.updated++;
        } else {
          await prisma.ubicacion.create({
            data: {
              nombre: rowData.nombre,
              calle: rowData.calle || null,
              ciudad: rowData.ciudad || null,
              estadoProvincia: rowData.estadoProvincia || null,
              codigoPostal: rowData.codigoPostal || null,
              pais: rowData.pais || 'MX',
              esSucursal,
              telefono: rowData.telefono || null,
              branchOffice: rowData.branchOffice || null,
              branchOfficeManagerId,
              supplyCenter: rowData.supplyCenter || null,
            },
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({ row: i + 1, error: err.message.substring(0, 120) });
      }
    }

    res.json(results);
  } catch (e) {
    console.error('[Ubicaciones] Error en carga masiva:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener ubicación por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.ubicacion.findUnique({
      where: { id: req.params.id },
      include: {
        branchOfficeManager: { select: { id: true, nombre: true, email: true } },
        usuarios: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Ubicación no encontrada' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear ubicación
router.post('/', async (req, res) => {
  try {
    const { nombre, calle, ciudad, estadoProvincia, codigoPostal, pais, esSucursal, telefono, latitud, longitud, branchOffice, branchOfficeManagerId, supplyCenter } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'nombre es requerido' });
    }
    const data = await prisma.ubicacion.create({
      data: {
        nombre,
        calle: calle || null,
        ciudad: ciudad || null,
        estadoProvincia: estadoProvincia || null,
        codigoPostal: codigoPostal || null,
        pais: pais || 'MX',
        esSucursal: esSucursal || false,
        telefono: telefono || null,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        branchOffice: branchOffice || null,
        branchOfficeManagerId: branchOfficeManagerId || null,
        supplyCenter: supplyCenter || null,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Ubicaciones] Error al crear:', e);
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Actualizar ubicación
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, calle, ciudad, estadoProvincia, codigoPostal, pais, esSucursal, telefono, latitud, longitud, branchOffice, branchOfficeManagerId, supplyCenter, activo } = req.body;
    const data = await prisma.ubicacion.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(calle !== undefined && { calle: calle || null }),
        ...(ciudad !== undefined && { ciudad: ciudad || null }),
        ...(estadoProvincia !== undefined && { estadoProvincia: estadoProvincia || null }),
        ...(codigoPostal !== undefined && { codigoPostal: codigoPostal || null }),
        ...(pais !== undefined && { pais: pais || null }),
        ...(esSucursal !== undefined && { esSucursal }),
        ...(telefono !== undefined && { telefono: telefono || null }),
        ...(latitud !== undefined && { latitud: latitud ? parseFloat(latitud) : null }),
        ...(longitud !== undefined && { longitud: longitud ? parseFloat(longitud) : null }),
        ...(branchOffice !== undefined && { branchOffice: branchOffice || null }),
        ...(branchOfficeManagerId !== undefined && { branchOfficeManagerId: branchOfficeManagerId || null }),
        ...(supplyCenter !== undefined && { supplyCenter: supplyCenter || null }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Eliminar ubicación
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ubicacion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
