# Documentación ServiceNow — Catalog Item "Material Alta" (MDM)

> Extracción **SOLO LECTURA** realizada el 2026-08-13 contra `nadrocomercialprod.service-now.com` (PROD).
> Item: **Material Alta** — `sc_cat_item` sys_id `96f6425c1be58610a9f8766dcc4bcbab`
> URL: https://nadrocomercialprod.service-now.com/sp?id=sc_cat_item&sys_id=96f6425c1be58610a9f8766dcc4bcbab
> No se realizó NINGUNA modificación en ServiceNow.

## Índice

| Doc | Contenido |
|---|---|
| [01-catalog-item.md](01-catalog-item.md) | Ficha del catalog item y estructura general |
| [02-variables.md](02-variables.md) | Las 8 variables del item + 37 del variable set (MRVS) |
| [03-reglas-visuales.md](03-reglas-visuales.md) | UI Policy "ReadOnly" y sus 12 acciones (reglas visuales) |
| [04-client-scripts.md](04-client-scripts.md) | Los 3 Catalog Client Scripts (onChange Excel, onSubmit, CheckBrowser) |
| [05-proceso-excel.md](05-proceso-excel.md) | Proceso de carga Excel: layout de 9 hojas, validaciones, flujo |
| [06-workflow.md](06-workflow.md) | Workflow "MDM mtr Alta v2.0": 8 etapas de aprobación, 25 actividades |
| [07-script-includes.md](07-script-includes.md) | 14 Script Includes vinculados a MDM |
| [08-business-rules.md](08-business-rules.md) | 24 Business Rules MDM (sc_task, sc_req_item, u_mdm_registros) |
| [09-scheduled-jobs.md](09-scheduled-jobs.md) | 6 Scheduled Jobs MDM |
| [10-imagenes-adjuntos.md](10-imagenes-adjuntos.md) | Carga de imágenes por material (PI/EMP/SUB) y adjuntos |

## Carpetas

- `scripts/` — código fuente íntegro extraído (client scripts, script includes, scheduled jobs)
- `data/` — volcados JSON crudos de la API (para consulta de cualquier campo no documentado)

## Resumen ejecutivo

El formulario "Material Alta" es un alta masiva de materiales vía **layout Excel** (9 hojas SAP: MARA, MARM, MLAN, MARC, MARD, MBEW, MVKE, BAPI1003, QMAT). Flujo:

1. El usuario descarga el layout, lo llena y lo sube (variable `excel_archivo`).
2. Un client script `onChange` llama vía GlideAjax a `jj_MDM_Utils_Client.lecturaExcel`, que parsea y valida TODO el Excel (tipos, vacíos, EANs únicos de 3-16 dígitos, referencias a catálogos, jerarquía Dep→Cat→Sub).
3. Si el Excel es válido, cada fila se convierte en un registro del **variable set multi-row (MRVS) "Listado de registros"**, donde por cada material se capturan **imágenes** (PI/EMP/SUB: frente, trasera, lateral, 2 opcionales) y **documentos** (registro sanitario, ficha técnica, etc.).
4. Al enviar, `onSubmit - Validacion` verifica que el número de registros del MRVS coincida con el Excel y que cada material tenga sus **archivos obligatorios** (PI Frente/Trasera/Lateral, Carta de presentación, Lista de precios, Marbete, Ficha técnica).
5. El workflow **MDM mtr Alta v2.0** lanza 8 etapas de aprobación (Comprador → Mercadotecnia → Asuntos Regulatorios → Jefe de Costos → Negociador → DGA → Maestro de Artículos → Maestro de Materiales) con tareas de catálogo, esperas, envío a SAP (BR async "EnvioSAP") y notificaciones.
