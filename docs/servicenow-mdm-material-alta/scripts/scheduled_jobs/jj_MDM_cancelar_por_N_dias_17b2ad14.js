// Scheduled Job (sysauto_script): jj MDM cancelar por N dias
// sys_id: 17b2ad14973b0290cc1ebbdfe153afde | active: true

// Cancelar RITM sin movimientos en "N" dias MDM_Materiales
// var varCancelacionLista = new jj_MDM_Utils_Client().jobTaskLimpiarRegPre();

var msgJobs = 'JJ_Job_MDM_N_dias_01',
    varMSG = '',
    varEstatus = '';

var gr001 = new GlideRecord('u_mdm_options');
gr001.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_estatus');
gr001.query();
if (gr001.next()) {
    varEstatus = gr001.u_value;
    if (varEstatus == 'Postergar') {
        gr001.u_value = 'Activo';
        gr001.update();
        varMSG = 'De estatus "Postergar" a "Activo".';
    } else {
        // Si esta "Activo"
        varMSG = 'Estatus "Activo" limpiar RITMs';
		var varNotificacionEjecuta = new jj_MDM_Utils_Client().jobTaskLimpiarRegCancela();
    }
} else {
    varMSG = 'No se encontro estatus en tabla "u_mdm_options".';
}

gs.log(varMSG, msgJobs);