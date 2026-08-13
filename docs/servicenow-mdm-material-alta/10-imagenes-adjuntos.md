# 10 — Carga de imágenes y adjuntos por material

## Imágenes por material ("Planos de Foto")

Cada fila del MRVS (cada material) captura imágenes en **3 unidades de producto**, cada una con su campo ID y 5 slots de imagen (Attachment):

| Unidad | Campo ID (texto) | Imágenes |
|---|---|---|
| **PI** — Unidad del producto | `vs_unidad_del_producto_id_pi` (obligatorio) | Frente*, Trasera*, Lateral*, Opcional 1, Opcional 2 |
| **EMP** — Empaque | `vs_unidad_del_producto_id_emp` | Frente, Trasera, Lateral, Opcional 1, Opcional 2 |
| **SUB** — Sub-empaque | `vs_unidad_del_producto_id_sub` | Frente, Trasera, Lateral, Opcional 1, Opcional 2 |

\* Obligatorias según validación `onSubmit` y UI Policy (solo PI exige Frente/Trasera/Lateral).

En el "listado de registros" (MRVS) las imágenes se ven como miniaturas por material — de ahí la "carga de imágenes por cada material" del listado.

## Documentos por material ("Archivos complementarios")

| Documento | Variable | Obligatorio |
|---|---|---|
| Registro Sanitario | `vs_registro_sanitario` | No |
| Prorroga | `vs_prorroga` | No |
| Hoja de seguridad | `vs_hoja_de_seguridad` | No |
| Oficio de clasificación | `vs_oficio_de_clasificacion` | No |
| Aviso de funcionamiento | `vs_aviso_de_funcionamiento` | No |
| Carta de presentación/Documento | `vs_carta_de_presentacion_documento` | **Sí** |
| Lista de precios | `vs_lista_de_precios` | **Sí** |
| Marbete/Empaque/Artes de Producto | `vs_marbete_empaque_artes_de_producto` | **Sí** |
| Ficha técnica | `vs_ficha_tecnica` | **Sí** |

## Validaciones de archivos (servidor)

En `jj_MDM_Utils_Client`:
- `validarExtencionIMG` (línea 2607) — solo extensiones de imagen permitidas
- `validarExtencionPDF` (2619) — solo PDF donde aplique
- `validarExtencionSize` (2578) — tamaño máximo
- `attachmentRenombrar` (6219) — renombra adjuntos con ID/EAN del material (ej. `Hoja_de_seguridad`)
- BR "MDM Proveedores - Renombra adjuntos" (sc_req_item, after) hace lo propio a nivel RITM
