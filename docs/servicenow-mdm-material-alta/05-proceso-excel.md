# 05 — Proceso de carga Excel (layout MDM)

> **Corrección 2026-08-13:** el layout de **Alta** es el archivo KEY (`000 - JJ 001 - KEY.xlsx`): una sola hoja de datos **"Info - Correcto"** (82 columnas de negocio, datos desde la fila 5) + hojas de referencia **SN** (catálogos `mdm_*`), **Catálogos** (listas desplegables) y **Taxonomia** (jerarquía Dep→Cat→Sub). El layout de 9 hojas SAP (MARA/MARM/…) es el del **complemento (segunda fase)**, generado por `mdm_E08_excel` / `createExcelFile` en la etapa 08 — NO es el de alta.

## Layout de Alta (KEY) — hoja "Info - Correcto"

Fila 1: encabezados · Fila 3: tipos (`Texto`, `Numero`, `Numero (13)`, `Numero(Entero)`, `Numero (8)`, `Decimal`, `Select`, `Texto (Libre)`) · Datos desde la **fila 5**.

| Col | Campo | Regla (réplica lecturaExcel) |
|---|---|---|
| A | Razón Social | texto libre |
| B | RFC | requerido |
| C | Nombre completo del material | requerido |
| D | Código SKU/EAN/UPC **PI** | requerido, entero 3-16 dígitos, **único** |
| E-H | Longitud/Ancho/Altura/Peso PI | requerido, número |
| I | UNIDAD EMP | opcional, catálogo `mdm_mt_emp_unidad` |
| J | Código EAN **EMP** | opcional, entero 3-16, único |
| K-O | Piezas/dimensiones EMP | opcional, entero/número |
| P | UNIDAD SUB | opcional, catálogo `mdm_mt_sub_unidad` |
| Q | Código EAN **SUB** | **requerido si P tiene valor**, entero 3-16, único |
| R-V | Piezas/dimensiones SUB | requerido si P tiene valor |
| W | Tipo de artículo/Fracción | requerido, `mdm_mt_tipo` |
| X | Forma del producto | requerido, `mdm_mt_formula` |
| Y | Clasificación Fiscal | requerido, `mdm_mt_clasificacion_fiscal` |
| Z | Gpo Trat. Logístico | requerido, `mdm_mt_gpo_trat_logistico` |
| AA | Antibiótico | requerido, `mdm_mt_antibiotico` |
| AB | División Factura | requerido, `mdm_fac_div` |
| AC | Catálogo Anexo 20 SAT | requerido |
| AD | Forma Farmacéutica | requerido, `mdm_mt_formula_farmaceutica` |
| AE-AG | Registro Sanitario / Vigencia / Prorroga | opcional; vigencia = entero 8 dígitos (AñoMesDia) |
| AH-AV | Principio Activo 1-15 | opcional, `mdm_mt_activo` |
| AW-AY | Tipo de gramaje 1-3 | opcional, `mdm_mt_gramaje_tipo` |
| AZ-BB | Contenido gramaje 1-3 | opcional, número |
| BC | # piezas por unidad | opcional, entero |
| BD-BG | P. Farmacia / P. Público / P. Lista / P. Costo | opcional, número |
| BH | Departamento | requerido, `mdm_d_dep` |
| BI | Categoría | requerido, `mdm_d_cat` + debe pertenecer al Depto |
| BJ | Subcategoría | opcional, `mdm_d_sub` + debe pertenecer a Dep/Cat |
| BK-BM | Descripción mercadológica / Beneficios / Keywords | requerido |
| BN-CB | Campos farmacéuticos (indicación, dosis, etc.) | opcional |
| CC | Línea del proveedor | requerido, `mdm_mt_linea_del_proveedor` |
| CD | Marca del producto | requerido, `mdm_mt_marca_del_producto` |

Validación de catálogos = réplica de `buscarMDMoption`: la opción existe si `labe = valor` o `labe ENDSWITH valor`. Jerarquía Dep→Cat→Sub = réplica de `validarDepCatSub` (vía `u_mdm_options` ref01/ref02, extraído en vivo de devtest).

## Layout del complemento (fase 2, etapa 08) — 9 hojas SAP

Definido en `jj_MDM_Utils_Client.createExcelFile()` (el sistema también genera el layout descargable). Cada hoja tiene 4 filas de encabezado: `[números de columna]`, `[tabla SAP]`, `[campo SAP]`, `[etiqueta español]`. Columna A siempre = `ID_CARGA` (liga todas las hojas de un mismo material).

