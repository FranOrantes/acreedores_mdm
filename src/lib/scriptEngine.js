const vm = require('vm');
const prisma = require('./prisma');
const { construirGs } = require('./sesion');

// ─────────────────────────────────────────────────────────────────────────────
// ScriptEngine — ejecución sandboxed de Script Includes y Business Rules
// (estilo ServiceNow: vm con timeout, globals controlados)
// ─────────────────────────────────────────────────────────────────────────────

const cacheIncludes = new Map(); // nombre -> { api, ts }
const CACHE_TTL_MS = 60 * 1000; // recargar includes cada 60s (o invalidar al guardar)

function crearSandbox(extras = {}) {
  const logs = extras.logsCaptura || [];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    result: undefined,
    logs,
    // console limitado (captura en logs, no stdout)
    console: {
      log: (...a) => logs.push(a.map(String).join(' ')),
      warn: (...a) => logs.push('[warn] ' + a.map(String).join(' ')),
      error: (...a) => logs.push('[error] ' + a.map(String).join(' ')),
    },
    // utilidades seguras
    JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    Buffer,
    fetch, // para integraciones HTTP desde Script Includes / Business Rules
    incluir: cargarInclude, // una línea: const utils = await incluir('MDM_Excel') → todas sus funciones
    glideRecord, // queries estilo GlideRecord sobre tablas dinámicas y legacy
    ...extras,
  };
  return sandbox;
}

// Ejecuta código JS en sandbox. Si el código devuelve una promesa, se espera.
async function runScript(codigo, extras = {}, timeoutMs = 10000) {
  const sandbox = crearSandbox(extras);
  vm.createContext(sandbox);
  const wrapped = `(async () => { ${codigo}\n })()`;
  const script = new vm.Script(wrapped, { timeout: timeoutMs });
  const promise = script.runInContext(sandbox, { timeout: timeoutMs });
  const resultado = await Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout de script')), timeoutMs + 500)),
  ]);
  // module.exports o return explícito tienen prioridad; si no, el resultado del IIFE
  const exportado = sandbox.module.exports && Object.keys(sandbox.module.exports).length
    ? sandbox.module.exports
    : resultado !== undefined ? resultado : sandbox.result;
  return { resultado: exportado, logs: sandbox.logs };
}

// Carga un Script Include y devuelve su API (objeto de funciones)
async function cargarInclude(nombre) {
  const cached = cacheIncludes.get(nombre);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.api;

  const row = await prisma.scriptInclude.findUnique({ where: { nombre } });
  if (!row || !row.activo) throw new Error(`Script Include no encontrado o inactivo: ${nombre}`);

  const { resultado } = await runScript(row.script, { callScriptInclude, prisma });
  const api = resultado || {};
  cacheIncludes.set(nombre, { api, ts: Date.now() });
  return api;
}

// Llama a una función de un Script Include: callScriptInclude('MDM_Utils', 'validarEan', { ean })
async function callScriptInclude(nombre, metodo, params) {
  const api = await cargarInclude(nombre);
  const fn = api?.[metodo];
  if (typeof fn !== 'function') throw new Error(`Método "${metodo}" no existe en Script Include "${nombre}"`);
  return fn(params);
}

// GlideRecord-like: consulta tablas dinámicas (custom), materiales_registros y legacy de Postgres.
// Uso: const gr = glideRecord('mi_tabla'); gr.addQuery('campo', 'contiene', 'x'); await gr.query();
//      while (gr.next()) { gr.get('campo') }
const LEGACY_MAP = {
  solicitud: 'solicitud', usuario: 'usuario', aprobacion: 'aprobacion', grupo_aprobacion: 'grupoAprobacion',
  dominio: 'dominio', documento: 'documento', incidente: 'incidente', ubicacion: 'ubicacion',
  log_sistema: 'logSistema', formulario: 'formulario', tabla_custom: 'tablaCustom',
};

