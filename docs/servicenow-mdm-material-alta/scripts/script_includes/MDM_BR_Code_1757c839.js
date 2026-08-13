// Script Include: MDM_BR_Code
// sys_id: 1757c8399398ee106af0b6cd1dba10ab | activo: true | updated: 04-02-2026 14:40:24
// description: MDM

var MDM_BR_Code = Class.create();
var respuestaSAP;
MDM_BR_Code.prototype = {
    initialize: function() {},
    getEmailGrupal: function(varGrupoID) {
        var respUsers = '',
            iCont = 1;
        var gr02 = new GlideRecord('sys_user_grmember');
        gr02.addEncodedQuery('group=' + varGrupoID);
        gr02.query();
        while (gr02.next()) {
            respUsers += (iCont == 1) ? '' : ',';
            respUsers += gr02.user.email.toString();
            iCont++;
        }
        // gs.log(respUsers, msgLog);
        return respUsers;
    },
    attachmentRenombrar: function(nID, nNombre, nExtencion) {
        // console.log('Ser 100 nID: ' + nID + ' - ' + nNombre + ' - ' + nExtencion);
        var gr02 = new GlideRecord('sys_attachment');
        gr02.addEncodedQuery('sys_id=' + nID);
        gr02.query();
        if (gr02.next()) {
            gr02.file_name = nNombre + nExtencion;
            gr02.update();
        }
        return nID;
    },
    cambio_a_sap: function(varRitmID, msgLog02) {
        //Codigo de cambio normal
        //Copia datos de la solicitud hacia el Material (MDM Registros)
        gs.log('Entro', msgLog02);
        gs.log("RITM: " + varRitmID, msgLog02); // sysid RITM

        var gr00 = new GlideRecord('sc_task');
        gr00.addEncodedQuery('request_item=' + varRitmID + '^u_mdm_etapa=6');
        gr00.query();
        if (gr00.next()) {

            // CODE Ikaros
            var sysid = gr00.sys_id.toString();
            var respSAP = new MDM_Rest_Utils().getDatos_mod(sysid, 'C');

            respuestaSAP = (respSAP == 'Mensaje enviado correctamente a PO') ? true : false;

            this.respuestaSAP_cambio(respSAP, msgLog02);
        }
    },
    cambio_fix: function(varRitmID, msgLog02) {
        //Ejecutar desde fix script, para arreglar solicitudes abiertas
        //Copia datos de la solicitud hacia el Material (MDM Registros)
        msgLog02 += '_fixMod';

        gs.log('Entro', msgLog02);
        gs.log("RITM: " + varRitmID, msgLog02); // sysid RITM

        var gr00 = new GlideRecord('sc_task');
        gr00.addEncodedQuery('request_item=' + varRitmID + '^u_mdm_etapa=6');
        gr00.query();
        if (gr00.next()) {
            respuestaSAP = true;
            this.respuestaSAP_cambio(varRitmID, msgLog02);
        }
    },
    respuestaSAP_cambio: function(varRitmID, msgLog02) {
        var gr01,
            gr02,
            numMtr01,
            numMtr02,
            respuestaFinal = '',
            varIDTempNew,
            eanPI,
            eanEMP,
            eanSUB,
            varEmail = 'jj@gmail.com';

        gr02 = new GlideRecord('u_mdm_registros');
        gr02.addEncodedQuery('u_ritm=' + varRitmID);
        gr02.query();
        if (gr02.next()) {
            var str = (gr02.u_mt_sap_no_envios.toString() == '') ? 0 : parseInt(gr02.u_mt_sap_no_envios.toString());
            str = str + 1;
            gr02.u_mt_sap_no_envios = str.toString();
            gr02.update();
        }

        if (respuestaSAP) {

            respuestaFinal = 'Respuesta_Positivo_cambio';
            gr01 = new GlideRecord('sc_req_item');
            gr01.addEncodedQuery('sys_id=' + varRitmID);
            gr01.query();
            if (gr01.next()) {

                gr01.state = 3; // Closed Complete
                gr01.u_mdm_resultado = respuestaFinal;
                varEmail = gr01.opened_by.email.toString();
                gr01.update();

                numMtr01 = gr01.u_mdm_material.toString();
                numMtr02 = gr01.u_mdm_material_cambio.toString();

                // ========================================================================================================
                var varCampo,
                    fields = [],
                    numF = 0,
                    numReg = 0,
                    varIdNew,
                    strTable01 = 'u_mdm_registros',
                    varId01 = numMtr02, // Cambio
                    strTable02 = 'u_mdm_registros',
                    varId02 = numMtr01, // Alta
                    aOmitirCampos = [
                        'sys_id',
                        'u_mt_estatus',
                        'u_mt_estatus_cambio',
                        'u_ritm',
                        'u_mt_etapa_actual',
                        'u_mtr_cambio_pendiente',
                        'u_mtr_cambio_material_origen',
                        'u_mtr_cambio_material_cambio',
                        'u_mtr_etapa07',
                        'u_mt_valido_error',
                        'u_mt_observacion_temp',
                        'u_mt_tipo_de_solicitud',
                        'sys_created_on',
                        'sys_created_by',
                        'u_mt_movimiento_sn'
                    ];

                // gs.print(' ---------------------------------------------------------------- ');
                // gs.print('Lectura de campos strTable01');
                var grCheck = new GlideRecord('sys_dictionary');
                grCheck.addEncodedQuery('name=' + strTable01 + '^element!=NULL');
                grCheck.query();
                // gs.print("Numero de campos: " + grCheck.getRowCount()); // Contador	
                while (grCheck.next()) {
                    varCampo = grCheck.element;
                    fields[numF] = varCampo.toString();
                    numF++;
                }
                // gs.print('Nombre de campos: ' + fields);
                // gs.print('');
                // gs.print(' ---------------------------------------------------------------- ');
                // gs.print('Duplica registro varId01 a varId02');

                // Table 01
                var gr001 = new GlideRecord(strTable01);
                gr001.addEncodedQuery('sys_id=' + varId01);
                gr001.query();
                while (gr001.next()) {
                    numReg++;
                    // gs.print("u_mt_nombre : " + gr001.u_mt_nombre);

                    // Table 02
                    var gr002 = new GlideRecord(strTable02);
                    gr002.addEncodedQuery('sys_id=' + varId02);
                    gr002.query();
                    if (gr002.next()) {
                        for (var i = 0; i < fields.length; i++) {
                            varCampo = fields[i];
                            // Validar que no este en los campos a omitir
                            if (aOmitirCampos.indexOf(varCampo) < 0) {
                                gr002[varCampo] = gr001[varCampo];
                                // gr002.<field name> = gr001.<field name>;
                                // gs.print(varCampo + ": "+gr001[varCampo]);
                            }
                        }
                        gr002.u_mt_valido_error = (gr001.u_mt_valido_error.toString() == '') ? gr002.u_mt_valido_error : gr002.u_mt_valido_error + '\n' + gr001.u_mt_valido_error;
                        gr002.u_mtr_cambio_pendiente = '';
                        gr002.u_cambio_material_cambio = '';

                        if (gr001.u_mt_estatus_cambio == '7b3c36d11b185210a9f8766dcc4bcb19') {
                            gr002.u_mt_estatus = 'Activo';
                        } else if (gr001.u_mt_estatus_cambio == 'fd4413591b985210a9f8766dcc4bcba3') {
                            // gr002.u_mt_estatus = 'Cambio';
                            // gr002.u_mt_estatus = gr001.u_mt_estatus;
                        } else if (gr001.u_mt_estatus_cambio == '2161c7d91b185210a9f8766dcc4bcb61') {
                            gr002.u_mt_estatus = 'Inactivo';
                        }
                        gr002.update();
                    }

                }
                // gs.print('Registros update: ' + numReg);
                // gs.print('');
                // ========================================================================================================

                gr02 = new GlideRecord('u_mdm_registros');
                gr02.addEncodedQuery('u_ritm=' + varRitmID);
                gr02.query();
                if (gr02.next()) {
                    gr02.u_mt_estatus = 'Aprobado';
                    gr02.update();

                    eanPI = gr02.u_mt_pi_ean;
                    eanEMP = gr02.u_mt_emp_ean;
                    eanSUB = gr02.u_mt_sub_ean;

                    gr02 = new GlideRecord('u_mdm_registros');
                    gr02.addEncodedQuery('sys_id=' + numMtr01);
                    gr02.query();
                    if (gr02.next()) {
                        varIDTempNew = eanPI;
                        this.attachmentRenombrar(gr02.u_mt_img_pi_01, varIDTempNew + '_01', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_pi_02, varIDTempNew + '_02', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_pi_03, varIDTempNew + '_03', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_pi_04, varIDTempNew + '_04', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_pi_05, varIDTempNew + '_05', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_a_lista_de_precios, varIDTempNew + '_Lista_de_precios', '');
                        this.attachmentRenombrar(gr02.u_mt_a_ficha_tecnica, varIDTempNew + '_Ficha_tecnica', '');
                        this.attachmentRenombrar(gr02.u_mt_a_registro_sanitario, varIDTempNew + '_Registro_sanitario', '');
                        this.attachmentRenombrar(gr02.u_mt_a_prorroga, varIDTempNew + '_Prorroga', '');
                        this.attachmentRenombrar(gr02.u_mt_a_hoja_seguridad, varIDTempNew + '_Hoja_de_seguridad', '');
                        this.attachmentRenombrar(gr02.u_mt_a_oficio_de_clasificacion, varIDTempNew + '_Oficio_de_clasificacion', '');
                        this.attachmentRenombrar(gr02.u_mt_a_aviso_de_funcionamiento, varIDTempNew + '_Aviso_de_funcionamiento', '');
                        this.attachmentRenombrar(gr02.u_mt_a_carta_presentacion_documento, varIDTempNew + '_Carta_presentacion_documento', '');
                        this.attachmentRenombrar(gr02.u_mt_a_marbete_empaque_artes_producto, varIDTempNew + '_Marbete_empaque_artes_producto', '');
                        varIDTempNew = eanEMP;
                        this.attachmentRenombrar(gr02.u_mt_img_emp_01, varIDTempNew + '_01', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_emp_02, varIDTempNew + '_02', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_emp_03, varIDTempNew + '_03', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_emp_04, varIDTempNew + '_04', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_emp_05, varIDTempNew + '_05', '.jpg');
                        varIDTempNew = eanSUB;
                        this.attachmentRenombrar(gr02.u_mt_img_sub_01, varIDTempNew + '_01', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_sub_02, varIDTempNew + '_02', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_sub_03, varIDTempNew + '_03', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_sub_04, varIDTempNew + '_04', '.jpg');
                        this.attachmentRenombrar(gr02.u_mt_img_sub_05, varIDTempNew + '_05', '.jpg');
                        // gr02.update();
                    }

                }

            }


        } else {

            respuestaFinal = 'Respuesta_Negativa_cambio';
            gr01 = new GlideRecord('sc_req_item');
            gr01.addEncodedQuery('sys_id=' + varRitmID);
            gr01.query();
            if (gr01.next()) {
                gr01.state = 1; // Open
                gr01.u_mdm_resultado = respuestaFinal;
                // varEmail = gr01.opened_by.email.toString();
                varEmail = getEmailGrupal('9b08ff94971b4650cc1ebbdfe153afbc'); // MDM_07_Analista Sr
                gr01.update();
            }


            gr02 = new GlideRecord('sc_task');
            gr02.addEncodedQuery('request_item=' + varRitmID + '^u_mdm_etapa=1');
            gr02.query();
            if (gr02.next()) {
                gr02.state = 1; // Open
                gr02.update();
            }

            gr01 = new GlideRecord('sc_req_item');
            gr01.addEncodedQuery('sys_id=' + varRitmID);
            gr01.query();
            if (gr01.next()) {
                gr01.state = 1; // Open
                gr01.u_mdm_resultado = '';
                gr01.update();
            }

        }

        gr00 = new GlideRecord('sc_task');
        gr00.addEncodedQuery('request_item=' + varRitmID + '^u_mdm_etapa=1');
        gr00.query();
        if (gr00.next()) {
            // gs.log('varEmail: ' + varEmail, msgLog02);
            gs.eventQueue('mdm.mt.task.estatus', gr00, varEmail, '');
            // gs.eventQueue("<event_name>", object, parm1, parm2);

            // gs.log(respuestaFinal + ' - ' + varRitmID, msgLog02);
        }
    },
    type: 'MDM_BR_Code'
};