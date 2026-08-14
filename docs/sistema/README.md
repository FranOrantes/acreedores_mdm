# Portal MDM — Arquitectura del sistema (para agentes y developers)

> Guía de referencia para crear, configurar o debuggear cualquier módulo. Todo es 100% auditable (módulo Logs) y parametrizable.

## Mapa de módulos (y cómo se conectan)

| Módulo | Dónde | Qué hace | Se conecta con |
|---|---|---|---|
| **Formularios** (builder) | `/admin/formularios` · `Formulario.definicion` | Estructura de formularios como DATO (pasos, campos, layout, scripts, acciones) | Reglas de Formulario (por clave de campo) · Client Scripts · UI Actions · envío → Solicitud (+tabla destino) |
| **Tablas** (table builder) | `/admin/tablas` · `TablaCustom`/`ColumnaCustom` | Tablas custom por módulo; datos en `custom_registros` (JSONB) o tabla física (`materiales_registros`) | Vistas (`vistas_formulario`) · menú del módulo (Sidebar) · roles auto |
| **Reglas de Formulario** | `/reglas-formulario` · `ReglaFormularioCampo` | UI policies: visible/requerido/readonly + script (modo avanzado) por campo | Aplican en FormRenderer (builder) y forms legacy |
| **Business Rules** | `/business-rules` · `BusinessRule` | Reglas server-side: entidad+evento (before/after_create/update, custom) + condiciones + script | Se disparan en `ejecutarBusinessRules` (solicitudes, formularios) |
| **Script Includes** | `/script-includes` · `ScriptInclude` | Funciones JS reutilizables server-side | Llamadas con `callScriptInclude` o `await incluir('Nombre')` desde cualquier script |
| **Background Scripts** | `/admin/scripts` · `POST /api/scripts/ejecutar` | Playground admin (corre en servidor) | Todo el sandbox |
| **Integraciones** (REST message) | `/integraciones` · colecciones/requests | HTTP out con `{{variables}}`, auth, scriptRespuesta (post-proceso) | Código llama `ejecutarGuardado(nombre, vars)` |
| **Scripted REST APIs** | `/admin/apis` · `ScriptedApi` | Exponen `/api/ext/<path>` con script | Auth `X-App-Token` (ApiToken) |
| **Tokens de apps** | `/admin/tokens` · `ApiToken` | Tokens autogenerados para sistemas externos | Scripted APIs |
| **Logs + Agente IA** | `/logs` · `LogSistema` | Auditoría total + agente (`POST /api/logs/ai`, IA real via Concordia + fallback) | Todo cae aquí |
| **IA de configuración** | botón ✨ en builders · `POST /api/ia/config` | Concordia chatbot (Gemini) con contexto del sistema | Integraciones → colección "Sistema" |
| **Preferencias usuario** | `preferencias_usuario` | Paginación, columnas, vistas por usuario | TablaDatosPage |
| **Materiales** | branch `MDM_Materiales_IA` | Alta con layout Excel, MRVS, matriz aprobadores, sync catálogo SN, config propia | Usa todos los anteriores |

## Sandbox de scripts (idéntico en todos lados)

### Servidor (Business Rules, Script Includes, Background Scripts, Scripted APIs)

```js
// Datos
await prisma.solicitud.findMany(...)          // Prisma directo (legacy)
const gr = glideRecord('mi_tabla');           // GlideRecord-like
await gr.addQuery('campo', 'contiene', 'x').query();
while (gr.next()) { gr.getValue('campo'); }
await gr.resolveRef('campo_ref');             // join
gr.rowCount(); gr.rows();

// Includes
const utils = await incluir('MDM_Excel');     // o callScriptInclude('MDM_Excel', 'metodo', params)

// Usuario (gs estilo ServiceNow)
gs.user(); gs.nombreCompleto(); gs.userEmail(); gs.roles();
gs.tieneRol('admin'); gs.esAdmin(); gs.sesionValida();
gs.tracking(); // { ip, userAgent, cuando }
gs.log('...'); console.log('...');            // ambos caen en logs

// HTTP
await fetch('https://...');
```

### Navegador (Client Scripts, UI Actions)

