// Scheduled Job (sysauto_script): jj MDM Alta sin RITM
// sys_id: b5b1fc172bc17250677df2f9ed91bf9c | active: true

// Validar RITM de Alta Material en estatus Pendiente y validar que campo MDM Registro -> Valido = "Corregir"

var varLimpiarAltasSinRITM = new jj_MDM_Utils_Client().jobTRitmSinAlta();

// JJ_job_MDM_AltaSinRITM_001