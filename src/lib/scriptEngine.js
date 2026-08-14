const vm = require('vm');
const prisma = require('./prisma');

// ─────────────────────────────────────────────────────────────────────────────
// ScriptEngine — ejecución sandboxed de Script Includes y Business Rules
// (estilo ServiceNow: vm con timeout, globals controlados)
// ─────────────────────────────────────────────────────────────────────────────

const cacheIncludes = new Map(); // nombre -> { api, ts }
const CACHE_TTL_MS = 60 * 1000; // recargar includes cada 60s (o invalidar al guardar)

function crearSandbox(extras = {}) {
  const logs = [];
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
async function ejecutarBusinessRules({ entidad, evento, datos, modulo, dominioId }) {
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
      regla: { nombre: regla.nombre, entidad, evento },
    }).catch((err) => {
      logs.push(`[BusinessRule "${regla.nombre}"] Error: ${err.message}`);
      return { logs: [] };
    });
    logs.push(...scriptLogs.map((l) => `[BusinessRule "${regla.nombre}"] ${l}`));
  }
  return { datos, logs, ejecutadas };
}

module.exports = { runScript, callScriptInclude, cargarInclude, invalidarInclude, ejecutarBusinessRules, evaluarCondiciones };
