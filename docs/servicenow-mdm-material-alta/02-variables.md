# 02 — Variables del formulario

## A. Variables propias del item (8) — zona de carga Excel

| Orden | Nombre interno | Tipo | Etiqueta | Propósito |
|---|---|---|---|---|
| 50 | `layout_ultimo` | Rich Text Label | — | Texto de ayuda/layout (HTML) |
| 100 | `excel_archivo` | **Attachment** | Cargar Layout | Archivo Excel (.xlsx) a procesar |
| 150 | `excel_id_random` | Single Line Text | ID random | Llave aleatoria de 12 chars generada en cliente; liga el Excel con los registros temporales |
| 200 | `excel_resultado` | Single Line Text | Excel resultado | `Correcto` / `Error` (lo llena el GlideAjax) |
| 225 | `excel_no_de_registros` | Single Line Text | Excel No de registros | Conteo de materiales detectados en el Excel |
| 250 | `excel_informacion` | Multi Line Text | Excel Informacion | Bitácora de validación del Excel (errores por línea/columna) |
| 300 | `archivos_resultado` | Single Line Text | Archivos resultado | `Correcto` / `Error` de la validación de adjuntos |
| 350 | `archivos_informacion` | Multi Line Text | Archivos Informacion | Detalle de materiales con archivos obligatorios faltantes |

## B. Variable set "Listado de registros" (MRVS) — 37 variables

sys_id set: `f1d3e5381b758a10a9f8766dcc4bcbfb` · tipo **Multi Row** · cada fila = **un material**.
Nombre interno del MRVS en cliente: `vs_listado_de_registros`.

### Encabezado del registro

| Orden | Nombre | Tipo | Etiqueta |
|---|---|---|---|
| 10 | `Instrucciones` | Rich Text Label | — |
| 11 | `vs_nombre_completo_del_material` | Single Line Text | Nombre completo del material |

### Archivos complementarios (documentos)

| Orden | Nombre | Tipo | Etiqueta | Obligatorio* |
|---|---|---|---|---|
| 400 | `vs_archivos` | Label | Archivos complementarios | — |
| 410 | `vs_registro_sanitario` | Attachment | Registro Sanitario | No |
| 420 | `vs_prorroga` | Attachment | Prorroga | No |
| 430 | `vs_hoja_de_seguridad` | Attachment | Hoja de seguridad | No |
| 440 | `vs_oficio_de_clasificacion` | Attachment | Oficio de clasificación | No |
| 450 | `vs_aviso_de_funcionamiento` | Attachment | Aviso de funcionamiento | No |
| 460 | `vs_carta_de_presentacion_documento` | Attachment | Carta de presentación/Documento | **Sí** |
| 470 | `vs_lista_de_precios` | Attachment | Lista de precios | **Sí** |
| 490 | `vs_marbete_empaque_artes_de_producto` | Attachment | Marbete/Empaque/Artes de Producto | **Sí** |
| 500 | `vs_ficha_tecnica` | Attachment | Ficha técnica | **Sí** |

### Planos de foto — imágenes por unidad de producto

Tres bloques: **PI** (unidad), **EMP** (empaque), **SUB** (sub-empaque). Cada bloque: 1 campo ID + 5 imágenes.

| Bloque | Campo ID | Imágenes |
|---|---|---|
| PI | `vs_unidad_del_producto_id_pi` (order 3100) | `vs_pi_img_01` Frente* · `vs_pi_img_02` Trasera* · `vs_pi_img_03` Lateral* · `vs_pi_img_04` Opcional 1 · `vs_pi_img_05` Opcional 2 |
| EMP | `vs_unidad_del_producto_id_emp` (3400) | `vs_emp_img_01..05` (mismo patrón, sin obligatoriedad en validación de submit) |
| SUB | `vs_unidad_del_producto_id_sub` (3700) | `vs_sub_img_01..05` (idem) |

Breaks: `formatter` (3000) y `formatter2` (6000) separan secciones; label `planos_de_foto` (3025) y `contacto` (6010).

### Contacto

| Orden | Nombre | Tipo | Etiqueta | Referencia |
|---|---|---|---|---|
| 6030 | `vs_comprador` | Reference | Comprador | `sys_user` |
| 6040 | `vs_negaciador` | Reference | Negociador | `sys_user` |
| 6050 | `vs_dga` | Reference | DGA | `sys_user` |

\* Obligatoriedad validada en el client script `onSubmit - Validacion` (PI Frente/Trasera/Lateral, Carta de presentación, Lista de precios, Marbete, Ficha técnica). La UI Policy "ReadOnly" marca además como `mandatory` varios de estos campos en modo lectura (ver [03-reglas-visuales.md](03-reglas-visuales.md)).