function glideRecord(tabla) {
  const condiciones = [];
  let resultado = [];
  let idx = -1;

  const aplicarCond = (datos) => datos.filter((row) => condiciones.every(([campo, op, valor]) => {
    const v = row[campo];
    switch (op) {
      case '=': case '==': return v === valor;
      case '!=': return v !== valor;
      case 'contiene': return String(v ?? '').toLowerCase().includes(String(valor).toLowerCase());
      case '>': return Number(v) > Number(valor);
      case '<': return Number(v) < Number(valor);
      case '>=': return Number(v) >= Number(valor);
      case '<=': return Number(v) <= Number(valor);
      case 'vacio': return v === null || v === undefined || v === '';
      case 'no_vacio': return v !== null && v !== undefined && v !== '';
      default: return true;
    }
  }));

  const gr = {
    addQuery: (campo, op, valor) => { condiciones.push([campo, op, valor]); return gr; },
    query: async () => {
      let datos = [];
      if (tabla === 'materiales_registros') {
        const rows = await prisma.materialesRegistro.findMany({
          take: 50000,
          select: { sysId: true, noMateria: true, nombre: true, estatus: true, tipoSolicitud: true, eanPi: true, razonSocial: true, sysUpdatedOn: true },
        });
        datos = rows.map((r) => ({ sys_id: r.sysId, ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'sysId')) }));
      } else if (LEGACY_MAP[tabla] && prisma[LEGACY_MAP[tabla]]) {
        const rows = await prisma[LEGACY_MAP[tabla]].findMany({ take: 50000 });
        datos = rows.map((r) => ({ sys_id: r.id, ...r }));
      } else {
        // Tabla dinámica por clave o id
        const t = await prisma.tablaCustom.findFirst({ where: { OR: [{ clave: tabla }, { id: tabla }] } });
        if (!t) throw new Error(`Tabla no encontrada: ${tabla}`);
        const rows = await prisma.customRegistro.findMany({ where: { tablaId: t.id, eliminado: false }, take: 10000 });
        datos = rows.map((r) => ({ sys_id: r.id, ...r.datos }));
      }
      resultado = aplicarCond(datos);
      idx = -1;
      return gr;
    },
    get: async (sysId) => {
      let row = null;
      if (tabla === 'materiales_registros') {
        const r = await prisma.materialesRegistro.findUnique({ where: { sysId } });
        if (r) row = { sys_id: r.sysId, ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'raw')) };
      } else if (LEGACY_MAP[tabla] && prisma[LEGACY_MAP[tabla]]) {
        const r = await prisma[LEGACY_MAP[tabla]].findUnique({ where: { id: sysId } });
        if (r) row = { sys_id: r.id, ...r };
      } else {
        const r = await prisma.customRegistro.findUnique({ where: { id: sysId } });
        if (r) row = { sys_id: r.id, ...r.datos };
      }
      if (!row) return false;
      resultado = [row];
      idx = 0;
      return true;
    },
    next: () => { idx++; return idx < resultado.length; },
    getValue: (campo) => resultado[idx]?.[campo],
    rowCount: () => resultado.length,
    rows: () => resultado,
  };
  return gr;
}

function invalidarInclude(nombre) {
  if (nombre) cacheIncludes.delete(nombre);
  else cacheIncludes.clear();
}

// Evalúa condiciones JSON contra un registro (mismos operadores que Reglas de Formulario)
function evaluarCondiciones(condicionesStr, logica, datos) {
  let condiciones;
  try { condiciones = JSON.parse(condicionesStr || '[]'); } catch { condiciones = []; }
  if (!condiciones.length) return true;

  const evalUna = (cond) => {
    const val = datos?.[cond.campo] ?? '';
    switch (cond.operador) {
      case '!=': case 'not': return val !== cond.valor;
      case 'contiene': return String(val).toLowerCase().includes(String(cond.valor).toLowerCase());
      case 'no_contiene': return !String(val).toLowerCase().includes(String(cond.valor).toLowerCase());
      case 'existe': return val !== '' && val !== null && val !== undefined;
      case 'no_existe': return val === '' || val === null || val === undefined;
      case '>': return Number(val) > Number(cond.valor);
      case '<': return Number(val) < Number(cond.valor);
      case '==': default: return val === cond.valor;
    }
  };
  return logica === 'OR' ? condiciones.some(evalUna) : condiciones.every(evalUna);
}

// Ejecuta las Business Rules de una entidad+evento contra los datos
// Retorna { datos (posiblemente mutados), logs, ejecutadas }
async function ejecutarBusinessRules({ entidad, evento, datos, modulo, dominioId, sesion }) {
  const reglas = await prisma.businessRule.findMany({
    where: {
      entidad, evento, activo: true,
      modulo: { in: [modulo || 'todos', 'todos'] },
    },
    orderBy: { orden: 'asc' },
  });

  const logs = [];
  let ejecutadas = 0;
  for (const regla of reglas) {
    if (regla.dominioId && dominioId && regla.dominioId !== dominioId) continue;
    if (!evaluarCondiciones(regla.condiciones, regla.logica, datos)) continue;
    if (!regla.script) continue;
    ejecutadas++;
    const { logs: scriptLogs } = await runScript(regla.script, {
      datos,
      prisma,
      callScriptInclude,
      glideRecord,
      incluir: cargarInclude,
      gs: construirGs(sesion, logs),
      regla: { nombre: regla.nombre, entidad, evento },
    }).catch((err) => {
      logs.push(`[BusinessRule "${regla.nombre}"] Error: ${err.message}`);
      return { logs: [] };
    });
    logs.push(...scriptLogs.map((l) => `[BusinessRule "${regla.nombre}"] ${l}`));
  }
  return { datos, logs, ejecutadas };
}

module.exports = { runScript, callScriptInclude, cargarInclude, invalidarInclude, ejecutarBusinessRules, evaluarCondiciones, glideRecord };