| # | Hoja | Tabla destino SN | Tabla SAP | Campos (orden de columnas) |
|---|---|---|---|---|
| 1 | **DatosBasicos** | `u_cmdb_mdm_datos_basicos` | MARA/MAKT | ID_CARGA, BISMT, MATNR, MTART, MBRSH, MATKL, MEINS, GROES, NTGEW, GEWEI, TEMPB, TRAGR, SPART, PRDHA, CADKZ, XCHPF, EXTWG, MSTAE, MSTAV, MSTDE, MSTDV, MHDRZ, MHDLP, NRFHG, MFRNR, IPRKZ, RDMHD, MTPOS_MARA, SLED_BBD, WHSTC, HNDLCODE, QGRP, SPRAS, MAKTX, LABOR (35 cols) |
| 2 | **UnidadesAlter** | `u_cmdb_mdm_unidadesalter` | MARM | ID_CARGA, MEINH, UMREZ, UMREN, EAN11, NUMTP, LAENG, BREIT, HOEHE, MEABM, VOLUM, VOLEH, BRGEW, GEWEI (14 cols) |
| 3 | **TaxClassif** | `u_cmdb_mdm_taxclassif` | MLAN | ID_CARGA, TAXM1, TAXM2 (3 cols) |
| 4 | **Planta** | `u_cmdb_mdm_planta` | MARC | ID_CARGA, WERKS, MMSTA, MMSTD, MAABC, EKGRP, DISMM, DISPO, PLIFZ, PERKZ, DISLS, BESKZ, SOBSL, MINBE, BSTMI, MABST, FHORI, LADGR, MTVFP, KAUTB, PRCTR, VRMOD, VINT1, VINT2, DISGR, QMATV, ABCIN, SERNP, STRGR, LGFSB, SHZET, LOGGR, VSPVB, SCM_STRA1, XCHPF (35 cols) |
| 5 | **Almacen** | `u_cmdb_mdm_almacen` | MARD | ID_CARGA, WERKS, LGORT (3 cols) |
| 6 | **Valoracion** | `u_cmdb_mdm_valoracion` | MBEW | ID_CARGA, BWKEY, BWTAR, VPRSV, BKLAS (5 cols) |
| 7 | **Ventas** | `u_cmdb_mdm_ventas` | MVKE | ID_CARGA, VKORG, VTWEG, VERSG, SKTOF, VMSTA, VMSTD, MTPOS, PRODH, KTGRM, MVGR1, MVGR2, MVGR4, MVGR5, PRAT2, PRAT6, RDPRF, MVGR3 (18 cols) |
| 8 | **Caracteristicas** | `u_cmdb_mdm_caracteristicas` | BAPI1003_KEY/AUSP | ID_CARGA, OBTAB, CLASSTYPE, CLASSNUM, ALLOC, ATNAM, ATWRT, DELETE (8 cols) |
| 9 | **Calidad** | `u_cmdb_mdm_calidad` | QMAT | ID_CARGA, ART, AKTIV, DELE (4 cols) |

## Flujo de validación (Alta)

`jj_MDM_Utils_Client.lecturaExcel()` (GlideAjax, llamado desde el client script onChange):

1. **Valida extensión** — `getExtensio()`: si no es `.XLSX` → respuesta `Error ... NoEsExcel`.
2. **Parsea** con `sn_impex.GlideExcelParser` y recorre fila por fila (`while (parser.next())`).
3. **Validaciones por celda** (helpers del propio script include):
   - `validarVacio` — campo requerido no vacío
   - `validarVacioNumero` — numérico
   - `validarVacioNumeroEntero` — entero
   - `validarVacioNumeroEnteroDigitosDos(v…, 3, 16)` — EAN: entero de **3 a 16 dígitos**
   - `validarUnicoEAN(linea, col, ean, 'PI'|'EMP')` — EAN único (no duplicado en la carga ni existente)
   - `validarVacioReferent(…, 'mdm_mt_emp_unidad' | 'mdm_mt_sub_unidad')` — valor debe existir en catálogo de unidades
   - `validarPerteneceGrupo` — consistencia de grupos
   - `validarDepCatSub` — jerarquía Departamento → Categoría → Subcategoría
   - `MKT_valida_existencia` / `MKT_valida_diplicado` — existencia y duplicados contra SAP/EAN
4. **Genera** por cada material una fila para el MRVS y la respuesta `Resultado zzRespUestazz Informacion zzRespUestazz JSON zzRespUestazz NoRegistros`.
5. Los registros quedan ligados al `excel_id_random` (job "jj MDM Borrar Random en Registros estado lectura" limpia los temporales).

## Reglas del layout

- El orden de columnas es fijo y corresponde 1:1 con el arreglo `campos` de cada hoja en `MDM_ExcelToJsonParser.parseExcel_JJ` (índice 0 = `xVaciox` dummy para alinear con Excel que inicia en 1).
- `ID_CARGA` es la llave que relaciona las 9 hojas de un mismo material.
- `MDM_ExcelToJsonParser.parseExcel_JJ(attachmentSysId, taskSysId, taskNumber, esAlta)` es el parser servidor completo (inserta en las tablas `u_cmdb_mdm_*`); `lecturaExcel` es la validación previa del portal.

## Archivos involucrados

- `scripts/script_includes/jj_MDM_Utils_Client_083c82d0.js` (431 KB — GlideAjax principal)
- `scripts/script_includes/MDM_ExcelToJsonParser_70132449.js` (parser servidor)
- `scripts/cs_onChange_-_Excel_Archivo_045b4290.js` (cliente)

## Nota 2026-08-13 — Layout oficial PROD V20

El layout vigente en producción es `Layout Alta - 2026-07-23 V20 .xlsx` (adjunto SN `9cd82109...`, enlazado desde la variable `layout_ultimo`). **Mismas 83 columnas que el KEY**, pero la hoja de datos se llama **"Materiales"** (no "Info - Correcto"). El validador acepta ambas (búsqueda tolerante + fallback a la primera hoja). El portal sirve la V20 en `GET /api/materiales/layout`.

## Clon del maintain item en el portal (Formulario `mt_alta`)

- 8 variables del item con tipos/órdenes exactos → campos del builder (`layout_ultimo`, `carga_excel` [attachment], `excel_id_random`→session, `excel_resultado`, `excel_no_de_registros`, `excel_informacion`, `archivos_resultado`, `archivos_informacion`)
- Variable set MRVS "Listado de registros" → campo `registros` tipo `registros_materiales` (mrvs config en la definición)
- 3 Catalog Client Scripts → `clientScripts` de la definición: `onChange - Excel Archivo` (onChange/carga_excel), `CheckBrowser` (onLoad), `onSubmit - Validacion` (onSubmit, con `return false` para bloquear)
- UI Policy "ReadOnly" → Reglas de Formulario (10 reglas `requerir`, módulo materiales)
- Integración Rixie (imágenes) → módulo Integraciones, colección Materiales
