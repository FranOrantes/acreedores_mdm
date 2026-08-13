# 08 — Business Rules MDM (24)

Datos crudos en `data/business_rules.json`. Solo lectura; ninguno fue modificado.

## Sobre `sc_req_item` (RITM)

| Nombre | Cuándo | Activo | Propósito |
|---|---|---|---|
| jj MDM mt - RITM new 00 Padre Alta | after | ✔ | Inicializa la etapa 00 del alta |
| jj MDM mt - RITM EnvioSAP Alta | async | ✔ | **Envío a SAP en altas** |
| jj MDM mt - RITM EnvioSAP Cambio | async | ✔ | Envío a SAP en cambios |
| jj MDM mt - RITM EnvioSAP Cambio MKT | async | ✖ | (inactivo) |
| jj MDM mt - RITM EnvioSAP Cambio IMG off | async | ✖ | (inactivo) |
| jj MDM mt - RITM new Cambio MKT | after | ✔ | Nuevo cambio MKT |
| jj MDM mt - RITM Closed Incomplete A/C | after | ✔ | Manejo de cierre incompleto (Alta/Cambio) |
| jj MDM mt - Registros Update EtapaCambio | before | ✔ | Actualiza etapas en cambio |
| MDM Proveedores - Renombra adjuntos | after | ✔ | Renombra adjuntos con ID/EAN |

## Sobre `sc_task` (tareas de catálogo)

| Nombre | Cuándo | Activo | Propósito |
|---|---|---|---|
| jj MDM mt - Task OPEN | before | ✔ | Al abrir tarea |
| jj MDM mt - Task N Hijos Alta New | after | ✔ | Hijos etapa New (alta) |
| jj MDM mt - Task N Hijos Alta Open | after | ✔ | Hijos etapa Open (alta) |
| jj MDM mt - Task N Hijos Cambio New | after | ✔ | Hijos etapa New (cambio) |
| jj MDM mt - Task Open/Closed Cambio MKT | async | ✔ | Cambio MKT open/closed |
| jj MDM mt - Task Update Etapa08 Asig | before | ✔ | Asignación etapa 08 |
| jj MDM mt - Task E08 XLSXchange | before | ✔ | Genera Excel en etapa 08 |
| jj MDM mt - Task Historico Update | before | ✔ | Bitácora/histórico |

## Sobre tablas custom MDM

| Nombre | Tabla | Cuándo | Activo | Propósito |
|---|---|---|---|---|
| jj MDM mt - Registros Update EtapasAlta | `u_mdm_registros` | after | ✔ | Avance de etapas del alta |
| jj MDM mt - Reg Aprobacion | `u_mdm_registros_aprobaciones` | after | ✔ | Registro de aprobaciones |
| CopiarMaterial-Anterior v2 | `u_cmdb_mdm_datos_basicos` | before | ✔ | Copia datos de material anterior |
| RechazarSinMaterial | `u_cmdb_mdm_datos_basicos` | before | ✔ | Rechaza si no hay material |
| MDM DISMM X0 / ND / ChkValues | `u_cmdb_mdm_planta` | before | ✖ (3 inactivos) | Validaciones de planta DISMM |
