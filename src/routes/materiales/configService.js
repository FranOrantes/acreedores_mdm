const prisma = require('../../lib/prisma');

// ─────────────────────────────────────────────────────────────
// ConfigService — parametrización del módulo Materiales
// Precedencia: BD (ConfiguracionModulo) → variable de entorno → default.
// Caché en memoria invalidada al escribir (cambios aplican al momento).
// ─────────────────────────────────────────────────────────────

const MODULO = 'materiales';

// Registro de claves conocidas: default, tipo, grupo, descripción, env de bootstrap
const DEFAULTS = [
  // Integraciones
  // Validaciones Excel
  { clave: 'validacion.excel.ean_min_digitos', tipo: 'number', grupo: 'Validaciones', descripcion: 'EAN: dígitos mínimos (SN: 3)', default: 3 },
  { clave: 'validacion.excel.ean_max_digitos', tipo: 'number', grupo: 'Validaciones', descripcion: 'EAN: dígitos máximos (SN: 16)', default: 16 },
  { clave: 'validacion.excel.campos_requeridos', tipo: 'json', grupo: 'Validaciones', descripcion: 'Campos obligatorios de la hoja DatosBasicos', default: ['ID_CARGA', 'MTART', 'MATKL', 'MEINS', 'MAKTX'] },
  // Validaciones adjuntos
  { clave: 'validacion.adjuntos.max_mb', tipo: 'number', grupo: 'Validaciones', descripcion: 'Tamaño máximo por archivo (MB)', default: 25 },
  { clave: 'validacion.adjuntos.ext_imagenes', tipo: 'json', grupo: 'Validaciones', descripcion: 'Extensiones permitidas para imágenes', default: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'] },
  { clave: 'validacion.adjuntos.ext_documentos', tipo: 'json', grupo: 'Validaciones', descripcion: 'Extensiones permitidas para documentos', default: ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx'] },
  { clave: 'validacion.adjuntos.obligatorios', tipo: 'json', grupo: 'Validaciones', descripcion: 'Adjuntos obligatorios por material (validación onSubmit)', default: ['vs_pi_img_01', 'vs_pi_img_02', 'vs_pi_img_03', 'vs_carta_de_presentacion_documento', 'vs_lista_de_precios', 'vs_marbete_empaque_artes_de_producto', 'vs_ficha_tecnica'] },
  // Flujo
  { clave: 'flujo.folio_prefijo', tipo: 'string', grupo: 'Flujo', descripcion: 'Prefijo del folio de solicitudes de materiales', default: 'MT' },
  { clave: 'flujo.etapa_inicial', tipo: 'string', grupo: 'Flujo', descripcion: 'Etapa inicial del flujo de aprobación', default: '01 - Comprador' },
  { clave: 'matriz.aprobadores', tipo: 'json', grupo: 'Flujo', descripcion: 'Matriz de aprobadores (comprador/negociador/DGA) — réplica u_matriz_area_aprobadores', default: [] },
  { clave: 'layout.archivo', tipo: 'json', grupo: 'Validaciones', descripcion: 'Layout Excel vigente del alta (se sube desde el builder; vacío = empaquetado V20)', default: null },
  // Integración ServiceNow (sync del catálogo u_mdm_registros)
  { clave: 'integracion.servicenow.base_url', tipo: 'url', grupo: 'Integraciones', descripcion: 'Instancia ServiceNow PROD para sync de materiales', default: 'https://nadrocomercialprod.service-now.com' },
  { clave: 'integracion.servicenow.user', tipo: 'string', grupo: 'Integraciones', descripcion: 'Usuario ServiceNow (solo lectura)', env: 'PROD_SERVICENOW_USER', default: '' },
  { clave: 'integracion.servicenow.password', tipo: 'secret', grupo: 'Integraciones', sensible: true, descripcion: 'Password ServiceNow (solo lectura)', env: 'PROD_SERVICENOW_PASSWORD', default: '' },
  // Sync
  { clave: 'sync.page_size', tipo: 'number', grupo: 'Integraciones', descripcion: 'Registros por página al extraer de ServiceNow', default: 500 },
  { clave: 'sync.full_cron', tipo: 'string', grupo: 'Integraciones', descripcion: 'Cron del upsert completo (default: 11pm diario)', default: '0 23 * * *' },
  { clave: 'sync.delta_cron', tipo: 'string', grupo: 'Integraciones', descripcion: 'Cron del sync incremental por sys_updated_on (default: cada hora)', default: '0 * * * *' },
];

const cache = new Map(); // clave -> valor resuelto

function defaultDe(clave) {
  const def = DEFAULTS.find((d) => d.clave === clave);
  if (!def) return undefined;
  const envVal = def.env ? process.env[def.env] : undefined;
  return envVal !== undefined && envVal !== '' ? envVal : def.default;
}

async function get(clave) {
  if (cache.has(clave)) return cache.get(clave);
  const row = await prisma.configuracionModulo.findUnique({
    where: { modulo_clave: { modulo: MODULO, clave } },
  });
  const valor = row ? row.valor : defaultDe(clave);
  cache.set(clave, valor);
  return valor;
}

async function getAll() {
  const rows = await prisma.configuracionModulo.findMany({ where: { modulo: MODULO } });
  const mapa = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  const resultado = {};
  for (const def of DEFAULTS) {
    resultado[def.clave] = mapa[def.clave] !== undefined ? mapa[def.clave] : defaultDe(def.clave);
  }
  // Incluir claves custom creadas desde la UI
  for (const r of rows) {
    if (!(r.clave in resultado)) resultado[r.clave] = r.valor;
  }
  return resultado;
}

async function set(clave, valor, actualizadoPor) {
  const def = DEFAULTS.find((d) => d.clave === clave);
  const row = await prisma.configuracionModulo.upsert({
    where: { modulo_clave: { modulo: MODULO, clave } },
    update: { valor, actualizadoPor: actualizadoPor || null },
    create: {
      modulo: MODULO,
      clave,
      valor,
      tipo: def?.tipo || 'string',
      grupo: def?.grupo || 'General',
      descripcion: def?.descripcion || null,
      sensible: def?.sensible || false,
      actualizadoPor: actualizadoPor || null,
    },
  });
  cache.set(clave, valor);
  return row;
}

// Siembra las claves default en BD (idempotente; bootstrap desde env cuando aplique)
async function seed() {
  for (const def of DEFAULTS) {
    const existe = await prisma.configuracionModulo.findUnique({
      where: { modulo_clave: { modulo: MODULO, clave: def.clave } },
    });
    if (!existe) {
      await prisma.configuracionModulo.create({
        data: {
          modulo: MODULO,
          clave: def.clave,
          valor: defaultDe(def.clave),
          tipo: def.tipo,
          grupo: def.grupo,
          descripcion: def.descripcion,
          sensible: def.sensible || false,
        },
      });
    }
  }
}

module.exports = { get, getAll, set, seed, DEFAULTS, MODULO };
