# 11 — Integración de validación de imágenes "Rixie" (Concordia)

## REST Message

| Campo | Valor |
|---|---|
| Nombre | **MDM Imagen Rixie** |
| Función | `ImagenValida` |
| Endpoint | `POST https://concordia.nadro.dev/api/validate` |
| Autenticación | Header **`X-API-Key`** (definido en la función `ImagenValida`; el padre dice "No authentication" pero la función sí lleva la key) |
| Content-Type | application/json |

> La API key vive en el `.env` del backend como `RIXIE_API_KEY` (nunca en código ni en este repo).

## Request

```json
{
  "image": "<base64 del adjunto>",
  "mimetype": "image/jpeg",
  "filename": "foto.jpg",
  "position": "frontal"
}
```

## Response

```json
{
  "message": "La imagen no cumple con todos los requisitos técnicos.",
  "resultado": false,
  "validation_details": [
    {
      "Formato": "true / El formato es image/png",
      "Extensión": "true / Extensión .png permitida",
      "Tamaño": "true / 1.8 KB (rango: 1–10240 KB)",
      "Integridad": "true / La imagen no está corrupta",
      "Metadatos": "true / Metadatos válidos — ...",
      "Dimensiones": "true / Las dimensiones son 512×512",
      "Fondo": "true / 100% de los bordes son blancos/transparentes"
    }
  ]
}
```

Verificado en vivo (2026-08-13): la API valida **7 checks** (Formato, Extensión, Tamaño, Integridad, Metadatos, Dimensiones, Fondo) y devuelve HTTP 500 cuando falla — ServiceNow lee el body igual. Si la imagen pasa los checks técnicos pero falla la clasificación, la API agrega `"Error General": "...400"` y `message: "Ocurrió un error inesperado en el servidor."` — ojo: la lógica de SN interpreta ese caso como **"Correcto"** (quirk replicado fielmente en el portal).

## Lógica en ServiceNow (`jj_MDM_Utils_Client.rixie_Imagen`)

1. Recibe `sysparm_ArchivoID` (sys_id del attachment).
2. Convierte el adjunto a Base64 (`GlideSysAttachment.getBytes` + `GlideStringUtil.base64Encode`).
3. Llama al REST Message `MDM Imagen Rixie / ImagenValida`.
4. Interpreta la respuesta:
   - `message != "La imagen no cumple con todos los requisitos técnicos."` → **"Correcto"**
   - Si no → **"Error imagen no cumple con los requisitos:"** + lista SOLO las validaciones en `false` (Formato, Tamaño, Dimensiones, Fondo).
5. Logs bajo el tag `rixie_IMG`.

## Réplica en el portal

- Backend: `POST /api/materiales/validar-imagen` (`src/routes/materiales/validarImagen.js`) — recibe el id del adjunto (temporal o definitivo), lo reenvía a Concordia con el mismo payload y devuelve `{ resultado, detalles }`.
- Frontend: `AdjuntoInput` valida automáticamente cada imagen (PI/EMP/SUB) al subirla y muestra ✓ o los requisitos fallidos.

## Reglas de negocio del portal (scriptRespuesta de la integración, 2026-08-14)

Sobre la respuesta técnica de Concordia, el portal aplica (editables en Integraciones → Rixie → scriptRespuesta):

| Regla | Detalle |
|---|---|
| **Fondo** | Concordia exige 90% bordes blancos; el negocio acepta **≥ 80%** (sombras/color con fondo mayormente blanco OK) |
| **Formato** | Solo **JPG/JPEG** (PNG y demás → Error aunque Concordia los acepte) |
| **Tamaño** | Máx **256 KB** |
| **Dimensiones** | Deben ser **cuadradas** (ancho = alto) |

Verificado con el pack de pruebas (Excel Alta - Imagenes.rar): **14/14 casos** coinciden con lo esperado (v01-v13).
