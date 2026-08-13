// Scheduled Job (sysauto_script): jj MDM Borrar Random en Registros estado lectura
// sys_id: 7618938e1be14e10a9f8766dcc4bcb8c | active: true

// Limpia tabla "MDM Registros" 

var delectGlobal = new jj_MDM_Utils().borrarRegistrosEnLectura();
var delectTables = new x_nsadc_tables.jj_MDM_Utils_Tables().borrarRegistrosEnLectura();
 
// Sin log

/* 	
	if( u_mt_id_random != NULL )
		if( u_mt_estatus == 'Lectura' )
			deleteRecord();
		else
			u_mt_id_random = '';
           	update();
*/