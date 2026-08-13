# 12 — Matriz de aprobadores (`u_matriz_area_aprobadores`, u_proyecto=MDM)

Extraída en vivo de `nadrocomercialdevtest` (2026-08-13, solo lectura) — 20 filas.

## Estructura de la tabla en ServiceNow

| Campo | Contenido |
|---|---|
| `u_area` / `u_label` / `u_cdr` / `u_direccion` / `u_subdireccion` | Clasificación de la fila (vacíos en devtest) |
| `u_comprador` | Referencia `sys_user` — Comprador |
| `u_negociador` | Referencia `sys_user` — Negociador |
| `u_dga` | Referencia `sys_user` — DGA |
| Otros roles | `u_kam`, `u_analista`, `u_gerente`, `u_gerente_operaciones`, `u_auxiliar_ventas`, `u_analista_cobranza`, `u_facilitador_almacen`, `u_quimico_responsable`, `u_solicitante` (vacíos en MDM) |

## Uso en el formulario Material Alta

Los campos del MRVS `vs_comprador`, `vs_negaciador`, `vs_dga` (references a `sys_user`) se llenan desde esta matriz.

## Réplica en el portal

- La matriz vive en `ConfiguracionModulo` clave **`matriz.aprobadores`** (parametrizable, aplica al momento).
- Backend: `GET/PUT /api/materiales/matriz-aprobadores` y `GET .../opciones` (listas únicas para selects).
- Frontend: menú Gestión → **"Matriz de aprobadores"** (admin) con edición en tabla; los selects del editor de materiales se alimentan de ella.
- Seed inicial: `src/routes/materiales/data/matrizAprobadores.seed.json` (20 filas con nombre + email de cada usuario).
