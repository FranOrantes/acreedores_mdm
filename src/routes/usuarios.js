const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar usuarios
router.get('/', async (req, res) => {
  try {
    const data = await prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { aprobaciones: true, membresiaGrupos: true } },
        manager: { select: { id: true, nombre: true, email: true } },
        ubicacion: { select: { id: true, nombre: true } },
        membresiaGrupos: {
          include: { grupo: { select: { id: true, nombre: true, roles: true, activo: true } } },
        },
      },
    });
    res.json(data);
  } catch (e) {
    console.error('[Usuarios] Error al listar:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CARGA MASIVA DE USUARIOS (debe ir ANTES de /:id)
// ═══════════════════════════════════════════════════════════════

const USUARIO_LAYOUT_COLUMNS = [
  'email',
  'nombre',
  'username',
  'rolInterno',
  'areaHumana',
  'linea',
  'employeeNumber',
  'contrasena',
  'managerEmail',
  'ubicacionNombre',
];

// Descargar layout CSV para carga masiva de usuarios
router.get('/carga-masiva/layout', (req, res) => {
  const header = USUARIO_LAYOUT_COLUMNS.join(',');
  const exampleRow = [
    'juan.perez@empresa.com',
    'Juan Pérez López',
    'juan.perez',
    'usuario',
    'Contabilidad',
    'Línea Norte',
    'EMP-001',
    'password123',
    'gerente@empresa.com',
    'Oficina CDMX',
  ].join(',');

  const csv = `${header}\n${exampleRow}`;

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="layout_usuarios.csv"');
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

// Carga masiva de usuarios (CSV como texto en body)
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

    // Validate required columns
    const required = ['email', 'nombre'];
    const missing = required.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Columnas faltantes: ${missing.join(', ')}` });
    }

    // Pre-fetch managers and ubicaciones for resolution
    const allManagers = await prisma.usuario.findMany({ select: { id: true, email: true } });
    const managerMap = Object.fromEntries(allManagers.map((m) => [m.email.toLowerCase(), m.id]));

    const allUbicaciones = await prisma.ubicacion.findMany({ select: { id: true, nombre: true } });
    const ubicacionMap = Object.fromEntries(allUbicaciones.map((u) => [u.nombre.toLowerCase(), u.id]));

    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData = {};
      headers.forEach((h, idx) => {
        const val = values[idx]?.trim();
        if (val) rowData[h] = val;
      });

      if (!rowData.email || !rowData.nombre) {
        results.errors.push({ row: i + 1, error: 'email y nombre son requeridos' });
        continue;
      }

      // Resolve managerEmail to managerId
      let managerId = null;
      if (rowData.managerEmail) {
        managerId = managerMap[rowData.managerEmail.toLowerCase()] || null;
      }

      // Resolve ubicacionNombre to ubicacionId
      let ubicacionId = null;
      if (rowData.ubicacionNombre) {
        ubicacionId = ubicacionMap[rowData.ubicacionNombre.toLowerCase()] || null;
      }

      try {
        // Upsert: if email exists, update; otherwise create
        const existing = await prisma.usuario.findUnique({ where: { email: rowData.email } });

        if (existing) {
          await prisma.usuario.update({
            where: { id: existing.id },
            data: {
              nombre: rowData.nombre,
              username: rowData.username || existing.username,
              rolInterno: rowData.rolInterno || existing.rolInterno,
              areaHumana: rowData.areaHumana || existing.areaHumana,
              linea: rowData.linea || existing.linea,
              employeeNumber: rowData.employeeNumber || existing.employeeNumber,
              contrasena: rowData.contrasena || existing.contrasena,
              managerId: managerId || existing.managerId,
              ubicacionId: ubicacionId || existing.ubicacionId,
            },
          });
          results.updated++;
        } else {
          const ssoId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await prisma.usuario.create({
            data: {
              ssoId,
              email: rowData.email,
              nombre: rowData.nombre,
              username: rowData.username || rowData.email.split('@')[0],
              rolInterno: rowData.rolInterno || 'usuario',
              areaHumana: rowData.areaHumana || null,
              linea: rowData.linea || null,
              employeeNumber: rowData.employeeNumber || null,
              contrasena: rowData.contrasena || null,
              managerId,
              ubicacionId,
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
    console.error('[Usuarios] Error en carga masiva:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      include: {
        membresiaGrupos: {
          include: { grupo: { select: { id: true, nombre: true } } },
        },
        manager: { select: { id: true, nombre: true, email: true } },
        ubicacion: { select: { id: true, nombre: true } },
        _count: { select: { aprobaciones: true } },
      },
    });
    if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  try {
    const { email, nombre, username, rolInterno, areaHumana, linea, managerId, employeeNumber, contrasena, ubicacionId } = req.body;
    if (!email || !nombre) {
      return res.status(400).json({ error: 'email y nombre son requeridos' });
    }

    const ssoId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const data = await prisma.usuario.create({
      data: {
        ssoId,
        email,
        nombre,
        username: username || email.split('@')[0],
        rolInterno: rolInterno || 'usuario',
        areaHumana: areaHumana || null,
        linea: linea || null,
        managerId: managerId || null,
        employeeNumber: employeeNumber || null,
        contrasena: contrasena || null,
        ubicacionId: ubicacionId || null,
      },
    });
    res.status(201).json(data);
  } catch (e) {
    console.error('[Usuarios] Error al crear:', e);
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Actualizar usuario
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, email, username, rolInterno, activo, areaHumana, linea, managerId, employeeNumber, contrasena, ubicacionId } = req.body;
    const data = await prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(email !== undefined && { email }),
        ...(username !== undefined && { username }),
        ...(rolInterno !== undefined && { rolInterno }),
        ...(activo !== undefined && { activo }),
        ...(areaHumana !== undefined && { areaHumana: areaHumana || null }),
        ...(linea !== undefined && { linea: linea || null }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(employeeNumber !== undefined && { employeeNumber: employeeNumber || null }),
        ...(contrasena !== undefined && { contrasena: contrasena || null }),
        ...(ubicacionId !== undefined && { ubicacionId: ubicacionId || null }),
      },
    });
    res.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(400).json({ error: e.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
