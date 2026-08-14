const express = require('express');
const prisma = require('../lib/prisma');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const { logSistema, reqInfo } = require('../lib/logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Table Builder (réplica del de ServiceNow): tablas custom por módulo,
// dictionary entries (columnas), vista lista con filtros, preview de formulario.
// Storage "json" → custom_registros (JSONB). Storage físico → tabla sincronizada (ver FISICAS).
const FISICAS = {
  materiales_registros: { modelo: 'materialesRegistro', idCampo: 'sysId', ordenDefault: 'noMateria', camposModelo: ['noMateria', 'nombre', 'estatus', 'tipoSolicitud', 'eanPi', 'razonSocial', 'sysUpdatedOn'] },
  materiales_options: { modelo: 'materialesOption', idCampo: 'sysId', ordenDefault: 'clave', camposModelo: ['clave', 'valor', 'etiqueta', 'sysUpdatedOn'] },
  materiales_matriz_aprobadores: { modelo: 'materialesMatrizAprobador', idCampo: 'sysId', ordenDefault: 'comprador', camposModelo: ['comprador', 'negociador', 'dga', 'proyecto', 'sysUpdatedOn'] },
};
// ─────────────────────────────────────────────────────────────────────────────

const CLAVE_OK = /^[a-z][a-zA-Z0-9_]*$/; // snake_case o camelCase (mapeo de columnas físicas existentes)

const jwt = require('jsonwebtoken');
function usuarioSesion(req) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return null;
    const d = jwt.verify(token, process.env.JWT_SECRET);
    return { id: d.userId, email: d.email, nombre: d.nombre };
  } catch { return null; }
}

// ── Tablas ──

