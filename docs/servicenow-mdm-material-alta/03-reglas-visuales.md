# 03 — Reglas visuales (UI Policies)

## UI Policy: "ReadOnly"

| Campo | Valor |
|---|---|
| sys_id | `ceeda37c977d4e10cc1ebbdfe153af95` |
| Ámbito | Variable set "Listado de registros" (`variable_set` = f1d3e538…) |
| Activa | true |
| Condiciones | *(vacía — siempre aplica cuando la policy se evalúa)* |
| script_true / script_false | funciones `onCondition()` vacías (todo se hace vía acciones) |
| `run_scripts` / `isolate_script` | configuración por defecto de catálogo |

### Acciones (12) — `catalog_ui_policy_action`

Todas dejan el campo **visible = true** y **disabled = true** (solo lectura). La obligatoriedad (`mandatory`) marca visualmente cuáles deben llenarse al capturar:

| Variable | Visible | Mandatory | Disabled (readonly) |
|---|---|---|---|
| `vs_comprador` | ✔ | **true** | ✔ |
| `vs_unidad_del_producto_id_pi` | ✔ | **true** | ✔ |
| `vs_unidad_del_producto_id_emp` | ✔ | false | ✔ |
| `vs_unidad_del_producto_id_sub` | ✔ | false | ✔ |
| `vs_nombre_completo_del_material` | ✔ | **true** | ✔ |
| `vs_carta_de_presentacion_documento` | ✔ | **true** | ✔ |
| `vs_lista_de_precios` | ✔ | **true** | ✔ |
| `vs_marbete_empaque_artes_de_producto` | ✔ | **true** | ✔ |
| `vs_ficha_tecnica` | ✔ | **true** | ✔ |
| `vs_pi_img_01` (PI Frente) | ✔ | **true** | ✔ |
| `vs_pi_img_02` (PI Trasera) | ✔ | **true** | ✔ |
| `vs_pi_img_03` (PI Lateral) | ✔ | **true** | ✔ |

> No hay UI policies a nivel item (`catalog_item`) — la consulta devolvió 0. Toda la lógica visual adicional (ocultar/mostrar `archivos_informacion`, etc.) se hace en los client scripts.

## Reglas visuales implementadas en client scripts (complemento)

| Regla | Script | Detalle |
|---|---|---|
| Limpiar estado al recargar Excel | onChange Excel | Resetea `excel_id_random`, `excel_resultado`, `excel_informacion`, `excel_no_de_registros`, `vs_listado_de_registros`, `archivos_informacion` |
| Ocultar `archivos_informacion` | onChange Excel | `g_form.setVisible('archivos_informacion', false)` al cambiar archivo |
| Mostrar `archivos_informacion` | onSubmit | `g_form.setDisplay('archivos_informacion', true)` cuando Excel = Correcto |
| Alertas de validación | onSubmit | Alerts de layout faltante / errores / archivos obligatorios |
| Bloqueo por navegador | onLoad CheckBrowser | Redirige si IE o Edge (mensaje: usar Chrome, Firefox u Opera) |
