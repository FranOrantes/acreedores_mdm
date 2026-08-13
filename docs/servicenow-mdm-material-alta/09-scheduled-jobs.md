# 09 — Scheduled Jobs MDM (6)

Los scripts viven en `sysauto_script` (los `sys_trigger` solo programan la ejecución). Código íntegro en `scripts/scheduled_jobs/`.

| Nombre | Frecuencia | Próxima ejec. | Propósito |
|---|---|---|---|
| jj MDM Estatus RITM pendientes | Repeat | 13-08-2026 14:00 | Actualiza estatus de RITMs pendientes (217 chars) |
| jj MDM Alta sin RITM | Repeat | 13-08-2026 14:00 | Detecta/limpia altas sin RITM asociado (215 chars) |
| jj MDM Borrar Registros Vacios AprovacionMultiple | Daily | 14-08-2026 05:00 | Limpia registros vacíos de aprobación múltiple (158 chars) |
| jj MDM Borrar Random en Registros estado lectura | Daily | 14-08-2026 05:00 | Borra registros temporales ligados a `excel_id_random` en estado lectura (345 chars) |
| jj MDM cancelar por N dias | Days in Week | 14-08-2026 17:00 | Cancela solicitudes inactivas tras N días (851 chars) |
| **MDM Materiales Styrk - No SAP - SUPER API** | Repeat | 15-08-2026 22:00 | **Integración SAP** — envío masivo de materiales vía API (17.7 KB, el más grande) |

Notas:
- El job "SUPER API" es el canal de comunicación con SAP para materiales que no siguen el flujo RITM estándar (Styrk / No SAP).
- Los jobs de limpieza confirman que la carga Excel crea **registros temporales** ligados al random de 12 caracteres que luego se purgan.
