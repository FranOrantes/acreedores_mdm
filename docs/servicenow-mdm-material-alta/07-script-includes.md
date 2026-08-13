# 07 — Script Includes vinculados a MDM (14)

Código íntegro en `scripts/script_includes/`.

| Nombre | Tamaño | Activo | Rol en el proceso |
|---|---|---|---|
| **jj_MDM_Utils_Client** | 431 KB | ✔ | **Núcleo GlideAjax del portal**: `lecturaExcel` (validación del layout), `createExcelFile` (genera layout/descargas), validaciones de EAN/vacíos/referencias, `recuperaComprador*`, `mdm_Ritm_*` (etapas, validación de registros, cierre paralelo), `attachmentRenombrar`, `validarExtencionIMG/PDF/Size` |
| **MDM_ExcelToJsonParser** | 30 KB | ✔ | Parser servidor: Excel → JSON/tablas `u_cmdb_mdm_*` (mapeo de las 9 hojas) |
| **MDM_Rest_Utils** | 97 KB | ✔ | Integración REST (envío/recepción SAP) |
| **MDM_BR_Code** | 13 KB | ✔ | Código compartido por Business Rules |
| **MDM_Attachment_EQVIA** | 4 KB | ✔ | Manejo de adjuntos (equivocaciones/renombrado) |
| **utilsGaMDM** | 12 KB | ✔ | Utilidades generales MDM |
| **jj_MDM_Utils** | 2 KB | ✔ | Utilidades servidor |
| **jj_MDM_Utils_Tables** | 1 KB | ✔ | Constantes/mapeo de tablas |
| **MDM_DataLake_Utils** (x2 versiones) | 13 KB | ✔ | Integración DataLake |
| **MDM_DataLake_Utils_test** | 13 KB | ✔ | Versión de pruebas del DataLake |
| **MDMProductDataDAO** | 2.5 KB | ✔ | DAO de datos de producto |
| **ActualizarProveedoresMDM** | 7 KB | ✔ | Sync de proveedores |
| **CIMDMetadataHelper** | 7.5 KB | ✔ | Metadata CIMD (sospechoso: sys_id artificial `a1b2...39ab`, revisar) |

## Funciones clave de `jj_MDM_Utils_Client` (índice)

- Excel: `lecturaExcel` (2667), `createExcelFile` (548), `mdm_E08_excel` (972), `fillExcelWithDummyData` (1034)
- Validación: `validarVacio*` (4086-4288), `validarUnicoEAN` (4467), `validarUnicosEAN` (1673), `validarDepCatSub` (4392), `MKT_valida_existencia/duplicado` (4537/4568), `validarPerteneceGrupo` (4654), `validarExtencionIMG/PDF/Size` (2578-2666)
- Etapas/aprobación: `recuperaNameEtapa` (2297), `recuperaSemaforo` (2357), `mdm_Ritm_Etapa` (4733), `mdm_Ritm_Validar_row_registro` (5010), `mdm_Ritm_Validar_normal_registro` (5659), `mdm_info_row_registro*` (4812-5010), `mdm_Ritm_Limpiar_hilos_duplicados` (5492)
- Adjuntos: `attachmentRenombrar` (6219)
- Catálogos: `buscarMDMoption*` (4344-4392), `regresaOption*` (6239-6271)

*(números = línea dentro del archivo extraído)*
