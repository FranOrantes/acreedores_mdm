// Script Include: jj_MDM_Utils_Tables
// sys_id: f6ed8d1c2bd9f650677df2f9ed91bfa7 | activo: true | updated: 26-02-2026 20:56:19
// description: MDM

var jj_MDM_Utils_Tables = Class.create();
jj_MDM_Utils_Tables.prototype = {
    initialize: function() {},

    borrarRegistrosEnLectura: function() {

        var gr03,
            gr04,
            varQuery;

        // Limpiar "MDM Material Cambio MKT"

        varQuery = 'u_mkt_ritm=NULL^u_mkt_estatus=Lectura';
        gr03 = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
        gr03.addEncodedQuery(varQuery);
        gr03.query();
        new global.ResultadosAPIs().info('MDM', 'Limpieza_MKT', 'Eliminados por estatus "Lectura": ' + gr03.getRowCount());
        gr03.deleteMultiple();

		varQuery = 'u_mkt_ritm!=NULL^u_mkt_random!=NULL';
        gr04 = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
        gr04.addEncodedQuery(varQuery);
        gr04.query();
		gr04.u_mkt_random = '';
        new global.ResultadosAPIs().info('MDM', 'Limpieza_MKT', 'Update random difernete a "NULL": ' + gr04.getRowCount());
        gr04.updateMultiple();



    },







    type: 'jj_MDM_Utils_Tables'
};