// GET /api/tablas?modulo=
router.get('/', async (req, res) => {
  try {
    const { modulo } = req.query;
    const where = {};
    if (modulo) where.modulo = { in: [modulo, 'todos'] };
    const data = await prisma.tablaCustom.findMany({
      where,
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
      orderBy: [{ modulo: 'asc' }, { orden: 'asc' }],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tablas/menu?modulo= — tablas con acceso en menú para el sidebar
router.get('/menu', async (req, res) => {
  try {
    const { modulo } = req.query;
    const data = await prisma.tablaCustom.findMany({
      where: { menuVisible: true, activa: true, ...(modulo ? { modulo: { in: [modulo, 'todos'] } } : {}) },
      select: { id: true, clave: true, label: true, modulo: true, menuLabel: true, menuIcono: true, menuPadre: true, icono: true },
      orderBy: { orden: 'asc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { orderBy: { orden: 'asc' } } },
    });
    if (!data) return res.status(404).json({ error: 'No encontrada' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { clave, label, modulo, icono, descripcion, autoNumber, permisos, storage, menuVisible, menuLabel, menuIcono, menuPadre } = req.body;
    if (!clave || !label) return res.status(400).json({ error: 'clave y label son requeridos' });
    if (!CLAVE_OK.test(clave)) return res.status(400).json({ error: 'clave debe ser snake_case (a-z, 0-9, _)' });
    // Auto-roles estilo SN: <clave_tecnica>.leer / .escribir / .eliminar (solo deletes lógicos)
    const rolesAuto = { leer: `${clave}.leer`, escribir: `${clave}.escribir`, eliminar: `${clave}.eliminar` };
    const permisosFinal = { ...(permisos || {}), rolesAuto };
    const data = await prisma.tablaCustom.create({
      data: { clave, label, modulo: modulo || 'todos', icono, descripcion, autoNumber, permisos: permisosFinal, storage, menuVisible, menuLabel, menuIcono, menuPadre },
      include: { columnas: true },
    });
    logSistema('tabla_dinamica', `Tabla creada: ${label} (${clave})`, { detalle: `Roles auto: ${rolesAuto.leer}, ${rolesAuto.escribir}, ${rolesAuto.eliminar}`, modulo: modulo || 'todos', ...reqInfo(req) });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const campos = ['clave', 'label', 'modulo', 'icono', 'descripcion', 'activa', 'autoNumber', 'permisos', 'orden', 'storage', 'menuVisible', 'menuLabel', 'menuIcono', 'menuPadre', 'configForm'];
    const data = {};
    campos.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const tabla = await prisma.tablaCustom.update({ where: { id: req.params.id }, data });
    res.json(tabla);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id } });
    if (tabla?.storage === 'json') {
      await prisma.customRegistro.deleteMany({ where: { tablaId: req.params.id } });
    }
    await prisma.tablaCustom.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// ── Columnas (dictionary entries) ──

router.post('/:id/columnas', async (req, res) => {
  try {
    const { clave, etiqueta, tipo, opciones, referencia, filtroReferencia, maxLength, defaultValue, display, requerido, orden } = req.body;
    if (!clave || !etiqueta) return res.status(400).json({ error: 'clave y etiqueta son requeridos' });
    if (!CLAVE_OK.test(clave)) return res.status(400).json({ error: 'clave debe ser snake_case' });
    const data = await prisma.columnaCustom.create({
      data: { tablaId: req.params.id, clave, etiqueta, tipo: tipo || 'string', opciones, referencia, filtroReferencia, maxLength, defaultValue, display: !!display, requerido: !!requerido, orden: orden ?? 0 },
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id/columnas/:colId', async (req, res) => {
  try {
    const campos = ['clave', 'etiqueta', 'tipo', 'opciones', 'referencia', 'filtroReferencia', 'maxLength', 'defaultValue', 'display', 'requerido', 'orden', 'activo'];
    const data = {};
    campos.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const col = await prisma.columnaCustom.update({ where: { id: req.params.colId }, data });
    res.json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id/columnas/:colId', async (req, res) => {
  try {
    await prisma.columnaCustom.delete({ where: { id: req.params.colId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Preview: genera una definición de formulario desde las columnas ──
// (compatible con el FormRenderer del form builder)
router.get('/:id/preview', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });

    const TIPO_A_CAMPO = {
      string: 'texto', text: 'textarea', integer: 'numerico', float: 'flotante',
      boolean: 'booleano', choice: 'choices', date: 'fecha', datetime: 'fecha',
      attachment: 'attachment', reference: 'reference',
    };
    const campos = {};
    const claves = [];
    for (const col of tabla.columnas) {
      campos[col.clave] = {
        clave: col.clave,
        etiqueta: col.etiqueta,
        tipo: TIPO_A_CAMPO[col.tipo] || 'texto',
        requerido: col.requerido,
        opciones: Array.isArray(col.opciones) ? col.opciones.join(',') : '',
        placeholder: col.defaultValue || '',
        columnaId: col.id, // para campos reference (dropdown con búsqueda)
      };
      claves.push(col.clave);
    }
    // Sys ID siempre presente (estilo SN) — read-only, al final
    campos.sys_id = { clave: 'sys_id', etiqueta: 'Sys ID', tipo: 'texto', readOnly: true, ayuda: 'Identificador interno de la plataforma (exports/imports/scripting)' };
    claves.push('sys_id');

    // Layout: filas de 2 columnas
    const layout = [];
    for (let i = 0; i < claves.length; i += 2) {
      layout.push({ columnas: 2, campos: claves.slice(i, i + 2) });
    }
    res.json({
      clave: `preview_${tabla.clave}`,
      tablaId: tabla.id,
      nombre: `Preview: ${tabla.label}`,
      tipo: 'simple',
      modulo: tabla.modulo,
      definicion: { pasos: [{ titulo: tabla.label, tipo: 'campos', layout }], campos, clientScripts: tabla.configForm?.clientScripts || [], uiActions: tabla.configForm?.uiActions || [] },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tablas/:id/referencias/:colId?buscar= — opciones para campos reference
router.get('/:id/referencias/:colId', async (req, res) => {
  try {
    const col = await prisma.columnaCustom.findUnique({ where: { id: req.params.colId } });
    if (!col || col.tablaId !== req.params.id) return res.status(404).json({ error: 'Columna no encontrada' });
    if (col.tipo !== 'reference' || !col.referencia) return res.status(400).json({ error: 'La columna no es reference' });

    const buscar = String(req.query.buscar || '');
    const filtro = col.filtroReferencia || null;
    const aplicaFiltro = (datos) => {
      if (!filtro) return datos;
      const lista = Array.isArray(filtro) ? filtro : [filtro];
      return datos.filter((row) => lista.every((f) => {
        const v = row[f.campo];
        switch (f.op) {
          case '!=': return v !== f.valor;
          case 'contiene': return String(v ?? '').toLowerCase().includes(String(f.valor).toLowerCase());
          case 'vacio': return v === null || v === undefined || v === '';
          case 'no_vacio': return v !== null && v !== undefined && v !== '';
          default: return v === f.valor;
        }
      }));
    };

    let opciones = [];
    // Tabla custom por clave
    const refCustom = await prisma.tablaCustom.findFirst({ where: { clave: col.referencia } });
    if (refCustom) {
      const refFisica = FISICAS[refCustom.storage];
      if (refFisica) {
        const rows = await prisma[refFisica.modelo].findMany({ take: 50 });
        opciones = rows.map((r) => {
          const vals = refFisica.camposModelo.filter((k) => r[k]).map((k) => r[k]);
          return { id: r[refFisica.idCampo], label: vals.slice(0, 2).join(' — ') || r[refFisica.idCampo] };
        });
      } else {
        const rows = await prisma.customRegistro.findMany({ where: { tablaId: refCustom.id, eliminado: false }, take: 500 });
        const labelCol = refCustom.columnas?.find?.(() => true); // n/a
        opciones = aplicaFiltro(rows.map((r) => ({ id: r.id, ...r.datos })))
          .filter((r) => !buscar || JSON.stringify(r.datos || r).toLowerCase().includes(buscar.toLowerCase()))
          .slice(0, 50)
          .map((r) => ({ id: r.id, label: r.nombre || r.label || r.id.slice(0, 8) }));
      }
    } else {
      // Legacy: modelo prisma por nombre técnico
      const LEGACY = { solicitud: 'solicitud', usuario: 'usuario', grupo_aprobacion: 'grupoAprobacion', ubicacion: 'ubicacion', dominio: 'dominio' };
      const modelo = LEGACY[col.referencia];
      // Referencias a tablas de ServiceNow u otras no resolubles localmente: lista vacía sin error
      if (!modelo || !prisma[modelo]) return res.json([]);
      const rows = await prisma[modelo].findMany({ take: 50 });
      opciones = aplicaFiltro(rows).map((r) => ({ id: r.id, label: r.nombre || r.folio || r.label || r.email || r.id.slice(0, 8), raw: { folio: r.folio, email: r.email } }));
    }
    res.json(opciones);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Datos (vista lista con filtros) ──

// GET /api/tablas/:id/registros?page&limit&filtros(JSON {clave:valor})&buscar
router.get('/:id/registros', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let filtros = {};
    try { filtros = JSON.parse(req.query.filtros || '{}'); } catch { filtros = {}; }
    // ordenar=clave:asc|desc · filtros con operador "!valor" = excluir (filter out)
    const ordenar = String(req.query.ordenar || '');
    const [ordCampo, ordDir] = ordenar.split(':');
    const ordenValido = tabla.columnas.some((c) => c.clave === ordCampo) ? { [ordCampo]: ordDir === 'desc' ? 'desc' : 'asc' } : null;

    // Tabla física (cualquiera de FISICAS): SQL proyectado (solo columnas activas — sin el raw completo)
    const fisica = FISICAS[tabla.storage];
    if (fisica) {
      const { Prisma } = require('@prisma/client');
      const CAMPOS_MODELO = fisica.camposModelo;
      const cols = tabla.columnas.filter((c) => c.activo);
      const clavesOk = new Set(cols.map((c) => c.clave));
      const selectCols = [Prisma.raw('"sysId" AS "id"')];
      for (const k of clavesOk) {
        if (!/^[a-zA-Z0-9_]+$/.test(k)) continue;
        selectCols.push(CAMPOS_MODELO.includes(k) ? Prisma.raw(`"${k}"`) : Prisma.raw(`raw->>'${k}' AS "${k}"`));
      }
      const condiciones = [];
      for (const [k, v] of Object.entries(filtros)) {
        if (!clavesOk.has(k) || !/^[a-zA-Z0-9_]+$/.test(k)) continue;
        const excluir = String(v).startsWith('!');
        const valor = excluir ? String(v).slice(1) : String(v);
        if (!valor) continue;
        const col = cols.find((c) => c.clave === k);
        const esNum = ['integer', 'float'].includes(col?.tipo);
        const expr = CAMPOS_MODELO.includes(k) ? Prisma.raw(`"${k}"`) : Prisma.raw(`raw->>'${k}'`);
        let cond;
        if (esNum) cond = Prisma.sql`${expr} = ${Number(valor)}`;
        else if (col?.tipo === 'choice') cond = Prisma.sql`${expr} = ${valor}`;
        else cond = Prisma.sql`${expr} ILIKE ${'%' + valor + '%'}`;
        condiciones.push(excluir ? Prisma.sql`NOT (${cond})` : cond);
      }
      const whereSql = condiciones.length ? Prisma.sql`WHERE ${Prisma.join(condiciones, ' AND ')}` : Prisma.empty;
      const ordenExpr = ordenValido
        ? (CAMPOS_MODELO.includes(ordCampo) ? Prisma.raw(`"${ordCampo}"`) : Prisma.raw(`raw->>'${ordCampo}'`))
        : Prisma.raw('"' + fisica.ordenDefault + '"');
      const dir = ordDir === 'desc' ? Prisma.raw('DESC') : Prisma.raw('ASC');
      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw(Prisma.sql`SELECT ${Prisma.join(selectCols, ', ')} FROM ${Prisma.raw('"' + tabla.storage + '"')} ${whereSql} ORDER BY ${ordenExpr} ${dir} LIMIT ${limit} OFFSET ${(page - 1) * limit}`),
        prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS n FROM ${Prisma.raw('"' + tabla.storage + '"')} ${whereSql}`),
      ]);
      logSistema && null; // (export/log aparte)
      return res.json({ data: rows.map((r) => ({ sys_id: r.id, ...r })), total: countRows[0].n, page, limit });
    }


    // Storage JSON: filtrar con JSONB (sin eliminados; "!valor" = excluir)
    const where = { tablaId: tabla.id, eliminado: false };
    for (const [k, v] of Object.entries(filtros)) {
      if (v === '' || v === undefined) continue;
      if (String(v).startsWith('!')) where.AND = [...(where.AND || []), { NOT: { datos: { path: [k], string_contains: String(v).slice(1) } } }];
      else where.AND = [...(where.AND || []), { datos: { path: [k], string_contains: String(v) } }];
    }
    const [data, total] = await Promise.all([
      prisma.customRegistro.findMany({ where, orderBy: ordenValido ? { datos: { path: [ordCampo], sort: ordDir === 'desc' ? 'desc' : 'asc' } } : { creadoEn: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.customRegistro.count({ where }),
    ]);
    let lista = data.map((r) => ({ id: r.id, sys_id: r.id, ...r.datos }));
    if (ordenValido) {
      lista.sort((a, b) => {
        const va = a[ordCampo] ?? ''; const vb = b[ordCampo] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
        return ordDir === 'desc' ? -cmp : cmp;
      });
    }
    res.json({ data: lista, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tablas/:id/registros — crear registro (storage json)
router.post('/:id/registros', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({
      where: { id: req.params.id },
      include: { columnas: { where: { activo: true } } },
    });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });
    if (tabla.storage !== 'json') return res.status(400).json({ error: 'Tabla de solo lectura (storage físico)' });

    const clavesValidas = new Set(tabla.columnas.map((c) => c.clave));
    const datos = Object.fromEntries(Object.entries(req.body.datos || {}).filter(([k]) => clavesValidas.has(k)));
    // Requeridos
    for (const col of tabla.columnas) {
      if (col.requerido && (datos[col.clave] === undefined || datos[col.clave] === '')) {
        return res.status(400).json({ error: `${col.etiqueta} es requerido` });
      }
    }
    const usr = usuarioSesion(req);
    const data = await prisma.customRegistro.create({ data: { tablaId: tabla.id, datos, creadoPor: usr?.id || 'sistema', actualizadoPor: usr?.id || 'sistema' } });
    logSistema('tabla_dinamica', `Registro creado en ${tabla.label}`, { entidadTipo: 'tabla', entidadId: tabla.id, modulo: tabla.modulo, usuarioId: usr?.id, usuarioEmail: usr?.email, usuarioNombre: usr?.nombre, ...reqInfo(req) });
    res.status(201).json({ id: data.id, ...data.datos });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/tablas/:id/registros/:regId — con auditoría campo a campo (valor anterior → nuevo)
router.put('/:id/registros/:regId', async (req, res) => {
  try {
    const reg = await prisma.customRegistro.findUnique({ where: { id: req.params.regId } });
    if (!reg || reg.tablaId !== req.params.id) return res.status(404).json({ error: 'No encontrado' });
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id } });
    const entrantes = req.body.datos || {};
    const cambios = [];
    for (const [campo, nuevo] of Object.entries(entrantes)) {
      const anterior = reg.datos?.[campo];
      if (JSON.stringify(anterior ?? null) !== JSON.stringify(nuevo ?? null)) {
        cambios.push({ campo, anterior: anterior ?? null, nuevo });
      }
    }
    const usr = usuarioSesion(req);
    const datos = { ...reg.datos, ...entrantes };
    const data = await prisma.customRegistro.update({ where: { id: reg.id }, data: { datos, actualizadoPor: usr?.id || 'sistema' } });
    if (cambios.length) {
      logSistema('auditoria', `Edición de registro en ${tabla?.label || req.params.id}`, {
        usuarioId: usr?.id, usuarioEmail: usr?.email, usuarioNombre: usr?.nombre,
        detalle: `${cambios.length} campo(s) modificados`,
        metadata: { cambios, registroId: reg.id },
        entidadTipo: 'tabla', entidadId: req.params.id,
        modulo: tabla?.modulo,
        ...reqInfo(req),
      });
    }
    res.json({ id: data.id, ...data.datos });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id/registros/:regId', async (req, res) => {
  try {
    // Delete lógico (único tipo de delete del sistema)
    await prisma.customRegistro.update({
      where: { id: req.params.regId },
      data: { eliminado: true, eliminadoEn: new Date() },
    });
    const usrDel = usuarioSesion(req);
    logSistema('tabla_dinamica', `Registro eliminado (lógico)`, { entidadTipo: 'tabla', entidadId: req.params.id, modulo: 'todos', usuarioId: usrDel?.id, usuarioEmail: usrDel?.email, usuarioNombre: usrDel?.nombre, ...reqInfo(req) });
    res.json({ ok: true, eliminado: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Exportación / Importación ──

function aFilasPlano(tabla, registros) {
  const cols = tabla.columnas.filter((c) => c.activo);
  return {
    headers: ['Sys ID', ...cols.map((c) => c.etiqueta)],
    claves: ['sys_id', ...cols.map((c) => c.clave)],
    filas: registros.map((r) => [r.id ?? r.sys_id ?? '', ...cols.map((c) => r[c.clave] ?? '')]),
  };
}

async function obtenerRegistrosParaExport(tabla, filtros) {
  const fisicaExport = FISICAS[tabla.storage];
  if (fisicaExport) {
    const where = {};
    for (const [k, v] of Object.entries(filtros)) {
      if (!v) continue;
      const excluir = String(v).startsWith('!');
      const valor = excluir ? String(v).slice(1) : String(v);
      const col = tabla.columnas.find((c) => c.clave === k);
      if (!col) continue;
      const cond = ['integer', 'float'].includes(col.tipo) ? Number(valor) : (col.tipo === 'choice' ? valor : { contains: valor, mode: 'insensitive' });
      if (excluir) where.NOT = [...(where.NOT || []), { [k]: cond }];
      else where[k] = cond;
    }
    const rows = await prisma[fisicaExport.modelo].findMany({ where, take: 10000 });
    return rows.map((r) => ({ id: r[fisicaExport.idCampo], ...Object.fromEntries(tabla.columnas.map((c) => [c.clave, r[c.clave] ?? r.raw?.[c.clave] ?? null])) }));
  }
  const rows = await prisma.customRegistro.findMany({ where: { tablaId: tabla.id, eliminado: false }, take: 10000 });
  return rows.map((r) => ({ id: r.id, ...r.datos }));
}

// GET /api/tablas/:id/registros/exportar?formato=csv|xlsx|xml|json|pdf&filtros={}
router.get('/:id/registros/exportar', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id }, include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } } });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });
    let filtros = {};
    try { filtros = JSON.parse(req.query.filtros || '{}'); } catch { filtros = {}; }
    const registrosRaw = await obtenerRegistrosParaExport(tabla, filtros);
    const registros = registrosRaw.map((r) => ({ sys_id: r.id, ...r }));
    const { headers, claves, filas } = aFilasPlano(tabla, registros);
    const formato = req.query.formato || 'csv';
    const nombre = `${tabla.clave}_${new Date().toISOString().slice(0, 10)}`;

    logSistema('tabla_dinamica', `Exportación ${formato} de ${tabla.label} (${registros.length} registros)`, { entidadTipo: 'tabla', entidadId: tabla.id, modulo: tabla.modulo, ...reqInfo(req) });

    if (formato === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.json"`);
      return res.send(JSON.stringify(registros.map((r) => Object.fromEntries(claves.map((c) => [c, r[c]]))), null, 2));
    }
    if (formato === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...filas]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tabla.clave.slice(0, 28));
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.xlsx"`);
      return res.send(buf);
    }
    if (formato === 'xml') {
      const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
      const xml = builder.build({ tabla: { nombre: tabla.label, registro: registros.map((r) => Object.fromEntries(claves.map((c) => [c, r[c]]))) } });
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.xml"`);
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`);
    }
    if (formato === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.pdf"`);
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      doc.fontSize(14).text(tabla.label, { underline: true });
      doc.moveDown(0.5).fontSize(8).text(`Exportado: ${new Date().toLocaleString('es-MX')} · ${registros.length} registros`);
      doc.moveDown();
      const colWidth = (doc.page.width - 60) / headers.length;
      doc.font('Helvetica-Bold');
      headers.forEach((h, i) => doc.text(String(h).slice(0, 20), 30 + i * colWidth, doc.y, { width: colWidth, continued: i < headers.length - 1 }));
      doc.moveDown().font('Helvetica');
      for (const fila of filas) {
        fila.forEach((celda, i) => doc.text(String(celda).slice(0, 24), 30 + i * colWidth, doc.y, { width: colWidth, continued: i < fila.length - 1 }));
        doc.moveDown(0.3);
        if (doc.y > doc.page.height - 50) doc.addPage();
      }
      doc.end();
      return;
    }
    // csv (default)
    const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = '\ufeff' + [headers.map(esc).join(','), ...filas.map((f) => f.map(esc).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}.csv"`);
    return res.send(csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tablas/:id/registros/:regId/exportar?formato=csv|json — un registro
router.get('/:id/registros/:regId/exportar', async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id }, include: { columnas: { where: { activo: true }, orderBy: { orden: 'asc' } } } });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });
    const registros = await obtenerRegistrosParaExport(tabla, {});
    const reg = registros.find((r) => r.id === req.params.regId);
    if (!reg) return res.status(404).json({ error: 'Registro no encontrado' });
    const { headers, claves } = aFilasPlano(tabla, []);
    headers.unshift('Sys ID');
    claves.unshift('sys_id');
    reg.sys_id = reg.id;
    const formato = req.query.formato || 'json';
    const nombre = `${tabla.clave}_${req.params.regId.slice(0, 8)}`;
    if (formato === 'csv') {
      const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
      const csv = '\ufeff' + headers.map(esc).join(',') + '\n' + claves.map((c) => esc(reg[c])).join(',');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.csv"`);
      return res.send(csv);
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}.json"`);
    res.send(JSON.stringify(Object.fromEntries(claves.map((c) => [c, reg[c]])), null, 2));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tablas/:id/registros/importar — importación masiva (json o xml, de los extraídos)
// Body raw: JSON array o XML <tabla><registro>…</registro></tabla> (content-type text/xml o application/json)
router.post('/:id/registros/importar', express.text({ type: ['text/xml', 'application/xml', 'application/json', 'text/plain'], limit: '50mb' }), async (req, res) => {
  try {
    const tabla = await prisma.tablaCustom.findUnique({ where: { id: req.params.id }, include: { columnas: { where: { activo: true } } } });
    if (!tabla) return res.status(404).json({ error: 'No encontrada' });
    if (tabla.storage !== 'json') return res.status(400).json({ error: 'Tabla de solo lectura (storage físico)' });

    let registros = [];
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('xml')) {
      const parsed = new XMLParser().parse(req.body);
      const regs = parsed?.tabla?.registro;
      registros = Array.isArray(regs) ? regs : regs ? [regs] : [];
    } else {
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      registros = Array.isArray(parsed) ? parsed : [parsed];
    }

    const clavesValidas = new Set(tabla.columnas.map((c) => c.clave));
    let insertados = 0;
    let actualizados = 0;
    const errores = [];
    for (const [i, reg] of registros.entries()) {
      const datos = Object.fromEntries(Object.entries(reg).filter(([k]) => clavesValidas.has(k)));
      const falta = tabla.columnas.find((c) => c.requerido && (datos[c.clave] === undefined || datos[c.clave] === ''));
      if (falta) { errores.push(`Registro ${i + 1}: falta ${falta.etiqueta}`); continue; }
      const sysId = reg.sys_id || reg.id || null;
      if (sysId) {
        // Upsert por sys_id (estilo SN import)
        const existente = await prisma.customRegistro.findUnique({ where: { id: String(sysId) } }).catch(() => null);
        if (existente && existente.tablaId === tabla.id) {
          await prisma.customRegistro.update({ where: { id: existente.id }, data: { datos: { ...existente.datos, ...datos } } });
          actualizados++;
          continue;
        }
      }
      await prisma.customRegistro.create({ data: { tablaId: tabla.id, datos } });
      insertados++;
    }
    logSistema('tabla_dinamica', `Importación masiva en ${tabla.label}: ${insertados} nuevos, ${actualizados} actualizados`, { entidadTipo: 'tabla', entidadId: tabla.id, modulo: tabla.modulo, ...reqInfo(req) });
    res.json({ ok: true, insertados, actualizados, errores });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