```js
g_form.getValue('campo'); g_form.setValue('campo', v);
g_form.setVisible / setDisplay / setRequired / setReadOnly('campo', bool);
g_form.showError('campo', 'msg'); g_form.showMensaje('ok'|'error'|'info', 'msg');
g_form.alert('...'); g_form.getCampo('campo'); // config del campo
await callScriptInclude('Nombre', 'metodo', params); // servidor
fetch('/api/...'); session; // sessionKey del form
// onSubmit: return false bloquea el envío
```

## Cómo crear cada cosa (recetas)

### Nueva tabla + formulario + reglas (todo por config)
1. `/admin/tablas` → Nueva tabla (módulo, ícono) → columnas (dictionary) → Menú (visible en sidebar) → Vistas → Reglas y Scripts
2. `/admin/formularios` → Nuevo formulario (misma clave de campos) → pasos + campos (drag&drop) → Client Scripts/UI Actions
3. Reglas visuales: `/reglas-formulario` (formulario = clave o `tabla_<clave_tabla>`)
4. Reglas de servidor: `/business-rules` (entidad = clave del formulario o `solicitud`, evento)
5. Record producer: en la definición del formulario → `config: { tablaDestino, tareas[], aprobaciones[] }` → al enviar cae en Solicitudes (clasificada por módulo) + escribe en la tabla + crea tareas/aprobaciones
6. Logs: todo queda en `/logs` (auditoría con diff de campos, usuario, IP)

### Nueva integración (REST message)
`/integraciones` → colección (con módulo) → request (metodo/url/headers/body/auth + scriptRespuesta) → código: `require('../routes/integraciones').ejecutarGuardado('Nombre', { vars })`

### Nueva API expuesta (scripted REST)
`/admin/apis` → nombre, metodo, path, script → queda en `/api/ext/<path>` · crear token en `/admin/tokens` → el sistema externo llama con header `X-App-Token`

## Debuggear
- Logs: `/logs` → filtra por módulo/tipo/nivel o pregunta al **Agente de Auditoría**
- Playground: `/admin/scripts` (Background Scripts) con todo el sandbox
- Probar integración: botón "Probar" en el request (Integraciones) o en Configuración de materiales
- Regla/script que no corre: revisar en Logs (`tipo=script`/`api_externa` con metadata del error)

## Reglas duras
- ServiceNow: SOLO LECTURA (jamás modificar)
- Nada hardcodeado: URLs/keys/params → Configuración o Integraciones
- Deletes: solo lógicos
- Nada de passwords/keys en código ni en git

## Configuración por campo (click derecho en el label — todo el sistema)

En cualquier formulario renderizado por el FormRenderer (builder de formularios, formulario de registro de tabla, wizard de materiales):
**click derecho sobre el label del campo → "Show config"** con tres toggles:

- **Read-only** → Regla de Formulario `accionReadOnly: readonly`
- **Mandatory** → Regla `accionObligatorio: requerir`
- **Hide** → Regla `accionVisible: ocultar`

Se guardan como `ReglaFormularioCampo` (sin condiciones = siempre), con `formulario` = clave del formulario o `tabla_<clave>` para forms de tablas custom. Las edita también el admin en `/reglas-formulario`. El hook `useReglasFormulario` expone `recargar()` para refrescar tras guardar.

## Menús contextuales de la vista lista (tablas)

- **Click derecho en header de columna**: ordenar, ocultar columna, excluir/mostrar, ⚙ Configuración de la tabla, Layout (drag&drop), Vistas, UI Actions/Client Scripts, Business Rules, UI Policies (deep-links a `/admin/tablas?abrir=<id>&tab=<tab>`)
- **Click derecho en celda**: "Excluir: <valor>" / "Mostrar solo: <valor>" (filter out / show match estilo SN)
- Filtros con debounce (400ms) — no llama API por tecla
- Lista de `materiales_registros`: SQL proyectado (solo columnas activas, `raw->>'clave'`), ILIKE para texto, exacto para choice, NOT para excluir

## Performance
- La tabla física proyecta solo columnas activas (no trae el raw completo de 293 campos)
- Paginación por usuario en `preferencias_usuario` (25/50/100/200)
