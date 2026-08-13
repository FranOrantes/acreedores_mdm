// Script Include: jj_MDM_Utils_Client
// sys_id: 083c82d01b298610a9f8766dcc4bcb52 | activo: true | updated: 04-08-2026 14:01:59
// description: MDM

var msgLog = 'MDM_018',
    msgLogDGA = '',
    eTempError,
    eTempMsg,
    eTempUnicoEs,
    eMsgError,
    // Llenar variables. Solo TEST ************************************************************************
    vLlenarVariablesTest = false,
    numRandom,
    vTempMsg,
    vTempMsgTemp,
    vTempLimpio,
    variableSetListado,
    variableSetName,
    // validarUnicosEAN,
    variableSetEanIP,
    variableSetEanEMP,
    variableSetEanSUB,
    globalNewEtapaRow = 111,
    globalNewEtapaRowActual = 111,
    mdmRegresar = 'Normal',
    varIDTemp,
    varIDTempNew,
    opcionEAN,
    fields = [], // Para el diccionario 
    aListaCamposEAN = [],
    aListaCamposSAP = [],
    numUbicacion00 = 0,
    numUbicacion01 = 0,
    numUbicacion02 = 0,
    // SECUENCIA DEL PROCESO ************************************************************************
    globalFechaInicioParalelo = '2025-08-30';























