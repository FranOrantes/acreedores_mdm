// Script Include: jj_MDM_Utils
// sys_id: 99c81b8e1be14e10a9f8766dcc4bcb80 | activo: true | updated: 14-11-2025 14:44:33
// description: MDM

var jj_MDM_Utils = Class.create();
jj_MDM_Utils.prototype = {
    initialize: function() {},

    borrarRegistrosEnLectura: function() {

        var gr01,
            gr02,
            gr03,
            varQuery,
            varRespuesta,
            varTota = 0,
            varTotalEmiminados = 0,
            varTotaClean = 0;

        // varQuery = 'u_id_random!=NULL^u_ritm=NULL';
        varQuery = 'u_mt_id_random!=NULL';

        gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery(varQuery);
        gr01.query();
        while (gr01.next()) {
            varTota++;
            if (gr01.u_mt_estatus.toString() == 'Lectura') {
                gr01.deleteRecord();
                varTotalEmiminados++;
            } else {
                gr01.u_mt_id_random = '';
                gr01.update();
                varTotaClean++;
            }
        }
        gs.log('varTotal: ' + varTota + '\nvarTotalEliminados: ' + varTotalEmiminados + '\nvarTotaClean: ' + varTotaClean, 'jj_Limpieza_Rand_MDM');

        // Limpiar registros basura
        gr02 = new GlideRecord('u_mdm_registros');
        gr02.addEncodedQuery('u_mt_tipo_de_solicitud=NULL^ORu_mt_estatus=NULL');
        gr02.query();
        gr02.deleteMultiple();

        // varQuery = 'u_mkt_ritm=NULL';
        // // Limpiar "MDM Material Cambio MKT"
        // gr03 = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
        // gr03.addEncodedQuery(varQuery);
        // gr03.query();
        // while (gr03.next()) {
        //     if (gr03.u_mkt_estatus.toString() == 'Lectura') {
        //         gr03.deleteRecord();
        //         gs.log('Borrar ' + gr03.u_mkt_numero_de_material, 'jj_Limpieza_Rand_MDM');
        //     } else {
        //         gr03.u_mkt_random = '';
        //         gr03.update();
        //         gs.log('Update ' + gr03.u_mkt_numero_de_material, 'jj_Limpieza_Rand_MDM');
        //     }
        // }

    },


    borrarRegistrosVaciosAprovMultiple: function() {

        // Limpiar registros basura
        var gr13 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr13.addEncodedQuery('u_ritm=NULL');
        gr13.query();
        gr13.deleteMultiple();

        gs.log('TotalEliminados: ' + gr13.getRowCount(), 'jj_Limpieza_AprovMultiple_MDM');

    },





    type: 'jj_MDM_Utils'
};