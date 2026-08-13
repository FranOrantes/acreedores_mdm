// Scheduled Job (sysauto_script): jj MDM Estatus RITM pendientes
// sys_id: 5f27d7aa2b683650677df2f9ed91bf5a | active: true

// Validar RITM de Alta Material en estatus Pendiente y validar que campo MDM Registro -> Valido = "Corregir"

var varLimpiarEnProcesos = new jj_MDM_Utils_Client().jobTRitmPendienteS();

// JJ_job_MDM_RegPending_001

