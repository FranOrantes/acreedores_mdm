# 04 — Catalog Client Scripts (3)

Código íntegro en `scripts/cs_*.js`.

## 1. `onChange - Excel Archivo` — `scripts/cs_onChange_-_Excel_Archivo_045b4290.js`

- **Tipo:** onChange sobre `excel_archivo` · global=true · sys_id `045b42901b298610a9f8766dcc4bcb9e`
- **Qué hace:**
  1. Si es carga inicial o valor vacío → sale.
  2. Resetea todos los campos de estado (`excel_id_random`, `excel_resultado`, `excel_informacion`, `excel_no_de_registros`, `vs_listado_de_registros`, `archivos_informacion`) y oculta `archivos_informacion`.
  3. Genera un **random de 12 caracteres** (`crearRandom()`) — llave de la carga.
  4. **GlideAjax** a `jj_MDM_Utils_Client.lecturaExcel` con parámetros: `sysparm_vUser` (userID), `sysparm_vTipoSolicitud='Alta'`, `sysparm_sysid` (sys_id del attachment temporal), `sysparm_numRandom`.
  5. Procesa la respuesta separada por el delimitador **`zzRespUestazz`**:
     - `[0]` → `excel_resultado` (`Correcto`/`Error`)
     - `[1]` → si es `NoEsExcel`: alert "Favor de subir un archivo con extensión .XLSX"; si no → `excel_informacion`
     - `[2]` → JSON de filas → llena el MRVS `vs_listado_de_registros`
     - `[3]` → `excel_no_de_registros`

## 2. `onSubmit - Validacion` — `scripts/cs_onSubmit_-_Validacion_1c90bca4.js`

- **Tipo:** onSubmit · sys_id `1c90bca41b790a10a9f8766dcc4bcbbf`
- **Regla 1:** si `excel_resultado != 'Correcto'` → bloquea submit:
  - vacío → alert "Favor de cargar layout de materiales."
  - con error → alert "Es necesario corregir el archivo excel con respecto a los comentarios del campo Excel Informacion."
- **Regla 2 (conteo):** compara `excel_no_de_registros` contra el número de filas del MRVS `vs_listado_de_registros`. Si difieren → `archivos_resultado=Error`, mensaje "Los registros mostrados no coinciden con el excel", submit bloqueado.
- **Regla 3 (archivos obligatorios por material):** para cada fila del MRVS exige:
  - `vs_pi_img_01` (PI - Frente)
  - `vs_pi_img_02` (PI - Trasera)
  - `vs_pi_img_03` (PI - Lateral)
  - `vs_carta_de_presentacion_documento`
  - `vs_lista_de_precios`
  - `vs_marbete_empaque_artes_de_producto`
  - `vs_ficha_tecnica`
  - Faltantes → lista "Materiales con archivos pendientes" en `archivos_informacion` + alert, submit bloqueado.
- Si todo pasa → `archivos_resultado='Correcto'`, mensaje "Materiales con todos los archivos obligatorios cargados.", submit permitido.

## 3. `CheckBrowser` — `scripts/cs_CheckBrowser_c7ddff67.js`

- **Tipo:** onLoad · sys_id `c7ddff67...`
- Detecta `navigator.userAgent` y bloquea/redirige (`reedirectChrome`) en:
  - Internet Explorer (`MSIE`, `Trident/`)
  - Edge Legacy (`Edge/`) y Edge Chromium (`Edg/`)
- Mensaje: *"es posible que la solicitud no sea creada de manera adecuada, favor de utiliza Google Chrome, Firefox, Opera"*.
