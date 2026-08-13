# 01 — Catalog Item: Material Alta

| Campo | Valor |
|---|---|
| sys_id | `96f6425c1be58610a9f8766dcc4bcbab` |
| Nombre | **Material Alta** |
| Descripción corta | MDM Material Alta |
| Categoría | Datos Maestros (`sc_category` 79cdf4501b9aca90a9f8766dcc4bcbae) |
| Workflow | **MDM mtr Alta v2.0** (`wf_workflow` 255aedcc97c2ee10cc1ebbdfe153af91), tabla `sc_req_item` |
| Activo | true |
| Método de solicitud | Submit |
| Tiempo de entrega | 2 días |
| Visible en bundle / guía | true / true |
| Sin carrito / sin cantidad | false / false |
| Creado | 09-04-2024 · Última act. 23-07-2026 |

## Estructura del formulario

El formulario se compone de:

1. **8 variables propias del item** — encabezado de la solicitud + zona de carga Excel (ver [02-variables.md](02-variables.md)).
2. **1 variable set multi-row (MRVS)** llamado **"Listado de registros"** (`item_option_new_set` f1d3e5381b758a10a9f8766dcc4bcbfb, `type = Multi Row`, order 500) con **37 variables internas** — una fila del MRVS = un material.
3. **3 Catalog Client Scripts** globales del item (ver [04-client-scripts.md](04-client-scripts.md)).
4. **1 UI Policy** a nivel variable set: **"ReadOnly"** (ver [03-reglas-visuales.md](03-reglas-visuales.md)).

## Flujo de captura (resumen)

```
Descargar layout → llenar Excel → subir excel_archivo
  → onChange llama GlideAjax jj_MDM_Utils_Client.lecturaExcel
  → respuesta: Resultado zzRespUestazz Info zzRespUestazz JSON_MRVS zzRespUestazz NoRegistros
  → si Correcto: se llena el MRVS vs_listado_de_registros con los materiales
  → por cada material (fila MRVS): imágenes PI/EMP/SUB + documentos
  → onSubmit valida conteo y obligatorios → Submit
  → Workflow MDM mtr Alta v2.0 (8 etapas) → envío a SAP
```
