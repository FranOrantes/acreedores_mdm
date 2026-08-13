# 06 — Workflow: MDM mtr Alta v2.0

| Campo | Valor |
|---|---|
| sys_id workflow | `255aedcc97c2ee10cc1ebbdfe153af91` |
| Tabla | `sc_req_item` (RITM) |
| Versión publicada | `18f5ab412b1b3ed0677df2f9ed91bf9d` (v2.0, publicada 25-02-2026) |
| Versiones históricas | 14 (v2.0, v2.1 borradores) — ver `data/wf_versions.json` |

## Etapas de aprobación (Catalog Tasks)

| Etapa | Nombre tarea | Rol aprobador |
|---|---|---|
| 00 | Inicio | Tarea padre inicial |
| 01 | Comprador | Comprador (`vs_comprador`) |
| 02 | Asuntos regulatorios | Asuntos Regulatorios |
| 03 | Mercadotecnia | Mercadotecnia |
| 04 | Jefe de Costos | Costos |
| 05 | Negociador | Negociador (`vs_negaciador`) |
| 06 | DGA | DGA (`vs_dga`) |
| 07 | Maestro de Artículos | Maestro de Artículos |
| 08 | Maestro de Materiales | Maestro de Materiales |

## Actividades del workflow publicado (25)

| Actividad | Tipo |
|---|---|
| Begin / End | Inicio y fin |
| 00 - Inicio, 01 - Comprador, 02 - Asuntos regulatorios, 03 - Mercadotecnia, 04 - Jefe de Costos, 05 - Negociador, 06 - DGA, 07 - Maestro de Artículos, 08 - Maestro de Materiales | Catalog Task |
| EtapaN | Switch (enrutado por etapa) |
| Respuesta SAP / SAP respuesta | Wait for condition / Switch |
| Esta OPEN ? | Wait for condition |
| Close task en paralelo? | Wait for condition (cierre de tareas paralelas) |
| Notificacion (x2) | Run Script |
| Notificacion Cancelada | Run Script |
| Enviar notificacion | Set Values |
| Limpiar hilos duplicados (x2) | Run Script |
| Correo de errores SAP | Run Script |
| Terminar padre | Run Script |
| Rechazo 4 ejecuciones | If (rechaza tras 4 ciclos) |

Datos crudos en `data/wf_activities.json` (25 registros).

## Comportamiento clave

- Las tareas se crean por etapa; existen reglas de **paralelismo** ("Close task en paralelo?") y de **limpieza de hilos duplicados**.
- Tras las etapas de captura/validación hay **espera de respuesta SAP** ("Respuesta SAP") — el envío lo hacen los Business Rules async `jj MDM mt - RITM EnvioSAP Alta/Cambio` (ver [08-business-rules.md](08-business-rules.md)) y el job "MDM Materiales Styrk - No SAP - SUPER API".
- Si SAP responde error → "Correo de errores SAP".
- Si se cancela → "Notificacion Cancelada".
- Rechazo automático después de **4 ejecuciones** ("Rechazo 4 ejecuciones").