var jj_MDM_Utils_Client = Class.create();
jj_MDM_Utils_Client.prototype = Object.extendsObject(AbstractAjaxProcessor, {














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    modificar_NegCompDgaProv: function(vMtr, vEAN, vCompr, vProve, vUser, vModulo) {

        msgLog = 'MDM_reasignar_001';
        // gs.log('000 ', msgLog);
        var gr000,
            gr001,
            gr005,
            asig_mtr_comprador,
            asig_mtr_negociador,
            asig_mtr_dga,
            tempRITM,
            tempTipo,
            tempQuery02,
            numTask = 0;

        if (vMtr != '') {
            tempQuery01 = 'sys_id=' + vCompr;
            tempQuery02 = 'sys_id=' + vMtr;
        } else {
            tempQuery01 = 'u_proyecto=MDM^u_comprador=' + vCompr;
            tempQuery02 = 'u_mt_pi_ean=' + vEAN + '^u_mt_estatus!=Rechazado^u_mt_estatus!=Lectura';
        }
        // gs.log('000 \n\n'+tempQuery01+'\n\n'+tempQuery02+'\n\n', msgLog);

        gr005 = new GlideRecord('u_matriz_area_aprobadores');
        gr005.addEncodedQuery(tempQuery01);
        gr005.query();
        if (gr005.next()) {
            asig_mtr_comprador = gr005.u_comprador;
            asig_mtr_negociador = gr005.u_negociador;
            asig_mtr_dga = gr005.u_dga;
        }

        gr001 = new GlideRecord('u_mdm_registros');
        gr001.addEncodedQuery(tempQuery02);
        gr001.query();
        while (gr001.next()) {
            gr001.u_mt_comprador = asig_mtr_comprador;
            gr001.u_mt_negaciador = asig_mtr_negociador;
            gr001.u_mt_dga = asig_mtr_dga;
            if (vProve != '')
                gr001.u_mt_proveedor = vProve;
            gr001.u_mt_historico = 'Reasignado por ' + vUser + ' (' + vModulo + ')';
            gr001.update();

            tempRITM = gr001.u_ritm.toString();
            tempTipo = gr001.u_mt_tipo_de_solicitud.toString();

            if (tempRITM != '') {

                var gr000 = new GlideRecord('sc_task');
                gr000.addEncodedQuery('request_item=' + tempRITM);
                gr000.query();
                while (gr000.next()) {
                    // Material Alta
                    if (tempTipo == 'Alta') {
                        if (gr000.u_mdm_etapa == 1) {
                            gr000.assigned_to = asig_mtr_comprador;
                            gr000.update();
                            numTask++;
                        }
                        if (gr000.u_mdm_etapa == 5) {
                            gr000.assigned_to = asig_mtr_negociador;
                            gr000.update();
                            numTask++;
                        }
                        if (gr000.u_mdm_etapa == 6) {
                            gr000.assigned_to = asig_mtr_dga;
                            gr000.update();
                            numTask++;
                        }
                    }
                    // Material Cambio
                    if (tempTipo == 'Cambio') {
                        if (gr000.u_mdm_etapa == 1) {
                            gr000.assigned_to = asig_mtr_comprador;
                            gr000.update();
                            numTask++;
                        }
                    }
                }

            }

        }
        return numTask;
    },

    // ==============================================================================================================================















    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    cancela_RITM_MDM_Material: function(ritm_ID, varRechadoPor, varRechadoMotivo) {

        msgLog = 'MDM_cancela_RITM_001';
        // gs.log('000 ', msgLog);

        var grNew00,
            grTask,
            grMtr,
            grMtrReg,
            newRitmNum = '';
        var varRechadoCuando = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes 

        grNew00 = new GlideRecord('sc_req_item');
        grNew00.addEncodedQuery('sys_id=' + ritm_ID);
        grNew00.query();
        if (grNew00.next()) {
            newRitmNum = grNew00.number.toString();
            grNew00.state = 4; // Closed Incomplete
            grNew00.u_mdm_rechazado_por = varRechadoPor;
            grNew00.u_mdm_rechazado_motivo = varRechadoMotivo;
            grNew00.u_mdm_rechazado_cuando = varRechadoCuando;
            grNew00.setWorkflow(false);

            grTask = new GlideRecord('sc_task');
            grTask.addEncodedQuery('request_item=' + ritm_ID + '^state!=3');
            grTask.query();
            while (grTask.next()) {
                grTask.state = 4; // Closed Incomplete
                grTask.setWorkflow(false);
                grTask.update();
            }

            if (grNew00.cat_item == '96f6425c1be58610a9f8766dcc4bcbab') { // Material Alta

                grMtr = new GlideRecord('u_mdm_registros');
                grMtr.addEncodedQuery('sys_id=' + grNew00.u_mdm_material);
                grMtr.query();
                if (grMtr.next()) {
                    grMtr.u_mt_estatus = 'Rechazado';
                    grMtr.u_mt_motivo_de_rechazo_por = varRechadoPor;
                    grMtr.u_mt_motivo_de_rechazo = varRechadoMotivo;
                    grMtr.u_mt_motivo_de_rechazo_fecha = varRechadoCuando;
                    grMtr.update();
                }
                grMtrReg = new GlideRecord('u_mdm_registros_aprobaciones');
                grMtrReg.addEncodedQuery('u_ritm=' + ritm_ID + '^u_ejecuciones_no=' + grNew00.u_mdm_ejecuciones_no + '^u_fecha=NULL');
                grMtrReg.query();
                while (grMtrReg.next()) {
                    grMtrReg.u_estatus = 'Cancelado';
                    grMtrReg.u_motivo = varRechadoMotivo;
                    grMtrReg.u_fecha = varRechadoCuando;
                    grMtrReg.update();
                }

            }

            if (grNew00.cat_item == 'ac6f02961bbf8210a9f8766dcc4bcbc1') { // Material Cambio

                grMtr = new GlideRecord('u_mdm_registros');
                grMtr.addEncodedQuery('sys_id=' + grNew00.u_mdm_material);
                grMtr.query();
                if (grMtr.next()) {
                    grMtr.u_mtr_cambio_pendiente = '';
                    grMtr.update();
                }

                grMtr = new GlideRecord('u_mdm_registros');
                grMtr.addEncodedQuery('sys_id=' + grNew00.u_mdm_material_cambio);
                grMtr.query();
                if (grMtr.next()) {
                    grMtr.u_mt_estatus = 'Rechazado';
                    grMtr.u_mt_motivo_de_rechazo = varRechadoMotivo;
                    grMtr.u_mt_motivo_de_rechazo_por = varRechadoPor;
                    grMtr.u_mt_motivo_de_rechazo_fecha = varRechadoCuando;
                    grMtr.update();
                }
            }

            if (grNew00.cat_item == 'fa1c86963b880710a4187124c3e45a0c') { // Material Cambio IMG

                grMtr = new GlideRecord('u_mdm_registros');
                grMtr.addEncodedQuery('sys_id=' + grNew00.u_mdm_material_cambio);
                grMtr.query();
                if (grMtr.next()) {
                    grMtr.u_mt_estatus = 'Rechazado';
                    grMtr.u_mt_motivo_de_rechazo = varRechadoMotivo;
                    grMtr.u_mt_motivo_de_rechazo_por = varRechadoPor;
                    grMtr.u_mt_motivo_de_rechazo_fecha = varRechadoCuando;
                    grMtr.update();
                }
            }

            grNew00.update();
        }

        return newRitmNum;
    },

    // ==============================================================================================================================















    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    recuperaInfoRITM: function() {

        msgLog = 'MDM_Info_RITM_001';
        // gs.log('000 ', msgLog);
        var respuesta = '',
            var_id_ritm = this.getParameter('parm_RitmID');

        gr00 = new GlideRecord('sc_req_item');
        gr00.addEncodedQuery('sys_id=' + var_id_ritm);
        gr00.query();
        gr00.next();
        respuesta += gr00.sys_id.toString() + 'zzZzz';
        respuesta += gr00.cat_item.toString() + 'zzZzz';
        respuesta += gr00.state.toString() + 'zzZzz';
        respuesta += gr00.u_mdm_etapa.toString() + 'zzZzz';
        respuesta += gr00.u_mdm_enviado_sap_no.toString() + 'zzZzz';
        respuesta += gr00.short_description.toString() + 'zzZzz';

        return respuesta;
    },

    // ==============================================================================================================================















    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    recuperaComprador: function() {
        msgLog = 'JJ_005';
        // gs.log('Entro', msgLog);	
        var iUno = 1,
            varQueryGr = '',
            filtro = '';

        // -----------------------------------------------------------------------------------------------------------------
        /*
        // IMPORTANNTE: ACTUALIZAR LOS MIEMBROS DEL LOS GRUPOS CUANDO ENTREN MAS Negociadores y DGAs
        // Client Script "jj_MDM_Utils_Client"
        // Widget "MDM - Alta de proveedor"

        aNeg = [
            'b3466307977a0e10cc1ebbdfe153afb3', // Grupo "Compradores Jr 920704" 	NADIA ALEXANDRA BUENO MENDEZ	
            '3ca567c3977a0e10cc1ebbdfe153af45', // Grupo "Compradores Jr 892315"	VERONICA ZAVALA JIMENEZ
            '8735ebc3977a0e10cc1ebbdfe153af73', // Grupo "Compradores Jr 891275"	SHEILA BARRIOS LORENZO
            '58e44b4f97b60e10cc1ebbdfe153af89', // Grupo "Compradores Jr 133157"	PABLO BECERRA GODOY
            'd1a0d4d497fe0210cc1ebbdfe153af0a' // Grupo "Compradores Jr 21071"		JUAN LUIS TORAL ALDACO
        ];
        aBga = [
            '04628acd970b4610cc1ebbdfe153af3a', // Grupo "Aprobador DG Proveedores 136473"	PABLO ESCANDON MATARAZZO	
            '08d0028d970b4610cc1ebbdfe153af6c' // Grupo "Aprobador DG Proveedores 48249"	FERNANDO TORRES SUAREZ	
        ];
        varQueryGr += 'group=b3466307977a0e10cc1ebbdfe153afb3^OR'; // Grupo "Compradores Jr 920704s"
        varQueryGr += 'group=3ca567c3977a0e10cc1ebbdfe153af45^OR'; // Grupo "Compradores Jr 892315"
        varQueryGr += 'group=8735ebc3977a0e10cc1ebbdfe153af73^OR'; // Grupo "Compradores Jr 891275"
        varQueryGr += 'group=58e44b4f97b60e10cc1ebbdfe153af89^OR'; // Grupo "Compradores Jr 133157"
        varQueryGr += 'group=d1a0d4d497fe0210cc1ebbdfe153af0a'; // Grupo "Compradores Jr 21071"
        var gr01 = new GlideRecord('sys_user_grmember');
		 gr01.addEncodedQuery(varQueryGr);
        gr01.query();
        while (gr01.next()) {
            filtro += (iUno == 1) ? '' : '^OR';
            filtro += 'sys_id=' + gr01.user;
            iUno = 2;
        }
        // gs.log(filtro, msgLog);
        return filtro;
		*/
        // -----------------------------------------------------------------------------------------------------------------

        varQueryGr = 'u_proyecto=MDM';
        var gr01 = new GlideRecord('u_matriz_area_aprobadores');
        gr01.addEncodedQuery(varQueryGr);
        gr01.query();
        while (gr01.next()) {
            filtro += (iUno == 1) ? '' : '^OR';
            filtro += 'sys_id=' + gr01.u_comprador;
            iUno = 2;
        }
        // gs.log(filtro, msgLog);
        return filtro;
    },

    // ==============================================================================================================================

    recuperaCompradorInfo: function() {
        msgLog = 'JJ_005';
        // gs.log('Entro', msgLog);
        var msgRespuesta = '',
            sys_id = this.getParameter('sysparm_CompradorID');

        var gr01 = new GlideRecord('u_matriz_area_aprobadores');
        gr01.addEncodedQuery('u_proyecto=MDM^u_comprador=' + sys_id);
        gr01.query();
        if (gr01.next()) {
            msgRespuesta = gr01.u_negociador + 'zzRespUestazz' + gr01.u_dga;
        }
        // gs.log(msgRespuesta);
        return msgRespuesta;
    },

    // ==============================================================================================================================

    recuperaCompradorInfoFO: function() {
        msgLog = 'JJ_005';
        // gs.log('Entro', msgLog);
        var msgRespuesta = '',
            sys_id = this.getParameter('sysparm_CompradorID');

        var gr01 = new GlideRecord('u_matriz_area_aprobadores');
        gr01.addEncodedQuery('u_proyecto=FOCD^u_comprador=' + sys_id);
        gr01.query();
        gs.log("Encoded query  " + gr01.getEncodedQuery());
        if (gr01.next()) {
            msgRespuesta = gr01.u_negociador;
        }
        gs.log("response" + msgRespuesta, "focd11_comprador");
        return msgRespuesta;
    },

    // ==============================================================================================================================









    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    createExcelFile: function() {

        msgLog = 'MDM_Excel_007';
        // gs.log('000 ', msgLog);

        var json = new JSON();
        var obj01 = {},
            i01,
            gr01,
            vTemp,
            tempCargaID,
            v1,
            v2,
            v3,
            v4,
            logEAN,
            logEANtipo,
            aTemp01 = [],
            aTemp02 = [],
            vQuery = '',
            vTipoSolicitud = this.getParameter('parm_tipo_solicitud'),
            vRegMDM = this.getParameter('parm_mdm_registro_id');

        if (vTipoSolicitud == 'Alta') {
            vQuery = 'u_mt_tipo_de_solicitud=Alta';
            vQuery += '^u_mt_etapa_actual=8';
            vQuery += '^u_mt_estatus=En Proceso';
            // vQuery += '^sys_id=' + vRegMDM;
        } else {
            vQuery = 'u_mt_tipo_de_solicitud=Cambio';
            vQuery += '^u_mt_etapa_actual=6';
            vQuery += '^u_mt_estatus=En Proceso';
            vQuery += '^u_mtr_cambio_material_origen!=441ae9871bfd9610a9f8766dcc4bcbc3'; // Modificacion sin flujo MM
            // vQuery += '^sys_id=' + vRegMDM;
        }


        // Llenar JSON con objetos
        obj01.hoja01 = [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "15", "14", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"],
            ["", "", "", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MARA", "MAKT", "MAKT", "MARA"],
            ["ID_CARGA", "BISMT", "MATNR", "MTART", "MBRSH", "MATKL", "MEINS", "GROES", "NTGEW", "GEWEI", "TEMPB", "TRAGR", "SPART", "PRDHA", "CADKZ", "XCHPF", "EXTWG", "MSTAE", "MSTAV", "MSTDE", "MSTDV", "MHDRZ", "MHDLP", "NRFHG", "MFRNR", "IPRKZ", "RDMHD", "MTPOS_MARA", "SLED_BBD", "WHSTC", "HNDLCODE", "QGRP", "SPRAS", "MAKTX", "LABOR"],
            ["", "NºMat Ant.", "Material", "TpMat", "Ramo", "Gpo.artíc.", "Unidad", "Tamaño", "Neto", "Unidad", "Cond-temp", "GrTransp.", "Sector", "Jquía.productos", "Ind.CAD", "SujetLote", "GrpArtExt", "StatusMat", "Status", "Válido de", "Validez de", "TmpoHastaCaduc", "DurTotalConserv", "SusBonifEs", "Fabricante", "Ind.período", "Regla redondeo", "GrPosGral", "FeCad/FeEx", "Cond.almacenam.", "Ind.manipul.", "Gr.ctrl.calidad", "Idioma", "Denomin.", "Labor oficina"]
        ];

        obj01.hoja02 = [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
            ["", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM", "MARM"],
            ["ID_CARGA", "MEINH", "UMREZ", "UMREN", "EAN11", "NUMTP", "LAENG", "BREIT", "HOEHE", "MEABM", "VOLUM", "VOLEH", "BRGEW", "GEWEI"],
            ["", "UM alt.", "Contador", "Denominador", "Código EAN/UPC", "Tipo EAN", "Longitud", "Ancho", "Altura", "Unidad", "Volumen", "Unidad volumen", "Peso bruto", "Unidad de peso"]
        ];

        gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery(vQuery);
        gr01.orderBy('u_mt_no_materia');
        gr01.orderBy('u_mt_no_material_anterior');
        gr01.query();
        i01 = 0;
        while (gr01.next()) {

            i01++;
            tempCargaID = (vTipoSolicitud == 'Alta') ? i01 : gr01.u_mt_no_materia.toString();

            aTemp01 = [];
            aTemp01.push(tempCargaID); // 01 - ID_CARGA
            aTemp01.push(gr01.u_mt_no_material_anterior.toString()); // 02 - No. Material Ant.
            aTemp01.push(gr01.u_mt_no_materia.toString()); // 03 - No. Material
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_tpmaterial_ref).toString()); // 04 - TpMat
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_ramo_ref).toString()); // 05 - Ramo
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_tipo).toString()); // 06 - Gpo.artíc.
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_pi_unidad).toString()); // 07 - Unidad
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_formula).toString()); // 08 - Tamaño
            aTemp01.push(gr01.u_mt_pi_pesos_gr.toString()); // 09 - Neto       
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 10 - Unidad02
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_condicion_de_temperatura).toString()); // 11 - Cond-temp
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_grtransp_ref).toString()); // 12 - GrTransp.
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_sector_ref).toString()); // 13 - Sector
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_jerarquia_de_productos).toString()); // 15 - Jquía.productos
            aTemp01.push(''); // 14 - Ind.CAD
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_sujeto_a_lote).toString()); // 16 - SujetLote
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_linea_del_proveedor).toString()); // 17 - GrpArtExt
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_statusmat_ref).toString()); // 18 - StatusMat
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_status_ref).toString()); // 19 - Status
            vTemp = gr01.u_mt_valido_de.toString();
            vTemp = (gr01.u_mt_valido_de.toString()) ? vTemp.substring(8, 10) + vTemp.substring(5, 7) + vTemp.substring(0, 4) : '';
            aTemp01.push(vTemp); // 20 - Válido de
            vTemp = gr01.u_mt_validez_de.toString();
            vTemp = (gr01.u_mt_validez_de.toString()) ? vTemp.substring(8, 10) + vTemp.substring(5, 7) + vTemp.substring(0, 4) : '';
            aTemp01.push(vTemp); // 21 - Validez de
            aTemp01.push(gr01.u_mt_tmpohastacaduc.toString()); // 22 - TmpoHastaCaduc
            aTemp01.push(gr01.u_mt_durtotalconserv.toString()); // 23 - DurTotalConserv
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_susbonifes_ref).toString()); // 24 - SusBonifEs
            aTemp01.push(gr01.u_mt_fabricante.toString()); // 25 - Fabricante
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_ind_periodo_ref).toString()); // 26 - Ind.período 
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_regla_redondeo_ref).toString()); // 27 - Regla redondeo
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_grposgral_ref).toString()); // 28 - GrPosGral
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_fecad_feex_ref).toString()); // 29 - FeCad/FeEx
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_cond_almacenamiento_ref).toString()); // 30 - Cond.almacenam.
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_indicador_manipulacion).toString()); // 31 - Ind.manipul.
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_grupo_control_calidad).toString()); // 32 - Gr.ctrl.calidad
            aTemp01.push(this.regresaOptionValueXLS(gr01.u_mt_idioma_ref).toString()); // 33 - Idioma
            aTemp01.push(gr01.u_mt_denomin.toString()); // 34 - Denomin.
            // aTemp01.push(gr01.u_mt_nombre.toString());
            // aTemp01.push(gr01.u_ritm.getDisplayValue().toString());
            obj01.hoja01.push(aTemp01);



            if (gr01.u_mt_pi_piezas != '') { // u_mt_pi_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_pi_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_pi_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_pi_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_pi_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_pi_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_pi_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_pi_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_pi_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pi_longitud_cm.toString());
                v2 = (gr01.u_mt_pi_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pi_ancho_cm.toString());
                v3 = (gr01.u_mt_pi_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pi_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_pi_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_emp_piezas != '') { // u_mt_emp_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_emp_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_emp_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_emp_ean.toString()); // 05 - Código EAN/UPC                
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_emp_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_emp_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_emp_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_emp_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_emp_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_emp_longitud_cm.toString());
                v2 = (gr01.u_mt_emp_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_emp_ancho_cm.toString());
                v3 = (gr01.u_mt_emp_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_emp_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_emp_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_sub_piezas != '') { // u_mt_sub_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_sub_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_sub_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_sub_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_sub_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_sub_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_sub_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_sub_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_sub_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_sub_longitud_cm.toString());
                v2 = (gr01.u_mt_sub_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_sub_ancho_cm.toString());
                v3 = (gr01.u_mt_sub_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_sub_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_sub_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_bto_piezas != '') { // u_mt_bto_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_bto_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_bto_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_bto_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_bto_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_bto_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_bto_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_bto_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_bto_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_bto_longitud_cm.toString());
                v2 = (gr01.u_mt_bto_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_bto_ancho_cm.toString());
                v3 = (gr01.u_mt_bto_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_bto_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_bto_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_pal_piezas != '') { // u_mt_pal_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_pal_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_pal_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_pal_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_pal_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_pal_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_pal_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_pal_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_pal_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pal_longitud_cm.toString());
                v2 = (gr01.u_mt_pal_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pal_ancho_cm.toString());
                v3 = (gr01.u_mt_pal_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pal_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_pal_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_zca_piezas != '') { // u_mt_zca_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_zca_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_zca_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_zca_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_zca_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_zca_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_zca_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_zca_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_zca_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_zca_longitud_cm.toString());
                v2 = (gr01.u_mt_zca_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_zca_ancho_cm.toString());
                v3 = (gr01.u_mt_zca_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_zca_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_zca_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_pa1_piezas != '') { // u_mt_pa1_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_pa1_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_pa1_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_pa1_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_pa1_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_pa1_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_pa1_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_pa1_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_pa1_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pa1_longitud_cm.toString());
                v2 = (gr01.u_mt_pa1_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pa1_ancho_cm.toString());
                v3 = (gr01.u_mt_pa1_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_pa1_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_pa1_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
            if (gr01.u_mt_ze1_piezas != '') { // u_mt_ze1_ean
                aTemp02 = [];
                aTemp02.push(tempCargaID); // 01 - ID_CARGA
                aTemp02.push(gr01.u_mt_ze1_unidad_id.toString()); // 02 - UM alt.
                aTemp02.push(gr01.u_mt_ze1_piezas.toString()); // 03 - Contador
                aTemp02.push('1'); // 04 - Denominador
                aTemp02.push(gr01.u_mt_ze1_ean.toString()); // 05 - Código EAN/UPC
                logEANtipo = this.createExcelFile_logEAN(gr01.u_mt_ze1_ean.toString().length);
                aTemp02.push(logEANtipo); // 06 - Tipo EAN
                aTemp02.push(gr01.u_mt_ze1_longitud_cm.toString()); // 07 - Longitud
                aTemp02.push(gr01.u_mt_ze1_ancho_cm.toString()); // 08 - Ancho
                aTemp02.push(gr01.u_mt_ze1_altura_cm.toString()); // 09 - Altura
                aTemp02.push('CM'); // 10 - Unidad
                v1 = (gr01.u_mt_ze1_longitud_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_ze1_longitud_cm.toString());
                v2 = (gr01.u_mt_ze1_ancho_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_ze1_ancho_cm.toString());
                v3 = (gr01.u_mt_ze1_altura_cm.toString() == '') ? 0 : parseFloat(gr01.u_mt_ze1_altura_cm.toString());
                v4 = v1 * v2 * v3;
                aTemp02.push(v4); // 11 - Volumen
                aTemp02.push('CM3'); // 12 - Unidad volumen
                aTemp02.push(gr01.u_mt_ze1_pesos_gr.toString()); // 13 - Peso bruto
                aTemp02.push(this.regresaOptionValueXLS(gr01.u_mt_2_unidad).toString()); // 14 - Unidad de peso
                obj01.hoja02.push(aTemp02);
            }
        }



        obj01.hoja03 = [
            ["1", "2", "3"],
            ["", "mlan", "mlan"],
            ["ID_CARGA", "taxm1", "taxm2"],
            ["", "Clasific.fiscal", "Clasific.fiscal"]
        ]

        obj01.hoja04 = [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"],
            ["", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARC", "MARA"],
            ["ID_CARGA", "WERKS", "MMSTA", "MMSTD", "MAABC", "EKGRP", "DISMM", "DISPO", "PLIFZ", "PERKZ", "DISLS", "BESKZ", "SOBSL", "MINBE", "BSTMI", "MABST", "FHORI", "LADGR", "MTVFP", "KAUTB", "PRCTR", "VRMOD", "VINT1", "VINT2", "DISGR", "QMATV", "ABCIN", "SERNP", "STRGR", "LGFSB", "SHZET", "LOGGR", "VSPVB", "SCM_STRA1", "XCHPF"],
            ["", "Centro", "StatusMat", "Válido de", "ABC", "Gr.compras", "Caract.", "Plan.nec.", "PlazoEntr", "Ind-period", "Tam.lote", "ClAprov", "ClAprovEsp", "Pto.pedido", "TamLoteMín", "StockMáx", "Cv-horiz.", "GrupoCarga", "VerifDisp", "InPedAut", "CeBe", "ModComp", "CompAtrás", "CompAdel.", "GrPlanNec", "ParamInsp", "InvCícl", "Perfil", "GrupoEstrategs.", "Alm.Apr.Ex", "MargenSeg.", "GrTratLog", "ASP prop.", "Estrategia nec.", "SujetLote Centro"]
        ]

        obj01.hoja05 = [
            ["1", "2", "3"],
            ["", "MARD", "MARD"],
            ["ID_CARGA", "WERKS", "LGORT"],
            ["", "Centro", "Almacén"]
        ]

        obj01.hoja06 = [
            ["1", "2", "3", "4", "5"],
            ["", "MBEW", "MBEW", "MBEW", "MBEW"],
            ["ID_CARGA", "BWKEY", "BWTAR", "VPRSV", "BKLAS"],
            ["", "", "", "", ""]
        ]

        obj01.hoja07 = [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
            ["", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE", "MVKE"],
            ["ID_CARGA", "VKORG", "VTWEG", "VERSG", "SKTOF", "VMSTA", "VMSTD", "MTPOS", "PRODH", "KTGRM", "MVGR1", "MVGR2", "MVGR4", "MVGR5", "PRAT2", "PRAT6", "RDPRF", "MVGR3"],
            ["", "Org.Ventas", "Can.distr.", "Gr.est.mat", "Dto.p.p.", "Status", "Validez de", "Gr.tp.Pos.", "JquíaProd", "Gr.Imp.Mat", "Gr.mater.1", "Gr.mater.2", "Gr.mater.4", "Gr.mater.5", "Atr.prod.2", "Atr.prod.6", "PerfRedond", "Gr.mater.3"]
        ]

        obj01.hoja08 = [
            ["1", "2", "3", "4", "5", "6", "7", "8"],
            ["", "BAPI1003_KEY", "BAPI1003_KEY", "BAPI1003_KEY", "", "AUSP", "AUSP", "AUSP"],
            ["ID_CARGA", "OBTAB", "CLASSTYPE", "CLASSNUM", "ALLOC", "ATNAM", "ATWRT", "DELETE"],
            ["", "Nombre de  tabla ", "N° de clase", "Categoría de la clase", "Tipo tabla NUM,Char,Curr", "Nom. Caract.", "Val. Caract.", ""]
        ]

        obj01.hoja09 = [
            ["1", "2", "3", "4"],
            ["", "QMAT", "QMAT", ""],
            ["ID_CARGA", "ART", "AKTIV", "DELE"],
            ["", "Clase de inspección", "Activa", "borrar"]
        ]

        // Tranformar JSON a string()
        var strData = json.encode(obj01); // <-- Se puede mandar como respuesta de "Script Includes"

        return strData;

    },

    // ==============================================================================================================================

    createExcelFile_logEAN: function(logEAN) {
        logEANtipo = '';
        if (logEAN == 3)
            logEANtipo = 'N0'
        if (logEAN == 4)
            logEANtipo = 'N1'
        if (logEAN == 5)
            logEANtipo = 'N2'
        if (logEAN == 6)
            logEANtipo = 'N3'
        if (logEAN == 7)
            logEANtipo = 'N4'
        if (logEAN == 8)
            logEANtipo = 'N5'
        if (logEAN == 9)
            logEANtipo = 'N6'
        if (logEAN == 10)
            logEANtipo = 'N7'
        if (logEAN == 11)
            logEANtipo = 'N8'
        if (logEAN == 12)
            logEANtipo = 'N9'
        if (logEAN == 13)
            logEANtipo = 'NA'
        if (logEAN == 14)
            logEANtipo = 'NB'
        if (logEAN == 15)
            logEANtipo = 'NC'
        if (logEAN == 16)
            logEANtipo = 'ND'
        if (logEAN == 17)
            logEANtipo = 'NE'
        return logEANtipo;
    },

    // ==============================================================================================================================











    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_E08_excel: function() {
        msgLog = 'MDM_Excel_001';
        // gs.log('000 ', msgLog);
        var respuestaTask = '',
            var_id_task = this.getParameter('parm_TaskID'),
            var_id_ritm = this.getParameter('parm_RitmID'),
            var_id_reg = this.getParameter('parm_RegID'),
            varEtapaNum = this.getParameter('parm_EtapaNum');

        var csvHeart = '"Titulo01","Titulo02","Titulo03",' + '\r\n',
            csvData = '"a001","a002","a003",' + '\r\n';

        csvData += '"b001","b002","b003",';

        // ........................ Creacion de attachment ...................................
        var gr01 = new GlideRecord('sys_attachment');
        gr01.initialize();
        var gr02 = new GlideSysAttachment();
        var fileName = 'Excel_MSM_' + '001' + '.csv';

        var attachmentSYSID = gr02.write(gr01, fileName, 'application/csv', csvHeart + csvData);
        return attachmentSYSID;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    fillExcelWithDummyData: function(attachmentSysId) {
        try {
            var excelParser = new sn_impex.GlideExcelParser();
            var attachment = new GlideSysAttachment();

            // Leer el archivo de attachment
            var excelStream = attachment.getContentStream(attachmentSysId);
            excelParser.process(excelStream);

            // Obtener los nombres de las hojas
            var sheetNames = excelParser.getSheetNames();
            gs.info('Total Sheets: ' + sheetNames.length);

            // Iterar sobre cada hoja (página)
            for (var i = 0; i < sheetNames.length; i++) {
                var sheetName = sheetNames[i];
                var sheet = excelParser.getSheet(sheetName);
                gs.info('Processing Sheet: ' + sheetName);

                // Datos ficticios para llenar
                var dummyData = this.getDummyDataForSheet(sheetName);
                gs.info('Dummy records for ' + sheetName + ': ' + dummyData.length);

                // Empezar en la fila 5 (para evitar los encabezados)
                var rowIndex = 5;

                // Iterar sobre los registros ficticios y llenar las filas en la hoja
                dummyData.forEach(function(record) {
                    var row = sheet.getRow(rowIndex);

                    // Llenar las columnas con los datos ficticios
                    row.getCell(0).setValue(record.field1);
                    row.getCell(1).setValue(record.field2);
                    row.getCell(2).setValue(record.field3);

                    rowIndex++; // Moverse a la siguiente fila
                });
            }

            // Guardar el archivo modificado como un nuevo attachment
            var updatedExcelStream = excelParser.getContentStream();
            var newAttachment = new GlideSysAttachment();
            newAttachment.write('98f9672e1b2c9a50a9f8766dcc4bcbd2', 'new_filled_excel_with_dummy_data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', updatedExcelStream);

        } catch (e) {
            gs.error('Error processing Excel file: ' + e.message);
        }
    },

    // ==============================================================================================================================

    // Generar datos ficticios para cada hoja
    getDummyDataForSheet: function(sheetName) {
        var dummyRecords = [];

        // Generar datos ficticios diferentes según la hoja
        if (sheetName === 'DatosBasicos') {
            for (var i = 0; i < 10; i++) {
                dummyRecords.push({
                    field1: 'Name ' + (i + 1),
                    field2: 'Address ' + (i + 1),
                    field3: 'Phone ' + (1000 + i)
                });
            }
        } else if (sheetName === 'UnidadesAlter') {
            for (var i = 0; i < 15; i++) {
                dummyRecords.push({
                    field1: 'Product ' + (i + 1),
                    field2: 'Category ' + (i + 1),
                    field3: 'Price ' + (i * 10)
                });
            }
        } else if (sheetName === 'TaxClassif') {
            for (var i = 0; i < 8; i++) {
                dummyRecords.push({
                    field1: 'TaxType ' + (i + 1),
                    field2: 'Rate ' + (i + 5),
                    field3: 'Description ' + (i + 1)
                });
            }
        }
        // Agregar más condiciones para otras hojas según sea necesario

        return dummyRecords;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_Ritm_btn_cambio: function() {
        msgLog = 'MDM_cambio_002';
        // gs.log('000 ', msgLog);
        var gr00,
            gr01,
            gr02,
            gr04,
            gr05,
            gr06,
            respuestaTask = '',
            varEmail = 'jj@gmail.com',
            numMtr01 = '',
            numMtr02 = '',
            varCopiar = '',
            varIDTemp,
            cambioEANoNAME = 'No',
            var_id_task = this.getParameter('parm_TaskID'),
            var_id_ritm = this.getParameter('parm_RitmID'),
            var_id_reg = this.getParameter('parm_RegID'),
            var_id_reg_org = this.getParameter('parm_RegID_Org'),
            varObserv = this.getParameter('parm_Observacion'),
            varComentarios = this.getParameter('parm_Comentarios'),
            varEtapaNum = this.getParameter('parm_EtapaNum'),
            varNoMtrAnterior = this.getParameter('parm_NoMtrAnterior'),
            varOption = this.getParameter('parm_Option'),
            campoDataAll = this.getParameter('parm_Data_All');
        // gs.log('001 - ' + var_id_task + ' - ' + var_id_ritm + ' - ' + var_id_reg + ' - ' + varObserv + 'varOption' + varOption, msgLog);


        respuestaNumDuplicado = (varEtapaNum == '6') ? this.mdm_Ritm_Validar_No_MTR(var_id_reg_org, varNoMtrAnterior) : 'No';
        if (respuestaNumDuplicado == 'No') {
            // ------------------------------------------------------------
            var respArray = campoDataAll.toString().split('zzRespUestazz');
            // gs.log(respArray[87], msgLog);

            if (varOption == 'Siguiente') {

                // "Enviar MDM cambio"
                respuestaTask = 'Respuesta_Positiva';

                gr00 = new GlideRecord('sc_req_item');
                gr00.addEncodedQuery('sys_id=' + var_id_ritm);
                gr00.query();
                gr00.next();
                gr00.u_mdm_resultado = respuestaTask;
                gr00.update();

                numMtr01 = gr00.u_mdm_material.toString();
                numMtr02 = gr00.u_mdm_material_cambio.toString();

                gr01 = new GlideRecord('sc_task');
                gr01.addEncodedQuery('sys_id=' + var_id_task);
                gr01.query();
                gr01.next();
                gr01.state = 3; // Close
                gr01.update();

                //UPDATE CAMBIOS
                // ++ +++ ++ ------------------------------------------------------------------------- ++ +++ ++ 
                gr06 = new GlideRecord('u_mdm_registros');
                gr06.addEncodedQuery('sys_id=' + numMtr02);
                gr06.query();
                gr06.next();

                // SIGUIENTE ETAPA	
                if (gr06.u_mt_valido != 'Corregir')
                    gr06.u_mt_valido = 'Valido';
                gr06.u_mt_observacion_temp = '';
                // gr06.u_mt_valido_error = '';

                // PI -----------------------------------------------------------------------------
                varIDTemp = gr06.u_mt_pi_ean;
                varIDTempNew = respArray[1];
                // gs.log('Ser 100 EAN PI: \n' + gr06.u_mt_pi_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 PI Cambio.', msgLog);
                    this.attachmentRenombrar(gr06.u_mt_img_pi_01, varIDTempNew, 'pi_01');
                    this.attachmentRenombrar(gr06.u_mt_img_pi_02, varIDTempNew, 'pi_02');
                    this.attachmentRenombrar(gr06.u_mt_img_pi_03, varIDTempNew, 'pi_03');
                    this.attachmentRenombrar(gr06.u_mt_img_pi_04, varIDTempNew, 'pi_04');
                    this.attachmentRenombrar(gr06.u_mt_img_pi_05, varIDTempNew, 'pi_05');
                    this.attachmentRenombrar(gr06.u_mt_a_lista_de_precios, varIDTempNew, 'Lista_de_precios');
                    this.attachmentRenombrar(gr06.u_mt_a_ficha_tecnica, varIDTempNew, 'Ficha_tecnica');
                    this.attachmentRenombrar(gr06.u_mt_a_registro_sanitario, varIDTempNew, 'Registro_sanitario');
                    this.attachmentRenombrar(gr06.u_mt_a_prorroga, varIDTempNew, 'Prorroga');
                    this.attachmentRenombrar(gr06.u_mt_a_hoja_seguridad, varIDTempNew, 'Hoja_de_seguridad');
                    this.attachmentRenombrar(gr06.u_mt_a_oficio_de_clasificacion, varIDTempNew, 'Oficio_de_clasificacion');
                    this.attachmentRenombrar(gr06.u_mt_a_aviso_de_funcionamiento, varIDTempNew, 'Aviso_de_funcionamiento');
                    this.attachmentRenombrar(gr06.u_mt_a_carta_presentacion_documento, varIDTempNew, 'Carta_presentacion_documento');
                    this.attachmentRenombrar(gr06.u_mt_a_marbete_empaque_artes_producto, varIDTempNew, 'Marbete_empaque_artes_producto');
                }
                gr06.u_mt_pi_unidad_id = 'PI';
                gr06.u_mt_pi_unidad = '60ceefa01be9c610a9f8766dcc4bcb1e';

                // gs.log(gr06.u_mt_pi_ean  +' -- ' +respArray[1], msgLog);
                if (gr06.u_mt_pi_ean != respArray[1])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr06.u_mt_pi_ean = respArray[1];
                gr06.u_mt_pi_piezas = this.esNumeroNdecimales(respArray[2], 0);
                gr06.u_mt_pi_longitud_cm = this.esNumeroNdecimales(respArray[3], 3);
                gr06.u_mt_pi_ancho_cm = this.esNumeroNdecimales(respArray[4], 3);
                gr06.u_mt_pi_altura_cm = this.esNumeroNdecimales(respArray[5], 3);
                gr06.u_mt_pi_pesos_gr = this.esNumeroNdecimales(respArray[6], 3);

                // EMP -----------------------------------------------------------------------------
                varIDTemp = gr06.u_mt_emp_ean;
                varIDTempNew = respArray[8];
                // gs.log('Ser 100 EAN EMP: \n' + gr06.u_mt_emp_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 EMP Cambio.', msgLog);
                    this.attachmentRenombrar(gr06.u_mt_img_emp_01, varIDTempNew, 'emp_01');
                    this.attachmentRenombrar(gr06.u_mt_img_emp_02, varIDTempNew, 'emp_02');
                    this.attachmentRenombrar(gr06.u_mt_img_emp_03, varIDTempNew, 'emp_03');
                    this.attachmentRenombrar(gr06.u_mt_img_emp_04, varIDTempNew, 'emp_04');
                    this.attachmentRenombrar(gr06.u_mt_img_emp_05, varIDTempNew, 'emp_05');
                }
                gr06.u_mt_emp_unidad_id = 'EMP';
                gr06.u_mt_emp_unidad = 'ecceefa01be9c610a9f8766dcc4bcb1e';
                gr06.u_mt_emp_ean = respArray[8];
                gr06.u_mt_emp_piezas = this.esNumeroNdecimales(respArray[9], 0);
                gr06.u_mt_emp_longitud_cm = this.esNumeroNdecimales(respArray[10], 3);
                gr06.u_mt_emp_ancho_cm = this.esNumeroNdecimales(respArray[11], 3);
                gr06.u_mt_emp_altura_cm = this.esNumeroNdecimales(respArray[12], 3);
                gr06.u_mt_emp_pesos_gr = this.esNumeroNdecimales(respArray[13], 3);

                // SUB -----------------------------------------------------------------------------
                varIDTemp = gr06.u_mt_sub_ean;
                varIDTempNew = respArray[15];
                // gs.log('Ser 100 EAN SUB: \n' + gr06.u_mt_sub_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 SUB Cambio.', msgLog);
                    this.attachmentRenombrar(gr06.u_mt_img_sub_01, varIDTempNew, 'sub_01');
                    this.attachmentRenombrar(gr06.u_mt_img_sub_02, varIDTempNew, 'sub_02');
                    this.attachmentRenombrar(gr06.u_mt_img_sub_03, varIDTempNew, 'sub_03');
                    this.attachmentRenombrar(gr06.u_mt_img_sub_04, varIDTempNew, 'sub_04');
                    this.attachmentRenombrar(gr06.u_mt_img_sub_05, varIDTempNew, 'sub_05');
                }
                gr06.u_mt_sub_unidad_id = 'SUB';
                gr06.u_mt_sub_unidad = 'a0ceefa01be9c610a9f8766dcc4bcb1f';
                gr06.u_mt_sub_ean = respArray[15];
                gr06.u_mt_sub_piezas = this.esNumeroNdecimales(respArray[16], 0);
                gr06.u_mt_sub_longitud_cm = this.esNumeroNdecimales(respArray[17], 3);
                gr06.u_mt_sub_ancho_cm = this.esNumeroNdecimales(respArray[18], 3);
                gr06.u_mt_sub_altura_cm = this.esNumeroNdecimales(respArray[19], 3);
                gr06.u_mt_sub_pesos_gr = this.esNumeroNdecimales(respArray[20], 3);
                gr06.u_mt_tipo_id = this.regresaOptionValue(respArray[21]);
                gr06.u_mt_agrupaci_n_de_material_ssa_ref = this.regresaOptionFieldRef01(respArray[21]);
                gr06.u_mt_tipo = respArray[21];
                gr06.u_mt_formula = respArray[22];
                gr06.u_mt_clasificacion_fiscal_id = this.regresaOptionValue(respArray[23]);
                gr06.u_mt_clasificacion_fiscal = respArray[23];
                gr06.u_mt_gpo_trat_logistico_id = this.regresaOptionValue(respArray[24]);
                gr06.u_mt_gpo_trat_logistico = respArray[24];
                gr06.u_mt_circulo_salud_id = this.regresaOptionValue(respArray[25]);
                gr06.u_mt_circulo_salud = respArray[25];
                gr06.u_mt_antibiotico_id = this.regresaOptionValue(respArray[26]);
                gr06.u_mt_antibiotico = respArray[26];
                gr06.u_mt_devolucion_del_cliente_id = this.regresaOptionValue(respArray[27]);
                gr06.u_mt_devolucion_del_cliente = respArray[27];
                gr06.u_mt_division_factura = respArray[28];
                gr06.u_mt_anexo_20_sat = respArray[29];
                gr06.u_mt_formula_farmaceutica_id = this.regresaOptionValue(respArray[30]);
                gr06.u_mt_formula_farmaceutica = respArray[30];
                gr06.u_mt_registro_sanitario = respArray[31];
                gr06.u_mt_registro_sanitario_vigencia = respArray[32];
                gr06.u_mt_registro_sanitario_vigencia_prorroga = respArray[33];
                gr06.u_mt_activo_01_id = this.regresaOptionValue(respArray[34]);
                gr06.u_mt_activo_01 = respArray[34];
                gr06.u_mt_activo_02_id = this.regresaOptionValue(respArray[35]);
                gr06.u_mt_activo_02 = respArray[35];
                gr06.u_mt_activo_03_id = this.regresaOptionValue(respArray[36]);
                gr06.u_mt_activo_03 = respArray[36];
                gr06.u_mt_activo_04_id = this.regresaOptionValue(respArray[37]);
                gr06.u_mt_activo_04 = respArray[37];
                gr06.u_mt_activo_05_id = this.regresaOptionValue(respArray[38]);
                gr06.u_mt_activo_05 = respArray[38];
                gr06.u_mt_activo_06_id = this.regresaOptionValue(respArray[39]);
                gr06.u_mt_activo_06 = respArray[39];
                gr06.u_mt_activo_07_id = this.regresaOptionValue(respArray[40]);
                gr06.u_mt_activo_07 = respArray[40];
                gr06.u_mt_activo_08_id = this.regresaOptionValue(respArray[41]);
                gr06.u_mt_activo_08 = respArray[41];
                gr06.u_mt_activo_09_id = this.regresaOptionValue(respArray[42]);
                gr06.u_mt_activo_09 = respArray[42];
                gr06.u_mt_activo_10_id = this.regresaOptionValue(respArray[43]);
                gr06.u_mt_activo_10 = respArray[43];
                gr06.u_mt_activo_11_id = this.regresaOptionValue(respArray[44]);
                gr06.u_mt_activo_11 = respArray[44];
                gr06.u_mt_activo_12_id = this.regresaOptionValue(respArray[45]);
                gr06.u_mt_activo_12 = respArray[45];
                gr06.u_mt_activo_13_id = this.regresaOptionValue(respArray[46]);
                gr06.u_mt_activo_13 = respArray[46];
                gr06.u_mt_activo_14_id = this.regresaOptionValue(respArray[47]);
                gr06.u_mt_activo_14 = respArray[47];
                gr06.u_mt_activo_15_id = this.regresaOptionValue(respArray[48]);
                gr06.u_mt_activo_15 = respArray[48];
                gr06.u_mt_gramaje_tipo_01_id = this.regresaOptionValue(respArray[49]);
                gr06.u_mt_gramaje_tipo_01 = respArray[49];
                gr06.u_mt_gramaje_tipo_02_id = this.regresaOptionValue(respArray[50]);
                gr06.u_mt_gramaje_tipo_02 = respArray[50];
                gr06.u_mt_gramaje_tipo_03_id = this.regresaOptionValue(respArray[51]);
                gr06.u_mt_gramaje_tipo_03 = respArray[51];
                gr06.u_mt_gramaje_contenido_01 = respArray[52];
                gr06.u_mt_gramaje_contenido_02 = respArray[53];
                gr06.u_mt_gramaje_contenido_03 = respArray[54];
                gr06.u_mt_num_piezas_por_unidad = respArray[55];
                gr06.u_mt_d_departamento_id = this.regresaOptionValue(respArray[56]);
                gr06.u_mt_d_departamento = respArray[56];
                gr06.u_mt_d_categoria_id = this.regresaOptionValue(respArray[57]);
                gr06.u_mt_d_categoria = respArray[57];
                gr06.u_mt_d_subcategoria_id = this.regresaOptionValue(respArray[58]);
                gr06.u_mt_d_subcategoria = respArray[58];
                gr06.u_mt_descripcion_mercadologica = respArray[59];
                gr06.u_mt_beneficios = respArray[60];
                gr06.u_mt_ecommerce = respArray[61];
                gr06.u_mt_indicacion_terapeutica = respArray[62];
                gr06.u_mt_contraindicacion = respArray[63];
                gr06.u_mt_leyenda_de_proteccion = respArray[64];
                gr06.u_mt_prescripcion = respArray[65];
                gr06.u_mt_advertencias = respArray[66];
                gr06.u_mt_interaccion_medicamentosa = respArray[67];
                gr06.u_mt_racciones_adversas = respArray[68];
                gr06.u_mt_manjo_de_sobredosificacion = respArray[69];
                gr06.u_mt_propiedad_farmaceutica = respArray[70];
                gr06.u_mt_dosis = respArray[71];
                gr06.u_mt_via_de_administracion = respArray[72];
                gr06.u_mt_clave_cnis = respArray[73];
                gr06.u_mt_embarazo = respArray[74];
                gr06.u_mt_lactancia = respArray[75];
                gr06.u_mt_nominacion_generica = respArray[76];
                gr06.u_mt_marca_del_producto_id = this.regresaOptionValue(respArray[77]);
                gr06.u_mt_marca_del_producto = respArray[77];
                gr06.u_mt_linea_del_proveedor_id = this.regresaOptionValue(respArray[78]);
                gr06.u_mt_linea_del_proveedor = respArray[78];

                gr06.u_mt_esquema = respArray[79];
                gr06.u_mt_precio_costo = respArray[80];
                gr06.u_mt_precio_farmacia = respArray[81];
                gr06.u_mt_markup = respArray[82];
                gr06.u_mt_fee = respArray[83];
                gr06.u_mt_condicion_adiconal = respArray[84];
                // gr06.u_mt_condicion_no_devolucion = respArray[85]; // <-- "No"
                gr06.u_mt_margen_final_en_porcentaje = respArray[86];
                gr06.u_mt_margen_final_en_dinero = respArray[87];
                gr06.u_mt_plazo_de_pago = respArray[88];

                gr06.u_mt_condicion_de_temperatura = respArray[89]; // Pestaña "Asuntos regulatorios"
                gr06.u_mt_cond_almacenamiento_ref = this.regresaOptionFieldRef01(respArray[89]); // Pestaña "Datos Basicos"
                gr06.u_mt_grtransp_ref = this.regresaOptionFieldRef02(respArray[89]);

                gr06.u_mt_sujeto_a_lote = respArray[90];
                gr06.u_mt_indicador_manipulacion = respArray[91];

                gr06.u_mt_grupo_control_calidad = respArray[92]; // Pestaña "Asuntos regulatorios"
                gr06.u_mt_gr_ctrl_calidad_ref = respArray[92]; // Pestaña "Datos Basicos"			

                // gr06.u_mt_motivo_de_rechazo = ' ++ '+campoEtapa;

                gr06.u_mt_grupo_de_material_2 = respArray[93];
                gr06.u_mt_jerarquia_de_productos = respArray[94];

                gr06.u_mt_analista_sr = respArray[98];

                gr06.u_mt_no_material_anterior = respArray[99];
                gr06.u_mt_no_materia = respArray[100];
                gr06.u_mt_tpmaterial_ref = respArray[101];
                gr06.u_mt_ramo_ref = respArray[102];
                // gr06.u_mt_grtransp_ref = respArray[103];
                gr06.u_mt_sector_ref = respArray[104];
                gr06.u_mt_jquia_producto_ref = respArray[105];
                gr06.u_mt_ind_cad_ref = respArray[106];
                gr06.u_mt_statusmat_ref = respArray[107];
                gr06.u_mt_status_ref = respArray[108];
                gr06.u_mt_valido_de = respArray[109];
                gr06.u_mt_validez_de = respArray[110];
                gr06.u_mt_tmpohastacaduc = respArray[111];
                gr06.u_mt_durtotalconserv = respArray[112];
                gr06.u_mt_susbonifes_ref = respArray[113];
                gr06.u_mt_fabricante = this.cerosIzquierda(respArray[114], 10);
                gr06.u_mt_ind_periodo_ref = respArray[115];
                gr06.u_mt_regla_redondeo_ref = respArray[116];
                gr06.u_mt_grposgral_ref = respArray[117];
                gr06.u_mt_fecad_feex_ref = respArray[118];
                // gr06.u_mt_cond_almacenamiento_ref = respArray[119];
                gr06.u_mt_ind_manipul_ref = respArray[120];
                gr06.u_mt_denomin = respArray[122];
                gr06.u_mt_pb_niv_mandante_ref = respArray[123];
                gr06.u_mt_linea_de_devolucion_ref = respArray[124];
                gr06.u_mt_deltacontrolfield_ref = respArray[125];

                gr06.u_mt_precio_costo_final = respArray[126];
                gr06.u_mt_precio_farmacia_final = respArray[127];

                gr06.u_mt_2_unidad = respArray[128];

                gr06.u_mt_bto_unidad_id = 'BTO';
                gr06.u_mt_bto_unidad = 'b5d828b41b389690a9f8766dcc4bcb0c';
                gr06.u_mt_bto_ean = respArray[130];
                gr06.u_mt_bto_piezas = this.esNumeroNdecimales(respArray[131], 0);
                gr06.u_mt_bto_longitud_cm = this.esNumeroNdecimales(respArray[132], 3);
                gr06.u_mt_bto_ancho_cm = this.esNumeroNdecimales(respArray[133], 3);
                gr06.u_mt_bto_altura_cm = this.esNumeroNdecimales(respArray[134], 3);
                gr06.u_mt_bto_pesos_gr = this.esNumeroNdecimales(respArray[135], 3);

                gr06.u_mt_pal_unidad_id = 'PAL';
                gr06.u_mt_pal_unidad = '741eeda997f5a210cc1ebbdfe153af7b';
                gr06.u_mt_pal_ean = respArray[138];
                gr06.u_mt_pal_piezas = this.esNumeroNdecimales(respArray[139], 0);
                gr06.u_mt_pal_longitud_cm = this.esNumeroNdecimales(respArray[140], 3);
                gr06.u_mt_pal_ancho_cm = this.esNumeroNdecimales(respArray[141], 3);
                gr06.u_mt_pal_altura_cm = this.esNumeroNdecimales(respArray[142], 3);
                gr06.u_mt_pal_pesos_gr = this.esNumeroNdecimales(respArray[143], 3);

                gr06.u_mt_zca_unidad_id = 'ZCA';
                gr06.u_mt_zca_unidad = '935eeda997f5a210cc1ebbdfe153af9a';
                gr06.u_mt_zca_ean = respArray[145];
                gr06.u_mt_zca_piezas = this.esNumeroNdecimales(respArray[146], 0);
                gr06.u_mt_zca_longitud_cm = this.esNumeroNdecimales(respArray[147], 3);
                gr06.u_mt_zca_ancho_cm = this.esNumeroNdecimales(respArray[148], 3);
                gr06.u_mt_zca_altura_cm = this.esNumeroNdecimales(respArray[149], 3);
                gr06.u_mt_zca_pesos_gr = this.esNumeroNdecimales(respArray[150], 3);

                gr06.u_mt_pa1_unidad_id = 'PA1';
                gr06.u_mt_pa1_unidad = 'b68eada997f5a210cc1ebbdfe153af84';
                gr06.u_mt_pa1_ean = respArray[152];
                gr06.u_mt_pa1_piezas = this.esNumeroNdecimales(respArray[153], 0);
                gr06.u_mt_pa1_longitud_cm = this.esNumeroNdecimales(respArray[154], 3);
                gr06.u_mt_pa1_ancho_cm = this.esNumeroNdecimales(respArray[155], 3);
                gr06.u_mt_pa1_altura_cm = this.esNumeroNdecimales(respArray[156], 3);
                gr06.u_mt_pa1_pesos_gr = this.esNumeroNdecimales(respArray[157], 3);

                gr06.u_mt_ze1_unidad_id = 'ZE1';
                gr06.u_mt_ze1_unidad = '4caeada997f5a210cc1ebbdfe153af96';
                gr06.u_mt_ze1_ean = respArray[159];
                gr06.u_mt_ze1_piezas = this.esNumeroNdecimales(respArray[160], 0);
                gr06.u_mt_ze1_longitud_cm = this.esNumeroNdecimales(respArray[161], 3);
                gr06.u_mt_ze1_ancho_cm = this.esNumeroNdecimales(respArray[162], 3);
                gr06.u_mt_ze1_altura_cm = this.esNumeroNdecimales(respArray[163], 3);
                gr06.u_mt_ze1_pesos_gr = this.esNumeroNdecimales(respArray[164], 3);

                /*
                if (campoEtapa.toString() == '5') {
                    gr06.u_mtr_etapa07 = 'Ya';
                }
                */



                // gs.log(gr06.u_mt_nombre  +' -- ' +respArray[136], msgLog);
                if (gr06.u_mt_nombre != respArray[136])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr06.u_mt_nombre = respArray[136];
                gr06.u_mt_grupo_mtr_almacen = respArray[165];

                gr06.u_mt_keywords_complementario = respArray[95];
                gr06.u_mt_metadescripcion = respArray[96];
                gr06.u_mt_caption_link = respArray[97];

                if (gr01.u_mdm_etapa == 1 && gr01.u_mdm_flujo_cambio == 1)
                    gr06.u_mt_archivo_existencias_oper = gr01.u_mdm_archivo_existencias; // Archivo existencia para Operativos

                gr06.u_mt_motivo_de_rechazo = '';
                gr06.update();
                // ++ +++ ++ ------------------------------------------------------------------------- ++ +++ ++ 


                if (varEtapaNum == 6) { // Ultima etapa "4"

                    gr02 = new GlideRecord('sc_req_item');
                    gr02.addEncodedQuery('sys_id=' + var_id_ritm);
                    gr02.query();
                    gr02.next();
                    gr02.state = 2; // Work in Progress
                    gr02.u_mdm_resultado = 'Enviado';
                    gr02.update();

                    // Activa Business Rules 

                } else {

                    gr02 = new GlideRecord('sc_req_item');
                    gr02.addEncodedQuery('sys_id=' + var_id_ritm);
                    gr02.query();
                    gr02.next();
                    /*
                var str = parseInt(varEtapaNum.toString());
                str = str + 1;
                gr02.u_mdm_etapa = str.toString();
				*/
                    gr02.u_mdm_resultado = ''; // Limpiar    
                    gr02.update();
                }





            } else {

                // "Cancelar MDM cambio"
                respuestaTask = 'Respuesta_Negativa';

                var canceladoUser = gs.getUserID(),
                    canceladoMotivo = varObserv,
                    canceladoCuando = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes 

                gr00 = new GlideRecord('sc_req_item');
                gr00.addEncodedQuery('sys_id=' + var_id_ritm);
                gr00.query();
                gr00.next();
                gr00.u_mdm_resultado = respuestaTask;
                gr00.update();

                varEmail = gr00.opened_by.email.toString();
                numMtr01 = gr00.u_mdm_material.toString();
                numMtr02 = gr00.u_mdm_material_cambio.toString();

                gr01 = new GlideRecord('sc_task');
                gr01.addEncodedQuery('sys_id=' + var_id_task);
                gr01.query();
                gr01.next();
                gr01.state = 3; // Close
                gr01.update();

                gr02 = new GlideRecord('sc_req_item');
                gr02.addEncodedQuery('sys_id=' + var_id_ritm);
                gr02.query();
                gr02.next();
                gr02.state = 4; // Close incomplete           
                gr02.stage = 'Request Cancelled';
                gr02.u_mdm_rechazado_por = canceladoUser;
                gr02.u_mdm_rechazado_motivo = canceladoMotivo;
                gr02.u_mdm_rechazado_cuando = canceladoCuando;
                gr02.update();

                gr05 = new GlideRecord('u_mdm_registros');
                gr05.addEncodedQuery('sys_id=' + numMtr01);
                gr05.query();
                gr05.next();
                gr05.u_mtr_cambio_pendiente = ''; // Limpiar
                gr05.u_cambio_material_cambio = '';
                gr05.update();

                gr06 = new GlideRecord('u_mdm_registros');
                gr06.addEncodedQuery('sys_id=' + numMtr02);
                gr06.query();
                gr06.next();
                gr06.u_mt_estatus = 'Rechazado'; // Rechazar
                gr06.u_mt_motivo_de_rechazo_por = canceladoUser;
                gr06.u_mt_motivo_de_rechazo = canceladoMotivo;
                gr06.u_mt_motivo_de_rechazo_fecha = canceladoCuando;
                gr06.update();

                // Correo de rechazo
                // gs.log('varEmail: ' + varEmail, msgLog02);
                gs.eventQueue('mdm.mt.task.estatus', gr01, varEmail, '');
                // gs.eventQueue("<event_name>", object, parm1, parm2);

            }
            // ------------------------------------------------------------
            var gr00 = new GlideRecord('sc_task');
            gr00.addEncodedQuery('request_item=' + var_id_ritm);
            gr00.query();
            gr00.u_mdm_comentarios = varComentarios;
            gr00.updateMultiple();
            // ------------------------------------------------------------

        } else {
            respuestaTask = 'NoDuplicadozzRespUestazz' + respuestaNumDuplicado;
        }
        return respuestaTask;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    validarUnicosEAN: function() {
        msgLog = 'mdm_EAN_003';
        // gs.log('Entro', msgLog);	
        var respuestaZ,
            msgErroUnicoEANx1 = 'No',
            msgErroUnicoEANx2 = 'No',
            msgErroUnicoEANx3 = 'No',
            msgErroUnicoEANx4 = 'No',
            msgErroUnicoEANx5 = 'No',
            msgErroUnicoEANx6 = 'No',
            msgErroUnicoEANx7 = 'No',
            msgErroUnicoEANx8 = 'No',
            tempResp,
            tempBusqueda,
            varMaterial = this.getParameter('parm_Material'),
            varEANx,
            varEANx1 = this.getParameter('parm_EAN_01'),
            varEANx1_long = this.getParameter('parm_EAN_01_log'),
            varEANx2 = this.getParameter('parm_EAN_02'),
            varEANx2_long = this.getParameter('parm_EAN_02_log'),
            varEANx3 = this.getParameter('parm_EAN_03'),
            varEANx3_long = this.getParameter('parm_EAN_03_log'),
            varEANx4 = this.getParameter('parm_EAN_04'),
            varEANx4_long = this.getParameter('parm_EAN_04_log'),
            varEANx5 = this.getParameter('parm_EAN_05'),
            varEANx5_long = this.getParameter('parm_EAN_05_log'),
            varEANx6 = this.getParameter('parm_EAN_06'),
            varEANx6_long = this.getParameter('parm_EAN_06_log'),
            varEANx7 = this.getParameter('parm_EAN_07'),
            varEANx7_long = this.getParameter('parm_EAN_07_log'),
            varEANx8 = this.getParameter('parm_EAN_08'),
            varEANx8_long = this.getParameter('parm_EAN_08_log');

        vTempMsgTemp = '';
        vTempMsgTemp += 'EAN_PI: ' + varEANx1 + ' - ' + varEANx1_long + '\n';
        vTempMsgTemp += 'EAN_EMP: ' + varEANx2 + ' - ' + varEANx2_long + '\n';
        vTempMsgTemp += 'EAN_SUB: ' + varEANx3 + ' - ' + varEANx3_long + '\n';
        vTempMsgTemp += 'EAN_BTO: ' + varEANx4 + ' - ' + varEANx4_long + '\n';
        vTempMsgTemp += 'EAN_PAL: ' + varEANx5 + ' - ' + varEANx5_long + '\n';
        vTempMsgTemp += 'EAN_ZCA: ' + varEANx6 + ' - ' + varEANx6_long + '\n';
        vTempMsgTemp += 'EAN_PA1: ' + varEANx7 + ' - ' + varEANx7_long + '\n';
        vTempMsgTemp += 'EAN_ZE1: ' + varEANx8 + ' - ' + varEANx8_long + '\n';
        // gs.log('00 - EAN: \n\n' + vTempMsgTemp + '\n', msgLog);


        opcionEAN = this.getParameter('parm_Material_original');
        // gs.log('01 - Alta/ID: '+opcionEAN, msgLog);	

        // "PIEZAS"
        varEANx = varEANx1;
        tempResp = true;
        if (varEANx1_long == 0) {
            msgErroUnicoEANx1 = 'Falta llenar';
        } else {
            msgErroUnicoEANx1 = this.funNumeroEnteroDosEAN(varEANx1, varEANx1_long, 3, 16);
            if (msgErroUnicoEANx1 == 'No') {
                // if (varEANx1 == varEANx1) {
                //     msgErroUnicoEANx2 = '"Código EAN (PI)"';
                //     tempResp = false;
                // }
                if (varEANx1 == varEANx2) {
                    msgErroUnicoEANx1 = '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx3) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx4) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx5) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx6) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx7) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx1 == varEANx8) {
                    msgErroUnicoEANx1 = (msgErroUnicoEANx1 == 'No') ? '' : msgErroUnicoEANx1 + ' y ';
                    msgErroUnicoEANx1 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx1 = 'EAN duplicado en el campo ' + msgErroUnicoEANx1;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx1);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx1 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "EMPAQUE"
        varEANx = varEANx2;
        tempResp = true;
        if (varEANx2_long == 0) {
            msgErroUnicoEANx2 = 'No';
        } else {
            msgErroUnicoEANx2 = this.funNumeroEnteroDosEAN(varEANx2, varEANx2_long, 3, 16);
            if (msgErroUnicoEANx2 == 'No') {
                if (varEANx2 == varEANx1) {
                    msgErroUnicoEANx2 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                // if (varEANx2 == varEANx2) {
                //     msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                //     msgErroUnicoEANx2 += '"Código EAN (EMP)"';
                //     tempResp = false;
                // }
                if (varEANx2 == varEANx3) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx2 == varEANx4) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx2 == varEANx5) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx2 == varEANx6) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx2 == varEANx7) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx2 == varEANx8) {
                    msgErroUnicoEANx2 = (msgErroUnicoEANx2 == 'No') ? '' : msgErroUnicoEANx2 + ' y ';
                    msgErroUnicoEANx2 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx2 = 'EAN duplicado en el campo ' + msgErroUnicoEANx2;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx2);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx2 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "SUB-EMPAQUE"
        varEANx = varEANx3;
        tempResp = true;
        if (varEANx3_long == 0) {
            msgErroUnicoEANx3 = 'No';
        } else {
            msgErroUnicoEANx3 = this.funNumeroEnteroDosEAN(varEANx3, varEANx3_long, 3, 16);
            if (msgErroUnicoEANx3 == 'No') {
                if (varEANx3 == varEANx1) {
                    msgErroUnicoEANx3 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx3 == varEANx2) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                // if (varEANx3 == varEANx3) {
                //     msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                //     msgErroUnicoEANx3 += '"Código EAN (SUB)"';
                //     tempResp = false;
                // }
                if (varEANx3 == varEANx4) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx3 == varEANx5) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx3 == varEANx6) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx3 == varEANx7) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx3 == varEANx8) {
                    msgErroUnicoEANx3 = (msgErroUnicoEANx3 == 'No') ? '' : msgErroUnicoEANx3 + ' y ';
                    msgErroUnicoEANx3 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx3 = 'EAN duplicado en el campo ' + msgErroUnicoEANx3;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx3);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx3 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "BTO"
        varEANx = varEANx4;
        tempResp = true;
        if (varEANx4_long == 0) {
            msgErroUnicoEANx4 = 'No';
        } else {
            msgErroUnicoEANx4 = this.funNumeroEnteroDosEAN(varEANx4, varEANx4_long, 3, 16);
            if (msgErroUnicoEANx4 == 'No') {
                if (varEANx4 == varEANx1) {
                    msgErroUnicoEANx4 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx4 == varEANx2) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx4 == varEANx3) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                // if (varEANx4 == varEANx4) {
                //     msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                //     msgErroUnicoEANx4 += '"Código EAN (BTO)"';
                //     tempResp = false;
                // }
                if (varEANx4 == varEANx5) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx4 == varEANx6) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx4 == varEANx7) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx4 == varEANx8) {
                    msgErroUnicoEANx4 = (msgErroUnicoEANx4 == 'No') ? '' : msgErroUnicoEANx4 + ' y ';
                    msgErroUnicoEANx4 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx4 = 'EAN duplicado en el campo ' + msgErroUnicoEANx4;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx4);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx4 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "PAL"
        varEANx = varEANx5;
        tempResp = true;
        if (varEANx5_long == 0) {
            msgErroUnicoEANx5 = 'No';
        } else {
            msgErroUnicoEANx5 = this.funNumeroEnteroDosEAN(varEANx5, varEANx5_long, 3, 16);
            if (msgErroUnicoEANx5 == 'No') {
                if (varEANx5 == varEANx1) {
                    msgErroUnicoEANx5 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx5 == varEANx2) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx5 == varEANx3) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx5 == varEANx4) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                // if (varEANx5 == varEANx5) {
                //     msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                //     msgErroUnicoEANx5 += '"Código EAN (PAL)"';
                //     tempResp = false;
                // }
                if (varEANx5 == varEANx6) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx5 == varEANx7) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx5 == varEANx8) {
                    msgErroUnicoEANx5 = (msgErroUnicoEANx5 == 'No') ? '' : msgErroUnicoEANx5 + ' y ';
                    msgErroUnicoEANx5 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx5 = 'EAN duplicado en el campo ' + msgErroUnicoEANx5;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx5);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx5 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "ZCA"
        varEANx = varEANx6;
        tempResp = true;
        if (varEANx6_long == 0) {
            msgErroUnicoEANx6 = 'No';
        } else {
            msgErroUnicoEANx6 = this.funNumeroEnteroDosEAN(varEANx6, varEANx6_long, 3, 16);
            if (msgErroUnicoEANx6 == 'No') {
                if (varEANx6 == varEANx1) {
                    msgErroUnicoEANx6 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx6 == varEANx2) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx6 == varEANx3) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx6 == varEANx4) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx6 == varEANx5) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                // if (varEANx6 == varEANx6) {
                //     msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                //     msgErroUnicoEANx6 += '"Código EAN (ZCA)"';
                //     tempResp = false;
                // }
                if (varEANx6 == varEANx7) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                if (varEANx6 == varEANx8) {
                    msgErroUnicoEANx6 = (msgErroUnicoEANx6 == 'No') ? '' : msgErroUnicoEANx6 + ' y ';
                    msgErroUnicoEANx6 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx6 = 'EAN duplicado en el campo ' + msgErroUnicoEANx6;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx6);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx6 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "PA1"
        varEANx = varEANx7;
        tempResp = true;
        if (varEANx7_long == 0) {
            msgErroUnicoEANx7 = 'No';
        } else {
            msgErroUnicoEANx7 = this.funNumeroEnteroDosEAN(varEANx7, varEANx7_long, 3, 16);
            if (msgErroUnicoEANx7 == 'No') {
                if (varEANx7 == varEANx1) {
                    msgErroUnicoEANx7 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx7 == varEANx2) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx7 == varEANx3) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx7 == varEANx4) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx7 == varEANx5) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx7 == varEANx6) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                // if (varEANx7 == varEANx7) {
                //     msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                //     msgErroUnicoEANx7 += '"Código EAN (PA1)"';
                //     tempResp = false;
                // }
                if (varEANx7 == varEANx8) {
                    msgErroUnicoEANx7 = (msgErroUnicoEANx7 == 'No') ? '' : msgErroUnicoEANx7 + ' y ';
                    msgErroUnicoEANx7 += '"Código EAN (ZE1)"';
                    tempResp = false;
                }
                if (tempResp == false) {
                    msgErroUnicoEANx7 = 'EAN duplicado en el campo ' + msgErroUnicoEANx7;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx7);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx7 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        // "ZE1"
        varEANx = varEANx8;
        tempResp = true;
        if (varEANx8_long == 0) {
            msgErroUnicoEANx8 = 'No';
        } else {
            msgErroUnicoEANx8 = this.funNumeroEnteroDosEAN(varEANx8, varEANx8_long, 3, 16);
            if (msgErroUnicoEANx8 == 'No') {
                if (varEANx8 == varEANx1) {
                    msgErroUnicoEANx8 = '"Código EAN (PI)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx2) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (EMP)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx3) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (SUB)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx4) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (BTO)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx5) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (PAL)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx6) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (ZCA)"';
                    tempResp = false;
                }
                if (varEANx8 == varEANx7) {
                    msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                    msgErroUnicoEANx8 += '"Código EAN (PA1)"';
                    tempResp = false;
                }
                // if (varEANx8 == varEANx8) {
                //     msgErroUnicoEANx8 = (msgErroUnicoEANx8 == 'No') ? '' : msgErroUnicoEANx8 + ' y ';
                //     msgErroUnicoEANx8 += '"Código EAN (ZE1)"';
                //     tempResp = false;
                // }
                if (tempResp == false) {
                    msgErroUnicoEANx8 = 'EAN duplicado en el campo ' + msgErroUnicoEANx8;
                } else {
                    tempBusqueda = this.validarUnicosEANxN(varMaterial, varEANx8);
                    if (tempBusqueda != 'No') {
                        msgErroUnicoEANx8 = 'Registro duplicado en base datos "' + tempBusqueda + '"';
                    }
                }
            }
        }

        respuestaZ = msgErroUnicoEANx1 + 'zzRespUestazz' + msgErroUnicoEANx2 + 'zzRespUestazz' + msgErroUnicoEANx3 + 'zzRespUestazz' + msgErroUnicoEANx4 + 'zzRespUestazz' + msgErroUnicoEANx5 + 'zzRespUestazz' + msgErroUnicoEANx6 + 'zzRespUestazz' + msgErroUnicoEANx7 + 'zzRespUestazz' + msgErroUnicoEANx8;

        gs.log('09 - respuestaZ: \n\n' + respuestaZ + '\n', msgLog);

        return respuestaZ;
    },

    // ==============================================================================================================================

    validarUnicosEANxN: function(varID, varEANx) {
        var respuestaZ = 'No';
        var varQueryEAN = 'sys_id!=' + varID;
        // varQueryEAN += '^u_mt_estatus!=Inactivo';
        varQueryEAN += '^u_mt_estatus!=Lectura';
        varQueryEAN += '^u_mt_estatus!=Aprobado';
        varQueryEAN += '^u_mt_estatus!=Rechazado';
        varQueryEAN += '^u_mt_cambio_de_img!=Si';
        varQueryEAN += '^u_mt_pi_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_emp_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_sub_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_bto_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_pal_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_zca_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_pa1_ean=' + varEANx;
        varQueryEAN += '^ORu_mt_ze1_ean=' + varEANx;
        if (opcionEAN != 'Alta')
            varQueryEAN += '^sys_id!=' + opcionEAN;

        // gs.log('02 - Query: '+varQueryEAN, msgLog);	

        var gr00 = new GlideRecord('u_mdm_registros');
        gr00.addEncodedQuery(varQueryEAN);
        gr00.query();
        if (gr00.next()) {
            var varCampoEanLocalizado = '';
            if (gr00.u_mt_pi_ean == varEANx)
                varCampoEanLocalizado = 'pi';
            if (gr00.u_mt_emp_ean == varEANx)
                varCampoEanLocalizado = 'emp';
            if (gr00.u_mt_sub_ean == varEANx)
                varCampoEanLocalizado = 'sub';
            if (gr00.u_mt_bto_ean == varEANx)
                varCampoEanLocalizado = 'bto';
            if (gr00.u_mt_pal_ean == varEANx)
                varCampoEanLocalizado = 'pal';
            if (gr00.u_mt_zca_ean == varEANx)
                varCampoEanLocalizado = 'zca';
            if (gr00.u_mt_pa1_ean == varEANx)
                varCampoEanLocalizado = 'pa1';
            if (gr00.u_mt_ze1_ean == varEANx)
                varCampoEanLocalizado = 'ze1';
            respuestaZ = 'Nombre: "' + gr00.u_mt_nombre.toString() + '"';
            respuestaZ += ' EAN_' + varCampoEanLocalizado + ': "' + varEANx + '"';
            respuestaZ += ' Tipo: "' + gr00.u_mt_tipo_de_solicitud.toString() + '"';
            respuestaZ += ' Etapa: "' + gr00.u_mt_etapa_actual.toString() + '"';
            respuestaZ += ' Estatus: "' + gr00.u_mt_estatus.toString() + '"';
        }
        return respuestaZ;
    },

    // ==============================================================================================================================

    funNumeroEnteroDosEAN: function(eValor, eDigitos00, eDigitos01, eDigitos02) {
        var tempResp = 'No';
        if (eValor == Math.floor(eValor)) { // Es numero entero
            if (eDigitos00 != 0 && (eDigitos00 < eDigitos01 || eDigitos00 > eDigitos02)) { // Validar si longitud de numero
                tempResp = 'Favor de ingresar un numero EAN de 3 a 16 digitos.';
            } else
                tempResp = 'No';
        } else {
            tempResp = 'Favor de ingresar un numero entero EAN de 3 a 16 digitos.';
        }
        return tempResp;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    recuperaNameEtapa: function(numEtapaActual) {
        var nameEtapa = '';
        if (numEtapaActual == "1")
            nameEtapa = 'Etapa01 - Comprador';
        if (numEtapaActual == "2")
            nameEtapa = 'Etapa02 - Asuntos regulatorios';
        if (numEtapaActual == "3")
            nameEtapa = 'Etapa03 - Mercadotecnia';
        if (numEtapaActual == "4")
            nameEtapa = 'Etapa04 - Jefe de Costos';
        if (numEtapaActual == "5")
            nameEtapa = 'Etapa05 - Negociador';
        if (numEtapaActual == "6")
            nameEtapa = 'Etapa06 - DGA';
        if (numEtapaActual == "7")
            nameEtapa = 'Etapa07 - Maestro de Articulos	';
        if (numEtapaActual == "8")
            nameEtapa = 'Etapa08';

        return nameEtapa;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    recuperaSemaforo: function() {
        msgLog = 'JJ_ SemaF_001';
        // gs.log('Entro', msgLog);	

        var respuestaZ = '',
            varCASO = this.getParameter('parm_Caso'),
            varCosto = this.getParameter('parm_Costo'),
            varCostoFinal = 0,
            varFarm = this.getParameter('parm_Farm'),
            varFarmFinal = 0,
            varFee = (this.getParameter('parm_Fee') / 100),
            varConA = (this.getParameter('parm_ConA') / 100),
            varMark = (this.getParameter('parm_Mark') / 100),
            // varConN = (this.getParameter('parm_ConN') / 100),
            varMargenP = 0,
            varMargenD = 0,
            varVadlido = 'No';

        if (varCASO == '64b90b5c97bf0290cc1ebbdfe153af07') { // "Comercial"  

            if (varCosto == 0 || varCosto == 0.00)
                varCostoFinal = varFarm * (1 - varFee) * (1 - varConA);
            else
                varCostoFinal = varCosto * (1 - varFee) * (1 - varConA);

            if (varFarm == 0 || varFarm == 0.00)
                varFarmFinal = varCostoFinal / (1 - varMark);
            else
                varFarmFinal = varFarm;

            varMargenP = (1 - varCostoFinal / varFarmFinal) * 100; // Porcentaje
            varMargenD = varFarmFinal - varCostoFinal; // Dinero

            gs.log('\n varCostoFinal: ' + varCostoFinal + '\n varFarmFinal: ' + varFarmFinal + '\n varMargenP: ' + varMargenP + '\n varMargenD: ' + varMargenD, msgLog);

            if (varMargenD >= 0)
                varVadlido = 'Si';

            respuestaZ += parseFloat(varCosto).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varCostoFinal).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varFarm).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varFarmFinal).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varFee * 100).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varConA * 100).toFixed(2) + 'zzRespUestazz';
            respuestaZ += parseFloat(varMark * 100).toFixed(2) + 'zzRespUestazz';
            // respuestaZ += parseFloat(varConN * 100).toFixed(2) + 'zzRespUestazz';
            if (varMargenD == 0) {
                respuestaZ += '0.00' + 'zzRespUestazz';
                respuestaZ += '0.00' + 'zzRespUestazz';
            } else {
                respuestaZ += varMargenP.toFixed(2) + 'zzRespUestazz';
                respuestaZ += varMargenD.toFixed(2) + 'zzRespUestazz';
            }
            respuestaZ += varVadlido + 'zzRespUestazz';
        }


        /*
		if (varCASO == 'd1a950c397c38e10cc1ebbdfe153afed') { // "01 - Con adicional" Inactivo
            varFarm = varCosto / (1 - varMark);
            varMargenP = 1 - (varCosto * (1 - varConA)) / varFarm; // Decimal
        } else if (varCASO == '46c9908397c38e10cc1ebbdfe153aff3') { // "02 - Sin adicional" Inactivo
            varMargenP = 1 - (varCosto * (1 - varFee) * (1 - varConA) / varFarm);
        } else {
			// Caso03
		}		
		// Caso "01" o "02"
        varMargenD = varFarm * varMargenP;
        varMargenP = varMargenP * 100; // Porcentaje
        respuestaZ += parseFloat(varCosto).toFixed(2) + 'zzRespUestazz';
        respuestaZ += varFarm.toFixed(2) + 'zzRespUestazz';
        respuestaZ += parseFloat(varMark * 100).toFixed(2) + 'zzRespUestazz';
        respuestaZ += parseFloat(varFee * 100).toFixed(2) + 'zzRespUestazz';
        respuestaZ += parseFloat(varConA * 100).toFixed(2) + 'zzRespUestazz';
        respuestaZ += parseFloat(varConN * 100).toFixed(2) + 'zzRespUestazz';
        respuestaZ += varMargenP.toFixed(2) + 'zzRespUestazz';
        respuestaZ += varMargenD.toFixed(2) + 'zzRespUestazz';
		*/
        return respuestaZ;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    recuperaSiPerteneceGrupo: function() {
        // gs.log('Entro', msgLog);	
        var respuestaID = 'No',
            sys_vUser = this.getParameter('parm_vUser'),
            sys_vGrupo = this.getParameter('parm_vGrupo'),
            sys_vAsignado = this.getParameter('parm_vAsignado');
        // --- lvl_01 ----------------------------------------------------------
        var gr01 = new GlideRecord('sys_user_grmember');
        gr01.addEncodedQuery('group=' + sys_vGrupo + '^user=' + sys_vUser);
        gr01.query();
        if (gr01.next()) {
            respuestaID = 'Soy del grupo asignado';
            // --- lvl_02 -----------------------------------------------------
            if (sys_vAsignado == '' || sys_vUser == sys_vAsignado)
                respuestaID = 'Si'
            else
                respuestaID = 'No';
        }
        // --- lvl_03 ---------------------------------------------------------
        var gr02 = new GlideRecord('sys_user_has_role');
        gr02.addEncodedQuery('user=' + sys_vUser + '^role=2831a114c611228501d4ea6c309d626d'); // Rol "admin"
        gr02.query();
        if (gr02.next())
            respuestaID = 'Soy admin';
        // gs.log(filtro, msgLog);
        return respuestaID;
    },

    // ==============================================================================================================================

    recuperaMaterialID: function() {
        // gs.log('Entro', msgLog);	
        var respuestaID,
            sys_id = this.getParameter('parm_RitmID');
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('u_ritm=' + sys_id);
        gr01.query();
        gr01.next();
        respuestaID = gr01.sys_id;
        // gs.log(filtro, msgLog);
        return respuestaID;
    },

    // ==============================================================================================================================

    // No la ocupe
    recuperaAnalistaSr: function() {
        // gs.log('Entro', msgLog);	
        var iUno = 1,
            varQueryGr = '',
            filtro = '';
        varQueryGr += 'group=9b08ff94971b4650cc1ebbdfe153afbc'; // Grupo "mdm Analista Sr"
        var gr01 = new GlideRecord('sys_user_grmember');
        gr01.addEncodedQuery(varQueryGr);
        gr01.query();
        while (gr01.next()) {
            filtro += (iUno == 1) ? '' : '^OR';
            filtro += 'sys_id=' + gr01.user;
            iUno = 2;
        }
        // gs.log(filtro, msgLog);
        return filtro;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    validarExtencionSize: function() {
        var msgFinal = 'Valido',
            sys_id = this.getParameter('sysparm_ArchivoID'),
            ext = this.getParameter('sysparm_ext'),
            size_max = this.getParameter('sysparm_sizeMax');
        var tempArchivoAll = this.getExtensioSize(sys_id);
        var tempArchivo = tempArchivoAll.split('zzZzz');
        // Validar extension
        if (tempArchivo[0] != ext)
            msgFinal = 'NoEsValido';
        // Validar tamaño
        if (Math.floor(size_max) < Math.floor(tempArchivo[1]))
            msgFinal = 'NoEsValido';
        // Ver valida por IA ???
        if (msgFinal == 'Valido') {
            var gr01 = new GlideRecord('u_mdm_options');
            gr01.addEncodedQuery('u_key=mdm_mtr_rixie_img^u_labe=IA_alta_material');
            gr01.query();
            if (gr01.next()) {
                var vIA = gr01.u_value.toString();
                if (vIA == 'true')
                    msgFinal = 'ValidarPorIA';
            }
        }
        return msgFinal;
    },

    // ==============================================================================================================================

    validarExtencionIMG: function() {
        var msgFinal = 'SiEsJPG',
            sys_id = this.getParameter('sysparm_ArchivoID');
        // Validar archivo sea ".jpg"
        varTipoArchivo = this.getExtensio(sys_id);
        if (varTipoArchivo != 'JPG')
            msgFinal = 'NoEsJPG';
        return msgFinal;
    },

    // ==============================================================================================================================

    validarExtencionPDF: function() {
        var msgFinal = 'SiEsPDF',
            sys_id = this.getParameter('sysparm_ArchivoID');
        // Validar archivo sea ".jpg"
        varTipoArchivo = this.getExtensio(sys_id);
        if (varTipoArchivo != 'PDF')
            msgFinal = 'NoEsPDF';
        return msgFinal;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    lecturaExcel: function() {

        var row,
            msgFinal = '',
            varTipoArchivo = '',
            rRespuesta = 'Error',
            // ID del temporal archivo
            sys_id = this.getParameter('sysparm_sysid'),
            sys_tipoSolicitud = this.getParameter('sysparm_vTipoSolicitud'),
            sys_UserLogeado = this.getParameter('sysparm_vUser'),
            numRandom = this.getParameter('sysparm_numRandom');

        // Validar archivo sea ".xlsx"
        varTipoArchivo = this.getExtensio(sys_id);

        if (varTipoArchivo == 'XLSX') {

            // ------------------------- Excel ------------------------- 
            var parser = new sn_impex.GlideExcelParser();
            var attachment = new GlideSysAttachment();

            // Use sys_id del excel attachment. 
            var attachmentStream = attachment.getContentStream(sys_id);
            parser.parse(attachmentStream);

            // Recuperar los encabezados de columna.
            var headers = parser.getColumnHeaders();
            var c01 = headers[0], // 'A'
                c02 = headers[1], // 'B'
                c03 = headers[2], // 'C'
                c04 = headers[3], // 'D'
                c05 = headers[4], // 'E'
                c06 = headers[5], // 'F'
                c07 = headers[6], // 'G'
                c08 = headers[7], // 'H'
                c09 = headers[8], // 'I'
                c10 = headers[9], // 'J'
                c11 = headers[10], // 'K'
                c12 = headers[11], // 'L'
                c13 = headers[12], // 'M'
                c14 = headers[13], // 'N'
                c15 = headers[14], // 'O'
                c16 = headers[15], // 'P'
                c17 = headers[16], // 'Q'
                c18 = headers[17], // 'R'
                c19 = headers[18], // 'S'
                c20 = headers[19], // 'T'
                c21 = headers[20], // 'U'
                c22 = headers[21], // 'V'
                c23 = headers[22], // 'W'
                c24 = headers[23], // 'X'
                c25 = headers[24], // 'Y'
                c26 = headers[25], // 'Z'
                c27 = headers[26], // 'AA'
                c28 = headers[27], // 'AB'
                c29 = headers[28], // 'AC'
                c30 = headers[29], // 'AD'
                c31 = headers[30], // 'AE'
                c32 = headers[31], // 'AF'
                c33 = headers[32], // 'AG'
                c34 = headers[33], // 'AH'
                c35 = headers[34], // 'AI'
                c36 = headers[35], // 'AJ'
                c37 = headers[36], // 'AK'
                c38 = headers[37], // 'AL'
                c39 = headers[38], // 'AM'
                c40 = headers[39], // 'AN'
                c41 = headers[40], // 'AO'
                c42 = headers[41], // 'AP'
                c43 = headers[42], // 'AQ'
                c44 = headers[43], // 'AR'
                c45 = headers[44], // 'AS'
                c46 = headers[45], // 'AT'
                c47 = headers[46], // 'AU'
                c48 = headers[47], // 'AV'
                c49 = headers[48], // 'AW'
                c50 = headers[49], // 'AX'
                c51 = headers[50], // 'AY'
                c52 = headers[51], // 'AZ'
                c53 = headers[52], // 'BA'
                c54 = headers[53], // 'BB'
                c55 = headers[54], // 'BC'
                c56 = headers[55], // 'BD'
                c57 = headers[56], // 'BE'
                c58 = headers[57], // 'BF'
                c59 = headers[58], // 'BG'
                c60 = headers[59], // 'BH'
                c61 = headers[60], // 'BI'
                c62 = headers[61], // 'BJ'
                c63 = headers[62], // 'BK'
                c64 = headers[63], // 'BL'
                c65 = headers[64], // 'BM'
                c66 = headers[65], // 'BN'
                c67 = headers[66], // 'BO'
                c68 = headers[67], // 'BP'
                c69 = headers[68], // 'BQ'
                c70 = headers[69], // 'BR'
                c71 = headers[70], // 'BS'
                c72 = headers[71], // 'BT'
                c73 = headers[72], // 'BU'
                c74 = headers[73], // 'BV'
                c75 = headers[74], // 'BW'
                c76 = headers[75], // 'BX'
                c77 = headers[76], // 'BY'
                c78 = headers[77], // 'BZ'
                c79 = headers[78], // 'CA'
                c80 = headers[79], // 'CB'
                c81 = headers[80], // 'CC'
                c82 = headers[81], // 'CD'
                c83 = headers[82], // 'CE'
                c84 = headers[83], // 'CF'
                c85 = headers[84], // 'CG'
                c86 = headers[85], // 'CH'
                c87 = headers[86]; // 'CI'

            // Variables 
            var eTemp,
                eTempAuto,
                eTempColum,
                eTempArreglo,
                eTempValor,
                eTempVacio,
                eTempNumValido,
                eEnGrupo,
                eEnGrupoValor,
                eAll = [0], //  [0] = [Vacio]
                eAllError = [],
                eLinea = 1,
                eLineasCorrectas = 0,
                eLineasConError = 0,
                strRespuesta,
                strRespuestaArray,
                dDep,
                dDepCol,
                dCat,
                dCatCol,
                dSub,
                dSubCol;

            // eTemp = [eLinea, c01, c02, c03, c04];
            eTemp = 'Vacio'; // No necesito los tilulos
            eAll.push(eTemp); // [1] = [Titulos]  
            variableSetListado = '[';

            // Recorido de los registros del la fila 2 en adelante
            while (parser.next()) {
                row = parser.getRow();
                eLinea++; // [2] inicia 1 mas el "++"
                eTempError = 'No';
                eMsgError = '';



                // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                eTempColum = 'A';
                eTempValor = row[c01];
                if (eTempValor != null && eLinea >= 5) { // Quiero que inicie en la linea "5"

                    // No voy a almacenarlos en array temporal "eTemp"
                    // eTemp = [eLinea, row[c01], row[c02], row[c03], row[c04]]; 

                    var gr = new GlideRecord('u_mdm_registros');
                    gr.initialize();
                    gr.u_mt_estatus = 'Lectura';
                    gr.u_mt_id_random = numRandom;
                    gr.u_extra_01 = eLinea.toString();
                    gr.u_lab_razon_social = eTempValor;



                    eEnGrupo = 'No-zzZzz-';
                    eEnGrupoValor = '00Vacio00';

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'B';
                    eTempArreglo = row[c02];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_lab_rfc = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // gs.log(eLinea + ' Esperando proveedores. 666', msgLog);
                    // gr.u_mt_plazo_de_pago = (eTempValor == '00Vacio00') ? '' : this.recuperaPlazo(eTempValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'ID de carga';
                    gr.u_lab_caraga_id = '';

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'C';
                    eTempArreglo = row[c03];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo.replace(/[\r\n]+/g, " ");
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_nombre = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    eTempValor = eTempValor.replaceAll('"', 'In.'); // Solo vista VariableSet
                    variableSetName = eTempValor;


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'UNIDAD(es) DEL PRODUCTO PI';
                    gr.u_mt_pi_unidad_id = 'PI';
                    gr.u_mt_pi_unidad = '60ceefa01be9c610a9f8766dcc4bcb1e';
                    // Caso especial ya que no nomeclatura de "PI" es en automatico
                    // eEnGrupo = eTempColum;
                    // eEnGrupoValor = eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'D';
                    eTempArreglo = row[c04];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    eTempNumValido = this.validarVacioNumeroEnteroDigitosDos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 3, 16, eTempMsg);
                    eTempUnicoEs = 'Si';
                    eTempNumValido = (eTempNumValido == true) ? this.validarUnicoEAN(eLinea, eTempColum, eTempValor, 'PI') : 'Valor invalido';
                    gr.u_mt_pi_ean = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    variableSetEanIP = eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'Piezas por empaque PI';
                    gr.u_mt_pi_piezas = '1';

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'E';
                    eTempArreglo = row[c05];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_pi_longitud_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'F';
                    eTempArreglo = row[c06];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_pi_ancho_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'G';
                    eTempArreglo = row[c07];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_pi_altura_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'H';
                    eTempArreglo = row[c08];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_pi_pesos_gr = (eTempValor == '00Vacio00') ? '' : eTempValor;


                    eEnGrupo = 'No-zzZzz-';


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'I';
                    eTempArreglo = row[c09];
                    // eTempArreglo = 'Empaque';
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_emp_unidad', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_emp_unidad_id = 'EMP';
                    gr.u_mt_emp_unidad = 'ecceefa01be9c610a9f8766dcc4bcb1e';
                    eEnGrupo = eTempColum;
                    eEnGrupoValor = eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'J';
                    eTempArreglo = row[c10];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    eTempNumValido = this.validarVacioNumeroEnteroDigitosDos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', 3, 16, eTempMsg);
                    eTempUnicoEs = 'Si';
                    eTempNumValido = (eTempNumValido == true) ? this.validarUnicoEAN(eLinea, eTempColum, eTempValor, 'EMP') : 'Valor invalido';
                    gr.u_mt_emp_ean = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, '00Vacio00');
                    variableSetEanEMP = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    /*
					eTempColum = 'K';
                    eTempArreglo = row[c11];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumeroEntero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_emp_piezas = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor + ' -' + eEnGrupo + ' -' + eEnGrupoValor, msgLog);					
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);
					*/
                    eTempColum = 'K';
                    eTempArreglo = row[c11];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumeroEntero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', eTempMsg);
                    gr.u_mt_emp_piezas = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'L';
                    eTempArreglo = row[c12];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    gr.u_mt_emp_longitud_cm = eTempValor;
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', eTempMsg);
                    gr.u_mt_emp_longitud_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, '00Vacio00');

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'M';
                    eTempArreglo = row[c13];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', eTempMsg);
                    gr.u_mt_emp_ancho_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, '00Vacio00');

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'N';
                    eTempArreglo = row[c14];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', eTempMsg);
                    gr.u_mt_emp_altura_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, '00Vacio00');

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'O';
                    eTempArreglo = row[c15];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, '00Vacio00', eTempMsg);
                    gr.u_mt_emp_pesos_gr = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    // this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, '00Vacio00');


                    eEnGrupo = 'No-zzZzz-';


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'P';
                    eTempArreglo = row[c16];
                    // eTempArreglo = 'Sub empaque';
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_sub_unidad', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_sub_unidad_id = 'SUB';
                    gr.u_mt_sub_unidad = 'a0ceefa01be9c610a9f8766dcc4bcb1f';
                    eEnGrupo = eTempColum;
                    eEnGrupoValor = eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'Q';
                    eTempArreglo = row[c17];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    eTempNumValido = this.validarVacioNumeroEnteroDigitosDos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 3, 16, eTempMsg);
                    eTempUnicoEs = 'Si';
                    eTempNumValido = (eTempNumValido == true) ? this.validarUnicoEAN(eLinea, eTempColum, eTempValor, 'SUB') : 'Valor invalido';
                    gr.u_mt_sub_ean = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);
                    variableSetEanSUB = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'R';
                    eTempArreglo = row[c18];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumeroEntero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_sub_piezas = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'S';
                    eTempArreglo = row[c19];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_sub_longitud_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'T';
                    eTempArreglo = row[c20];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_sub_ancho_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'U';
                    eTempArreglo = row[c21];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_sub_altura_cm = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'V';
                    eTempArreglo = row[c22];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_sub_pesos_gr = (eTempValor == '00Vacio00') ? '' : eTempValor;
                    this.validarPerteneceGrupo(eLinea, eTempColum, eTempValor, eEnGrupo, eEnGrupoValor);



                    eEnGrupo = 'No-zzZzz-';
                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'W';
                    eTempArreglo = row[c23];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_tipo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_tipo_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_tipo = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];
                    gr.u_mt_agrupaci_n_de_material_ssa_ref = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[6];

                    /*
                    if (strRespuestaArray[1] == '64ceefa01be9c610a9f8766dcc4bcb1f') {
                        // "H100" - Farma sin Clasificar: Sin fracción familia 1 - Vacio
                    } else if (strRespuestaArray[1] == 'a8ceefa01be9c610a9f8766dcc4bcb20') {
                        // "H200" - No Farma sin Clasificar: Familia 2 - Vacio
                    } else {
                        // Caso del "H101" a "H106"
                        gr.u_mt_tmpohastacaduc = '12';
                        gr.u_mt_durtotalconserv = '42';
                        gr.u_mt_ind_periodo_ref = '7cd48767971fca10cc1ebbdfe153af3e';
                        gr.u_mt_regla_redondeo_ref = 'a238f4b11bf1ce10a9f8766dcc4bcbfb';
                        gr.u_mt_gr_ctrl_calidad_ref = '11e9b4751bf1ce10a9f8766dcc4bcb37';
                    }
					*/



                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'X';
                    eTempArreglo = row[c24];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_formula', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_formula = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'Y';
                    eTempArreglo = row[c25];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_clasificacion_fiscal', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_clasificacion_fiscal_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_clasificacion_fiscal = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'Z';
                    eTempArreglo = row[c26];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_gpo_trat_logistico', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_gpo_trat_logistico_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_gpo_trat_logistico = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'Circulo de la Salud';
                    gr.u_mt_circulo_salud_id = '004';
                    gr.u_mt_circulo_salud = 'acceefa01be9c610a9f8766dcc4bcb22';

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AA';
                    eTempArreglo = row[c27];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_antibiotico', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_antibiotico_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_antibiotico = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempAuto = 'Devolución del cliente.';
                    gr.u_mt_devolucion_del_cliente_id = '';
                    gr.u_mt_devolucion_del_cliente = 'e4ceefa01be9c610a9f8766dcc4bcb23';

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AB';
                    eTempArreglo = row[c28];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    // this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_fac_div', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_division_factura = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_division_factura_ref = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AC';
                    eTempArreglo = row[c29];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_anexo_20_sat = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AD';
                    eTempArreglo = row[c30];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_formula_farmaceutica', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_formula_farmaceutica_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_formula_farmaceutica = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AE';
                    eTempArreglo = row[c31];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_registro_sanitario = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AF';
                    eTempArreglo = row[c32];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo; // 
                    eTempVacio = 'Si';
                    eTempMsg = 'Debe se un numero de 8 digitos. AñoMesDia "20240125".';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumeroEnteroDigitos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 8, eTempMsg);
                    gr.u_mt_registro_sanitario_vigencia = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AG';
                    eTempArreglo = row[c33];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_registro_sanitario_vigencia_prorroga = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AH';
                    eTempArreglo = row[c34];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_01_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_01 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AI';
                    eTempArreglo = row[c35];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_02_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_02 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AJ';
                    eTempArreglo = row[c36];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_03_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_03 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AK';
                    eTempArreglo = row[c37];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_04_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_04 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AL';
                    eTempArreglo = row[c38];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_05_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_05 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AM';
                    eTempArreglo = row[c39];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_06_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_06 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AN';
                    eTempArreglo = row[c40];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_07_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_07 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AO';
                    eTempArreglo = row[c41];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_08_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_08 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AP';
                    eTempArreglo = row[c42];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_09_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_09 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AQ';
                    eTempArreglo = row[c43];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_10_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_10 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AR';
                    eTempArreglo = row[c44];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_11_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_11 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AS';
                    eTempArreglo = row[c45];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_12_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_12 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AT';
                    eTempArreglo = row[c46];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_13_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_13 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AU';
                    eTempArreglo = row[c47];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_14_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_14 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AV';
                    eTempArreglo = row[c48];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_activo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_activo_15_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_activo_15 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AW';
                    eTempArreglo = row[c49];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_gramaje_tipo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_gramaje_tipo_01_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_gramaje_tipo_01 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AX';
                    eTempArreglo = row[c50];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_gramaje_tipo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_gramaje_tipo_02_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_gramaje_tipo_02 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AY';
                    eTempArreglo = row[c51];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_gramaje_tipo', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_gramaje_tipo_03_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_gramaje_tipo_03 = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'AZ';
                    eTempArreglo = row[c52];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_gramaje_contenido_01 = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BA';
                    eTempArreglo = row[c53];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_gramaje_contenido_02 = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BB';
                    eTempArreglo = row[c54];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_gramaje_contenido_03 = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BC';
                    eTempArreglo = row[c55];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumeroEntero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_num_piezas_por_unidad = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BD';
                    eTempArreglo = row[c56];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_precio_farmacia = (eTempValor == '00Vacio00') ? '0.00' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BE';
                    eTempArreglo = row[c57];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_precio_publico = (eTempValor == '00Vacio00') ? '0.00' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BF';
                    eTempArreglo = row[c58];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_precio_lista = (eTempValor == '00Vacio00') ? '0.00' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BG';
                    eTempArreglo = row[c59];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacioNumero(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_precio_costo = (eTempValor == '00Vacio00') ? '0.00' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BH';
                    eTempArreglo = row[c60];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_d_dep', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_d_departamento_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_d_departamento = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];
                    dDepCol = eTempColum;
                    dDep = (eTempValor == '00Vacio00') ? eTempValor : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BI';
                    eTempArreglo = row[c61];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
					strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'MultiOpc' + 'zzRespUestazz' + 'mdm_d_cat' + 'zzRespUestazz' + 'mdm_d_dep' + 'zzRespUestazz' + dDep, eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_d_categoria_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_d_categoria = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];
                    dCatCol = eTempColum;
                    dCat = (eTempValor == '00Vacio00') ? eTempValor : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BJ';
                    eTempArreglo = row[c62];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'MultiOpc' + 'zzRespUestazz' + 'mdm_d_sub' + 'zzRespUestazz' + 'mdm_d_cat' + 'zzRespUestazz' + dCat, eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_d_subcategoria_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_d_subcategoria = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];
                    dSubCol = eTempColum;
                    dSub = (eTempValor == '00Vacio00') ? eTempValor : strRespuestaArray[1];


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    // Validar Dep -> Cat -> Sub
                    this.validarDepCatSub(eLinea, dDepCol, dDep, dCatCol, dCat, dSubCol, dSub);


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BK';
                    eTempArreglo = row[c63];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_descripcion_mercadologica = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BL';
                    eTempArreglo = row[c64];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_beneficios = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BM';
                    eTempArreglo = row[c65];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_ecommerce = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BN';
                    eTempArreglo = row[c66];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_indicacion_terapeutica = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BO';
                    eTempArreglo = row[c67];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_contraindicacion = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BP';
                    eTempArreglo = row[c68];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_leyenda_de_proteccion = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BQ';
                    eTempArreglo = row[c69];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_prescripcion = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BR';
                    eTempArreglo = row[c70];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_advertencias = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BS';
                    eTempArreglo = row[c71];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_interaccion_medicamentosa = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BT';
                    eTempArreglo = row[c72];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_racciones_adversas = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BU';
                    eTempArreglo = row[c73];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_manjo_de_sobredosificacion = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BV';
                    eTempArreglo = row[c74];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_propiedad_farmaceutica = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BW';
                    eTempArreglo = row[c75];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_dosis = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BX';
                    eTempArreglo = row[c76];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_via_de_administracion = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BY';
                    eTempArreglo = row[c77];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_clave_cnis = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'BZ';
                    eTempArreglo = row[c78];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_embarazo = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'CA';
                    eTempArreglo = row[c79];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_lactancia = (eTempValor == '00Vacio00') ? '' : eTempValor;

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'CB';
                    eTempArreglo = row[c80];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'Si';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    gr.u_mt_nominacion_generica = (eTempValor == '00Vacio00') ? '' : eTempValor;


                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'CC';
                    eTempArreglo = row[c81];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_linea_del_proveedor', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_linea_del_proveedor_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_linea_del_proveedor = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];

                    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    eTempColum = 'CD';
                    eTempArreglo = row[c82];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    strRespuesta = this.validarVacioReferent(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 'mdm_mt_marca_del_producto', eTempMsg);
                    strRespuestaArray = strRespuesta.split('zzZzz');
                    gr.u_mt_marca_del_producto_id = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[2];
                    gr.u_mt_marca_del_producto = (eTempValor == '00Vacio00') ? '' : strRespuestaArray[1];







                    // Hay error ???					
                    // gs.log(eLinea +' Error: ' + eTempError, msgLog);

                    if (eTempError == 'No') {

                        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                        // Compuestos
                        /*
                        vTempMsg = '';
                        vTempMsg += row[c03].toString() + ' - ';
                        vTempMsg += row[c04].toString() + ' - ';
                        // vTempMsg += 'No_Material' + ' - ';
                        // vTempMsg += 'Concepto_de_búsqueda' + ' - ';
                        vTempMsgTemp = row[c60];
                        vTempMsgTemp = (vTempMsgTemp == null) ? '00Vacio00' : vTempMsgTemp;
                        if (vTempMsgTemp != '00Vacio00') {
                            vTempMsgTemp = vTempMsgTemp.replace(/_/g, ' '); // Remplazar caracteres "_" por " ".
                            vTempMsg += vTempMsgTemp + ' - ';
                        } else {
                            vTempMsg += 'Sin Departarmento - ';
                        }
                        vTempMsgTemp = row[c61];
                        vTempMsgTemp = (vTempMsgTemp == null) ? '00Vacio00' : vTempMsgTemp;
                        if (vTempMsgTemp != '00Vacio00') {
                            vTempMsgTemp = vTempMsgTemp.replace(/_/g, ' '); // Remplazar caracteres "_" por " ".
                            vTempMsg += vTempMsgTemp + ' - ';
                        } else {
                            vTempMsg += 'Sin Categoria - ';
                        }
                        vTempMsgTemp = row[c62];
                        vTempMsgTemp = (vTempMsgTemp == null) ? '00Vacio00' : vTempMsgTemp;
                        if (vTempMsgTemp != '00Vacio00') {
                            vTempMsgTemp = vTempMsgTemp.replace(/_/g, ' '); // Remplazar caracteres "_" por " ".
                            vTempMsg += vTempMsgTemp;
                        } else {
                            vTempMsg += 'Sin SubCategoria';
                        }
                        gr.u_mt_metadescripcion = vTempMsg;

                        vTempMsg = vTempMsg + ' - ' + row[c65].toString();
                        gr.u_mt_keywords_complementario = vTempMsg;

                        vTempMsg = '##' + row[c03].toString();
                        vTempMsg = vTempMsg.replace(/[^a-zA-Z0-9]/g, ''); // Quitar caracteres raros y espacios en blanco
                        gr.u_mt_caption_link = vTempMsg;
						*/



                        gr.u_mt_proveedor = sys_UserLogeado;
                        // gr.u_mt_proveedor_anterior = sys_UserLogeado;

                        // MANUAL
                        gr.u_mt_tpmaterial_ref = '1d3de0751bb1ce10a9f8766dcc4bcb68'; // NHAW
                        gr.u_mt_ramo_ref = '01bdac751bb1ce10a9f8766dcc4bcb4c'; // P
                        gr.u_mt_sector_ref = '2ba4307d1bb1ce10a9f8766dcc4bcb61'; // ??
                        gr.u_mt_jquia_producto_ref = '60d9e6a397474250cc1ebbdfe153afcc'; // ??
                        gr.u_mt_statusmat_ref = '0ef638bd1bb1ce10a9f8766dcc4bcb87'; // SB
                        gr.u_mt_status_ref = '0ef638bd1bb1ce10a9f8766dcc4bcb87'; // SB
                        gr.u_mt_susbonifes_ref = '4a97bc711bf1ce10a9f8766dcc4bcb11'; // 1
                        gr.u_mt_grposgral_ref = '5bb8f8f11bf1ce10a9f8766dcc4bcbe6'; // NORM
                        gr.u_mt_fecad_feex_ref = '6de870351bf1ce10a9f8766dcc4bcb3c'; // B					
                        gr.u_mt_idioma_ref = '426b46b3975b0e10cc1ebbdfe153afbe'; // ESP
                        gr.u_mt_movimiento_sn = 'cd46271497a3ce10cc1ebbdfe153af13'; // Alta

                        gr.u_mt_bto_unidad_id = 'BTO';
                        gr.u_mt_bto_unidad = 'b5d828b41b389690a9f8766dcc4bcb0c';
                        gr.u_mt_pal_unidad_id = 'PAL';
                        gr.u_mt_pal_unidad = '741eeda997f5a210cc1ebbdfe153af7b';
                        gr.u_mt_zca_unidad_id = 'ZCA';
                        gr.u_mt_zca_unidad = '935eeda997f5a210cc1ebbdfe153af9a';
                        gr.u_mt_pa1_unidad_id = 'PA1';
                        gr.u_mt_pa1_unidad = 'b68eada997f5a210cc1ebbdfe153af84';
                        gr.u_mt_ze1_unidad_id = 'ZE1';
                        gr.u_mt_ze1_unidad = '4caeada997f5a210cc1ebbdfe153af96';

                        gr.u_mt_valido = 'Valido';
                        gr.u_mt_tipo_de_solicitud = sys_tipoSolicitud;

                        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                        // Variables para test

                        if (vLlenarVariablesTest) {
                            // 00 Laboratorio / Se remplaza si agregas uno por ITEM alta materiales
                            gr.u_mt_comprador = '8b60bd701b5b5510a9f8766dcc4bcb9b';
                            gr.u_mt_negaciador = 'dd4541391b285150a9f8766dcc4bcb89';
                            gr.u_mt_dga = '8fb0372f1bf3d950f803311d1e4bcb92';
                            // 02 Asuntos regulatorios
                            gr.u_mt_condicion_de_temperatura = '943338f91bb1ce10a9f8766dcc4bcbeb';
                            gr.u_mt_sujeto_a_lote = 'bbccdae397074250cc1ebbdfe153afbd';
                            gr.u_mt_indicador_manipulacion = 'd09970751bf1ce10a9f8766dcc4bcb45';
                            gr.u_mt_grupo_control_calidad = '0be9b0751bf1ce10a9f8766dcc4bcbc1';
                            gr.u_mt_grupo_de_material_2 = 'd510e6e797074250cc1ebbdfe153af14';
                            gr.u_mt_jerarquia_de_productos = 'd8d9e6a397474250cc1ebbdfe153af6f';
                            // 04 Jefe de costos
                            gr.u_mt_analista_sr = '39cfc51a93e71e102f6cb70e1dba103f';
                            // 07 Maesto de materiales
                            gr.u_mt_no_material_anterior = '11111111';
                            gr.u_mt_2_unidad = '39736ae61b770610a9f8766dcc4bcbcc';
                            gr.u_mt_grtransp_ref = '05a3bcf91bb1ce10a9f8766dcc4bcbef';
                            gr.u_mt_valido_de = '10-06-2025';
                            gr.u_mt_validez_de = '15-06-2025';
                            gr.u_mt_fabricante = '1111111111';
                            gr.u_mt_denomin = '11111 Deno';
                        }

                        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                        eLineasCorrectas++;
                        var varTempID_MK = gr.insert();

                        // Actualizar MK
                        var tempActualizarMKExcel = this.mdm_ActualizarName_RegUpdate(varTempID_MK, row[c03].toString()); // (Reg, Nombre)



                        // eAll.push(eTemp);

                        variableSetListado += (eLineasCorrectas == 1) ? '{' : ',{';
                        variableSetListado += '"vs_nombre_completo_del_material":"' + variableSetName + '",';
                        variableSetListado += '"vs_unidad_del_producto_id_pi":"' + variableSetEanIP + '",';
                        variableSetListado += '"vs_unidad_del_producto_id_emp":"' + variableSetEanEMP + '",';
                        variableSetListado += '"vs_unidad_del_producto_id_sub":"' + variableSetEanSUB + '"';
                        variableSetListado += '}';



                    } else {
                        eLineasConError++;
                        eMsgError = 'Linea ' + eLinea + '\n' + eMsgError;
                        eAllError.push(eMsgError);
                        // gs.log(eLinea + eMsgError, msgLog);
                    }
                } else {
                    // Filas no juegan si no tiene "Razón Social" [A]
                }
            }
            variableSetListado += ']';


            // Mensage de regreso
            // msgFinal += '\nExcel: \n';
            if (eLineasConError >= 1) {
                variableSetListado = ''; // Vacio
                msgFinal += 'Registros en estatus correcto: ' + eLineasCorrectas + '\n';
                msgFinal += 'Registros en con errores: ' + eLineasConError + '\n\n\n';
                msgFinal += 'Favor de corregir los siguientes campos: \n\n';
                for (var i = 0; i < eAllError.length; i++) {
                    msgFinal += eAllError[i] + '\n';
                }


                /* "Habilitame al FINAL" ************************************************** */
                if (eLineasConError >= 1) {
                    var varQuery = 'u_mt_id_random=' + numRandom + '^u_mt_estatus=Lectura';
                    var grError = new GlideRecord('u_mdm_registros');
                    grError.addEncodedQuery(varQuery);
                    grError.query();
                    grError.next();
                    grError.deleteMultiple();
                }
                // ************************************************************************** 

            } else {
                msgFinal += 'Registros en estatus correcto: ' + eLineasCorrectas + '\n';
                msgFinal += 'Lectura exitosa.';
                rRespuesta = 'Correcto';
            }

            // gs.log(msgFinal, msgLog);

            // eAll[0] es creado con "0"
            // eAll[1] es el Titulo de la columna
            // gs.log('Linea 3 Excel: ' + eAll[3], msgLog);		

        } else {
            msgFinal = 'NoEsExcel';
        }
        return rRespuesta + 'zzRespUestazz' + msgFinal + 'zzRespUestazz' + variableSetListado + 'zzRespUestazz' + eLineasCorrectas;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    getExtensio: function(id_archivo) {
        var gr01 = new GlideRecord('sys_attachment');
        gr01.addEncodedQuery('sys_id=' + id_archivo);
        gr01.query();
        gr01.next();
        var respuesta = gr01.file_name.toString(); // ArchivoTest.xlsx
        var arrayReverseRespuesta = respuesta.split('.').reverse(); // xlsx,ArchivoTest
        respuesta = arrayReverseRespuesta[0].toUpperCase();
        return respuesta;
    },

    // ==============================================================================================================================

    getExtensioSize: function(id_archivo) {
        var gr01 = new GlideRecord('sys_attachment');
        gr01.addEncodedQuery('sys_id=' + id_archivo);
        gr01.query();
        gr01.next();
        var respuesta = gr01.file_name.toString(); // ArchivoTest.xlsx
        var arrayReverseRespuesta = respuesta.split('.').reverse(); // xlsx,ArchivoTest
        respuesta = arrayReverseRespuesta[0].toUpperCase() + 'zzZzz' + gr01.size_bytes;
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacio: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vTempMsg) {
        var respuesta = true;
        if (vValor == '00Vacio00' && vVacio != 'Si') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
                respuesta = false;
            }
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacioNumero: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vTempMsg) {

        // eMsgError += '"' +vValor+' - '+ vVacio+' - '+ vEnGrupo+' - '+ vEnGrupoValor+' - '+ vTempMsg +'".\n';
        // "6E13.1NoNo-zzZzz-00Vacio00No".

        var respuesta = true;
        if (vValor == '00Vacio00') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
                respuesta = false;
            }
        } else {
            if (isNaN(vValor)) {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Debe se numero.\n';
                respuesta = false;
            }
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacioNumeroEntero: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vTempMsg) {
        var respuesta = true;
        if (vValor == '00Vacio00') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
                respuesta = false;
            }
        } else if (vValor != Math.floor(vValor)) {
            eTempError = 'Si';
            eMsgError += '"' + vColum + vLinea + '" Debe se un numero entero.\n';
            respuesta = false;
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacioNumeroEnteroDigitos: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vDigitos, vTempMsg) {
        var respuesta = true;
        if (vValor == '00Vacio00') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
                respuesta = false;
            }
        } else if (vValor != Math.floor(vValor) || vValor.length != vDigitos) {
            eTempError = 'Si';
            if (vTempMsg == 'No')
                eMsgError += '"' + vColum + vLinea + '" Debe se un numero de ' + vDigitos + ' digitos.\n';
            else
                eMsgError += '"' + vColum + vLinea + '" ' + vTempMsg + '\n';
            respuesta = false;
        } else {
            // Todo bien

            // Validar Formato AñoMesDia y fecha valida -------------- Inicio --------------
            if (vColum == 'AF') {
                var varFechaValida;
                // FORMATO	
                var RegExPattern = /^(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/; // Caso[03]
                if ((vValor.match(RegExPattern)) && (vValor != '')) {
                    // FECHA EXISTE
                    y = vValor.substring(0, 4);
                    m = vValor.substring(4, 6);
                    d = vValor.substring(6, 8);
                    var existeFecha = m > 0 && m < 13 && y > 0 && y < 32768 && d > 0 && d <= (new Date(y, m, 0)).getDate();
                    if (existeFecha) {
                        varFechaValida = true;
                    } else {
                        varFechaValida = false;
                    }
                } else {
                    varFechaValida = false;
                }
                // Resultado
                if (varFechaValida == false) {
                    vTempMsg += ' Fecha invalida "' + vValor + '".';
                    eTempError = 'Si';
                    eMsgError += '"' + vColum + vLinea + '" ' + vTempMsg + '\n';
                }
            }
            // Validar Formato AñoMesDia y fecha valida -------------- Fin --------------

        }
        return respuesta;
    },

    // ==============================================================================================================================

    recuperaPlazo: function(vRFC) {
        var respuesta = '';
        var gr02 = new GlideRecord('u_mdm_proveedores');
        gr02.addEncodedQuery('u_rfc=' + vRFC);
        gr02.query();
        if (gr02.next()) {
            respuesta = gr02.u_plazo_de_pago.toString();
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacioNumeroEnteroDigitosDos: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vDigitos01, vDigitos02, vTempMsg) {
        var respuesta = true;
        if (vValor == '00Vacio00') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
                respuesta = false;
            }
        } else if (vValor != Math.floor(vValor) || vValor.length < vDigitos01 || vValor.length > vDigitos02) {
            eTempError = 'Si';
            if (vTempMsg == 'No')
                eMsgError += '"' + vColum + vLinea + '" Debe se un numero entre ' + vDigitos01 + ' y ' + vDigitos02 + ' digitos.\n';
            else
                eMsgError += '"' + vColum + vLinea + '" ' + vTempMsg + '\n';
            respuesta = false;
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarVacioReferent: function(vLinea, vColum, vValor, vVacio, vEnGrupo, vEnGrupoValor, vKeyAll, vTempMsg) {
        var respuesta = '',
            aRespuesta;
        if (vValor == '00Vacio00') {
            if (vVacio == 'Si') {
                if (vEnGrupo == 'No-zzZzz-') {
                    // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                } else {
                    if (vEnGrupoValor == '00Vacio00') {
                        // Puede ir "Vacio" ya que no esta relacionado a ninguna columna.
                    } else {
                        eTempError = 'Si';
                        eMsgError += '"' + vColum + vLinea + '" Campo vacio, es necesario para columna "' + vEnGrupo + vLinea + '".\n';
                        respuesta = false;
                    }
                }
            } else {
                eTempError = 'Si';
                eMsgError += '"' + vColum + vLinea + '" Campo vacio.\n';
            }
            respuesta = 'NOzzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00';
        } else {

            // 8888

            var vKey = vKeyAll.substring(0, 8);
            // gs.log('vKey '+vKey ,'jj002');

            if (vKey != 'MultiOpc') {
                respuesta = this.buscarMDMoption(vKeyAll, vValor);
                aRespuesta = respuesta.split('zzZzz');
                if (aRespuesta[0] != 'SI') {
                    eTempError = 'Si';
                    eMsgError += '"' + vColum + vLinea + '" La opcion NO fue encontrado en el listado.\n';
                }
            } else {

                vKey = vKeyAll.toString().split('zzRespUestazz');
                // gs.log('vKey '+vKey[0] + '\n vKeyAll'+vKeyAll,'jj002');

                respuesta = this.buscarMDMoptionMultiple(vKey[1], vValor, vKey[2], vKey[3]);
                aRespuesta = respuesta.split('zzZzz');
                if (aRespuesta[0] != 'SI') {
                    eTempError = 'Si';
                    eMsgError += '"' + vColum + vLinea + '" La opcion NO fue encontrado en el listado.\n';
                }
            }



        }
        return respuesta;
    },

    // ==============================================================================================================================

    buscarMDMoptionMultiple: function(strKEY01, strLABE01, strKEY02, strLABE02) {

        if (strKEY02 == 'mdm_d_dep')
            strKEY02 = 'u_ref01';		
		if (strKEY02 == 'mdm_d_cat')
            strKEY02 = 'u_ref02';		
		
        // gs.log('u_key=' + strKEY01 + '^u_labe=' + strLABE01 + '^ORu_labeENDSWITH(' + strLABE01 + ')^' + strKEY02 + '=' + strLABE02, 'jj002');

        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('u_key=' + strKEY01 + '^u_labe=' + strLABE01 + '^ORu_labeENDSWITH(' + strLABE01 + ')^' + strKEY02 + '=' + strLABE02);
        gr01.query();
        var respuesta = 'NOzzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00';
        if (gr01.next()) {
            respuesta = 'SI';
            respuesta += 'zzZzz' + gr01.sys_id.toString();
            respuesta += 'zzZzz' + gr01.u_value.toString();
            respuesta += 'zzZzz' + gr01.u_field01.toString();
            respuesta += 'zzZzz' + gr01.u_field02.toString();
            respuesta += 'zzZzz' + gr01.u_field03.toString();
            respuesta += 'zzZzz' + gr01.u_ref01.toString();
            respuesta += 'zzZzz' + gr01.u_ref02.toString();
        }
        return respuesta;
    },

    // ==============================================================================================================================

    buscarMDMoption: function(strKEY, strLABE) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('u_key=' + strKEY + '^u_labe=' + strLABE + '^ORu_labeENDSWITH(' + strLABE + ')');
        gr01.query();
        var respuesta = 'NOzzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00zzZzz00Vacio00';
        if (gr01.next()) {
            respuesta = 'SI';
            respuesta += 'zzZzz' + gr01.sys_id.toString();
            respuesta += 'zzZzz' + gr01.u_value.toString();
            respuesta += 'zzZzz' + gr01.u_field01.toString();
            respuesta += 'zzZzz' + gr01.u_field02.toString();
            respuesta += 'zzZzz' + gr01.u_field03.toString();
            respuesta += 'zzZzz' + gr01.u_ref01.toString();
            respuesta += 'zzZzz' + gr01.u_ref02.toString();
        }
        return respuesta;
    },

    // ==============================================================================================================================

    validarDepCatSub: function(vLinea, vDepCol, vDep, vCatCol, vCat, vSubCol, vSub, vTempMsg) {
        var respuesta = true,
            vErrorNum = 0,
            vTempError = '';
        if (vCat != '00Vacio00') {
            var gr02 = new GlideRecord('u_mdm_options');
            gr02.addEncodedQuery('u_key=mdm_d_cat^sys_id=' + vCat);
            gr02.query();
            gr02.next();
            if (gr02.u_ref01 != vDep) {
                eTempError = 'Si';
                eMsgError += '"' + vCatCol + vLinea + '" Categoria no pertenece al Departamento.\n'; // ' + vDep + "/" + gr02.u_ref01 + '
            }
            respuesta = false;
        }
        if (vSub != '00Vacio00') {
            var gr01 = new GlideRecord('u_mdm_options');
            gr01.addEncodedQuery('u_key=mdm_d_sub^sys_id=' + vSub);
            gr01.query();
            gr01.next();
            if (gr01.u_ref01 != vDep) {
                vErrorNum++;
                vTempError = 'Departamento';
            }
            if (gr01.u_ref02 != vCat) {
                vErrorNum++;
                vTempError = (vErrorNum == 1) ? 'a la Categoria' : 'al Departamento y Categoria';
            }
            if (vErrorNum != 0) {
                eTempError = 'Si';
                eMsgError += '"' + vSubCol + vLinea + '" Subcategoria no pertenece ' + vTempError + '.\n';
            }
            respuesta = false;
        }
        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    validarUnicoEAN: function(vLinea, vTempColum, varEANx, vCampo) {
        var respuesta = true,
            vErrorNum = 0,
            vTempError = '';

        // eMsgError += vTempColum + vLinea + ' - ' + varEANx + ' - ' + vCampo + '\n';

        if (varEANx != '00Vacio00') {
            numUbicacion00 = aListaCamposEAN.indexOf(varEANx);
            numUbicacion01 = numUbicacion00 + 1;
            numUbicacion02 = numUbicacion00 + 2;

            if (numUbicacion00 > -1) {
                eTempError = 'Si';
                eMsgError += '"' + vTempColum + vLinea + '" Registro duplicado en Excel campo "' + aListaCamposEAN[numUbicacion01] + aListaCamposEAN[numUbicacion02] + '".\n';
                eTempUnicoEs = 'No';
            } else {
                aListaCamposEAN.push(varEANx);
                aListaCamposEAN.push(vTempColum);
                aListaCamposEAN.push(vLinea);

                var varQueryEAN = '';
                // varQueryEAN += '^u_mt_estatus!=Inactivo';
                varQueryEAN += '^u_mt_estatus!=Lectura';
                varQueryEAN += '^u_mt_estatus!=Aprobado';
                varQueryEAN += '^u_mt_estatus!=Rechazado';
                varQueryEAN += '^u_mt_emp_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_pi_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_sub_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_bto_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_pal_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_zca_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_pa1_ean=' + varEANx;
                varQueryEAN += '^ORu_mt_ze1_ean=' + varEANx;

                var gr01 = new GlideRecord('u_mdm_registros');
                gr01.addEncodedQuery(varQueryEAN);
                gr01.query();
                if (gr01.next()) {
                    var varCampoEanLocalizado = '';
                    if (gr01.u_mt_pi_ean == varEANx)
                        varCampoEanLocalizado = 'pi';
                    if (gr01.u_mt_emp_ean == varEANx)
                        varCampoEanLocalizado = 'emp';
                    if (gr01.u_mt_sub_ean == varEANx)
                        varCampoEanLocalizado = 'sub';
                    if (gr01.u_mt_bto_ean == varEANx)
                        varCampoEanLocalizado = 'bto';
                    if (gr01.u_mt_pal_ean == varEANx)
                        varCampoEanLocalizado = 'pal';
                    if (gr01.u_mt_zca_ean == varEANx)
                        varCampoEanLocalizado = 'zca';
                    if (gr01.u_mt_pa1_ean == varEANx)
                        varCampoEanLocalizado = 'pa1';
                    if (gr01.u_mt_ze1_ean == varEANx)
                        varCampoEanLocalizado = 'ze1';
                    eTempError = 'Si';
                    eMsgError += '"' + vTempColum + vLinea + '" Registro duplicado en ServiceNow Material: "' + gr01.u_mt_nombre + '" EAN_' + varCampoEanLocalizado + ': "' + varEANx + '" Tipo: "' + gr01.u_mt_tipo_de_solicitud + '" Estado: "' + gr01.u_mt_estatus + '"';
                    if (gr01.u_ritm.getDisplayValue().toString() != '') {
                        eMsgError += ' Solicitud: "' + gr01.u_ritm.getDisplayValue() + '"';
                    }
                    eMsgError += '.\n';
                }
            }
        }
        return respuesta;
    },

    // ==============================================================================================================================

    MKT_valida_existencia: function(vLinea, varSAPx, varEANx) {
        var respuesta = 'No_ID';

        // eMsgError += vTempColum + vLinea + ' - ' + varEANx + ' - ' + varSAPx + '\n';

        var varQuerySapEAN = '';
        varQuerySapEAN += 'u_mt_tipo_de_solicitud=Alta';
        varQuerySapEAN += '^u_mt_estatus!=Lectura';
        varQuerySapEAN += '^u_mt_estatus!=Aprobado';
        varQuerySapEAN += '^u_mt_estatus!=Rechazado';
        varQuerySapEAN += '^u_mt_no_materia=' + varSAPx;
        // varQuerySapEAN += '^u_mt_pi_ean=' + varEANx;

        // gs.log(varQuerySapEAN, msgLog);

        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery(varQuerySapEAN);
        gr01.query();
        if (gr01.next()) {
            // Si se encontro todo bien   
            respuesta = gr01.sys_id.toString();
        } else {
            eTempError = 'Si';
            eMsgError += '"C' + vLinea + '" SAP No. "' + varEANx + '" no localizada en ServiceNow.\n';
        }

        return respuesta;
    },

    // ==============================================================================================================================

    MKT_valida_diplicado: function(vLinea, vTempColum, varValorX, vBusquedar) {
        var respuesta = true,
            vErrorNum = 0,
            vTempError = '';

        // eMsgError += vTempColum + vLinea + ' - ' + varEANx + ' - ' + vBusquedar + '\n';

        if (vBusquedar == 'EAN') {
            if (varValorX != '00Vacio00') {
                numUbicacion00 = aListaCamposEAN.indexOf(varValorX);
                numUbicacion01 = numUbicacion00 + 1;
                numUbicacion02 = numUbicacion00 + 2;

                if (numUbicacion00 > -1) {
                    eTempError = 'Si';
                    eMsgError += '"' + vTempColum + vLinea + '" Registro duplicado en Excel campo "' + aListaCamposEAN[numUbicacion01] + aListaCamposEAN[numUbicacion02] + '".\n';
                    eTempUnicoEs = 'No';
                    respuesta = false;
                } else {
                    aListaCamposEAN.push(varValorX);
                    aListaCamposEAN.push(vTempColum);
                    aListaCamposEAN.push(vLinea);
                }
            }
        }
        if (vBusquedar == 'SAP') {
            if (varValorX != '00Vacio00') {
                numUbicacion00 = aListaCamposSAP.indexOf(varValorX);
                numUbicacion01 = numUbicacion00 + 1;
                numUbicacion02 = numUbicacion00 + 2;

                if (numUbicacion00 > -1) {
                    eTempError = 'Si';
                    eMsgError += '"' + vTempColum + vLinea + '" Registro duplicado en Excel campo "' + aListaCamposSAP[numUbicacion01] + aListaCamposSAP[numUbicacion02] + '".\n';
                    eTempUnicoEs = 'No';
                    respuesta = false;
                } else {
                    aListaCamposSAP.push(varValorX);
                    aListaCamposSAP.push(vTempColum);
                    aListaCamposSAP.push(vLinea);
                }
            }
        }


        return respuesta;
    },



    // ==============================================================================================================================












    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    validarPerteneceGrupo: function(vLinea, vTempColum, vTempValor, vEnGrupo, vEnGrupoValor) {
        if (vTempValor != '00Vacio00' && vEnGrupoValor == '00Vacio00') {
            eTempError = 'Si';
            eMsgError += '"' + vTempColum + vLinea + '" Debe limpiar celda, ya que depende de celda "' + vEnGrupo + vLinea + '" y esta se encuentra vacia.\n';
        }
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_RITM_informacion_00: function() {
        var sys_id = this.getParameter('parm_RitmID');
        var gr00 = new GlideRecord('sc_req_item');
        gr00.addEncodedQuery('sys_id=' + sys_id);
        gr00.query();
        gr00.next();
        var respuesta = '';
        respuesta += gr00.state.toString() + 'zzRespUestazz';
        respuesta += gr00.number.getDisplayValue().toString() + 'zzRespUestazz';
        respuesta += gr00.state.getDisplayValue().toString() + 'zzRespUestazz';
        respuesta += gr00.request.opened_by.getDisplayValue().toString() + 'zzRespUestazz';
        respuesta += gr00.u_mdm_etapa.getDisplayValue().toString() + 'zzRespUestazz';
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('u_mt_valido=Corregir^u_ritm=' + sys_id);
        gr01.query();
        gr01.next();
        respuesta += gr01.getRowCount() + 'zzRespUestazz';
        respuesta += gr00.request.opened_by + 'zzRespUestazz'; // ID user open	
        respuesta += gr00.u_mdm_material.toString() + 'zzRespUestazz'; // ID material
        respuesta += gr00.u_mdm_material.u_mt_nombre.toString() + 'zzRespUestazz'; // Name material
        return respuesta;
    },

    // ==============================================================================================================================

    mdm_Query_registros_aprovadores: function(RitmID) {
        msgLog = 'MDM_Query_001';
        var varQuery = 'u_ritm=' + RitmID + '^u_mt_valido=NULL';
        // gs.log('Query -' + varQuery, msgLog);
        return varQuery;
    },

    // ==============================================================================================================================

    mdm_Ritm_Etapa: function() {
        msgLog = 'MDM_Etapa_ritm_002';
        var sys_id = this.getParameter('parm_RitmID');
        var respuesta = '';
        // gs.log('sys_id=' + sys_id, msgLog);
        var gr01 = new GlideRecord('sc_req_item');
        gr01.addEncodedQuery('sys_id=' + sys_id);
        gr01.query();
        if (gr01.next()) {
            respuesta = gr01.u_mdm_etapa;
            // gs.log(gr01.u_mdm_etapa, msgLog);
        }
        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================
    /*

	// YA NO SE OCUPA porque en la lista relacionada solo se muestra las solicitudes que les pertenece al usuario

	var sys_user = this.getParameter('parm_Usuario');

    if (sys_etapa == 'Negociador') {
    	if (gr01.u_mt_negaciador.toString() != sys_user) {
    		faltaObservUser++;
    		respuestaListaVacios += gr01.u_mt_pi_ean + ' - ' + gr01.u_mt_nombre + ' -  ' + gr01.u_mt_negaciador.getDisplayValue() +'\n';
    	}
    }
    if (sys_etapa == 'DGA') {
    	if (gr01.u_mt_dga.toString() != sys_user) {
    		faltaObservUser++;
    		respuestaListaVacios += gr01.u_mt_pi_ean + ' - ' + gr01.u_mt_nombre + ' -  ' + gr01.u_mt_dga.getDisplayValue() +'\n';
    	}
    }
    */
    // ==============================================================================================================================


    // Se utiliza con B2S [Server]
    // ODM - DGARespuesta
    // En ServiceNow lo encontraremos en los bonotnes "Aprobar" y "Regresar" (Realizan la misma funcion)


    mdm_info_row_registro_lista_DGA: function() {

        // Entrada tipo AJAX
        var respuestaFinal = 'Sin respuesta',
            mov_tipo = this.getParameter('parm_Tipo'),
            sys_ids_rows = this.getParameter('parm_Row_ID_lista'),
            sys_etapa = this.getParameter('parm_Etapa_masiva'),
            sys_etapa_actual = this.getParameter('parm_Etapa');

        msgLogDGA = 'MDM_DGA_respuesta_SN_021';

        if (mov_tipo == 'Aprobar') {
            respuestaFinal = this.mdm_info_row_registro_lista_Aprob_SERVER(mov_tipo, sys_ids_rows, sys_etapa, sys_etapa_actual, 'ServiceNow', msgLogDGA);
        }
        if (mov_tipo == 'Rechazar') {
            respuestaFinal = this.mdm_info_row_registro_lista_Regresa_SERVER(mov_tipo, sys_ids_rows, sys_etapa, sys_etapa_actual, 'ServiceNow', msgLogDGA);
        }
        return respuestaFinal;
    },

    // ==============================================================================================================================

    // ==============================================================================================================================

    mdm_info_row_registro_lista_Regresa_SERVER: function(mov_tipo, sys_ids_rows, sys_etapa, sys_etapa_actual, sys_origen, new_msgLogDGA) {

        msgLogDGA = new_msgLogDGA;
        // ------------------------------------------------------------
        var vTempMsgDGA = '0101 Respuesta de SAP --- [ Script Includes ] \n\n';
        vTempMsgDGA += 'MDM_Registro(s): \n\n' + sys_ids_rows + '\n\n';
        vTempMsgDGA += 'Origen: ' + sys_origen + '\n';
        vTempMsgDGA += 'Solicitud: ' + mov_tipo + '\n';
        vTempMsgDGA += 'Area: ' + sys_etapa + '\n';
        vTempMsgDGA += 'Etapa actual: ' + sys_etapa_actual + '\n';
        vTempMsgDGA += '\n\n';
        gs.log(vTempMsgDGA, msgLogDGA);
        // ------------------------------------------------------------
        var faltaObserv = 0,
            faltaObservUser = 0,
            respuestaListaVacios = '';
        // ------------------------------------------------------------
        var mdmRegresar = 'Masivo';
        globalNewEtapaRowActual = sys_etapa_actual.toString();
        globalNewEtapaRow = parseInt(globalNewEtapaRowActual);
        globalNewEtapaRow = globalNewEtapaRow.toString();
        // ------------------------------------------------------------
        var str = sys_ids_rows;
        var strArray = str.toString().split(',');
        for (var i = 0; i < strArray.length; i++) {
            var gr01 = new GlideRecord('u_mdm_registros');
            gr01.addEncodedQuery('sys_id=' + strArray[i]);
            gr01.query();
            gr01.next();
            if (gr01.u_mt_motivo_de_rechazo == '') {
                faltaObserv++;
                respuestaListaVacios += gr01.u_mt_pi_ean + ' - ' + gr01.u_mt_nombre + '\n';
            } else {
                // Imprimir
            }
        }
        if (faltaObserv != 0) {
            // Campos observaciones sin llenar
            respuestaLista = 'No es posible regresar a proveedor. \nFavor de completar "Motivo de rechazo" de los siguientes regisrtros: \n\n' + respuestaListaVacios;
        } else if (faltaObservUser != 0) {
            // Registros no pertenecen al usuario
            respuestaLista = 'No puedes regresar registros que no pertenesca a tu usuario.\nPara continuar, favor de desmarca los siguientes regisrtros:\n\n' + respuestaListaVacios;
        } else {
            // Todo bien
            respuestaLista = this.mdm_info_row_registro_lista(sys_ids_rows, 'Regresar');
            respuestaLista = 'Regresado';
        }

        // ------------------------------------------------------------
        gs.log('0102 Resultado de procesar respuesta de SAP en ServiceNow --- [ Script Includes ] \n\n' + respuestaLista + '\n\n', msgLogDGA);
        return respuestaLista;
    },

    // ==============================================================================================================================

    // ==============================================================================================================================

    mdm_info_row_registro_lista_Aprob_SERVER: function(mov_tipo, sys_ids_rows, sys_etapa, sys_etapa_actual, sys_origen, new_msgLogDGA) {

        msgLogDGA = new_msgLogDGA;
        // ------------------------------------------------------------
        var vTempMsgDGA = '0101 Respuesta de SAP --- [ Script Includes ] \n\n';
        vTempMsgDGA += 'MDM_Registro(s): \n\n' + sys_ids_rows + '\n\n';
        vTempMsgDGA += 'Origen: ' + sys_origen + '\n';
        vTempMsgDGA += 'Solicitud: ' + mov_tipo + '\n';
        vTempMsgDGA += 'Area: ' + sys_etapa + '\n';
        vTempMsgDGA += 'Etapa actual: ' + sys_etapa_actual + '\n';
        vTempMsgDGA += '\n\n';
        gs.log(vTempMsgDGA, msgLogDGA);
        // ------------------------------------------------------------
        var faltaObserv = 0,
            faltaObservUser = 0,
            respuestaListaVacios = '';
        // ------------------------------------------------------------
        var mdmRegresar = 'Masivo';
        globalNewEtapaRowActual = sys_etapa_actual.toString();
        globalNewEtapaRow = parseInt(globalNewEtapaRowActual) + 1;
        globalNewEtapaRow = globalNewEtapaRow.toString();
        // ------------------------------------------------------------
        var str = sys_ids_rows;
        var strArray = str.toString().split(',');
        for (var i = 0; i < strArray.length; i++) {
            var gr01 = new GlideRecord('u_mdm_registros');
            gr01.addEncodedQuery('sys_id=' + strArray[i]);
            gr01.query();
            gr01.next();
            // Imprimir
        }
        if (faltaObservUser != 0) {
            // Registros no pertenecen al usuario
            respuestaLista = 'No puedes aprobar registros que no pertenesca a tu usuario.\nPara continuar, favor de desmarca los siguientes regisrtros:\n\n' + respuestaListaVacios;
        } else {
            // Todo bien            
            respuestaLista = this.mdm_info_row_registro_lista(sys_ids_rows, 'Aprobado');
            respuestaLista = 'Siguiente Etapa';
        }

        // ------------------------------------------------------------
        gs.log('0102 Resultado de procesar respuesta de SAP en ServiceNow --- [ Script Includes ] \n\n' + respuestaLista + '\n\n', msgLogDGA);
        return respuestaLista;
    },

    // ==============================================================================================================================

    mdm_info_row_registro_lista: function(lista_registros, estatus_registros) {
        // msgLogDGA = 'Funcion_origen';
        var respuestaLista = '',
            sys_ids_rows = lista_registros;
        var str = sys_ids_rows;
        var strArray = str.toString().split(',');
        for (var i = 0; i < strArray.length; i++) {
            respuestaLista += this.mdm_info_row_registro(strArray[i], estatus_registros) + '\n\n';
        }
        return respuestaLista;
    },

    // ==============================================================================================================================

    mdm_info_row_registro: function(sys_ids_row, estatus_row) {
        // msgLogDGA = 'Funcion_origen';
        var respuesta = '',
            respuestaRow = '',
            msgLogDGA_ALL = false,
            varRitm,
            varRitmName,
            varRitmEtapa,
            varTask,
            varRegRow = sys_ids_row,
            varObserv;

        if (msgLogDGA_ALL)
            gs.log('000 ', msgLogDGA);
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + varRegRow);
        gr01.query();
        gr01.next();
        varRitmName = gr01.u_mt_nombre;
        respuesta += varRitmName + 'zzRespUestazz'; // [0]
        respuesta += varRegRow + 'zzRespUestazz'; // [1]
        respuesta += gr01.u_ritm.getDisplayValue() + 'zzRespUestazz'; // [2]
        varRitm = gr01.u_ritm;


        var vHilosRITM = this.mdm_Ritm_Limpiar_hilos_duplicados(varRitm);
        // gs.log(gr01.u_ritm.getDisplayValue() + '\n\n' + vHilosRITM, msgLogDGA);


        varObserv = (estatus_row == 'Aprobado') ? '' : gr01.u_mt_motivo_de_rechazo;
        respuesta += varRitm + 'zzRespUestazz'; // [3]
        if (msgLogDGA_ALL)
            gs.log('001 ' + respuesta, msgLogDGA);
        var gr02 = new GlideRecord('sc_req_item');
        gr02.addEncodedQuery('sys_id=' + varRitm);
        gr02.query();
        gr02.next();
        varRitmEtapa = globalNewEtapaRowActual;
        respuesta += varRitmEtapa + 'zzRespUestazz'; // [4]
        if (msgLogDGA_ALL)
            gs.log('002 ' + respuesta, msgLogDGA);
        var gr03 = new GlideRecord('sc_task');
        gr03.addEncodedQuery('request_item=' + varRitm + '^u_mdm_etapa=' + varRitmEtapa);
        gr03.query();
        gr03.next();
        varTask = gr03.sys_id;
        respuesta += gr03.number + 'zzRespUestazz'; // [5]
        respuesta += varTask + 'zzRespUestazz'; // [6]
        if (msgLogDGA_ALL)
            gs.log('003 ' + respuesta, msgLogDGA);
        respuestaRow = varRitmName + ' ' + this.mdm_Ritm_Validar_row_registro(varTask, varRitm, varRegRow, varObserv, varRitmEtapa);
        return respuestaRow;
    },

    // ==============================================================================================================================

    mdm_Ritm_Validar_row_registro: function(idTask, idRitm, idRegistro, campoObservacion, campoEtapa) {
        // msgLogDGA = 'Funcion_origen';
        // gs.log('004 ', msgLogDGA);
        var respuesta = '',
            respuestaReg = '',
            respuestaCont = '',
            respuestaMsg = '',
            sys_id_task = idTask,
            sys_id_ritm = idRitm,
            sys_id_reg = idRegistro;
        // gs.log('005 - ' + idTask + ' - ' + idRitm + ' - ' + idRegistro + ' - ' + campoObservacion, msgLogDGA);

        // Update "Registro"
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + sys_id_reg);
        gr01.query();
        if (gr01.next()) {
            if (campoObservacion != '') {

                // REGRESAR
                gr01.u_mt_valido = 'Corregir';
                var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes
                gr01.u_mt_observacion_temp = '[' + fechaTemp + '] ' + this.recuperaNameEtapa(campoEtapa.toString()) + '\n' + campoObservacion + '\n\n';
                // gr01.u_mt_valido_error = 'Actualiza Task campo observacion' ;

            } else {

                // SIGUIENTE ETAPA	
                if (gr01.u_mt_valido != 'Corregir')
                    gr01.u_mt_valido = 'Valido';
                gr01.u_mt_observacion_temp = '';
                // gr01.u_mt_valido_error = '';

            }
            gr01.update();
        }



        // Logica pasada cuando dependia de varios registros simultanios ---------------------------------------------
        // Pero es necesario pra la logica actual.. ------------------------------------------------------------------

        // Validar "Registros" pendientes
        var gr02 = new GlideRecord('u_mdm_registros');
        gr02.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=NULL');
        gr02.query();
        if (gr02.next()) {
            respuestaReg = 'ConPendientes';
        } else {
            respuestaReg = 'NA';
        }
        respuesta += respuestaReg;
        respuesta += 'zzRespUestazz';

        // "Registros" regresados para corregir
        var gr03 = new GlideRecord('u_mdm_registros');
        gr03.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=Corregir');
        gr03.query();
        if (gr03.next()) {
            respuestaCont = gr03.getRowCount().toString();
        } else {
            respuestaCont = 'NA';
        }
        respuesta += respuestaCont;
        respuesta += 'zzRespUestazz';

        // gs.log('006 - Estatus \nMas task pendientes: ' + respuestaReg + '\nCorregir: ' + respuestaCont, msgLogDGA);
        // ------------------------------------------------------------------------------------------------------------ 	



        // TABLA MDM REGISTRO APROBACIONES
        // gs.log('006 - ' + 'u_ritm=' + sys_id_ritm + '^u_etapa_numero=' + campoEtapa, msgLogDGA);

        var gr702 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr702.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_etapa_numero=' + campoEtapa);
        gr702.orderByDesc('sys_created_on');
        gr702.query();
        gr702.next();
        if (campoObservacion == '') {
            gr702.u_estatus = 'Aprobado';
        } else {
            gr702.u_estatus = 'Rechazado';
            gr702.u_motivo = campoObservacion;
        }
        gr702.u_fecha = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora();
        gr702.update();




        // Update RITM "Mantaner" o "Siguiente" Etapa
        respuestaMsg = 'HoldEtapa';
        if (respuestaReg == 'NA') {
            var gr04 = new GlideRecord('sc_req_item');
            gr04.addEncodedQuery('sys_id=' + sys_id_ritm);
            gr04.query();
            gr04.next();

            if (respuestaCont == 'NA') {

                var newEtapa = globalNewEtapaRow; // ---------------------------------- New
                gr04.u_mdm_etapa = newEtapa;
                gr04.update();

                respuestaMsg = 'NewEtapa';

                // Cerrar "Task" actual
                var gr05 = new GlideRecord('sc_task');
                gr05.addEncodedQuery('sys_id=' + sys_id_task);
                gr05.query();
                gr05.next();
                gr05.state = 3;
                gr05.u_mdm_observacion = '';
                gr05.update();

                // Limpiar campos de "Registros"
                var gr06 = new GlideRecord('u_mdm_registros');
                gr06.addEncodedQuery('u_ritm=' + sys_id_ritm);
                gr06.query();
                gr06.u_mt_valido = '';
                // gr06.u_mt_valido_error = '';
                gr06.updateMultiple();

                // Buscar si ya esiste una "Task" con numero de etapa nuevo (Cuando se regresan las tareas).
                // var gr08 = new GlideRecord('sc_task');
                // gr08.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + newEtapa);
                // gr08.query();
                // gr08.next();
                // gr08.state = 1;
                // gr08.update();

            } else {

                // gs.log('006 - 01' , msgLogDGA); 

                // mdmRegresar == 'Masivo' o 'Normal' 

                // RITM
                gr04.setWorkflow(false);
                // gr04.u_mdm_etapa = globalNewEtapaRow; // RITM
                gr04.state = -5;
                gr04.update();

                var gr10 = new GlideRecord('sc_task');
                gr10.addEncodedQuery('sys_id=' + sys_id_task);
                gr10.query();
                gr10.next();
                gr10.state = 3; // Close
                gr10.update();

                /*
                if (mdmRegresar == 'Normal') {

                    // RITM
                    gr04.state = -5;
                    gr04.update();

                    // Pendiente "Task"
                    var gr07 = new GlideRecord('sc_task');
                    gr07.addEncodedQuery('sys_id=' + sys_id_task);
                    gr07.query();
                    gr07.next();
                    gr07.state = -5;
                    // var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy(); // Script Includes
                    // gr01.u_mt_observacion_temp = fechaTemp + '' + campoObservacion;
                    gr07.u_mdm_observacion = campoObservacion;
                    gr07.update();

                } else if (mdmRegresar == 'Masivo') {
                    // gs.log('006 - 02' , msgLogDGA); 	

                    // RITM
                    gr04.setWorkflow(false);
                    // gr04.u_mdm_etapa = globalNewEtapaRow; // RITM
                    gr04.state = -5;
                    gr04.update();

                    var gr10 = new GlideRecord('sc_task');
                    gr10.addEncodedQuery('sys_id=' + sys_id_task);
                    gr10.query();
                    gr10.next();
                    gr10.state = 3; // Close
                    gr10.update();
                   
                    // var gr11 = new GlideRecord('sc_task');
                    // gr11.addEncodedQuery('sys_id=' + sys_id_task);
                    // gr11.query();
                    // gr11.next();
                    // gr11.state = 2; // Work in Progress 
                    // gr11.update();

                    var gr12 = new GlideRecord('sc_task');
                    gr12.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + globalNewEtapaRow);
                    gr12.query();
                    gr12.next();
                    gr12.state = 1; // open
                    gr12.update();

                    // RITM
                    gr04.state = -5;
                    gr04.update();	

                }				
				*/
            }
        }
        respuesta += respuestaMsg;

        // ConPendientes/NA  ---  RegEnProceso/NA  ---  HoldEtapa/NewEtapa
        // NAzzRespUestazzNAzzRespUestazzNewEtapa								Respuesta que se manda a "UI Action" String
        // [NA] [NA] [NewEtapa]

        // gs.log('007 - ' + respuesta, msgLogDGA);


        // ------------------------------------------------------------
        var gr63 = new GlideRecord('sc_task');
        gr63.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=1');
        gr63.query();
        gr63.next();
        var varComentarios = gr63.u_mdm_comentarios;
        // ------------------------------------------------------------
        var gr69 = new GlideRecord('sc_task');
        gr69.addEncodedQuery('request_item=' + sys_id_ritm);
        gr69.query();
        gr69.u_mdm_comentarios = varComentarios;
        gr69.updateMultiple();
        // ------------------------------------------------------------

        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    /* 	varDataAll

        	[000] - Unidad de producto (PI)
    		[001] - Código EAN (PI)
    		[002] - Piezas por empaque (PI)
    		[003] - Longitud en centímetros (PI)
    		[004] - Ancho en centímetros (PI)
    		[005] - Altura en centímetros (PI)
    		[006] - Peso Bruto en gramos (PI)
    		[007] - Unidad de producto (EMP)
    		[008] - Código EAN (EMP)
    		[009] - Piezas por empaque (EMP)
    		[010] - Longitud en centímetros (EMP)
    		[011] - Ancho en centímetros (EMP)
    		[012] - Altura en centímetros (EMP)
    		[013] - Peso Bruto en gramos (EMP)
    		[014] - Unidad de producto (SUB)
    		[015] - Código EAN (SUB)
    		[016] - Piezas por empaque (SUB)
    		[017] - Longitud en centímetros (SUB)
    		[018] - Ancho en centímetros (SUB)
    		[019] - Altura en centímetros (SUB)
    		[020] - Peso Bruto en gramos (SUB)
    		[021] - Tipo de artículo/Fraccion
    		[022] - Forma del producto
    		[023] - Clasificación Fiscal
    		[024] - Gpo Trat. Logístico
    		[025] - Circulo de la Salud
    		[026] - Antibiótico
    		[027] - Devolución del cliente
    		[028] - División Factura
    		[029] - Catálogo Producto Anexo 20 SAT
    		[030] - Forma Farmaceutica
    		[031] - Registro Sanitario
    		[032] - Registro Sanitario vigencia
    		[033] - Registro Sanitario vigencia prorroga
    		[034] - Principio Activo 01
    		[035] - Principio Activo 02
    		[036] - Principio Activo 03
    		[037] - Principio Activo 04
    		[038] - Principio Activo 05
    		[039] - Principio Activo 06
    		[040] - Principio Activo 07
    		[041] - Principio Activo 08
    		[042] - Principio Activo 09
    		[043] - Principio Activo 10
    		[044] - Principio Activo 11
    		[045] - Principio Activo 12
    		[046] - Principio Activo 13
    		[047] - Principio Activo 14
    		[048] - Principio Activo 15
    		[049] - Tipo de Gramaje 01
    		[050] - Tipo de Gramaje 02
    		[051] - Tipo de Gramaje 03
    		[052] - Contenido Grameje 01
    		[053] - Contenido Grameje 02
    		[054] - Contenido Grameje 03
    		[055] - Numero de piezas por unidad
    		[056] - Departamento
    		[057] - Categoría
    		[058] - Subcategoría
    		[059] - Descripción Mercadológica del Material
    		[060] - Beneficios Del Producto
    		[061] - Keywords "ecommerce"
    		[062] - Indicación terapéutica
    		[063] - Contraindicación
    		[064] - Leyendas de protección
    		[065] - Prescripción
    		[066] - Advertencias
    		[067] - Interacción medicamentosa
    		[068] - Reacciones adversas
    		[069] - Manejo de sobredosificación
    		[070] - Propiedad Farmacéutica (Mecanismo de Acción)
    		[071] - Dosis
    		[072] - Vía de administración
    		[073] - Clave CNIS
    		[074] - Embarazo
    		[075] - Lactancia
    		[076] - Denominación Genérica
    		[077] - Marca del producto
    		[078] - Línea del proveedor
    		[079] - Esquema

    		[080] - Precio Costo
    		[081] - Precio Farmacia
    		[082] - Markup %
    		[083] - FEE %
    		[084] - Condición adiconal %
    		[085] - Condición No Devolución % <-- "No"
    		[086] - Margen final en %
    		[087] - Margen final en $
    		[088] - Plazo de pago

    		[089] - Condicion de temperatura
    		[090] - Sujeto a lote
    		[091] - Indicador manipulación
    		[092] - Grupo control calidad
    		[093] - Grupo de material 2
    		[094] - Jerarquía de productos

    		[095] - Keywords Complementario
    		[096] - Metadescripción
    		[097] - Caption Link

    		[098] - Analista Sr

    		[099] - No. Material anterior 
    		[100] - 	No. Materia
    		[101] - Tipos de material 
    		[102] - Ramo 
    		[103] - Grupos de transporte 
    		[104] - Sector 
    		[105] - Jerarquía de productos 
    		[106] - Ind. CAD 
    		[107] - StatusMat 
    		[108] - Status 
    		[109] - Valido de 
    		[110] - Validez de 
    		[111] - TmpoHastaCaduc 
    		[112] - DurTotalConserv 
    		[113] - Suscep. bonif. especie 
    		[114] - Fabricante 
    		[115] - Indicador de periodo 
    		[116] - Regla redondeo FPC 
    		[117] - Grupos de tipos de posición 
    		[118] - FeCad/FeEx 
    		[119] - Condición almacenamiento 
    		[120] - Indicador manipulación 
    		[121] - Grupo control calidad 
    		[122] - Denominación 
    		[123] - PB Niv. mandante 
    		[124] - Linea de Devolucion 
    		[125] - DeltaControlField 

    		[126] - Precio Costo final
    		[127] - Precio Farmacia final
    		
    		[128] - Unidad de producto (2)
			
    		[129] - Unidad de producto (BTO)
    		[130] - Código EAN (BTO)
    		[131] - Piezas por empaque (BTO)
    		[132] - Longitud en centímetros (BTO)
    		[133] - Ancho en centímetros (BTO)
    		[134] - Altura en centímetros (BTO)
    		[135] - Peso Bruto en gramos (BTO)

    		[136] - Nombre completo

			[137] - Unidad de producto (PAL)
			[138] - Código EAN (PAL)
			[139] - Piezas por empaque (PAL)
			[140] - Longitud en centímetros (PAL)
			[141] - Ancho en centímetros (PAL)
			[142] - Altura en centímetros (PAL)
			[143] - Peso Bruto en gramos (PAL)

			[144] - Unidad de producto (ZCA)
			[145] - Código EAN (ZCA)
			[146] - Piezas por empaque (ZCA)
			[147] - Longitud en centímetros (ZCA)
			[148] - Ancho en centímetros (ZCA)
			[149] - Altura en centímetros (ZCA)
			[150] - Peso Bruto en gramos (ZCA)

			[151] - Unidad de producto (PA1)
			[152] - Código EAN (PA1)
			[153] - Piezas por empaque (PA1)
			[154] - Longitud en centímetros (PA1)
			[155] - Ancho en centímetros (PA1)
			[156] - Altura en centímetros (PA1)
			[157] - Peso Bruto en gramos (PA1)

			[158] - Unidad de producto (ZE1)
			[159] - Código EAN (ZE1)
			[160] - Piezas por empaque (ZE1)
			[161] - Longitud en centímetros (ZE1)
			[162] - Ancho en centímetros (ZE1)
			[163] - Altura en centímetros (ZE1)
			[164] - Peso Bruto en gramos (ZE1)

			[165] - Grupo material almacén



        */

    // ==============================================================================================================================



    // SECUENCIA DEL PROCESO ************************************************************************

    mdm_Ritm_Validar_Fecha_Paralelo: function(nRitmIDFecha) {
        // gs.log('000 ', msgLog);
        var respuestaFechaMayor = '',
            gdt01,
            gdt02;
        var gr000 = new GlideRecord('sc_req_item');
        gr000.addEncodedQuery('sys_id=' + nRitmIDFecha);
        gr000.query();
        if (gr000.next()) {
            gdt01 = new GlideDateTime(globalFechaInicioParalelo); // Linea [29]
            gdt02 = new GlideDateTime(gr000.sys_created_on);
            respuestaFechaMayor = gdt02.onOrAfter(gdt01);
        }
        return respuestaFechaMayor;
    },

    // ELIMINAR HILOS DUPLICADOS ************************************************************************

    mdm_Ritm_Limpiar_hilos_duplicados: function(newValorRITM) {
        // gs.log('000 ', msgLog);
        var repHilos = '',
            iCorrecto = 0,
            iBorrados = 0,
            aListUnicos = [],
            sys_Ritm = newValorRITM;

        var gr11 = new GlideRecord('wf_context');
        gr11.addEncodedQuery('id=' + sys_Ritm);
        gr11.query();
        if (gr11.next()) {
            var gr12 = new GlideRecord('wf_executing');
            gr12.addEncodedQuery('context=' + gr11.sys_id);
            gr12.query();
            while (gr12.next()) {
                if (aListUnicos.indexOf(gr12.activity.toString()) < 0) {
                    aListUnicos.push(gr12.activity.toString()); // Agragar a Array[]
                    iCorrecto++;
                    // gs.info('New ' + gr12.activity.getDisplayValue());
                } else {
                    gr12.deleteRecord(); // Eliminar registro
                    iBorrados++;
                    // gs.info('Borrado ' + gr12.activity.getDisplayValue());
                }
            }
        }
        repHilos += 'Hilos \n';
        repHilos += 'sys_id: ' + newValorRITM + '\n';
        repHilos += 'Correctos: ' + iCorrecto + '\n';
        repHilos += 'Borrados: ' + iBorrados + '\n\n';
        return repHilos;
    },

    // SECUENCIA DEL PROCESO ************************************************************************

    mdm_Ritm_Validar_normal_registros_UI_Action_Task_CUAL: function() {
        msgLog = 'MDM_CUAL_001';
        // gs.log('000 ', msgLog);
        var respuestaCUAL = '',
            vFechaMayor,
            vFechaRitm,
            vFlujoCual,
            tempMsgCual = '',
            var_id_task = this.getParameter('parm_TaskID'),
            var_id_ritm = this.getParameter('parm_RitmID'),
            var_id_reg = this.getParameter('parm_RegID'),
            var_accion_Valida_02 = this.getParameter('parm_Accion'),
            varObserv = this.getParameter('parm_Observacion'), // Sirve para identificar si se regresa o pasa a la siguiente etapa
            varComentarios = this.getParameter('parm_Comentarios'),
            varEtapaNum = this.getParameter('parm_EtapaNum'),
            varNoMtrAnterior = this.getParameter('parm_NoMtrAnterior'),
            varDataAll = this.getParameter('parm_Data_All');


        if (var_accion_Valida_02 == 'Rechazar' && varObserv == '')
            varObserv = 'Sin comentarios. Favor de validar con el autorizador la forma y el navegador de rechazo.';

        var gr001 = new GlideRecord('sc_task');
        gr001.addEncodedQuery('sys_id=' + var_id_task);
        gr001.query();
        if (gr001.next()) {

            msgLog = gr001.request_item.getDisplayValue() + '_' + msgLog;

            // SECUENCIA DEL PROCESO ************************************************************************
            vFechaMayor = this.mdm_Ritm_Validar_Fecha_Paralelo(var_id_ritm); // <------ "false" si quieres que siempre entre a SECUENCIAL

            if (vFechaMayor) {
                // ------------------------------------------------------------------------
                vFlujoCual = 'PARALELO';
                respuestaCUAL = this.mdm_Ritm_Validar_normal_registros_UI_Action_Task_paralelo(var_id_task, var_id_ritm, var_id_reg, varObserv, varComentarios, varEtapaNum, varNoMtrAnterior, varDataAll);
            } else {
                // ------------------------------------------------------------------------
                vFlujoCual = 'SECUENCIAL';
                respuestaCUAL = this.mdm_Ritm_Validar_normal_registros_UI_Action_Task_secuencial(var_id_task, var_id_ritm, var_id_reg, varObserv, varComentarios, varEtapaNum, varNoMtrAnterior, varDataAll);
            }

            vFechaRitm = gr001.request_item.sys_created_on.toString().split(' ');
            tempMsgCual += 'RITM: ' + gr001.request_item.getDisplayValue() + '\n';
            tempMsgCual += 'Etapa:  ' + varEtapaNum + '\n';
            tempMsgCual += 'Task:  ' + gr001.number + '\n\n';
            tempMsgCual += 'Fechas \n';
            tempMsgCual += vFechaRitm[0] + ' > ' + globalFechaInicioParalelo + ': ' + vFechaMayor + '\n';
            tempMsgCual += 'Flujo:  ' + vFlujoCual + '\n\n';
            gs.log(tempMsgCual, msgLog);


            var vHilosRITM = this.mdm_Ritm_Limpiar_hilos_duplicados(var_id_ritm);
            // gs.log(gr001.request_item.getDisplayValue()  + '\n\n' + vHilosRITM, msgLog);


        }
        return respuestaCUAL;
    },

    // SECUENCIA DEL PROCESO ************************************************************************




    // ==============================================================================================================================

    // BOTON NORMAL De TASK Aprovacion/Regresar

    mdm_Ritm_Validar_normal_registros_UI_Action_Task_paralelo: function(a_var_id_task, a_var_id_ritm, a_var_id_reg, a_varObserv, a_varComentarios, a_varEtapaNum, a_varNoMtrAnterior, a_varDataAll) {
        msgLog = 'MDM_Valida_registros_025';
        // gs.log('000 ', msgLog);
        var respuestaTask = '',
            respuestaNumDuplicado = '',
            var_id_task = a_var_id_task,
            var_id_ritm = a_var_id_ritm,
            var_id_reg = a_var_id_reg,
            varObserv = a_varObserv, // Sirve para identificar si se regresa o pasa a la siguiente etapa
            varComentarios = a_varComentarios,
            varEtapaNum = a_varEtapaNum,
            varNoMtrAnterior = a_varNoMtrAnterior,
            varDataAll = a_varDataAll;
        gs.log('001 - ' + var_id_task + ' - ' + var_id_ritm + ' - ' + var_id_reg + ' - ' + varObserv, msgLog);
        // gs.log(varDataAll, msgLog);		


        respuestaNumDuplicado = (varEtapaNum == '8') ? this.mdm_Ritm_Validar_No_MTR(var_id_reg, varNoMtrAnterior) : 'No';
        if (respuestaNumDuplicado == 'No') {
            // ------------------------------------------------------------
            mdmRegresar = 'Normal';
            globalNewEtapaRow = parseInt(varEtapaNum) + 1;
            globalNewEtapaRowActual = parseInt(varEtapaNum);

            // ------------------------------------------------------------
            respuestaTask = this.mdm_Ritm_Validar_normal_registro(var_id_task, var_id_ritm, var_id_reg, varObserv, varDataAll, varEtapaNum);
            // ConPendientes/NA  ---  RegEnProceso/NA  ---  HoldEtapa/NewEtapa
            // NAzzRespUestazzNAzzRespUestazzNewEtapa								Respuesta que se manda a "UI Action" String
            // [NA] [NA] [NewEtapa] 												String -> Array 
            // ------------------------------------------------------------
            var gr00 = new GlideRecord('sc_task');
            gr00.addEncodedQuery('request_item=' + var_id_ritm);
            gr00.query();
            gr00.u_mdm_comentarios = varComentarios;
            gr00.updateMultiple();
            // ------------------------------------------------------------
        } else {
            respuestaTask = 'NAzzRespUestazzNAzzRespUestazzNoDuplicadozzRespUestazz' + respuestaNumDuplicado;
        }

        return respuestaTask;
    },


    // ==============================================================================================================================

    mdm_Ritm_Validar_No_MTR: function(reg_id, reg_num) {
        var respuestaNum = '';
        var gr84 = new GlideRecord('u_mdm_registros');
        gr84.addEncodedQuery('u_mt_estatus!=Rechazado^u_mt_estatus!=Lectura^u_mtr_cambio_material_origen!=' + reg_id + '^u_mt_no_material_anterior=' + reg_num);
        gr84.query();
        if (gr84.next()) {
            respuestaNum = gr84.u_mt_pi_ean;
        } else {
            respuestaNum = 'No';
        }
        return respuestaNum;
    },


    // ==============================================================================================================================

    mdm_Ritm_Validar_normal_registro: function(idTask, idRitm, idRegistro, campoObservacion, campoDataAll, campoEtapa) {
        // msgLog = 'Funcion_origen';
        // gs.log('004 ', msgLog);
        var respuesta = '',
            respuestaReg = '',
            respuestaCont = '',
            respuestaMsg = '',
            cambioEANoNAME = 'No',
            sys_id_task = idTask,
            sys_id_ritm = idRitm,
            sys_id_reg = idRegistro;
        // gs.log('005 - ' + idTask + ' - ' + idRitm + ' - ' + idRegistro + ' - ' + campoObservacion, msgLog);
        // gs.log(campoDataAll, msgLog);

        var respArray = campoDataAll.toString().split('zzRespUestazz');

        // Update "Registro"
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + sys_id_reg);
        gr01.query();
        if (gr01.next()) {

            if (campoObservacion != '') {

                // REGRAR
                gr01.u_mt_valido = 'Corregir';
                var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes
                gr01.u_mt_observacion_temp = gr01.u_mt_observacion_temp + '[' + fechaTemp + '] ' + this.recuperaNameEtapa(campoEtapa.toString()) + '\n' + campoObservacion + '\n\n';
                //gr01.u_mt_valido_error = 'Actualiza Task campo observacion' ;

            } else {

                // SIGUIENTE ETAPA	
                if (gr01.u_mt_valido != 'Corregir')
                    gr01.u_mt_valido = 'Valido';
                // gr01.u_mt_observacion_temp = ''; // WorkFlow - "Desde el INICIO"
                // gr01.u_mt_valido_error = '';

                // PI -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_pi_ean;
                varIDTempNew = respArray[1];
                // gs.log('Ser 100 EAN PI: \n' + gr01.u_mt_pi_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 PI Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_pi_01, varIDTempNew, 'pi_01');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_02, varIDTempNew, 'pi_02');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_03, varIDTempNew, 'pi_03');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_04, varIDTempNew, 'pi_04');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_05, varIDTempNew, 'pi_05');
                    this.attachmentRenombrar(gr01.u_mt_a_lista_de_precios, varIDTempNew, 'Lista_de_precios');
                    this.attachmentRenombrar(gr01.u_mt_a_ficha_tecnica, varIDTempNew, 'Ficha_tecnica');
                    this.attachmentRenombrar(gr01.u_mt_a_registro_sanitario, varIDTempNew, 'Registro_sanitario');
                    this.attachmentRenombrar(gr01.u_mt_a_prorroga, varIDTempNew, 'Prorroga');
                    this.attachmentRenombrar(gr01.u_mt_a_hoja_seguridad, varIDTempNew, 'Hoja_de_seguridad');
                    this.attachmentRenombrar(gr01.u_mt_a_oficio_de_clasificacion, varIDTempNew, 'Oficio_de_clasificacion');
                    this.attachmentRenombrar(gr01.u_mt_a_aviso_de_funcionamiento, varIDTempNew, 'Aviso_de_funcionamiento');
                    this.attachmentRenombrar(gr01.u_mt_a_carta_presentacion_documento, varIDTempNew, 'Carta_presentacion_documento');
                    this.attachmentRenombrar(gr01.u_mt_a_marbete_empaque_artes_producto, varIDTempNew, 'Marbete_empaque_artes_producto');
                }
                gr01.u_mt_pi_unidad_id = 'PI';
                gr01.u_mt_pi_unidad = '60ceefa01be9c610a9f8766dcc4bcb1e';

                // gs.log(gr01.u_mt_pi_ean  +' -- ' +respArray[1], msgLog);
                if (gr01.u_mt_pi_ean != respArray[1])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr01.u_mt_pi_ean = respArray[1];
                gr01.u_mt_pi_piezas = this.esNumeroNdecimales(respArray[2], 0);
                gr01.u_mt_pi_longitud_cm = this.esNumeroNdecimales(respArray[3], 3);
                gr01.u_mt_pi_ancho_cm = this.esNumeroNdecimales(respArray[4], 3);
                gr01.u_mt_pi_altura_cm = this.esNumeroNdecimales(respArray[5], 3);
                gr01.u_mt_pi_pesos_gr = this.esNumeroNdecimales(respArray[6], 3);

                // EMP -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_emp_ean;
                varIDTempNew = respArray[8];
                // gs.log('Ser 100 EAN EMP: \n' + gr01.u_mt_emp_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 EMP Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_emp_01, varIDTempNew, 'emp_01');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_02, varIDTempNew, 'emp_02');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_03, varIDTempNew, 'emp_03');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_04, varIDTempNew, 'emp_04');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_05, varIDTempNew, 'emp_05');
                }
                gr01.u_mt_emp_unidad_id = 'EMP';
                gr01.u_mt_emp_unidad = 'ecceefa01be9c610a9f8766dcc4bcb1e';
                gr01.u_mt_emp_ean = respArray[8];
                gr01.u_mt_emp_piezas = this.esNumeroNdecimales(respArray[9], 0);
                gr01.u_mt_emp_longitud_cm = this.esNumeroNdecimales(respArray[10], 3);
                gr01.u_mt_emp_ancho_cm = this.esNumeroNdecimales(respArray[11], 3);
                gr01.u_mt_emp_altura_cm = this.esNumeroNdecimales(respArray[12], 3);
                gr01.u_mt_emp_pesos_gr = this.esNumeroNdecimales(respArray[13], 3);

                // SUB -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_sub_ean;
                varIDTempNew = respArray[15];
                // gs.log('Ser 100 EAN SUB: \n' + gr01.u_mt_sub_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 SUB Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_sub_01, varIDTempNew, 'sub_01');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_02, varIDTempNew, 'sub_02');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_03, varIDTempNew, 'sub_03');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_04, varIDTempNew, 'sub_04');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_05, varIDTempNew, 'sub_05');
                }
                gr01.u_mt_sub_unidad_id = 'SUB';
                gr01.u_mt_sub_unidad = 'a0ceefa01be9c610a9f8766dcc4bcb1f';
                gr01.u_mt_sub_ean = respArray[15];
                gr01.u_mt_sub_piezas = this.esNumeroNdecimales(respArray[16], 0);
                gr01.u_mt_sub_longitud_cm = this.esNumeroNdecimales(respArray[17], 3);
                gr01.u_mt_sub_ancho_cm = this.esNumeroNdecimales(respArray[18], 3);
                gr01.u_mt_sub_altura_cm = this.esNumeroNdecimales(respArray[19], 3);
                gr01.u_mt_sub_pesos_gr = this.esNumeroNdecimales(respArray[20], 3);
                gr01.u_mt_tipo_id = this.regresaOptionValue(respArray[21]);
                gr01.u_mt_agrupaci_n_de_material_ssa_ref = this.regresaOptionFieldRef01(respArray[21]);
                gr01.u_mt_tipo = respArray[21];
                gr01.u_mt_formula = respArray[22];
                gr01.u_mt_clasificacion_fiscal_id = this.regresaOptionValue(respArray[23]);
                gr01.u_mt_clasificacion_fiscal = respArray[23];
                gr01.u_mt_gpo_trat_logistico_id = this.regresaOptionValue(respArray[24]);
                gr01.u_mt_gpo_trat_logistico = respArray[24];
                gr01.u_mt_circulo_salud_id = this.regresaOptionValue(respArray[25]);
                gr01.u_mt_circulo_salud = respArray[25];
                gr01.u_mt_antibiotico_id = this.regresaOptionValue(respArray[26]);
                gr01.u_mt_antibiotico = respArray[26];
                gr01.u_mt_devolucion_del_cliente_id = this.regresaOptionValue(respArray[27]);
                gr01.u_mt_devolucion_del_cliente = respArray[27];
                gr01.u_mt_division_factura = respArray[28];
                gr01.u_mt_anexo_20_sat = respArray[29];
                gr01.u_mt_formula_farmaceutica_id = this.regresaOptionValue(respArray[30]);
                gr01.u_mt_formula_farmaceutica = respArray[30];
                gr01.u_mt_registro_sanitario = respArray[31];
                gr01.u_mt_registro_sanitario_vigencia = respArray[32];
                gr01.u_mt_registro_sanitario_vigencia_prorroga = respArray[33];
                gr01.u_mt_activo_01_id = this.regresaOptionValue(respArray[34]);
                gr01.u_mt_activo_01 = respArray[34];
                gr01.u_mt_activo_02_id = this.regresaOptionValue(respArray[35]);
                gr01.u_mt_activo_02 = respArray[35];
                gr01.u_mt_activo_03_id = this.regresaOptionValue(respArray[36]);
                gr01.u_mt_activo_03 = respArray[36];
                gr01.u_mt_activo_04_id = this.regresaOptionValue(respArray[37]);
                gr01.u_mt_activo_04 = respArray[37];
                gr01.u_mt_activo_05_id = this.regresaOptionValue(respArray[38]);
                gr01.u_mt_activo_05 = respArray[38];
                gr01.u_mt_activo_06_id = this.regresaOptionValue(respArray[39]);
                gr01.u_mt_activo_06 = respArray[39];
                gr01.u_mt_activo_07_id = this.regresaOptionValue(respArray[40]);
                gr01.u_mt_activo_07 = respArray[40];
                gr01.u_mt_activo_08_id = this.regresaOptionValue(respArray[41]);
                gr01.u_mt_activo_08 = respArray[41];
                gr01.u_mt_activo_09_id = this.regresaOptionValue(respArray[42]);
                gr01.u_mt_activo_09 = respArray[42];
                gr01.u_mt_activo_10_id = this.regresaOptionValue(respArray[43]);
                gr01.u_mt_activo_10 = respArray[43];
                gr01.u_mt_activo_11_id = this.regresaOptionValue(respArray[44]);
                gr01.u_mt_activo_11 = respArray[44];
                gr01.u_mt_activo_12_id = this.regresaOptionValue(respArray[45]);
                gr01.u_mt_activo_12 = respArray[45];
                gr01.u_mt_activo_13_id = this.regresaOptionValue(respArray[46]);
                gr01.u_mt_activo_13 = respArray[46];
                gr01.u_mt_activo_14_id = this.regresaOptionValue(respArray[47]);
                gr01.u_mt_activo_14 = respArray[47];
                gr01.u_mt_activo_15_id = this.regresaOptionValue(respArray[48]);
                gr01.u_mt_activo_15 = respArray[48];
                gr01.u_mt_gramaje_tipo_01_id = this.regresaOptionValue(respArray[49]);
                gr01.u_mt_gramaje_tipo_01 = respArray[49];
                gr01.u_mt_gramaje_tipo_02_id = this.regresaOptionValue(respArray[50]);
                gr01.u_mt_gramaje_tipo_02 = respArray[50];
                gr01.u_mt_gramaje_tipo_03_id = this.regresaOptionValue(respArray[51]);
                gr01.u_mt_gramaje_tipo_03 = respArray[51];
                gr01.u_mt_gramaje_contenido_01 = respArray[52];
                gr01.u_mt_gramaje_contenido_02 = respArray[53];
                gr01.u_mt_gramaje_contenido_03 = respArray[54];
                gr01.u_mt_num_piezas_por_unidad = respArray[55];
                gr01.u_mt_d_departamento_id = this.regresaOptionValue(respArray[56]);
                gr01.u_mt_d_departamento = respArray[56];
                gr01.u_mt_d_categoria_id = this.regresaOptionValue(respArray[57]);
                gr01.u_mt_d_categoria = respArray[57];
                gr01.u_mt_d_subcategoria_id = this.regresaOptionValue(respArray[58]);
                gr01.u_mt_d_subcategoria = respArray[58];
                gr01.u_mt_descripcion_mercadologica = respArray[59];
                gr01.u_mt_beneficios = respArray[60];
                gr01.u_mt_ecommerce = respArray[61];
                gr01.u_mt_indicacion_terapeutica = respArray[62];
                gr01.u_mt_contraindicacion = respArray[63];
                gr01.u_mt_leyenda_de_proteccion = respArray[64];
                gr01.u_mt_prescripcion = respArray[65];
                gr01.u_mt_advertencias = respArray[66];
                gr01.u_mt_interaccion_medicamentosa = respArray[67];
                gr01.u_mt_racciones_adversas = respArray[68];
                gr01.u_mt_manjo_de_sobredosificacion = respArray[69];
                gr01.u_mt_propiedad_farmaceutica = respArray[70];
                gr01.u_mt_dosis = respArray[71];
                gr01.u_mt_via_de_administracion = respArray[72];
                gr01.u_mt_clave_cnis = respArray[73];
                gr01.u_mt_embarazo = respArray[74];
                gr01.u_mt_lactancia = respArray[75];
                gr01.u_mt_nominacion_generica = respArray[76];
                gr01.u_mt_marca_del_producto_id = this.regresaOptionValue(respArray[77]);
                gr01.u_mt_marca_del_producto = respArray[77];
                gr01.u_mt_linea_del_proveedor_id = this.regresaOptionValue(respArray[78]);
                gr01.u_mt_linea_del_proveedor = respArray[78];

                gr01.u_mt_esquema = respArray[79];
                gr01.u_mt_precio_costo = respArray[80];
                gr01.u_mt_precio_farmacia = respArray[81];
                gr01.u_mt_markup = respArray[82];
                gr01.u_mt_fee = respArray[83];
                gr01.u_mt_condicion_adiconal = respArray[84];
                // gr01.u_mt_condicion_no_devolucion = respArray[85]; // <-- "No"
                gr01.u_mt_margen_final_en_porcentaje = respArray[86];
                gr01.u_mt_margen_final_en_dinero = respArray[87];
                gr01.u_mt_plazo_de_pago = respArray[88];

                gr01.u_mt_condicion_de_temperatura = respArray[89]; // Pestaña "Asuntos regulatorios"
                gr01.u_mt_cond_almacenamiento_ref = this.regresaOptionFieldRef01(respArray[89]); // Pestaña "Datos Basicos"
                gr01.u_mt_grtransp_ref = this.regresaOptionFieldRef02(respArray[89]);

                gr01.u_mt_sujeto_a_lote = respArray[90];
                gr01.u_mt_indicador_manipulacion = respArray[91];

                gr01.u_mt_grupo_control_calidad = respArray[92]; // Pestaña "Asuntos regulatorios"
                gr01.u_mt_gr_ctrl_calidad_ref = respArray[92]; // Pestaña "Datos Basicos"

                // gr01.u_mt_motivo_de_rechazo = ' ++ '+campoEtapa;

                gr01.u_mt_grupo_de_material_2 = respArray[93];
                gr01.u_mt_jerarquia_de_productos = respArray[94];

                gr01.u_mt_analista_sr = respArray[98];

                gr01.u_mt_no_material_anterior = respArray[99];
                gr01.u_mt_no_materia = respArray[100];
                gr01.u_mt_tpmaterial_ref = respArray[101];
                gr01.u_mt_ramo_ref = respArray[102];
                // gr01.u_mt_grtransp_ref = respArray[103];
                gr01.u_mt_sector_ref = respArray[104];
                gr01.u_mt_jquia_producto_ref = respArray[105];
                gr01.u_mt_ind_cad_ref = respArray[106];
                gr01.u_mt_statusmat_ref = respArray[107];
                gr01.u_mt_status_ref = respArray[108];
                gr01.u_mt_valido_de = respArray[109];
                gr01.u_mt_validez_de = respArray[110];
                gr01.u_mt_tmpohastacaduc = respArray[111];
                gr01.u_mt_durtotalconserv = respArray[112];
                gr01.u_mt_susbonifes_ref = respArray[113];
                gr01.u_mt_fabricante = this.cerosIzquierda(respArray[114], 10);
                gr01.u_mt_ind_periodo_ref = respArray[115];
                gr01.u_mt_regla_redondeo_ref = respArray[116];
                gr01.u_mt_grposgral_ref = respArray[117];
                gr01.u_mt_fecad_feex_ref = respArray[118];
                // gr01.u_mt_cond_almacenamiento_ref = respArray[119];
                gr01.u_mt_ind_manipul_ref = respArray[120];
                gr01.u_mt_denomin = respArray[122];
                gr01.u_mt_pb_niv_mandante_ref = respArray[123];
                gr01.u_mt_linea_de_devolucion_ref = respArray[124];
                gr01.u_mt_deltacontrolfield_ref = respArray[125];

                gr01.u_mt_precio_costo_final = respArray[126];
                gr01.u_mt_precio_farmacia_final = respArray[127];

                gr01.u_mt_2_unidad = respArray[128];

                gr01.u_mt_bto_unidad_id = 'BTO';
                gr01.u_mt_bto_unidad = 'b5d828b41b389690a9f8766dcc4bcb0c';
                gr01.u_mt_bto_ean = respArray[130];
                gr01.u_mt_bto_piezas = this.esNumeroNdecimales(respArray[131], 0);
                gr01.u_mt_bto_longitud_cm = this.esNumeroNdecimales(respArray[132], 3);
                gr01.u_mt_bto_ancho_cm = this.esNumeroNdecimales(respArray[133], 3);
                gr01.u_mt_bto_altura_cm = this.esNumeroNdecimales(respArray[134], 3);
                gr01.u_mt_bto_pesos_gr = this.esNumeroNdecimales(respArray[135], 3);

                gr01.u_mt_pal_unidad_id = 'PAL';
                gr01.u_mt_pal_unidad = '741eeda997f5a210cc1ebbdfe153af7b';
                gr01.u_mt_pal_ean = respArray[138];
                gr01.u_mt_pal_piezas = this.esNumeroNdecimales(respArray[139], 0);
                gr01.u_mt_pal_longitud_cm = this.esNumeroNdecimales(respArray[140], 3);
                gr01.u_mt_pal_ancho_cm = this.esNumeroNdecimales(respArray[141], 3);
                gr01.u_mt_pal_altura_cm = this.esNumeroNdecimales(respArray[142], 3);
                gr01.u_mt_pal_pesos_gr = this.esNumeroNdecimales(respArray[143], 3);

                gr01.u_mt_zca_unidad_id = 'ZCA';
                gr01.u_mt_zca_unidad = '935eeda997f5a210cc1ebbdfe153af9a';
                gr01.u_mt_zca_ean = respArray[145];
                gr01.u_mt_zca_piezas = this.esNumeroNdecimales(respArray[146], 0);
                gr01.u_mt_zca_longitud_cm = this.esNumeroNdecimales(respArray[147], 3);
                gr01.u_mt_zca_ancho_cm = this.esNumeroNdecimales(respArray[148], 3);
                gr01.u_mt_zca_altura_cm = this.esNumeroNdecimales(respArray[149], 3);
                gr01.u_mt_zca_pesos_gr = this.esNumeroNdecimales(respArray[150], 3);

                gr01.u_mt_pa1_unidad_id = 'PA1';
                gr01.u_mt_pa1_unidad = 'b68eada997f5a210cc1ebbdfe153af84';
                gr01.u_mt_pa1_ean = respArray[152];
                gr01.u_mt_pa1_piezas = this.esNumeroNdecimales(respArray[153], 0);
                gr01.u_mt_pa1_longitud_cm = this.esNumeroNdecimales(respArray[154], 3);
                gr01.u_mt_pa1_ancho_cm = this.esNumeroNdecimales(respArray[155], 3);
                gr01.u_mt_pa1_altura_cm = this.esNumeroNdecimales(respArray[156], 3);
                gr01.u_mt_pa1_pesos_gr = this.esNumeroNdecimales(respArray[157], 3);

                gr01.u_mt_ze1_unidad_id = 'ZE1';
                gr01.u_mt_ze1_unidad = '4caeada997f5a210cc1ebbdfe153af96';
                gr01.u_mt_ze1_ean = respArray[159];
                gr01.u_mt_ze1_piezas = this.esNumeroNdecimales(respArray[160], 0);
                gr01.u_mt_ze1_longitud_cm = this.esNumeroNdecimales(respArray[161], 3);
                gr01.u_mt_ze1_ancho_cm = this.esNumeroNdecimales(respArray[162], 3);
                gr01.u_mt_ze1_altura_cm = this.esNumeroNdecimales(respArray[163], 3);
                gr01.u_mt_ze1_pesos_gr = this.esNumeroNdecimales(respArray[164], 3);


                if (campoEtapa.toString() == '7') {
                    gr01.u_mtr_etapa07 = 'Ya';
                }


                // gs.log(gr01.u_mt_nombre  +' -- ' +respArray[136], msgLog);
                if (gr01.u_mt_nombre != respArray[136])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr01.u_mt_nombre = respArray[136];
                gr01.u_mt_grupo_mtr_almacen = respArray[165];

                gr01.u_mt_keywords_complementario = respArray[95];
                gr01.u_mt_metadescripcion = respArray[96];
                gr01.u_mt_caption_link = respArray[97];

            }

            gr01.u_mt_motivo_de_rechazo = '';
            gr01.update();

        }



        // Logica pasada cuando dependia de varios registros simultanios ---------------------------------------------
        // Pero es necesario pra la logica actual.. ------------------------------------------------------------------

        // Validar "Registros" pendientes
        var gr02 = new GlideRecord('u_mdm_registros');
        gr02.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=NULL');
        gr02.query();
        if (gr02.next()) {
            respuestaReg = 'ConPendientes';
        } else {
            respuestaReg = 'NA';
        }
        respuesta += respuestaReg;
        respuesta += 'zzRespUestazz';

        // "Registros" regresados para corregir
        var gr03 = new GlideRecord('u_mdm_registros');
        gr03.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=Corregir');
        gr03.query();
        if (gr03.next()) {
            respuestaCont = gr03.getRowCount().toString();
        } else {
            respuestaCont = 'NA';
        }
        respuesta += respuestaCont;
        respuesta += 'zzRespUestazz';

        // gs.log('006 - Estatus \nMas task pendientes: ' + respuestaReg + '\nCorregir: ' + respuestaCont, msgLog);
        // ------------------------------------------------------------------------------------------------------------



        // TABLA MDM REGISTRO APROBACIONES
        // gs.log('006 - ' + 'u_ritm=' + sys_id_ritm + '^u_etapa_numero=' + campoEtapa, msgLog);

        var gr702 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr702.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_etapa_numero=' + campoEtapa);
        gr702.orderByDesc('sys_created_on');
        gr702.query();
        gr702.next();
        if (campoObservacion == '') {
            gr702.u_estatus = 'Aprobado';
        } else {
            gr702.u_estatus = 'Rechazado';
            gr702.u_motivo = campoObservacion;
        }
        gr702.u_fecha = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora();
        gr702.update();



        // APROBACION MULTIPLE

        var gr701 = new GlideRecord('sc_req_item');
        gr701.addEncodedQuery('sys_id=' + sys_id_ritm);
        gr701.query();
        gr701.next();

        if (gr701.u_mdm_etapa == 'Aprobacion multiple') {


            // NO cambios en RITM
            gs.log('007 - Opction APROBACION MULTIPLE. ', msgLog);

            var gr13 = new GlideRecord('sc_task');
            gr13.addEncodedQuery('sys_id=' + sys_id_task);
            gr13.query();
            if (gr13.next()) {
                gr13.state = 3; // Close
                gr13.update();
            }

            if (campoObservacion == '')
                respuestaMsg = 'MultipleAprobado';
            else
                respuestaMsg = 'MultipleRechazado';


        } else {


            // NORMAL 
            gs.log('007 - Opction NORMAL.', msgLog);

            // Update RITM "Mantaner" o "Siguiente" Etapa

            respuestaMsg = 'HoldEtapa';
            if (respuestaReg == 'NA') {

                var gr04 = new GlideRecord('sc_req_item');
                gr04.addEncodedQuery('sys_id=' + sys_id_ritm);
                gr04.query();
                gr04.next();
                if (respuestaCont == 'NA') {

                    var newEtapa = globalNewEtapaRow; // ---------------------------------- New
                    gr04.u_mdm_etapa = newEtapa.toString();
                    gr04.update();

                    respuestaMsg = 'NewEtapa';

                    // Cerrar "Task" actual
                    var gr05 = new GlideRecord('sc_task');
                    gr05.addEncodedQuery('sys_id=' + sys_id_task);
                    gr05.query();
                    gr05.next();
                    gr05.state = 3;
                    gr05.u_mdm_observacion = '';
                    gr05.update();

                    // Limpiar campos de "Registros"
                    var gr06 = new GlideRecord('u_mdm_registros');
                    gr06.addEncodedQuery('u_ritm=' + sys_id_ritm);
                    gr06.query();
                    gr06.u_mt_valido = '';
                    // gr06.u_mt_valido_error = '';
                    gr06.updateMultiple();

                    // Buscar si ya esiste una "Task" con numero de etapa nuevo (Cuando se regresan las tareas).
                    // if (newEtapa != 8 && gr04.u_mdm_etapa != 'Aprobacion multiple') {
                    //     var gr08 = new GlideRecord('sc_task');
                    //     gr08.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + newEtapa);
                    //     gr08.query();
                    //     gr08.next();
                    //     gr08.state = 1;
                    //     gr08.update();
                    // } else {
                    //     // gs.log('Diferente a 8.', msgLog);
                    // }

                } else {

                    // gs.log('006 - 01' , msgLog); 

                    // mdmRegresar == 'Masivo' o 'Normal' 

                    // RITM
                    gr04.setWorkflow(false);
                    // gr04.u_mdm_etapa = globalNewEtapaRow; // RITM
                    gr04.state = -5;
                    gr04.update();

                    var gr10 = new GlideRecord('sc_task');
                    gr10.addEncodedQuery('sys_id=' + sys_id_task);
                    gr10.query();
                    gr10.next();
                    gr10.state = 3; // Close
                    gr10.update();

                    /*
					if (mdmRegresar == 'Normal') {

						// RITM
						gr04.state = -5;
						gr04.update();

						// Pendiente "Task"
						var gr07 = new GlideRecord('sc_task');
						gr07.addEncodedQuery('sys_id=' + sys_id_task);
						gr07.query();
						gr07.next();
						gr07.state = -5;
						// var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy(); // Script Includes
						// gr01.u_mt_observacion_temp = fechaTemp + '' + campoObservacion;
						gr07.u_mdm_observacion = campoObservacion;
						gr07.update();

					} else if (mdmRegresar == 'Masivo') {
						// gs.log('006 - 02' , msgLog); 	

						// RITM
						gr04.setWorkflow(false);
						// gr04.u_mdm_etapa = globalNewEtapaRow; // RITM
						gr04.state = -5;
						gr04.update();

						var gr10 = new GlideRecord('sc_task');
						gr10.addEncodedQuery('sys_id=' + sys_id_task);
						gr10.query();
						gr10.next();
						gr10.state = 3; // Close
						gr10.update();
					
						// var gr11 = new GlideRecord('sc_task');
						// gr11.addEncodedQuery('sys_id=' + sys_id_task);
						// gr11.query();
						// gr11.next();
						// gr11.state = 2; // Work in Progress 
						// gr11.update();

						var gr12 = new GlideRecord('sc_task');
						gr12.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + globalNewEtapaRow);
						gr12.query();
						gr12.next();
						gr12.state = 1; // open
						gr12.update();

						// RITM
						gr04.state = -5;
						gr04.update();	

					}				
					*/
                }
            }

        }

        respuesta += respuestaMsg;

        // ConPendientes/NA  	RegEnProceso/NA		HoldEtapa/NewEtapa
        // [NA] 				[NA] 				[NewEtapa] 
        // NAzzRespUestazzNAzzRespUestazzNewEtapa		

        // gs.log('008 - respuesta: \n' + respuesta, msgLog);
        return respuesta;
    },


    // ==============================================================================================================================

    // Renombrar

    attachmentRenombrar: function(nID, nEAN, nNombre) {
        // Name por table "MDM Options"
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('u_key=mdm_archivo^u_labe=' + nNombre);
        gr01.query();
        gr01.next();
        nNombre = gr01.u_value.toString();
        // console.log('Ser 100 nID: ' + nID + ' - ' + nNombre + ' - ' + nExtencion);
        var gr02 = new GlideRecord('sys_attachment');
        gr02.addEncodedQuery('sys_id=' + nID);
        gr02.query();
        if (gr02.next()) {
            gr02.file_name = nEAN + nNombre;
            gr02.update();
        }
        return nID;
    },

    // ==============================================================================================================================

    regresaOptionLabe: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_labe;
    },

    // ==============================================================================================================================

    regresaOptionValue: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_value;
    },

    // ==============================================================================================================================

    regresaOptionValueXLS: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        if (gr01.next())
            return gr01.u_value;
        else
            return '';
    },

    // ==============================================================================================================================

    regresaOptionField01: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_field01;
    },

    // ==============================================================================================================================

    regresaOptionField02: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_field02;
    },

    // ==============================================================================================================================

    regresaOptionFieldRef01: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_ref01;
    },

    // ==============================================================================================================================

    regresaOptionFieldRef02: function(vID) {
        var gr01 = new GlideRecord('u_mdm_options');
        gr01.addEncodedQuery('sys_id=' + vID);
        gr01.query();
        gr01.next();
        return gr01.u_ref02;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    // BOTON NORMAL De TASK Aprovacion/Regresar
    mdm_Ritm_Validar_normal_registros_UI_Action_Task_secuencial: function(a_var_id_task, a_var_id_ritm, a_var_id_reg, a_varObserv, a_varComentarios, a_varEtapaNum, a_varNoMtrAnterior, a_varDataAll) {
        msgLog = 'MDM_Valida_registros_012';
        // gs.log('000 ', msgLog);
        var respuestaTask = '',
            respuestaNumDuplicado = '',
            var_id_task = a_var_id_task,
            var_id_ritm = a_var_id_ritm,
            var_id_reg = a_var_id_reg,
            varObserv = a_varObserv, // Sirve para identificar si se regresa o pasa a la siguiente etapa
            varComentarios = a_varComentarios,
            varEtapaNum = a_varEtapaNum,
            varNoMtrAnterior = a_varNoMtrAnterior,
            varDataAll = a_varDataAll;
        // gs.log('001 - ' + var_id_task +' - '+ var_id_ritm +' - '+ var_id_reg +' - '+ varObserv, msgLog);
        // gs.log(varDataAll, msgLog);		


        respuestaNumDuplicado = (varEtapaNum == '8') ? this.mdm_Ritm_Validar_No_MTR_secuencial(var_id_reg, varNoMtrAnterior) : 'No';
        if (respuestaNumDuplicado == 'No') {
            // ------------------------------------------------------------
            mdmRegresar = 'Normal';
            newEtapaRow = parseInt(varEtapaNum) + 1;
            newEtapaRowActual = parseInt(varEtapaNum);
            // ------------------------------------------------------------
            respuestaTask = this.mdm_Ritm_Validar_normal_registro_secuencial(var_id_task, var_id_ritm, var_id_reg, varObserv, varDataAll, varEtapaNum);
            // ConPendientes/NA  ---  RegEnProceso/NA  ---  HoldEtapa/NewEtapa
            // NAzzRespUestazzNAzzRespUestazzNewEtapa								Respuesta que se manda a "UI Action" String
            // [NA] [NA] [NewEtapa] 												String -> Array 
            // ------------------------------------------------------------
            var gr00 = new GlideRecord('sc_task');
            gr00.addEncodedQuery('request_item=' + var_id_ritm);
            gr00.query();
            gr00.u_mdm_comentarios = varComentarios;
            gr00.updateMultiple();
            // ------------------------------------------------------------
        } else {
            respuestaTask = 'NAzzRespUestazzNAzzRespUestazzNoDuplicadozzRespUestazz' + respuestaNumDuplicado;
        }

        return respuestaTask;
    },


    // ==============================================================================================================================

    mdm_Ritm_Validar_No_MTR_secuencial: function(reg_id, reg_num) {
        var respuestaNum = '';
        var gr84 = new GlideRecord('u_mdm_registros');
        gr84.addEncodedQuery('u_mt_estatus!=Rechazado^u_mt_estatus!=Lectura^u_mtr_cambio_material_origen!=' + reg_id + '^u_mt_no_material_anterior=' + reg_num);
        gr84.query();
        if (gr84.next()) {
            respuestaNum = gr84.u_mt_pi_ean;
        } else {
            respuestaNum = 'No';
        }
        return respuestaNum;
    },


    // ==============================================================================================================================

    mdm_Ritm_Validar_normal_registro_secuencial: function(idTask, idRitm, idRegistro, campoObservacion, campoDataAll, campoEtapa) {
        // msgLog = 'Funcion_origen';
        // gs.log('004 ', msgLog);
        var respuesta = '',
            respuestaReg = '',
            respuestaCont = '',
            respuestaMsg = '',
            cambioEANoNAME = 'No',
            sys_id_task = idTask,
            sys_id_ritm = idRitm,
            sys_id_reg = idRegistro;
        // gs.log('005 - ' + idTask + ' - ' + idRitm + ' - ' + idRegistro + ' - ' + campoObservacion, msgLog);
        // gs.log(campoDataAll, msgLog);

        var respArray = campoDataAll.toString().split('zzRespUestazz');

        // Update "Registro"
        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + sys_id_reg);
        gr01.query();
        if (gr01.next()) {

            if (campoObservacion != '') {
                // REGRAR
                gr01.u_mt_valido = 'Corregir';
                var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes
                gr01.u_mt_observacion_temp = fechaTemp + '\n\n' + this.recuperaNameEtapa(gr01.u_mt_etapa_actual.toString()) + '\n' + campoObservacion;
                //gr01.u_mt_valido_error = 'Actualiza Task campo observacion' ;
            } else {
                // SIGUIENTE ETAPA	
                if (gr01.u_mt_valido != 'Corregir')
                    gr01.u_mt_valido = 'Valido';
                gr01.u_mt_observacion_temp = '';
                // gr01.u_mt_valido_error = '';

                // PI -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_pi_ean;
                varIDTempNew = respArray[1];
                // gs.log('Ser 100 EAN PI: \n' + gr01.u_mt_pi_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 PI Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_pi_01, varIDTempNew, 'pi_01');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_02, varIDTempNew, 'pi_02');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_03, varIDTempNew, 'pi_03');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_04, varIDTempNew, 'pi_04');
                    this.attachmentRenombrar(gr01.u_mt_img_pi_05, varIDTempNew, 'pi_05');
                    this.attachmentRenombrar(gr01.u_mt_a_lista_de_precios, varIDTempNew, 'Lista_de_precios');
                    this.attachmentRenombrar(gr01.u_mt_a_ficha_tecnica, varIDTempNew, 'Ficha_tecnica');
                    this.attachmentRenombrar(gr01.u_mt_a_registro_sanitario, varIDTempNew, 'Registro_sanitario');
                    this.attachmentRenombrar(gr01.u_mt_a_prorroga, varIDTempNew, 'Prorroga');
                    this.attachmentRenombrar(gr01.u_mt_a_hoja_seguridad, varIDTempNew, 'Hoja_de_seguridad');
                    this.attachmentRenombrar(gr01.u_mt_a_oficio_de_clasificacion, varIDTempNew, 'Oficio_de_clasificacion');
                    this.attachmentRenombrar(gr01.u_mt_a_aviso_de_funcionamiento, varIDTempNew, 'Aviso_de_funcionamiento');
                    this.attachmentRenombrar(gr01.u_mt_a_carta_presentacion_documento, varIDTempNew, 'Carta_presentacion_documento');
                    this.attachmentRenombrar(gr01.u_mt_a_marbete_empaque_artes_producto, varIDTempNew, 'Marbete_empaque_artes_producto');
                }
                gr01.u_mt_pi_unidad_id = 'PI';
                gr01.u_mt_pi_unidad = '60ceefa01be9c610a9f8766dcc4bcb1e';

                // gs.log(gr01.u_mt_pi_ean  +' -- ' +respArray[1], msgLog);
                if (gr01.u_mt_pi_ean != respArray[1])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr01.u_mt_pi_ean = respArray[1];
                gr01.u_mt_pi_piezas = this.esNumeroNdecimales(respArray[2], 0);
                gr01.u_mt_pi_longitud_cm = this.esNumeroNdecimales(respArray[3], 3);
                gr01.u_mt_pi_ancho_cm = this.esNumeroNdecimales(respArray[4], 3);
                gr01.u_mt_pi_altura_cm = this.esNumeroNdecimales(respArray[5], 3);
                gr01.u_mt_pi_pesos_gr = this.esNumeroNdecimales(respArray[6], 3);

                // EMP -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_emp_ean;
                varIDTempNew = respArray[8];
                // gs.log('Ser 100 EAN EMP: \n' + gr01.u_mt_emp_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 EMP Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_emp_01, varIDTempNew, 'emp_01');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_02, varIDTempNew, 'emp_02');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_03, varIDTempNew, 'emp_03');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_04, varIDTempNew, 'emp_04');
                    this.attachmentRenombrar(gr01.u_mt_img_emp_05, varIDTempNew, 'emp_05');
                }
                gr01.u_mt_emp_unidad_id = 'EMP';
                gr01.u_mt_emp_unidad = 'ecceefa01be9c610a9f8766dcc4bcb1e';
                gr01.u_mt_emp_ean = respArray[8];
                gr01.u_mt_emp_piezas = this.esNumeroNdecimales(respArray[9], 0);
                gr01.u_mt_emp_longitud_cm = this.esNumeroNdecimales(respArray[10], 3);
                gr01.u_mt_emp_ancho_cm = this.esNumeroNdecimales(respArray[11], 3);
                gr01.u_mt_emp_altura_cm = this.esNumeroNdecimales(respArray[12], 3);
                gr01.u_mt_emp_pesos_gr = this.esNumeroNdecimales(respArray[13], 3);

                // SUB -----------------------------------------------------------------------------
                varIDTemp = gr01.u_mt_sub_ean;
                varIDTempNew = respArray[15];
                // gs.log('Ser 100 EAN SUB: \n' + gr01.u_mt_sub_ean + '\n' + varIDTempNew, msgLog);
                if (varIDTemp != varIDTempNew) {
                    // gs.log('Ser 100 SUB Cambio.', msgLog);
                    this.attachmentRenombrar(gr01.u_mt_img_sub_01, varIDTempNew, 'sub_01');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_02, varIDTempNew, 'sub_02');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_03, varIDTempNew, 'sub_03');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_04, varIDTempNew, 'sub_04');
                    this.attachmentRenombrar(gr01.u_mt_img_sub_05, varIDTempNew, 'sub_05');
                }
                gr01.u_mt_sub_unidad_id = 'SUB';
                gr01.u_mt_sub_unidad = 'a0ceefa01be9c610a9f8766dcc4bcb1f';
                gr01.u_mt_sub_ean = respArray[15];
                gr01.u_mt_sub_piezas = this.esNumeroNdecimales(respArray[16], 0);
                gr01.u_mt_sub_longitud_cm = this.esNumeroNdecimales(respArray[17], 3);
                gr01.u_mt_sub_ancho_cm = this.esNumeroNdecimales(respArray[18], 3);
                gr01.u_mt_sub_altura_cm = this.esNumeroNdecimales(respArray[19], 3);
                gr01.u_mt_sub_pesos_gr = this.esNumeroNdecimales(respArray[20], 3);
                gr01.u_mt_tipo_id = this.regresaOptionValue(respArray[21]);
                gr01.u_mt_agrupaci_n_de_material_ssa_ref = this.regresaOptionFieldRef01(respArray[21]);
                gr01.u_mt_tipo = respArray[21];
                gr01.u_mt_formula = respArray[22];
                gr01.u_mt_clasificacion_fiscal_id = this.regresaOptionValue(respArray[23]);
                gr01.u_mt_clasificacion_fiscal = respArray[23];
                gr01.u_mt_gpo_trat_logistico_id = this.regresaOptionValue(respArray[24]);
                gr01.u_mt_gpo_trat_logistico = respArray[24];
                gr01.u_mt_circulo_salud_id = this.regresaOptionValue(respArray[25]);
                gr01.u_mt_circulo_salud = respArray[25];
                gr01.u_mt_antibiotico_id = this.regresaOptionValue(respArray[26]);
                gr01.u_mt_antibiotico = respArray[26];
                gr01.u_mt_devolucion_del_cliente_id = this.regresaOptionValue(respArray[27]);
                gr01.u_mt_devolucion_del_cliente = respArray[27];
                gr01.u_mt_division_factura = respArray[28];
                gr01.u_mt_anexo_20_sat = respArray[29];
                gr01.u_mt_formula_farmaceutica_id = this.regresaOptionValue(respArray[30]);
                gr01.u_mt_formula_farmaceutica = respArray[30];
                gr01.u_mt_registro_sanitario = respArray[31];
                gr01.u_mt_registro_sanitario_vigencia = respArray[32];
                gr01.u_mt_registro_sanitario_vigencia_prorroga = respArray[33];
                gr01.u_mt_activo_01_id = this.regresaOptionValue(respArray[34]);
                gr01.u_mt_activo_01 = respArray[34];
                gr01.u_mt_activo_02_id = this.regresaOptionValue(respArray[35]);
                gr01.u_mt_activo_02 = respArray[35];
                gr01.u_mt_activo_03_id = this.regresaOptionValue(respArray[36]);
                gr01.u_mt_activo_03 = respArray[36];
                gr01.u_mt_activo_04_id = this.regresaOptionValue(respArray[37]);
                gr01.u_mt_activo_04 = respArray[37];
                gr01.u_mt_activo_05_id = this.regresaOptionValue(respArray[38]);
                gr01.u_mt_activo_05 = respArray[38];
                gr01.u_mt_activo_06_id = this.regresaOptionValue(respArray[39]);
                gr01.u_mt_activo_06 = respArray[39];
                gr01.u_mt_activo_07_id = this.regresaOptionValue(respArray[40]);
                gr01.u_mt_activo_07 = respArray[40];
                gr01.u_mt_activo_08_id = this.regresaOptionValue(respArray[41]);
                gr01.u_mt_activo_08 = respArray[41];
                gr01.u_mt_activo_09_id = this.regresaOptionValue(respArray[42]);
                gr01.u_mt_activo_09 = respArray[42];
                gr01.u_mt_activo_10_id = this.regresaOptionValue(respArray[43]);
                gr01.u_mt_activo_10 = respArray[43];
                gr01.u_mt_activo_11_id = this.regresaOptionValue(respArray[44]);
                gr01.u_mt_activo_11 = respArray[44];
                gr01.u_mt_activo_12_id = this.regresaOptionValue(respArray[45]);
                gr01.u_mt_activo_12 = respArray[45];
                gr01.u_mt_activo_13_id = this.regresaOptionValue(respArray[46]);
                gr01.u_mt_activo_13 = respArray[46];
                gr01.u_mt_activo_14_id = this.regresaOptionValue(respArray[47]);
                gr01.u_mt_activo_14 = respArray[47];
                gr01.u_mt_activo_15_id = this.regresaOptionValue(respArray[48]);
                gr01.u_mt_activo_15 = respArray[48];
                gr01.u_mt_gramaje_tipo_01_id = this.regresaOptionValue(respArray[49]);
                gr01.u_mt_gramaje_tipo_01 = respArray[49];
                gr01.u_mt_gramaje_tipo_02_id = this.regresaOptionValue(respArray[50]);
                gr01.u_mt_gramaje_tipo_02 = respArray[50];
                gr01.u_mt_gramaje_tipo_03_id = this.regresaOptionValue(respArray[51]);
                gr01.u_mt_gramaje_tipo_03 = respArray[51];
                gr01.u_mt_gramaje_contenido_01 = respArray[52];
                gr01.u_mt_gramaje_contenido_02 = respArray[53];
                gr01.u_mt_gramaje_contenido_03 = respArray[54];
                gr01.u_mt_num_piezas_por_unidad = respArray[55];
                gr01.u_mt_d_departamento_id = this.regresaOptionValue(respArray[56]);
                gr01.u_mt_d_departamento = respArray[56];
                gr01.u_mt_d_categoria_id = this.regresaOptionValue(respArray[57]);
                gr01.u_mt_d_categoria = respArray[57];
                gr01.u_mt_d_subcategoria_id = this.regresaOptionValue(respArray[58]);
                gr01.u_mt_d_subcategoria = respArray[58];
                gr01.u_mt_descripcion_mercadologica = respArray[59];
                gr01.u_mt_beneficios = respArray[60];
                gr01.u_mt_ecommerce = respArray[61];
                gr01.u_mt_indicacion_terapeutica = respArray[62];
                gr01.u_mt_contraindicacion = respArray[63];
                gr01.u_mt_leyenda_de_proteccion = respArray[64];
                gr01.u_mt_prescripcion = respArray[65];
                gr01.u_mt_advertencias = respArray[66];
                gr01.u_mt_interaccion_medicamentosa = respArray[67];
                gr01.u_mt_racciones_adversas = respArray[68];
                gr01.u_mt_manjo_de_sobredosificacion = respArray[69];
                gr01.u_mt_propiedad_farmaceutica = respArray[70];
                gr01.u_mt_dosis = respArray[71];
                gr01.u_mt_via_de_administracion = respArray[72];
                gr01.u_mt_clave_cnis = respArray[73];
                gr01.u_mt_embarazo = respArray[74];
                gr01.u_mt_lactancia = respArray[75];
                gr01.u_mt_nominacion_generica = respArray[76];
                gr01.u_mt_marca_del_producto_id = this.regresaOptionValue(respArray[77]);
                gr01.u_mt_marca_del_producto = respArray[77];
                gr01.u_mt_linea_del_proveedor_id = this.regresaOptionValue(respArray[78]);
                gr01.u_mt_linea_del_proveedor = respArray[78];

                gr01.u_mt_esquema = respArray[79];
                gr01.u_mt_precio_costo = respArray[80];
                gr01.u_mt_precio_farmacia = respArray[81];
                gr01.u_mt_markup = respArray[82];
                gr01.u_mt_fee = respArray[83];
                gr01.u_mt_condicion_adiconal = respArray[84];
                // gr01.u_mt_condicion_no_devolucion = respArray[85]; // <-- "No"
                gr01.u_mt_margen_final_en_porcentaje = respArray[86];
                gr01.u_mt_margen_final_en_dinero = respArray[87];
                gr01.u_mt_plazo_de_pago = respArray[88];

                gr01.u_mt_condicion_de_temperatura = respArray[89]; // Pestaña "Asuntos regulatorios"
                gr01.u_mt_cond_almacenamiento_ref = this.regresaOptionFieldRef01(respArray[89]); // Pestaña "Datos Basicos"
                gr01.u_mt_grtransp_ref = this.regresaOptionFieldRef02(respArray[89]);

                gr01.u_mt_sujeto_a_lote = respArray[90];
                gr01.u_mt_indicador_manipulacion = respArray[91];

                gr01.u_mt_grupo_control_calidad = respArray[92]; // Pestaña "Asuntos regulatorios"
                gr01.u_mt_gr_ctrl_calidad_ref = respArray[92]; // Pestaña "Datos Basicos"

                // gr01.u_mt_motivo_de_rechazo = ' ++ '+campoEtapa;

                gr01.u_mt_grupo_de_material_2 = respArray[93];
                gr01.u_mt_jerarquia_de_productos = respArray[94];

                gr01.u_mt_analista_sr = respArray[98];

                gr01.u_mt_no_material_anterior = respArray[99];
                gr01.u_mt_no_materia = respArray[100];
                gr01.u_mt_tpmaterial_ref = respArray[101];
                gr01.u_mt_ramo_ref = respArray[102];
                // gr01.u_mt_grtransp_ref = respArray[103];
                gr01.u_mt_sector_ref = respArray[104];
                gr01.u_mt_jquia_producto_ref = respArray[105];
                gr01.u_mt_ind_cad_ref = respArray[106];
                gr01.u_mt_statusmat_ref = respArray[107];
                gr01.u_mt_status_ref = respArray[108];
                gr01.u_mt_valido_de = respArray[109];
                gr01.u_mt_validez_de = respArray[110];
                gr01.u_mt_tmpohastacaduc = respArray[111];
                gr01.u_mt_durtotalconserv = respArray[112];
                gr01.u_mt_susbonifes_ref = respArray[113];
                gr01.u_mt_fabricante = this.cerosIzquierda(respArray[114], 10);
                gr01.u_mt_ind_periodo_ref = respArray[115];
                gr01.u_mt_regla_redondeo_ref = respArray[116];
                gr01.u_mt_grposgral_ref = respArray[117];
                gr01.u_mt_fecad_feex_ref = respArray[118];
                // gr01.u_mt_cond_almacenamiento_ref = respArray[119];
                gr01.u_mt_ind_manipul_ref = respArray[120];
                gr01.u_mt_denomin = respArray[122];
                gr01.u_mt_pb_niv_mandante_ref = respArray[123];
                gr01.u_mt_linea_de_devolucion_ref = respArray[124];
                gr01.u_mt_deltacontrolfield_ref = respArray[125];

                gr01.u_mt_precio_costo_final = respArray[126];
                gr01.u_mt_precio_farmacia_final = respArray[127];

                gr01.u_mt_2_unidad = respArray[128];

                gr01.u_mt_bto_unidad_id = 'BTO';
                gr01.u_mt_bto_unidad = 'b5d828b41b389690a9f8766dcc4bcb0c';
                gr01.u_mt_bto_ean = respArray[130];
                gr01.u_mt_bto_piezas = this.esNumeroNdecimales(respArray[131], 0);
                gr01.u_mt_bto_longitud_cm = this.esNumeroNdecimales(respArray[132], 3);
                gr01.u_mt_bto_ancho_cm = this.esNumeroNdecimales(respArray[133], 3);
                gr01.u_mt_bto_altura_cm = this.esNumeroNdecimales(respArray[134], 3);
                gr01.u_mt_bto_pesos_gr = this.esNumeroNdecimales(respArray[135], 3);

                gr01.u_mt_pal_unidad_id = 'PAL';
                gr01.u_mt_pal_unidad = '741eeda997f5a210cc1ebbdfe153af7b';
                gr01.u_mt_pal_ean = respArray[138];
                gr01.u_mt_pal_piezas = this.esNumeroNdecimales(respArray[139], 0);
                gr01.u_mt_pal_longitud_cm = this.esNumeroNdecimales(respArray[140], 3);
                gr01.u_mt_pal_ancho_cm = this.esNumeroNdecimales(respArray[141], 3);
                gr01.u_mt_pal_altura_cm = this.esNumeroNdecimales(respArray[142], 3);
                gr01.u_mt_pal_pesos_gr = this.esNumeroNdecimales(respArray[143], 3);

                gr01.u_mt_zca_unidad_id = 'ZCA';
                gr01.u_mt_zca_unidad = '935eeda997f5a210cc1ebbdfe153af9a';
                gr01.u_mt_zca_ean = respArray[145];
                gr01.u_mt_zca_piezas = this.esNumeroNdecimales(respArray[146], 0);
                gr01.u_mt_zca_longitud_cm = this.esNumeroNdecimales(respArray[147], 3);
                gr01.u_mt_zca_ancho_cm = this.esNumeroNdecimales(respArray[148], 3);
                gr01.u_mt_zca_altura_cm = this.esNumeroNdecimales(respArray[149], 3);
                gr01.u_mt_zca_pesos_gr = this.esNumeroNdecimales(respArray[150], 3);

                gr01.u_mt_pa1_unidad_id = 'PA1';
                gr01.u_mt_pa1_unidad = 'b68eada997f5a210cc1ebbdfe153af84';
                gr01.u_mt_pa1_ean = respArray[152];
                gr01.u_mt_pa1_piezas = this.esNumeroNdecimales(respArray[153], 0);
                gr01.u_mt_pa1_longitud_cm = this.esNumeroNdecimales(respArray[154], 3);
                gr01.u_mt_pa1_ancho_cm = this.esNumeroNdecimales(respArray[155], 3);
                gr01.u_mt_pa1_altura_cm = this.esNumeroNdecimales(respArray[156], 3);
                gr01.u_mt_pa1_pesos_gr = this.esNumeroNdecimales(respArray[157], 3);

                gr01.u_mt_ze1_unidad_id = 'ZE1';
                gr01.u_mt_ze1_unidad = '4caeada997f5a210cc1ebbdfe153af96';
                gr01.u_mt_ze1_ean = respArray[159];
                gr01.u_mt_ze1_piezas = this.esNumeroNdecimales(respArray[160], 0);
                gr01.u_mt_ze1_longitud_cm = this.esNumeroNdecimales(respArray[161], 3);
                gr01.u_mt_ze1_ancho_cm = this.esNumeroNdecimales(respArray[162], 3);
                gr01.u_mt_ze1_altura_cm = this.esNumeroNdecimales(respArray[163], 3);
                gr01.u_mt_ze1_pesos_gr = this.esNumeroNdecimales(respArray[164], 3);


                if (campoEtapa.toString() == '7') {
                    gr01.u_mtr_etapa07 = 'Ya';
                }


                // gs.log(gr01.u_mt_nombre  +' -- ' +respArray[136], msgLog);
                if (gr01.u_mt_nombre != respArray[136])
                    cambioEANoNAME = 'Si';
                // gs.log(cambioEANoNAME, msgLog);

                gr01.u_mt_nombre = respArray[136];
                gr01.u_mt_grupo_mtr_almacen = respArray[165];

                gr01.u_mt_keywords_complementario = respArray[95];
                gr01.u_mt_metadescripcion = respArray[96];
                gr01.u_mt_caption_link = respArray[97];
            }

            gr01.u_mt_motivo_de_rechazo = '';
            gr01.update();

        }

        // Validar "Registros" pendientes
        var gr02 = new GlideRecord('u_mdm_registros');
        gr02.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=NULL');
        gr02.query();
        if (gr02.next()) {
            respuestaReg = 'ConPendientes';
        } else {
            respuestaReg = 'NA';
        }
        respuesta += respuestaReg;
        respuesta += 'zzRespUestazz';

        // "Registros" regresados para corregir
        var gr03 = new GlideRecord('u_mdm_registros');
        gr03.addEncodedQuery('u_ritm=' + sys_id_ritm + '^u_mt_valido=Corregir');
        gr03.query();
        if (gr03.next()) {
            respuestaCont = gr03.getRowCount().toString();
        } else {
            respuestaCont = 'NA';
        }
        respuesta += respuestaCont;
        respuesta += 'zzRespUestazz';

        // Update RITM "Mantaner" o "Siguiente" Etapa
        respuestaMsg = 'HoldEtapa';
        if (respuestaReg == 'NA') {
            var gr04 = new GlideRecord('sc_req_item');
            gr04.addEncodedQuery('sys_id=' + sys_id_ritm);
            gr04.query();
            gr04.next();
            if (respuestaCont == 'NA') {
                var newEtapa = newEtapaRow; // ---------------------------------- New
                gr04.u_mdm_etapa = newEtapa.toString();
                gr04.update();
                respuestaMsg = 'NewEtapa';

                // Cerrar "Task" actual
                var gr05 = new GlideRecord('sc_task');
                gr05.addEncodedQuery('sys_id=' + sys_id_task);
                gr05.query();
                gr05.next();
                gr05.state = 3;
                gr05.u_mdm_observacion = '';
                gr05.update();
                // Limpiar campos de "Registros"
                var gr06 = new GlideRecord('u_mdm_registros');
                gr06.addEncodedQuery('u_ritm=' + sys_id_ritm);
                gr06.query();
                gr06.u_mt_valido = '';
                // gr06.u_mt_valido_error = '';
                gr06.updateMultiple();
                // Buscar si ya esiste una "Task" con numero de etapa nuevo (Cuando se regresan las tareas).
                if (newEtapa != 8) {
                    var gr08 = new GlideRecord('sc_task');
                    gr08.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + newEtapa);
                    gr08.query();
                    gr08.next();
                    gr08.state = 1;
                    gr08.update();
                } else {
                    // gs.log('Diferente a 8.', msgLog);
                }



            } else {

                if (mdmRegresar == 'Normal') {

                    // RITM
                    gr04.state = -5;
                    gr04.update();

                    // Pendiente "Task"
                    var gr07 = new GlideRecord('sc_task');
                    gr07.addEncodedQuery('sys_id=' + sys_id_task);
                    gr07.query();
                    gr07.next();
                    gr07.state = -5;
                    // var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy(); // Script Includes
                    // gr01.u_mt_observacion_temp = fechaTemp + '' + campoObservacion;
                    gr07.u_mdm_observacion = campoObservacion;
                    gr07.update();

                } else if (mdmRegresar == 'Masivo') {

                    // RITM
                    gr04.u_mdm_etapa = newEtapaRow; // RITM
                    gr04.state = -5;
                    gr04.update();

                    var gr10 = new GlideRecord('sc_task');
                    gr10.addEncodedQuery('sys_id=' + sys_id_task);
                    gr10.query();
                    gr10.next();
                    gr10.state = 3; // Close
                    gr10.update();

                    /*
                    var gr11 = new GlideRecord('sc_task');
                    gr11.addEncodedQuery('sys_id=' + sys_id_task);
                    gr11.query();
                    gr11.next();
                    gr11.state = 2; // Work in Progress 
                    gr11.update();
					*/

                    var gr12 = new GlideRecord('sc_task');
                    gr12.addEncodedQuery('request_item=' + sys_id_ritm + '^u_mdm_etapa=' + newEtapaRow);
                    gr12.query();
                    gr12.next();
                    gr12.state = 1; // open
                    gr12.update();

                    // RITM
                    gr04.state = -5;
                    gr04.update();

                }



            }
        }
        respuesta += respuestaMsg;

        // ConPendientes/NA  ---  RegEnProceso/NA  ---  HoldEtapa/NewEtapa
        // NAzzRespUestazzNAzzRespUestazzNewEtapa								Respuesta que se manda a "UI Action" String
        // [NA] [NA] [NewEtapa] 	

        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ---------------------------------------------------------------------------------------------------------------

    jobTRitmSinAlta: function() {

        msglog = 'JJ_job_MDM_AltaSinRITM_001';
        var respTaskN = 0,
            numRITMs = '',
            numRITM_Task = '',
            iTask = 0,
            tempTasks = '',
            numPadre;
        // Recuperar fecha y hora hoy
        var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes

        var gr011 = new GlideRecord('sc_req_item');
        gr011.addEncodedQuery('cat_item=96f6425c1be58610a9f8766dcc4bcbab^state=1^u_mdm_material=NULL^u_mdm_etapa!=99^ORu_mdm_etapa=NULL');
        gr011.orderBy('parent');
        gr011.orderBy('number');
        gr011.query();
        while (gr011.next()) {
            respTaskN++;
            numRITM_Task = gr011.sys_id;
            numRITMs = (respTaskN == 1) ? '\n\n RITM ---------- Parent -------- Created \n\n' : numRITMs;
            numPadre = (gr011.parent.getDisplayValue().toString() == '') ? 'SinPadre' : gr011.parent.getDisplayValue().toString();
            numRITMs += gr011.number.toString() + ' --- ' + numPadre + ' --- ' + gr011.sys_created_on.toString() + '\n';
            gr011.setWorkflow(false);
            gr011.state = 4; // Closed Incomplete
            gr011.update();

            iTask = 0;
            tempTasks = 'Sin TASKs';
            var gr012 = new GlideRecord('sc_task');
            gr012.addEncodedQuery('request_item=' + numRITM_Task);
            gr012.orderBy('number');
            gr012.query();
            while (gr012.next()) {
                iTask++;
                tempTasks = (iTask == 1) ? '' : tempTasks;
                tempTasks = (iTask > 1) ? tempTasks + ' - ' : tempTasks;
                tempTasks += gr012.number.toString();
                gr012.setWorkflow(false);
                gr012.state = 4; // Closed Incomplete
                gr012.update();
            }
            numRITMs += '[ ' + tempTasks + ' ]\n\n';
        }
        // respTaskN = gr011.getRowCount();
        gs.log('00 - RESUMEN [' + fechaTemp + '] \n\nRITM sin Material: ' + respTaskN + numRITMs + '\n RITM y TASK update a "Closed Incomplete" \n\n', msglog);
        return respTaskN;
    },

    // ==============================================================================================================================

    jobTRitmPendienteS: function(nDias) {

        // 777
        msglog = 'JJ_job_MDM_RegPending_001';

        var iTota = 0,
            iCorregidos = 0,
            iCorregidosDuda = 0,
            iCorregidosSecuencial = 0,
            iSinMaterial = 0,
            vRitmID,
            vRitmNum,
            vRitmEstatus,
            vRitmMaterial,
            ejecutarUpdate = false, // <------- IMPORTANTE
            vMtrEstatus,
            vFechaMayor,
            vFlujoCual,
            respRITMs = '',
            respRITMsTemp = '',
            respRITMsDuda = '',
            respRITMsSecuencial = '',
            respPendientes = '',
            hiloEtapa05 = '72b04b773b887250a4187124c3e45a88', // MDM_05_Negociador			
            hiloEtapaEsperaOpen = '26b04b773b887250a4187124c3e45a6e', // Esta OPEN ?
            respHiloEncontrado5,
            respHiloEncontradoOpen,
            repTaskOpen;


        // gs.log('00 - Inicio', msglog);

        // Recuperar fecha y hora hoy
        var fechaTemp = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora(); // Script Includes

        // RITM Material Alta
        // Estado Open y Pendiente
        // Fecha posterior al 2025-08-30

        var gr00 = new GlideRecord('sc_req_item');
        gr00.addEncodedQuery("cat_item=96f6425c1be58610a9f8766dcc4bcbab^state=1^ORstate=-5^sys_created_on>javascript:gs.dateGenerate('2025-08-30','23:59:59')");
        gr00.orderByDesc('state');
        gr00.query();
        while (gr00.next()) {
            vRitmID = gr00.sys_id.toString();
            vRitmNum = gr00.number.toString();
            vRitmEstatus = gr00.state.toString();
            vRitmMaterial = gr00.u_mdm_material.toString();

            gr01 = new GlideRecord('u_mdm_registros');
            gr01.addEncodedQuery('sys_id=' + vRitmMaterial);
            gr01.query();
            if (gr01.next()) {
                vMtrEstatus = gr01.u_mt_valido.toString();
                if (vMtrEstatus != '') {




                    vFechaMayor = this.mdm_Ritm_Validar_Fecha_Paralelo(vRitmID); // <------ "false" si quieres que siempre entre a SECUENCIAL


                    if (vFechaMayor) {
                        vFlujoCual = 'PARALELO';

                        if (vRitmEstatus == '-5' && vMtrEstatus != 'Corregir') {
                            repTaskOpen = this.taskOpenParalelo(vRitmID);
                            respHiloEncontradoOpen = this.workflowEnHilo(vRitmID, hiloEtapaEsperaOpen);

                            respRITMsTemp = '';
                            respRITMsTemp += vRitmNum + ' [pending] -- ';
                            respRITMsTemp += 'Reg.MDM [' + vMtrEstatus + '] -- ';
                            respRITMsTemp += 'TaskOpen [' + repTaskOpen + '] -- ';
                            respRITMsTemp += 'HiloEnOpen [' + respHiloEncontradoOpen + '] \n';

                            // RITM Estado Pendiente
                            // Hilo Esta OPEN ?
                            // Task Todas Closed 
                            if (respHiloEncontradoOpen && repTaskOpen == 0) {
                                if (ejecutarUpdate) {
                                    gr01.u_mt_valido = 'Corregir';
                                    gr01.update();
                                }
                                iCorregidos++;
                                respRITMs += respRITMsTemp;
                            } else {
                                iCorregidosDuda++;
                                respRITMsDuda += respRITMsTemp;
                            }
                        }


                        if (vRitmEstatus == '1' && vMtrEstatus != 'Valido') {
                            repTaskOpen = this.taskOpenParalelo(vRitmID);
                            respHiloEncontrado5 = this.workflowEnHilo(vRitmID, hiloEtapa05);
                            respHiloEncontradoOpen = this.workflowEnHilo(vRitmID, hiloEtapaEsperaOpen);

                            respRITMsTemp = '';
                            respRITMsTemp += vRitmNum + ' [open] -- ';
                            respRITMsTemp += 'Reg.MDM [' + vMtrEstatus + '] -- ';
                            respRITMsTemp += 'TaskOpen [' + repTaskOpen + '] -- ';
                            respRITMsTemp += 'HiloEn05 [' + respHiloEncontrado5 + '] -- ';
                            respRITMsTemp += 'HiloEnOpen [' + respHiloEncontradoOpen + '] -- ';
                            respRITMsTemp += '(Valido) \n';

                            // RITM Estado Open
                            // Hilo ???
                            // Task Todas Closed 
                            if (respHiloEncontrado5 && repTaskOpen == 1) {
                                if (ejecutarUpdate) {
                                    gr01.u_mt_valido = 'Valido';
                                    gr01.update();
                                    this.workflowNuevoHilo(vRitmID, hiloEtapa05);
                                }
                                iCorregidos++;
                                respRITMs += respRITMsTemp;
                            } else {
                                iCorregidosDuda++;
                                respRITMsDuda += '[No] ---- ' + respRITMsTemp;
                            }

                        }



                    } else {
                        vFlujoCual = 'SECUENCIAL';
                        if (vRitmEstatus == '-5' && vMtrEstatus != 'Corregir') {
                            iCorregidosSecuencial++;
                            respRITMsSecuencial += vRitmNum + ' --- Pendiente -------> Corregir \n';
                        }
                        if (vRitmEstatus == '1' && vMtrEstatus != 'Valido') {
                            iCorregidosSecuencial++;
                            respRITMsSecuencial += vRitmNum + ' --- Open -------> Valido \n';
                        }
                    }
                }
            } else {
                iSinMaterial++;
            }
            iTota++;
        }

        respPendientes += 'Total de registros: ' + iTota + '\n\n';
        respPendientes += 'Reg. Corregidos: ' + iCorregidos + '\n';
        respPendientes += 'Reg. Sin Material: ' + iSinMaterial + '\n\n';
        respPendientes += 'Ejecutar UpDate: ' + ejecutarUpdate + '\n\n';
        if (iCorregidos != 0)
            respPendientes += 'Listado: \n\n' + respRITMs + '\n\n';
        if (iCorregidosDuda != 0)
            respPendientes += 'Listado duda: \n\n' + respRITMsDuda + '\n\n';
        if (iCorregidosSecuencial != 0)
            respPendientes += 'Listado duda secuencial: \n\n' + respRITMsSecuencial + '\n\n';
        gs.log('01 - RESUMEN [' + fechaTemp + ']\n\n' + respPendientes, msglog);
    },

    // ---------------------------------------------------------------------------------------------------------------

    workflowNuevoHilo: function(buscarRITM, buscarHilo) {
        var gr005 = new GlideRecord('wf_context');
        gr005.addEncodedQuery('id=' + buscarRITM);
        gr005.query();
        if (gr005.next()) {
            var varWF = gr005.sys_id.toString();

            var gr006 = new GlideRecord('wf_executing');
            gr006.addEncodedQuery('context=' + varWF);
            gr006.query();
            gr006.setWorkflow(false);
            gr006.deleteMultiple();

            var gr007 = new GlideRecord('wf_executing');
            gr007.initialize();
            gr007.context = varWF;
            gr007.state = 'waiting';
            gr007.activity = buscarHilo;
            gr007.insert();
        }
    },

    // ---------------------------------------------------------------------------------------------------------------

    workflowEnHilo: function(buscarRITM, buscarHilo) {
        var respHilos = false;
        var gr005 = new GlideRecord('wf_context');
        gr005.addEncodedQuery('id=' + buscarRITM);
        gr005.query();
        if (gr005.next()) {
            var varWF = gr005.sys_id.toString();
            gr006 = new GlideRecord('wf_executing');
            gr006.addEncodedQuery('context=' + varWF + '^activity=' + buscarHilo);
            gr006.query();
            if (gr006.next())
                respHilos = true;
        }
        return respHilos
    },

    // ---------------------------------------------------------------------------------------------------------------

    taskOpenParalelo: function(buscarRITM_Task) {
        var respTaskN;
        var gr011 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr011.addEncodedQuery('u_ritm=' + buscarRITM_Task + '^u_estatus=NULL');
        gr011.query();
        respTaskN = gr011.getRowCount();
        return respTaskN;
    },

    // ---------------------------------------------------------------------------------------------------------------

    // ==============================================================================================================================

    jobTaskLimpiarRegPre: function(vCorreoBTN) {

        var gr00,
            allLog = true,
            strArray,
            strHoy,
            strHoyN,
            configDias, // N dias para cancelacion
            configEstatus,
            formattedDateTime;

        msglog = 'JJ_job_MDM_Cancel_pre_015';
        if (allLog)
            gs.log('00 - Inicio', msglog);

        // Recuperar valores de propiedades Cancelacion N dias
        gr00 = new GlideRecord('u_mdm_options');
        gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_dias');
        gr00.query();
        if (gr00.next())
            configDias = parseInt(gr00.u_value) * (-1);
        gr00 = new GlideRecord('u_mdm_options');
        gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_estatus');
        gr00.query();
        if (gr00.next())
            configEstatus = gr00.u_value;
        if (allLog)
            gs.log('01 - Email : Dias(' + configDias + ') Estatus(' + configEstatus + ')', msglog);

        // Recuperar fecha
        formattedDateTime = new jj_Fecha_Mx().fechaHoyMx_MDM_N_dias_habiles(configDias);

        // Dividir respuesta
        strArray = formattedDateTime.toString().split(',');
        strHoy = strArray[0];
        strHoyN = strArray[1];
        if (allLog)
            gs.log('02 - Enviar correo de cancelacion a "N" dias habiles de inactividad (' + configDias + ').\n\nDia actual: ' + strHoy + '\nUltimo movimiento: ' + strHoyN + '\n\n', msglog);

        // Notificacion
        // Recuperar emails de un grupo
        var varEmail = '';
        var gr00Email = new GlideRecord('sys_user_grmember');
        gr00Email.addEncodedQuery('group=7cb75f3b97468e90cc1ebbdfe153afdc'); // MDM_08_MM
        gr00Email.query();
        while (gr00Email.next()) {
            varEmail += (varEmail == '') ? gr00Email.user.email : ',' + gr00Email.user.email;
        }
        // Valida si agrupo o a quindio click en boton
        if (vCorreoBTN != 'MDM_08_MM') {
            varEmail = vCorreoBTN.toString();
        }
        // Llamar evento para mandar email
        gs.eventQueue('mdm.mt.reg.cancela.n.dias.pre', gr00, varEmail, '');
        // gs.eventQueue("<event_name>", object, parm1, parm2);

        this.jobTaskLimpiarEnLectura(msglog);
        gs.log('10 - Fin', msglog);
    },

    // ==============================================================================================================================

    jobTaskLimpiarRegCancela: function() {

        var gr00,
            gr01,
            gr02,
            gr03,
            gr04,
            allLog = true,
            strArray,
            strHoy,
            strHoyN,
            configDias, // N dias para cancelacion
            configEstatus,
            formattedDateTime,
            iConta = 0,
            nRitms = 0,
            nTask = 0,
            varQuery,
            varQueryTask,
            varQueryRITM,
            varQueryRITMxUsers,
            tempUser,
            tempUserName,
            tempUserEmail,
            tempUserRitmNum,
            tempUserListaArray,
            tempEmail,
            aUserNo,
            aUserAll = 0,
            aUserID = [],
            aUserIDNameEmail = [];

        msglog = 'JJ_job_MDM_Cancel_ejecuta_006';
        if (allLog)
            gs.log('00 - Inicio', msglog);

        // Recuperar valores de propiedades Cancelacion N dias
        gr00 = new GlideRecord('u_mdm_options');
        gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_dias');
        gr00.query();
        if (gr00.next())
            configDias = parseInt(gr00.u_value) * (-1);
        gr00 = new GlideRecord('u_mdm_options');
        gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_estatus');
        gr00.query();
        if (gr00.next())
            configEstatus = gr00.u_value;
        if (allLog)
            gs.log('01 - Email : Dias(' + configDias + ') Estatus(' + configEstatus + ')', msglog);

        // Recuperar fecha
        formattedDateTime = new jj_Fecha_Mx().fechaHoyMx_MDM_N_dias_habiles(configDias);

        // Dividir respuesta
        strArray = formattedDateTime.toString().split(',');
        strHoy = strArray[0];
        strHoyN = strArray[1];

        if (allLog)
            gs.log('02 - Enviar correo de cancelacion a "N" dias habiles de inactividad (' + configDias + ').\n\nDia actual: ' + strHoy + '\nUltimo movimiento: ' + strHoyN + '\n\n', msglog);

        // strHoyN = '2026-02-22'; // Forzar fecha de validacion --- TEST ---

        // Query "Creado hace N dias"
        varQuery = "sys_updated_on<javascript:gs.dateGenerate('" + strHoyN + "','00:00:00')";
        // "Material Alta y Cambio" -> "Creado hace N dias" -> "Estatus Open y Pending" 
        // ^ORstate=-5
        varQueryRITM = 'cat_item=96f6425c1be58610a9f8766dcc4bcbab^ORcat_item=ac6f02961bbf8210a9f8766dcc4bcbc1^' + varQuery + '^state=1';
        // "No Etapa99" -> "NO Modificacion sin flujo MM"
        varQueryRITM += '^u_mdm_etapa!=99^u_mdm_material!=441ae9871bfd9610a9f8766dcc4bcbc3';
        varQueryRITM += '^u_mdm_area!=Envió SAP';

        if (allLog)
            gs.log('04 - varQueryRITM: \n\n' + varQueryRITM + '\n\n', msglog);



        // ------------------------------------------------------
        // POR GRUPO ASIGNADO
        // ------------------------------------------------------

        gr01 = new GlideRecord('sc_req_item');
        gr01.addEncodedQuery(varQueryRITM);
        gr01.orderBy('request.opened_by');
        gr01.query();
        nRitms = gr01.getRowCount();
        while (gr01.next()) {

            gr03 = new GlideRecord('sc_task');
            gr03.addEncodedQuery('request_item=' + gr01.sys_id + '^state=1');
            gr03.orderBy('assignment_group');
            gr03.query();
            vArea = '<br>';
            nTask = 0;
            while (gr03.next()) {
                nTask++;
                tempUser = gr03.assignment_group.toString();
                aUserNo = aUserID.indexOf(tempUser);
                if (aUserNo < 0) {
                    aUserAll++;
                    aUserID.push(tempUser);
                    tempUserName = gr03.assignment_group.getDisplayValue().toString();
                    tempUserEmail = '';
                    var gr04 = new GlideRecord('sys_user_grmember');
                    gr04.addEncodedQuery('group=' + tempUser);
                    gr04.query();
                    while (gr04.next()) {
                        tempUserEmail += (tempUserEmail == '') ? '' : ',';
                        tempUserEmail += gr04.user.email.toString();
                    }
                    aUserIDNameEmail.push([tempUser, tempUserName, tempUserEmail, 1]);
                } else {
                    aUserIDNameEmail[aUserNo][3] = aUserIDNameEmail[aUserNo][3] + 1;
                }

            }
            if (nTask == 0) {
                tempUser = '680d1b6e933d0b503bdcf4aa6aba109b'; // MDM_13_Sin_Task
                aUserNo = aUserID.indexOf(tempUser);
                if (aUserID.indexOf(tempUser) < 0) {
                    aUserAll++;
                    aUserID.push(tempUser);
                    tempUserName = 'MDM_13_Sin_Task';
                    tempUserEmail = 'juan_julian_test@nadro.com.mx';
                    aUserIDNameEmail.push([tempUser, tempUserName, tempUserEmail, 1]);
                } else {
                    aUserIDNameEmail[aUserNo][3] = aUserIDNameEmail[aUserNo][3] + 1;
                }
            }
        }

        tempUserListaArray = '';
        if (aUserAll != 0) {
            for (var ii = 0; ii < aUserIDNameEmail.length; ii++) {

                tempUserListaArray += '[' + ii + '] \n';
                tempUserListaArray += 'Reg: ' + aUserIDNameEmail[ii][3] + '\n';
                tempUserListaArray += 'Grupo: ' + aUserIDNameEmail[ii][1] + ' \n';
                tempUserListaArray += 'sys_id: ' + aUserIDNameEmail[ii][0] + ' \n';
                tempEmail = aUserIDNameEmail[ii][2].toString();
                tempUserListaArray += 'Email: ' + aUserIDNameEmail[ii][2] + ' \n';

                gr00 = new GlideRecord('u_mdm_options');
                gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_estatus');
                gr00.query();
                if (gr00.next())
                    configEstatus = gr00.u_value;

                gs.eventQueue('mdm.mt.reg.cancela.n.dias.ejecuta', gr00, tempEmail, ii + ',' + aUserIDNameEmail[ii][0]); // Llamar evento
                // gs.eventQueue("<event_name>", object, parm1, parm2);   

                gs.sleep(500); // Pausa de 1 segundo
            }
        }




        /*

		// ------------------------------------------------------
		// POR PROVEEDOR
		// ------------------------------------------------------

        gr01 = new GlideRecord('sc_req_item');
        gr01.addEncodedQuery(varQueryRITM);
        gr01.orderBy('request.opened_by');
        gr01.query();
        nRitms = gr01.getRowCount();
        while (gr01.next()) {
            tempUser = gr01.request.opened_by.toString();
            if (aUserID.indexOf(tempUser) < 0) {
                aUserAll++;
                aUserID.push(tempUser);
                tempUserName = gr01.request.opened_by.user_name.toString();
                tempUserEmail = gr01.request.opened_by.email.toString();
                tempUserEmail = (tempUserEmail == '') ? 'Sin_Email' : tempUserEmail;
                aUserIDNameEmail.push([tempUser, tempUserName, tempUserEmail]);
            }
        }

        tempUserListaArray = '';
        if (aUserAll != 0) {
            for (var ii = 0; ii < aUserIDNameEmail.length; ii++) {
                varQueryRITMxUsers = varQueryRITM + '^request.opened_by=' + aUserIDNameEmail[ii][0];
                gr02 = new GlideRecord('sc_req_item');
                gr02.addEncodedQuery(varQueryRITMxUsers);
                gr02.query();
                tempUserRitmNum = gr02.getRowCount();
                tempUserListaArray += '[' + tempUserRitmNum + '] ' + aUserIDNameEmail[ii][0] + ' - ' + aUserIDNameEmail[ii][1];
                tempEmail = aUserIDNameEmail[ii][2].toString();
                // gs.log('05 - tempEmail: ' + tempEmail, msglog);
                gr00 = new GlideRecord('u_mdm_options');
                gr00.addEncodedQuery('u_key=mdm_config_mtr^u_labe=ritm_cancelar_programada_estatus');
                gr00.query();
                if (gr00.next())
                    configEstatus = gr00.u_value;

                if (tempEmail == 'Sin_Email') {
                    tempUserListaArray += ' <--------------------------------------- !!! SIN EMAIL !!! \n';
                    gs.eventQueue('mdm.mt.reg.cancela.n.dias.ejecuta', gr00, 'Sin_Email@nadro.com.mx', ii + ',' + aUserIDNameEmail[ii][0]); // Llamar evento
                    // gs.eventQueue("<event_name>", object, parm1, parm2);   
                } else {
                    tempUserListaArray += ' - ' + aUserIDNameEmail[ii][2] + ' \n';
                    gs.eventQueue('mdm.mt.reg.cancela.n.dias.ejecuta', gr00, tempEmail, ii + ',' + aUserIDNameEmail[ii][0]); // Llamar evento
                    // gs.eventQueue("<event_name>", object, parm1, parm2);   
                }
                gs.sleep(500); // Pausa de 1 segundo
            }
        }
		*/

        if (allLog)
            gs.log('06 - RITM(s): ' + nRitms + ' \n\naUserID: \n\n' + aUserID + ' \n\naUserIDNameEmail: \n\n' + tempUserListaArray + '\n\n', msglog);

        this.jobTaskLimpiarEnLectura(msglog);
        gs.log('10 - Fin', msglog);
    },

    // ==============================================================================================================================

    jobTaskLimpiarEnLectura: function(msglogLectura) {

        var gr20;

        varQuery = "u_mt_estatus=Lectura^sys_created_on<javascript:gs.beginningOfToday()";
        gs.log('08 - varQuery en "Lectura": \n\n' + varQuery + '\n\n', msglogLectura);

        gr20 = new GlideRecord('u_mdm_registros');
        gr20.addEncodedQuery(varQuery);
        gr20.query();
        gs.log('09 - Registros actualizados en "Lectura" antes de hoy: ' + gr20.getRowCount(), msglogLectura);
        while (gr20.next()) {
            gr20.deleteRecord();
        }
    },

    // ==============================================================================================================================













    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_Ritm_Enviar_SAP: function() {
        msgLog = 'MDM_Enviar_SAP_001';

        // gs.log('000 ', msgLog);

        var respuestaTask = '',
            var_id_task = this.getParameter('parm_TaskID'),
            var_id_ritm = this.getParameter('parm_RitmID'),
            var_id_reg = this.getParameter('parm_RegID'),
            varEtapaNum = this.getParameter('parm_EtapaNum');

        // gs.log('001 - ' + var_id_task +' - '+ var_id_ritm +' - '+ var_id_reg, msgLog);

        var gr00 = new GlideRecord('sc_task');
        gr00.addEncodedQuery('sys_id=' + var_id_task);
        gr00.query();
        gr00.next();
        gr00.state = 3; // Closed Complet
        gr00.update();

        var gr01 = new GlideRecord('sc_req_item');
        gr01.addEncodedQuery('sys_id=' + var_id_ritm + '^state=1');
        gr01.query();
        gr01.next();
        gr01.state = 2; // Work in Progress
        gr01.u_mdm_resultado = 'Enviado';
        var nEjecucion = parseInt(gr01.u_mdm_enviado_sap_no) + 1;
        gr01.u_mdm_enviado_sap_no = nEjecucion.toString();
        gr01.update();

        // TABLA MDM REGISTRO APROBACIONES

        var gr02 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr02.addEncodedQuery('u_ritm=' + var_id_ritm + '^u_etapa_numero=' + varEtapaNum);
        gr02.orderByDesc('sys_created_on');
        gr02.query();
        gr02.next();
        gr02.u_estatus = 'Aprobado';
        gr02.u_fecha = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora();
        gr02.update();

        return 'Listo';
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_Ritm_Enviar_IMG: function() {
        msgLog = 'MDM_Enviar_SAP_001';
        gs.log('000 ', msgLog);

        var vTask = this.getParameter('parm_TaskID'),
            vRitm = this.getParameter('parm_RitmID'),
            vRegMDM = this.getParameter('parm_RegID'),
            vEtapa = this.getParameter('parm_EtapaNum');

        this.mdm_Ritm_Enviar_IMG_server(vTask,vRitm,vRegMDM,vEtapa);

        return 'Listo';
    },

    // ==============================================================================================================================

    mdm_Ritm_Enviar_IMG_server: function(var_id_task, var_id_ritm, var_id_reg, varEtapaNum) {

        gs.log('001 - ' + var_id_task +' - '+ var_id_ritm +' - '+ var_id_reg, msgLog);
        var respuestaTask = '';

        var gr00 = new GlideRecord('sc_task');
        gr00.addEncodedQuery('sys_id=' + var_id_task);
        gr00.query();
        gr00.next();
        gr00.state = 3; // Closed Complet
        gr00.update();

        var gr01 = new GlideRecord('sc_req_item');
        gr01.addEncodedQuery('sys_id=' + var_id_ritm + '^state=1');
        gr01.query();
        gr01.next();
        gr01.state = 3; // Closed Complet
        gr01.u_mdm_resultado = 'Enviado';
        var nEjecucion = parseInt(gr01.u_mdm_enviado_sap_no) + 1;
        gr01.u_mdm_enviado_sap_no = nEjecucion.toString();
        gr01.update();

        // TABLA MDM REGISTRO APROBACIONES

        var gr02 = new GlideRecord('u_mdm_registros_aprobaciones');
        gr02.addEncodedQuery('u_ritm=' + var_id_ritm + '^u_etapa_numero=' + varEtapaNum);
        gr02.orderByDesc('sys_created_on');
        gr02.query();
        gr02.next();
        gr02.u_estatus = 'Aprobado';
        gr02.u_fecha = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora();
        gr02.update();

        // ACTUALIZA IMAGENES

        var gr04 = new GlideRecord('u_mdm_registros');
        gr04.addEncodedQuery('sys_id=' + var_id_reg);
        gr04.query();
        if (gr04.next()) {
            var gr05 = new GlideRecord('u_mdm_registros');
            gr05.addEncodedQuery('sys_id=' + gr04.u_mtr_cambio_material_origen);
            gr05.query();
            if (gr05.next()) {
                gr05.u_mt_img_pi_01 = gr04.u_mt_img_pi_01;
                gr05.u_mt_img_pi_02 = gr04.u_mt_img_pi_02;
                gr05.u_mt_img_pi_03 = gr04.u_mt_img_pi_03;
                gr05.u_mt_img_pi_04 = gr04.u_mt_img_pi_04;
                gr05.u_mt_img_pi_05 = gr04.u_mt_img_pi_05;
                gr05.update();
            }
            gr04.u_mt_estatus = 'Aprobado';
            gr04.update();
        }

        return 'Listo';
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    vistaAprovacionMasivaTipo: function() {
        // gs.log("Entro", msgLog);
        var varID = this.getParameter('parm_masivaID');

        var gr01 = new GlideRecord('u_mdm_materiales_aprobaciones');
        gr01.addEncodedQuery('sys_id=' + varID);
        gr01.query();
        gr01.next()
        var varItem = gr01.u_item.getDisplayValue();

        return varItem;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================
    // ==============================================================================================================================

    mdm_ActualizarName_Reg: function(a_id_material) {
        var gr100 = new GlideRecord('u_mdm_registros');
        gr100.addEncodedQuery('sys_id=' + a_id_material);
        gr100.query();
        if (gr100.next())
            var respuestaTask00 = this.mdm_ActualizarName_RegUpdate(a_id_material, gr100.u_mt_nombre.toString());
        return true;
    },

    // ==============================================================================================================================

    mdm_ActualizarName_Task: function() {
        // Desde Task
        var respuestaTask00 = '',
            var_id_material_task = this.getParameter('parm_MaterialID'),
            var_name_new_task = this.getParameter('parm_NameNew');
        respuestaTask00 = this.mdm_ActualizarName(var_id_material_task, var_name_new_task);
        respuestaTask00 += 'zzRespUestazz' + var_name_new_task;
        return respuestaTask00;
    },

    // ==============================================================================================================================

    mdm_ActualizarName_RegUpdate: function(var_id_material_exel, var_name_new_exel) {

        // En este mismo Script "lecturaExcel"
        var respuestaTask00 = this.mdm_ActualizarName(var_id_material_exel, var_name_new_exel);
        gs.sleep(500); // Pausa de 0.5 segundo
        var strArray = respuestaTask00.toString().split('zzRespUestazz');

        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + var_id_material_exel);
        gr01.query();
        if (gr01.next()) {
            gr01.setWorkflow(false);
            gr01.u_mt_keywords_complementario = strArray[0];
            gr01.u_mt_metadescripcion = strArray[1];
            gr01.u_mt_caption_link = strArray[2];
            gr01.update();
        }
        return true;
    },

    // ==============================================================================================================================

    mdm_ActualizarName: function(var_id_material_var, var_name_new_var) {
        // msgLog = 'MDM_UpdateName_001';
        // gs.log('000 ', msgLog);
        var respuestaTask = '',
            varKeywords = '',
            varMetadescripcion = '',
            varEcommer = '',
            varLink = '',
            var_id_material = var_id_material_var,
            var_name_new = var_name_new_var;

        // gs.log('000 \n\n' + var_id_material_var + '\n' + var_name_new_var + '\n\n', msgLog);

        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + var_id_material);
        gr01.query();
        if (gr01.next()) {

            var vTempMsg = '',
                vStrSinCaracterRaro = '';

            vTempMsg += var_name_new; // Nombre
            vTempMsg += ', ' + gr01.u_mt_pi_ean; // AEN_PI


            var gr31 = new GlideRecord('u_mdm_options');
            gr31.addEncodedQuery('sys_id=' + gr01.u_mt_d_departamento);
            gr31.query();
            if (gr31.next()) {
                vStrSinCaracterRaro = gr31.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += ', ' + vStrSinCaracterRaro;
            } else {
                // vTempMsg += ', Sin Departarmento';
                vTempMsg += '';
            }

            var gr32 = new GlideRecord('u_mdm_options');
            gr32.addEncodedQuery('sys_id=' + gr01.u_mt_d_categoria);
            gr32.query();
            if (gr32.next()) {
                vStrSinCaracterRaro = gr32.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += ', ' + vStrSinCaracterRaro;
            } else {
                // vTempMsg += ', Sin Categoria';
                vTempMsg += '';
            }

            var gr33 = new GlideRecord('u_mdm_options');
            gr33.addEncodedQuery('sys_id=' + gr01.u_mt_d_subcategoria);
            gr33.query();
            if (gr33.next()) {
                vStrSinCaracterRaro = gr33.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += ', ' + vStrSinCaracterRaro;
            } else {
                // vTempMsg += ', Sin SubCategoria';				
                vTempMsg += '';
            }

            varMetadescripcion = var_name_new; // 	Es igual al nombre completo del producto 
            varEcommer = ''; // ??? 
            varKeywords = vTempMsg;

            // Caption link 
            varLink = this.mdm_Limpiar_Caption_link(var_name_new);

        }
        respuestaTask += varKeywords + 'zzRespUestazz' + varMetadescripcion + 'zzRespUestazz' + varLink + 'zzRespUestazz' + varEcommer;
        return respuestaTask;
    },

    // ==============================================================================================================================

    mdm_Limpiar_Caption_link: function(var_valor) {
        var tempValor = '###' + var_valor;
        tempValor = tempValor.toLowerCase(); // minusculas
        tempValor = tempValor.replace(/[ .,/]/g, '-'); // espacio, punto, coma, /
        tempValor = tempValor.replace(/&/g, '-and-'); // &
        tempValor = tempValor.replace(/\+/g, '-mas-'); // +
        tempValor = tempValor.replace(/[:;'"¡!°]/g, ''); // eliminar
        tempValor = tempValor.normalize('NFD'); // separa letra + acento
        tempValor = tempValor.replace(/[\u0300-\u036f]/g, ''); // elimina acentos
        tempValor = tempValor.replace(/ñ/g, 'n'); // ñ → n (después del normalize)
        tempValor = tempValor.replace(/^-|-$/g, ''); // eliminar guiones al inicio o fin
        tempValor = tempValor.replace(/[^a-zA-Z0-9-]/g, ''); // solo permite "letras" "numeros" "-" 
        tempValor = tempValor.replace(/-+/g, '-') // limpiar guiones duplicados
        tempValor = tempValor.replace('###', '');
        return tempValor.toString();
    },


    // ==============================================================================================================================
    // ==============================================================================================================================

    mdm_ActualizarName_BK: function(var_id_material_var, var_name_new_var) {
        msgLog = 'MDM_UpdateName_001';
        // gs.log('000 ', msgLog);
        var respuestaTask = '',
            varKeywords = '',
            varMetadescripcion = '',
            varLink = '',
            var_id_material = var_id_material_var,
            var_name_new = var_name_new_var;

        var gr01 = new GlideRecord('u_mdm_registros');
        gr01.addEncodedQuery('sys_id=' + var_id_material);
        gr01.query();
        if (gr01.next()) {

            var vTempMsg = '',
                vStrSinCaracterRaro = '';
            vTempMsg += var_name_new + ' - ';
            vTempMsg += gr01.u_mt_pi_ean + ' - ';
            // vTempMsg += 'No_Material' + ' - ';
            // vTempMsg += 'Concepto_de_búsqueda' + ' - ';

            var gr31 = new GlideRecord('u_mdm_options');
            gr31.addEncodedQuery('sys_id=' + gr01.u_mt_d_departamento);
            gr31.query();
            if (gr31.next()) {
                vStrSinCaracterRaro = gr31.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += vStrSinCaracterRaro + ' - ';
            } else {
                // vTempMsg += 'Sin Departarmento - ';
                vTempMsg += '';
            }

            var gr32 = new GlideRecord('u_mdm_options');
            gr32.addEncodedQuery('sys_id=' + gr01.u_mt_d_categoria);
            gr32.query();
            if (gr32.next()) {
                vStrSinCaracterRaro = gr32.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += vStrSinCaracterRaro + ' - ';
            } else {
                // vTempMsg += 'Sin Categoria - ';
                vTempMsg += '';
            }

            var gr33 = new GlideRecord('u_mdm_options');
            gr33.addEncodedQuery('sys_id=' + gr01.u_mt_d_subcategoria);
            gr33.query();
            if (gr33.next()) {
                vStrSinCaracterRaro = gr33.u_labe.toString();
                vStrSinCaracterRaro = vStrSinCaracterRaro.replace(/_/g, ' ');
                vTempMsg += vStrSinCaracterRaro;
            } else {
                // vTempMsg += 'Sin SubCategoria';				
                vTempMsg += '';
            }

            varMetadescripcion = vTempMsg;
            vTempMsg = vTempMsg + ' - ' + gr01.u_mt_ecommerce.toString();
            varKeywords = vTempMsg;

            vTempMsg = '##' + var_name_new;
            vTempMsg = vTempMsg.replace(/[^a-zA-Z0-9]/g, ''); // Quitar caracteres raros y espacios en blanco
            // vTempMsg = this.limpiarCadenaManual('##' + var_name_new);
            varLink = vTempMsg;

        }
        respuestaTask += varKeywords + 'zzRespUestazz' + varMetadescripcion + 'zzRespUestazz' + varLink;
        return respuestaTask;
    },

    // ==============================================================================================================================

    esNumeroNdecimales: function(varNum, varDecimal) {
        var respuesta = '';
        // Quitar (,)
        // Pasar a flotante ("N" decimales)
        // Vaciar (NaN)
        respuesta = varNum.replaceAll(',', '');
        respuesta = Number(respuesta).toFixed(varDecimal);
        respuesta = (respuesta == 'NaN' || respuesta == '0.000' || respuesta == '0') ? '' : respuesta;
        return respuesta;
    },

    // ==============================================================================================================================

    cerosIzquierda: function(varNum, varDecimal) {
        var respuesta = '';
        if (varNum != '') {
            respuesta = '00000000000' + varNum;
            respuesta = respuesta.substring(respuesta.length - 10, respuesta.length);
        }
        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    iquiviaLecturaExcel: function() {

        var row,
            msgFinal = '',
            msgFinalerror = '',
            varTipoExcel = '',
            // ID del temporal archivo
            sys_id = this.getParameter('sysparm_sysid');

        // Validar archivo sea ".xlsx"
        varTipoExcel = this.iquiviaValidarTipoExcel(sys_id);

        // Limpiar Table
        var gr666 = new GlideRecord('u_mdm_eqvia');
        gr666.query();
        gr666.deleteMultiple();

        if (varTipoExcel == 'XLSX') {

            // ------------------------- Excel ------------------------- 
            var parser = new sn_impex.GlideExcelParser();
            var attachment = new GlideSysAttachment();

            // Use sys_id del excel attachment. 
            var attachmentStream = attachment.getContentStream(sys_id);
            parser.parse(attachmentStream);

            // Definir columnas
            var headers = parser.getColumnHeaders();
            var c01 = headers[0], // "A"
                c02 = headers[1], // "B"
                c03 = headers[2], // "C"  ATC4
                c04 = headers[3], // "D"
                c05 = headers[4], // "E"  Categoria
                c06 = headers[5], // "F"
                c07 = headers[6], // "G"  Genero
                c08 = headers[7], // "H"  
                c09 = headers[8], // "I"  SubGenero
                c10 = headers[9]; // "J"  

            // Variables 
            var TodoExcelLinea = 1,
                TodoExcelLineasErrores = 0,
                TodoExcelLineasCorrectas = 0;


            // Recorido de los registros del la fila 2 en adelante
            while (parser.next()) {
                row = parser.getRow();
                TodoExcelLinea++; // [2] inicia 1 mas el "++"	

                // row[c01]  = "A"
                if (row[c01] != null) {
                    var gr00 = new GlideRecord('u_mdm_registros');
                    gr00.addEncodedQuery('u_mt_estatus=Activo^u_mt_pi_ean=' + row[c01].toString());
                    gr00.query();
                    if (gr00.next()) {
                        TodoExcelLineasCorrectas++;
                        var idRegistro = gr00.sys_id;
                        var gr01 = new GlideRecord('u_mdm_eqvia');
                        gr01.initialize();
                        gr01.u_material = idRegistro;
                        gr01.u_atc4 = row[c03];
                        gr01.u_categoria = row[c05];
                        gr01.u_genero = row[c07];
                        gr01.u_sub_genero = row[c09];
                        gr01.insert();

                    } else {
                        TodoExcelLineasErrores++;
                        msgFinalerror += 'Linea[' + TodoExcelLinea + ']. ' + row[c01] + '\n';
                    }
                }
            }

            // Mensage de regreso
            if (TodoExcelLineasErrores == 0) {
                msgFinal = 'ExitosazzRespUestazzLineas correctas: ' + TodoExcelLineasCorrectas;
            } else {
                msgFinal = 'Con ErrorzzRespUestazzLineas correctas: ' + TodoExcelLineasCorrectas + '\n';
                msgFinal += 'Lineas con errores: ' + TodoExcelLineasErrores + '  \n\n';
                msgFinal += 'Materiales que no se encuentran activos: \n' + msgFinalerror + '\n';
            }

            // gs.log(msgFinal, msgLog);	

        } else {
            msgFinal = 'NoEsExcel';
        }
        return msgFinal;
    },

    // ==============================================================================================================================

    iquiviaValidarTipoExcel: function(id_archivo) {
        var gr01 = new GlideRecord('sys_attachment');
        gr01.addEncodedQuery('sys_id=' + id_archivo);
        gr01.query();
        gr01.next();
        var respuesta = gr01.file_name.toString(); // ArchivoTest.xlsx
        var arrayReverseRespuesta = respuesta.split('.').reverse(); // xlsx,ArchivoTest
        respuesta = arrayReverseRespuesta[0].toUpperCase();
        return respuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    mdm_alta_new_hijo: function(current_Task, msgLogEmail) {

        var vFechaMayor,
            vFlujoCual;

        msgLog = msgLogEmail;
        msgLog = current_Task.request_item.getDisplayValue() + '_0' + current_Task.u_mdm_etapa + '_' + msgLog;

        // gs.log('Entro', msgLog);

        var gr00 = new GlideRecord('u_mdm_registros');
        gr00.addEncodedQuery('u_ritm=' + current_Task.request_item);
        gr00.query();
        if (gr00.next()) {

            // Asignar Material a "Task"
            current_Task.u_mdm_material = gr00.sys_id;
            current_Task.update();


            // [0] - PROVEEDOR (Etapa0) 
            // [1] - COMPRADOR
            // [2] - ASUNTOS REGULATORIOS
            // [3] - MKT
            // [4] - Jefe de costos (Maestro de Materiales)
            // [5] - Negociador
            // [6] - DGA
            // [7] - Maestro de articulos
            // [8] - MM ??? 


            var varEmail = 'jj@gmail.com',
                varEtapa = current_Task.u_mdm_etapa; // Correcto
            // varEtapa = gr00.u_mt_etapa_actual; // <---- Flujo en paraleno no funciona [1,2,3,4] = Autorizacion multiple


            if (varEtapa == 1) {
                // [1] - COMPRADOR
                varEmail = gr00.u_mt_comprador.email.toString();
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 2) {
                // [2] - ASUNTOS REGULATORIOS
                varEmail = this.getEmailGrupal('73975fb797468e90cc1ebbdfe153af82'); // MDM_02_Asuntos_Regulatorios
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 3) {
                // [3] - MKT
                varEmail = this.getEmailGrupal('6cd75fbb97468e90cc1ebbdfe153afbd'); // MDM_03_Mercadotecnia
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 4) {
                // [4] - Jefe de costos (Maestro de Materiales)
                varEmail = this.getEmailGrupal('1c1b400697d70610cc1ebbdfe153afb4'); // MDM_04_Jefe_de_costos
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 5) {
                // [5] - Negociador
                varEmail = gr00.u_mt_negaciador.email.toString();
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 6) {
                // [6] - DGA
                varEmail = gr00.u_mt_dga.email.toString() + ',' + this.getEmailGrupal('de030b501b38d290a9f8766dcc4bcbc9'); // MDM_06_DGA_All
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 7) {
                // [7] - Maestro de articulos
                varEmail = this.getEmailGrupal('9b08ff94971b4650cc1ebbdfe153afbc'); // MDM_07_Analista Sr
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            } else if (varEtapa == 8) {
                // [8] - Maestro de articulos
                varEmail = this.getEmailGrupal('9b08ff94971b4650cc1ebbdfe153afbc'); // MDM_07_Analista Sr
                gs.eventQueue('mdm.mt.task.nueva', current_Task, varEmail, '');
            }


            // gs.eventQueue("<event_name>", object, parm1, parm2);
            gs.log('RITM: ' + gr00.u_ritm.getDisplayValue() + '\nEtapa: ' + varEtapa + '\nEmail(s): ' + varEmail + '\nTask: ' + current_Task.number, msgLog);
            // gs.log(current_Task, msgLog); // Task



            // Aprobacion multiple -----------------------------------------------------
            var aNew = [],
                iContaNew = 0;


            // SECUENCIA DEL PROCESO ************************************************************************

            vFechaMayor = this.mdm_Ritm_Validar_Fecha_Paralelo(current_Task.request_item);

            if (vFechaMayor) {
                // ------------------------------------------------------------------------
                vFlujoCual = 'PARALELO';
                aNew.push(['0', 'Padre', 'Padre']);
                aNew.push(['1', 'Comprador', 'Aprobacion multiple', 'Comprador, Asuntos regulatorios, Mercadotecnia y Jefe de costos']);
                aNew.push(['2', 'Asuntos regulatorios', 'Aprobacion multiple', 'Comprador, Asuntos regulatorios, Mercadotecnia y Jefe de costos']);
                aNew.push(['3', 'Mercadotecnia', 'Aprobacion multiple', 'Comprador, Asuntos regulatorios, Mercadotecnia y Jefe de costos']);
                aNew.push(['4', 'Jefe de costos', 'Aprobacion multiple', 'Comprador, Asuntos regulatorios, Mercadotecnia y Jefe de costos']);
                aNew.push(['5', 'Negociador', '5', 'Negociador']);
                aNew.push(['6', 'DGA', '6', 'DGA']);
                aNew.push(['7', 'Maestro de artículos', '7', 'Maestro de artículos']);
                aNew.push(['8', 'Envió SAP', '8', 'Envió SAP']);
            } else {
                // ------------------------------------------------------------------------
                vFlujoCual = 'SECUENCIAL';
                aNew.push(['0', 'Padre', 'Padre']);
                aNew.push(['1', 'Comprador', '1', 'Comprador']);
                aNew.push(['2', 'Asuntos regulatorios', '2', 'Asuntos regulatorios']);
                aNew.push(['3', 'Mercadotecnia', '3', 'Mercadotecnia']);
                aNew.push(['4', 'Jefe de costos', '4', 'Jefe de costos']);
                aNew.push(['5', 'Negociador', '5', 'Negociador']);
                aNew.push(['6', 'DGA', '6', 'DGA']);
                aNew.push(['7', 'Maestro de artículos', '7', 'Maestro de artículos']);
                aNew.push(['8', 'Envió SAP', '8', 'Envió SAP']);
            }

            // SECUENCIA DEL PROCESO ************************************************************************





            var gr01 = new GlideRecord('u_mdm_registros_aprobaciones');

            if (varEtapa == 8 && current_Task.request_item.u_mdm_enviado_sap_no != 0) {
                var vQueryE8 = '';
                vQueryE8 += 'u_ritm=' + current_Task.request_item;
                vQueryE8 += '^u_task=' + current_Task.sys_id;
                vQueryE8 += '^u_ejecuciones_no=' + current_Task.request_item.u_mdm_ejecuciones_no;
                vQueryE8 += '^u_etapa_numero=8';
                gr01.addEncodedQuery(vQueryE8);
                gr01.query();
                gr01.next();
                gr01.u_estatus = '';
                gr01.u_motivo = '';
                gr01.u_fecha = '';
                gr01.update();
            } else {
                gr01.initialize();
                gr01.u_fecha_open = new jj_Fecha_Mx().fechaHoyMx_MDM_hoy_hora();
                gr01.u_material = current_Task.request_item.u_mdm_material;
                gr01.u_ritm = current_Task.request_item;
                gr01.u_task = current_Task.sys_id;
                gr01.u_etapa_numero = aNew[varEtapa][0];
                gr01.u_etapa = aNew[varEtapa][1];
                gr01.u_ejecuciones_no = current_Task.request_item.u_mdm_ejecuciones_no;
                gr01.insert();
            }






            // Actualizacion etapa
            var gr02 = new GlideRecord('sc_req_item');
            gr02.addEncodedQuery('sys_id=' + current_Task.request_item);
            gr02.query();
            gr02.next();
            gr02.u_mdm_etapa = aNew[varEtapa][2];
            gr02.u_mdm_area = aNew[varEtapa][3];
            gr02.update();

            // Actualizacion etapa
            gr00.u_mt_etapa_actual = aNew[varEtapa][2];
            gr00.update();

            // Aprobacion multiple -----------------------------------------------------

        }
    },

    // ==============================================================================================================================

    getEmailGrupal: function(varGrupoID) {
        var respUsers = '',
            iCont = 1;
        var grE01 = new GlideRecord('sys_user_grmember');
        grE01.addEncodedQuery('group=' + varGrupoID);
        grE01.query();
        while (grE01.next()) {
            respUsers += (iCont == 1) ? '' : ',';
            respUsers += grE01.user.email.toString();
            iCont++;
        }
        // gs.log(respUsers, msgLog);
        return respUsers;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX














    // ==============================================================================================================================

    rixie_Imagen: function() {

        var vRespuesta = '',
            logIMG = 'rixie_IMG';
        // vRespuesta += '\n\n';
        // vRespuesta += 'Iniciando script (Modo REST Message)...\n\n';

        // 1. OBTENER LA IMAGEN EN BASE64
        // ---------------------------------
        // Reemplaza 'SYS_ID_DEL_REGISTRO' con el Sys ID del registro (p. ej. una incidencia) que tiene la imagen adjunta.
        // var attachmentSysId = "79fb941b3b7aa210a4187124c3e45abf";
        var attachmentSysId = this.getParameter('sysparm_ArchivoID');

        var attGr = new GlideRecord('sys_attachment');
        if (attGr.get(attachmentSysId)) {
            // vRespuesta += 'Adjunto encontrado: ' + attGr.file_name + ' (Tipo: ' + attGr.content_type + ')\n';

            try {
                // vRespuesta += 'Convirtiendo adjunto a Base64.\n';
                // --------------------------------------------------------
                // Attachment to Base64           
                var sa = new GlideSysAttachment();
                var binData = sa.getBytes(attGr);
                var base64Data = GlideStringUtil.base64Encode(binData);
                // vRespuesta+= base64Data;
                // --------------------------------------------------------

                if (!base64Data) {
                    vRespuesta += 'No se pudo convertir el adjunto a Base64. \n';
                    // return;
                }
                // vRespuesta += 'Conversión a Base64 exitosa.\n\n';

                // 2. LLAMAR A LA API USANDO EL MENSAJE REST
                // ------------------------------------------
                // vRespuesta += 'Llamando a la API con payload JSON usando el REST Message "JJ imagen rixie".\n\n';

                var restMessage = new sn_ws.RESTMessageV2('MDM Imagen Rixie', 'ImagenValida');

                var requestBody = {
                    'image': base64Data,
                    'mimetype': attGr.content_type.toString(),
                    'filename': attGr.file_name.toString(),
                    'position': 'frontal',
                };
                // vRespuesta += 'requestBody: ' + JSON.stringify(requestBody) + '\n\n';
                gs.log(JSON.stringify(requestBody), logIMG);

                var requestBodyJSON = JSON.stringify(requestBody);
                restMessage.setRequestHeader("Content-Type", "application/json");
                restMessage.setRequestBody(requestBodyJSON);

                // Ejecuta la petición POST
                var response = restMessage.execute();

                // Procesa la respuesta de la API
                var httpStatus = response.getStatusCode();
                var responseBody = response.getBody();

                // vRespuesta += 'Llamada a la API completada.\n';
                // vRespuesta += 'HTTP Status: ' + httpStatus + '\n';
                // vRespuesta += 'Response Body: ' + responseBody + '\n';	
                gs.log(responseBody, logIMG);

                // Tranformar string() a JSON
                var recordData = JSON.parse(responseBody);

                var vTempText,
                    vTempRespuesta,
                    vLista = [
                        'Formato',
                        'Tamaño',
                        'Dimensiones',
                        'Fondo'
                    ];

                // Imprimir respuesta
                /*
                for (var i = 0; i <= vLista.length - 1; i++) {
                    vTempText = recordData.validation_details[0][vLista[i]];
                    vTempRespuesta = vTempText.split(' / ');
                    vRespuesta += vLista[i] + ': ' + vTempRespuesta[0] + ' - ' + vTempRespuesta[1] + '\n';
                }
                vRespuesta += '\n\n';
				*/

                // 3. ACOMODAR RESPUESTA PARA USUARIO
                // ------------------------------------------ 
                // vRespuesta += 'Response Body: ' + recordData.message + '\n\n';
                if (recordData.message != 'La imagen no cumple con todos los requisitos técnicos.') {
                    vRespuesta += 'Correcto';
                } else {
                    vRespuesta += 'Error imagen no cumple con los requisitos: \n\n';
                    // Imprimir respiesta
                    for (var i = 0; i <= vLista.length - 1; i++) {
                        vTempText = recordData.validation_details[0][vLista[i]];
                        vTempRespuesta = vTempText.split(' / ');
                        // Solo errores
                        if (vTempRespuesta[0] == 'false') {
                            vRespuesta += vLista[i] + ': ' + vTempRespuesta[1] + '\n';
                        }
                    }
                }


            } catch (ex) {
                var errorMessage = "Error desconocido. El objeto de excepción es nulo.";
                if (ex) {
                    errorMessage = ex.getMessage();
                    if (!errorMessage) {
                        errorMessage = ex.toString();
                    }
                }
                vRespuesta += 'Ocurrió un error: ' + errorMessage + '\n';
                vRespuesta += 'Error completo en el Fix Script de envío de imagen: ' + JSON.stringify(ex) + '\n';
            }

        } else {
            vRespuesta += 'No se encontró el registro de adjunto con Sys ID: ' + attachmentSysId + '\n';
        }

        // vRespuesta += '\n\n';
        // gs.info(vRespuesta);
        return vRespuesta;
    },

    // ==============================================================================================================================














    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX













    // ==============================================================================================================================

    lecturaExcel_MKT: function() {

        msgLog = 'MDM_jj_028';

        var row,
            msgFinal = '',
            varTipoArchivo = '',
            rRespuesta = 'Error',
            horaInicio = new GlideDateTime(),
            // ID del temporal archivo
            sys_id = this.getParameter('sysparm_sysid'),
            sys_UserLogeado = this.getParameter('sysparm_vUser'),
            numRandom = this.getParameter('sysparm_numRandom');

        // Validar archivo sea ".xlsx"
        varTipoArchivo = this.getExtensio(sys_id);

        if (varTipoArchivo == 'XLSX') {

            // ------------------------- Excel ------------------------- 
            var parser = new sn_impex.GlideExcelParser();
            var attachment = new GlideSysAttachment();

            // Use sys_id del excel attachment. 
            var attachmentStream = attachment.getContentStream(sys_id);
            parser.parse(attachmentStream);

            // Recuperar los encabezados de columna.
            var headers = parser.getColumnHeaders();
            var c01 = headers[0], // 'A'
                c02 = headers[1], // 'B'
                c03 = headers[2], // 'C'
                c04 = headers[3]; // 'D'

            // Variables 
            var eTemp,
                eTempAuto,
                eTempColum,
                eTempArreglo,
                eTempValor,
                eTempVacio,
                eTempNumValido,
                eTempDataValidaID,
                eTempMktSAP,
                eTempMktEAN,
                eTempMktName,
                eTempMktKeyEcommer,
                logShowAll = false, // <------- IMPORTANTE
                eEnGrupo,
                eEnGrupoValor,
                eAll = [0], //  [0] = [Vacio]
                eAllError = [],
                eLinea = 1,
                eLineasCorrectas = 0,
                eLineasConError = 0,
                strRespuesta,
                strRespuestaArray,
                dDep,
                dDepCol,
                dCat,
                dCatCol,
                dSub,
                dSubCol;

            // eTemp = [eLinea, c01, c02, c03, c04];
            eTemp = 'Vacio'; // No necesito los tilulos
            eAll.push(eTemp); // [1] = [Titulos]  

            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++            

            // Recorido de los registros del la fila 2 en adelante
            while (parser.next()) {
                row = parser.getRow();
                eLinea++; // [2] inicia 1 mas el "++"
                eTempError = 'No';
                eMsgError = '';

                // ---------------------------------------------------------------

                eTempColum = 'A';
                eTempValor = row[c01];
                if (eTempValor != null && eLinea >= 2) { // Quiero que inicie en la linea "2"

                    // ---------------------------------------------------------------
                    eTempColum = 'A';
                    eTempArreglo = row[c01];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);
                    // Validar tipo
                    eTempNumValido = this.validarVacioNumeroEnteroDigitosDos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 1, 16, eTempMsg);
                    // eTempNumValido = true;
                    // Validar duplicados en el mismo Excel
                    eTempNumValido = (eTempNumValido == true) ? this.MKT_valida_diplicado(eLinea, eTempColum, eTempValor, 'SAP') : 'Valor invalido';
                    eTempMktSAP = (eTempNumValido == true) ? row[c01] : '';
                    // ---------------------------------------------------------------
                    eTempColum = 'B';
                    eTempArreglo = row[c02];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);					
                    // Validar tipo
                    // eTempNumValido = this.validarVacioNumeroEnteroDigitosDos(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, 3, 16, eTempMsg);
                    eTempNumValido = true;
                    // Validar duplicados en el mismo Excel
                    // eTempNumValido = (eTempNumValido == true) ? this.MKT_valida_diplicado(eLinea, eTempColum, eTempValor, 'EAN') : 'Valor invalido';
                    eTempMktEAN = (eTempNumValido == true) ? row[c02] : '';
                    // ---------------------------------------------------------------
                    eTempColum = 'C';
                    eTempArreglo = row[c03];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);		
                    // Validar Null							
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    eTempMktName = row[c03];
                    // ---------------------------------------------------------------
                    eTempColum = 'D';
                    eTempArreglo = row[c04];
                    eTempValor = (eTempArreglo == null) ? '00Vacio00' : eTempArreglo;
                    eTempVacio = 'No';
                    eTempMsg = 'No';
                    // gs.log(eLinea + eTempColum + ' -' + eTempValor, msgLog);	
                    // Validar Null				
                    this.validarVacio(eLinea, eTempColum, eTempValor, eTempVacio, eEnGrupo, eEnGrupoValor, eTempMsg);
                    eTempMktKeyEcommer = row[c04];
                    // ---------------------------------------------------------------
                    // Validacion si exite Materia [EAN] 
                    eTempDataValidaID = (eTempMktSAP != '') ? this.MKT_valida_existencia(eLinea, eTempMktSAP, eTempMktEAN) : 'No_ID';
                    // ---------------------------------------------------------------

                    if (logShowAll)
                        gs.log(eLinea + ' Error_01: ' + eTempError, msgLog);

                    if (eTempError == 'No') {
                        eLineasCorrectas++;

                        // Crear duplicado --------------------------- IMPORTANTE---------------------------

                        // var arrayDiccionario = this.MKT_registro_duplica_diccionario_PB('u_mdm_registros');
                        // var registroIdNew = this.MKT_registro_duplica_PB('u_mdm_registros', 'u_mdm_registros', eTempDataValidaID, true, row[c03], row[c04], sys_UserLogeado, numRandom);
                        // var registroIdNewCactipLink = this.mdm_ActualizarName_RegUpdate_PB(registroIdNew, row[c03]);
                        // var registroIdNewMKT = this.MKT_new_reg_cambios_MKT_PB('masivo', eTempDataValidaID, registroIdNew, numRandom);

                        // Crear Reg. cambio_mkt --------------------------- IMPORTANTE---------------------------

                        var registroIdNewMKT = this.MKT_new_reg_cambios_MKT_all('masivo', eTempDataValidaID, numRandom, eTempMktSAP, eTempMktEAN, eTempMktName, eTempMktKeyEcommer);

                        // Error forzado
                        // eAll.push(eTemp);

                    } else {
                        eLineasConError++;
                        eMsgError = 'Campo ' + eMsgError;
                        eAllError.push(eMsgError);
                        // gs.log(eLinea + eMsgError, msgLog);
                    }

                    // ---------------------------------------------------------------

                } else {
                    // Filas no juegan si no tiene "Razón Social" [A]z
                }
            }

            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++





            // Mensage de regreso
            // msgFinal += '\nExcel: \n';
            if (eLineasConError >= 1) {
                msgFinal += 'Registros en estatus correcto: ' + eLineasCorrectas + '\n';
                msgFinal += 'Registros en con errores: ' + eLineasConError + '\n\n\n';
                msgFinal += 'Favor de corregir los siguientes campos: \n\n';
                for (var i = 0; i < eAllError.length; i++) {
                    msgFinal += eAllError[i];
                }

                /* "Habilitame al FINAL" ************************************************** */
                if (eLineasConError >= 1) {
                    var varQuery = 'u_mkt_random=' + numRandom + '^u_mkt_estatus=Lectura';
                    var grError = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
                    grError.addEncodedQuery(varQuery);
                    grError.query();
                    grError.next();
                    grError.deleteMultiple();
                    if (logShowAll)
                        gs.log(eLinea + ' Registros eliminados: ' + grError.getRowCount(), msgLog);
                }
                // ************************************************************************** 

            } else {
                msgFinal += 'Registros en estatus correcto: ' + eLineasCorrectas + '\n';
                msgFinal += 'Lectura exitosa.';
                rRespuesta = 'Correcto';
            }

            // gs.log(msgFinal, msgLog);

            // eAll[0] es creado con "0"
            // eAll[1] es el Titulo de la columna
            // gs.log('Linea 3 Excel: ' + eAll[3], msgLog);		

        } else {
            msgFinal = 'NoEsExcel';
        }

        var msgFinalReturn = this.jjTiempoTotal(horaInicio, msgFinal);
        gs.log('99999\n\nMDM Materiales Cambio MKT "Lectura" ' + msgFinalReturn, msgLog);

        return rRespuesta + 'zzRespUestazz' + msgFinal + 'zzRespUestazz' + eLineasCorrectas;
    },


    // ==============================================================================================================================

    lecturaUnoaUno_MKT: function() {

        msgLog = 'MDM_jj_002';

        var row,
            msgFinal = '',
            varTipoArchivo = '',
            rRespuesta = 'Error',
            // ID Material
            sys_id = this.getParameter('sysparm_sysid'),
            sys_UserLogeado = this.getParameter('sysparm_vUser'),
            numRandom = this.getParameter('sysparm_numRandom');

        // Crear duplicado --------------------------- IMPORTANTE---------------------------

        // var arrayDiccionario = this.MKT_registro_duplica_diccionario_PB('u_mdm_registros');
        // var registroIdNew = this.MKT_registro_duplica_PB('u_mdm_registros', 'u_mdm_registros', sys_id, false, '', '', sys_UserLogeado, numRandom);
        // var registroIdNewMKT = this.MKT_new_reg_cambios_MKT_PB('uno_a_uno', sys_id, registroIdNew, numRandom);

        // Crear Reg. cambio_mkt --------------------------- IMPORTANTE---------------------------

        var registroIdNewMKT = this.MKT_new_reg_cambios_MKT_all('uno_a_uno', sys_id, numRandom, '', '', '', '');


    },


    // ==============================================================================================================================


    MKT_new_reg_cambios_MKT_all: function(v_tipo, v_id_origen, v_random, v_sap_no, v_ean, v_name, v_key_ecommer) {

        var gr0101 = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
        gr0101.initialize();
        gr0101.setWorkflow(false);
        gr0101.u_mkt_estatus = 'Lectura';
        gr0101.u_mkt_material_original = v_id_origen;
        gr0101.u_mkt_random = v_random;
        if (v_tipo == 'uno_a_uno') {
            // UNO_A_UNO
            var gr12 = new GlideRecord('u_mdm_registros');
            gr12.addEncodedQuery('sys_id=' + v_id_origen);
            gr12.query();
            if (gr12.next()) {
                gr0101.u_mkt_numero_de_material = gr12.u_mt_no_materia;
                gr0101.u_mkt_ean_pieza = gr12.u_mt_pi_ean;
            }
        } else {
            // MASIVO            
            gr0101.u_mkt_numero_de_material = v_sap_no;
            gr0101.u_mkt_ean_pieza = v_ean;
            gr0101.u_mkt_descripcion_larga_de_producto = v_name;
            gr0101.u_mkt_keyword = v_key_ecommer;
            /*
			// En Buseness Rules ----------------------------------------
            gr0101.u_mkt_keyword_comple = v_key_complementario;
            gr0101.u_mtr_metadescripcion = v_metadescrip;
            gr0101.u_mtr_caption_link = v_caption_link;
			*/
        }
        gr0101.insert();
    },


    // ==============================================================================================================================


    MKT_new_reg_cambios_MKT_PB: function(v_tipo, v_id_origen, v_id_new, v_random) {

        var gr0101 = new GlideRecord('x_nsadc_tables_mdm_material_cambio_mkt');
        gr0101.initialize();
        gr0101.u_mkt_estatus = 'Lectura';
        gr0101.u_mkt_material_original = v_id_origen;
        gr0101.u_mkt_material = v_id_new;
        gr0101.u_mkt_random = v_random;
        if (v_tipo == 'uno_a_uno') {
            // UNO_A_UNO
            var gr12 = new GlideRecord('u_mdm_registros');
            gr12.addEncodedQuery('sys_id=' + v_id_origen);
            gr12.query();
            if (gr12.next()) {
                gr0101.u_mkt_numero_de_material = gr12.u_mt_no_materia;
                gr0101.u_mkt_ean_pieza = gr12.u_mt_pi_ean;
            }
        } else {
            // MASIVO
            var gr12 = new GlideRecord('u_mdm_registros');
            gr12.addEncodedQuery('sys_id=' + v_id_new);
            gr12.query();
            if (gr12.next()) {
                gr0101.u_mkt_numero_de_material = gr12.u_mt_no_materia;
                gr0101.u_mkt_ean_pieza = gr12.u_mt_pi_ean;
                gr0101.u_mkt_descripcion_larga_de_producto = gr12.u_mt_nombre;
                gr0101.u_mkt_keyword = gr12.u_mt_ecommerce;
                gr0101.u_mkt_keyword_comple = gr12.u_mt_keywords_complementario;
                gr0101.u_mtr_metadescripcion = gr12.u_mt_metadescripcion;
                gr0101.u_mtr_caption_link = gr12.u_mt_caption_link;
            }
        }
        gr0101.insert();
    },





    // ==============================================================================================================================

    // Duplicar registro de tabla ++++++++++++++++++++++++++++++++++++++

    MKT_registro_duplica_PB: function(tablaOrginal, tablaNueva, registroID, vValorCambiar, vValor01, vValor02, vUser00, vRandomID) {

        // gs.log('Ser 100 Entro a duplicado de tabla.',msgLog);
        // Define la tabla y el sys_id del registro que deseas clonar

        var varCampo,
            numReg = 0,
            strTableOld = tablaOrginal, // Cambia a tu tabla original
            strTableNew = tablaNueva, // Cambia a tu tabla nueva
            varIdOriginal = registroID, // Cambia a tu id que quieras clonar
            varIdNew;

        // gs.log("Ser 100 Duplica registro strTableOld a strTableNew",msgLog);
        // Table 01
        var gr01 = new GlideRecord(strTableOld);
        gr01.addEncodedQuery('sys_id=' + varIdOriginal);
        gr01.query();
        while (gr01.next()) {
            numReg++;
            gr01.setWorkflow(false);
            // Table 02
            var gr02 = new GlideRecord(strTableNew);
            gr02.initialize();
            for (var i = 0; i < fields.length; i++) {
                varCampo = fields[i];
                gr02[varCampo] = gr01[varCampo];
                // gr02.<field name> = gr01.<field name>;
                // gs.log(varCampo + ": "+gr01[varCampo],msgLog);
            }

            gr02.u_mt_estatus = 'Lectura';
            gr02.u_mt_nombre = gr01.u_mt_nombre;
            gr02.u_mt_tipo_de_solicitud = 'Cambio';
            gr02.u_mt_tipo_de_solicitud_esp = '';
            gr02.u_mtr_cambio_material_origen = varIdOriginal;
            gr02.u_mt_movimiento_sn = 'd285b1452b813610677df2f9ed91bf6e'; // Cambio MKT
            gr02.u_mt_sap_no_envios = '';
            gr02.u_mt_vtex = '';
            gr02.u_mt_vtex_fecha = '';
            gr02.u_mt_historico = '';
            if (vValorCambiar) {
                gr02.u_mt_nombre = vValor01;
                gr02.u_mt_ecommerce = vValor02;
            }
            gr02.u_mt_etapa_actual = '8';
            gr02.u_mt_id_random = vRandomID;
            gr02.opened_by = vUser00;

            varIdNew = gr02.insert();

            /*
			Sin actualizar registro original 

            gr01.u_mtr_cambio_material_cambio = varIdNew;
            gr01.u_mtr_cambio_pendiente = 'Si';
            gr01.update();
			*/

        }
        // gs.log('Ser 100 Registros copiados: ' + numReg, msgLog);
        // gs.log('Ser 100 Nuevo ID: ' + varIdNew, msgLog);
        return varIdNew;
    },



    // Duplicar registro de tabla "DICCIONARIO" ++++++++++++++++++++++++++++++++++++++ 

    MKT_registro_duplica_diccionario_PB: function(tablaOrginal) {

        // gs.log('Ser 100 Entro a diccionario de tabla.',msgLog);
        // Define la tabla y el sys_id del registro que deseas clonar

        var varCampo,
            numF = 0,
            strTableOld = tablaOrginal; // Cambia a tu tabla original

        // gs.log("Ser 100 Lectura de campos strTableOld",msgLog);
        var grCheck = new GlideRecord('sys_dictionary');
        grCheck.addEncodedQuery('name=' + strTableOld + '^element!=NULL');
        grCheck.query();
        // gs.log("Ser 100 Numero de campos: " + grCheck.getRowCount(),msgLog); // Contador	
        while (grCheck.next()) {
            varCampo = grCheck.element;
            fields[numF] = varCampo.toString();
            numF++;
        }

        // gs.log("Ser 100 Nombre de campos: " + fields,msgLog);
        return 'Listo array Diccionario.';
    },












    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX













    // ==============================================================================================================================

    // ------------------------------------------------------------------------------------------------------------
    // Contador auto incremental para mensajes
    jjGet00Mov: function(vNum) {
        var calculoMov;
        calculoMov = '000000' + (vNum);
        calculoMov = calculoMov.substring(calculoMov.length - 5, calculoMov.length) + ' ';
        return calculoMov;
    },
    // ------------------------------------------------------------------------------------------------------------
    // Calculo tiempo total de ejecucion de codigo
    jjTiempoTotal: function(vFecha1, vMsg) {
        var vFecha2 = new GlideDateTime(); // Obtener fecha final
        var date1 = new GlideDateTime(vFecha1).getNumericValue(); // Convertir a milisegundos
        var date2 = new GlideDateTime(vFecha2).getNumericValue(); // Convertir a milisegundos
        var diffMillis = date2 - date1; // Calcular la diferencia en milisegundos
        var msgTemp = '\n\n';
        msgTemp += vFecha1 + ' \n';
        msgTemp += vFecha2 + ' \n';
        msgTemp += 'Tiempo de proceso = ' + this.jjConvertMillisToTime(diffMillis) + '\n\n';
        msgTemp += vMsg + ' \n\n';
        msgTemp += 'FIN \n\n';
        return msgTemp;
    },
    // ------------------------------------------------------------------------------------------------------------
    // Calculo de minutos
    jjConvertMillisToTime: function(millis) {
        var hours = Math.floor(millis / (1000 * 60 * 60)); // Calcular horas, minutos y segundos
        var minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((millis % (1000 * 60)) / 1000);
        hours = hours.toString().padStart(2, '0'); // Agregar ceros iniciales si es necesario (para formato HH:mm:ss)
        minutes = minutes.toString().padStart(2, '0');
        seconds = seconds.toString().padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds; // Devolver el formato HH:mm:ss
    },
    // ------------------------------------------------------------------------------------------------------------

    // ==============================================================================================================================












    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX













    // ==============================================================================================================================



    type: 'jj_MDM_Utils_Client'
});
// END