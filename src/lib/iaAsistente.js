// Asistente IA del sistema — Concordia chatbot (Gemini).
// La URL y API key viven en el módulo Integraciones (colección "Sistema",
// request "Concordia Chatbot IA") — editables sin tocar código.
const { ejecutarGuardado } = require('../routes/integraciones');

const NOMBRE_INTEGRACION = 'Concordia Chatbot IA';

// Contexto base del sistema para que la IA sepa cómo conectar módulos
const CONTEXTO_SISTEMA = `
Sistema MDM Portal (réplica ServiceNow). Módulos y cómo conectan:
- Formularios (builder): definicion JSON { pasos[], campos{}, clientScripts[], uiActions[] }. Tipos de campo: texto, textarea, numerico, flotante, booleano, choices, regex, fecha, attachment, imagen, label, break, layout_excel, registros_materiales.
- Reglas de Formulario (UI policies): campo, condiciones JSON [{campo, operador, valor}], logica AND/OR, accionVisible/Obligatorio/ReadOnly, script (modo avanzado, API g_form), formulario, modulo.
- Client Scripts (navegador): onLoad/onChange(campo)/onSubmit(return false bloquea), API: g_form.{getValue,setValue,setVisible,setDisplay,setRequired,setReadOnly,showError,showMensaje,alert,getCampo}, form, fetch, callScriptInclude, session.
- Business Rules (servidor): entidad+evento (before/after_create/update, custom), condiciones, script con { datos, prisma, callScriptInclude, glideRecord, incluir, gs, fetch }.
- Script Includes (servidor): script retorna objeto de funciones; se llaman con callScriptInclude('Nombre','metodo',params) o const x = await incluir('Nombre').
- Background Scripts: playground admin en /api/scripts/ejecutar con todo el sandbox.
- glideRecord(tabla): addQuery(campo,op,valor), query(), next(), getValue(), rowCount(), rows(), get(sysId), resolveRef(campo). Tablas: dinámicas por clave, materiales_registros, y legacy (solicitud, usuario, aprobacion, grupo_aprobacion, dominio, documento, incidente, ubicacion, log_sistema, formulario, tabla_custom).
- Tablas (table builder): TablaCustom + ColumnaCustom (tipos: string,text,integer,float,boolean,choice,date,datetime,reference,attachment; reference con referencia+filtroReferencia). Datos en custom_registros (JSONB) o materiales_registros (física). Roles auto: <clave>.leer/.escribir/.eliminar. Deletes solo lógicos.
- Integraciones (REST message): colecciones + requests (metodo,url,headers,body,auth,scriptRespuesta post-proceso). ejecutarGuardado(nombre, variables). Scripted REST: se exponen en /api/ext/<path> con token X-App-Token (módulo ApiTokens).
- Vistas de formulario: vistas_formulario por tablaId/formularioClave (layout filas 1-4 cols).
- Preferencias de usuario: preferencias_usuario (clave/valor JSON) — paginación, columnas, vista.
- Logs: LogSistema (tipo, accion, nivel, modulo, usuario, ip, metadata) + agente de auditoría en /api/logs/ai.
- Materiales: Formulario mt_alta (wizard alta con layout Excel validado), catálogo sync ServiceNow u_mdm_registros, matriz de aprobadores, configuración propia (ConfiguracionModulo).
`.trim();

// Escapa texto para insertarlo dentro de un string JSON del body template
const escJson = (s) => JSON.stringify(String(s ?? '')).slice(1, -1);

async function asistenteIA(mensaje, { systemInstruction, contexto, history } = {}) {
  const resp = await ejecutarGuardado(NOMBRE_INTEGRACION, {
    message: escJson(mensaje),
    system_instruccion: escJson(systemInstruction || 'Eres un experto configurador del sistema MDM Portal (réplica ServiceNow). Responde en español, conciso y con JSON cuando se pida configuración.'),
    contexto_base: escJson(contexto ? `${CONTEXTO_SISTEMA}\n\nContexto actual:\n${contexto}` : CONTEXTO_SISTEMA),
    history: JSON.stringify(history || []),
  });
  return resp.body;
}

module.exports = { asistenteIA, CONTEXTO_SISTEMA };
