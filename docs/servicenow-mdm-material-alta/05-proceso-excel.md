# 05 — Proceso de carga Excel (layout MDM)

## Layout del archivo (9 hojas)

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
