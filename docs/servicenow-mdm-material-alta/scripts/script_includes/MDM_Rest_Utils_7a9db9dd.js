// Script Include: MDM_Rest_Utils
// sys_id: 7a9db9dd97cc1a10cc1ebbdfe153af8b | activo: true | updated: 04-02-2026 14:38:40
// description: MDM

var global_log,
    global_Email = '',
    global_Movimiento = 0;

var MDM_Rest_Utils = Class.create();
MDM_Rest_Utils.prototype = {

    // ==============================================================================================================================

    initialize: function() {},

    // ==============================================================================================================================

    /*
    	MATERIAL ALTA 			-> getDatos												Layout OBLIGATORIO
    	MATERIAL CAMBIO			-> getDatos_mod			-> getDatos						Layout SI
    													-> getDatos_mod_noLayout		Layout NO
		MATERIAL CAMBIO MKT		-> getDatos_mod_MKT

		Nota: En general el "sys_id" es del Task
    */

    // ==============================================================================================================================

    getDatos: function(sys_id, tipo) { // tipo [A/C] Layout [S]

        if (tipo == 'A')
            global_log = this.getNoRITM(sys_id) + '_' + tipo + '_MDM_getDatos_' + this.generarIdAleatorio();

        // global_log heredado de getDatos_mod si "tipo" es igual a [C] 

        var tipoLabel = 'Alta',
            limite = 8000,
            limitar = false,
            regTotal = 0,
            currentBatch,
            batchSize = 200, // Tamaño del batch (lote)
            idCarga,
            logMaterial,
            xID_CARGA,
            record,
            msgAlta = 'Material creado correctamente',
            msgCambio = 'El material fue modificado correctamente',
            vQuery,
            msgAltaOmitir = '(Omitir) Material creado correctamente',
            msgCambioOmitir = '(Omitir) El material fue modificado correctamente',
            responseBody = '',
            httpStatus,
            response,
            logDeTodo = false, // Oculta o Muestra TODOS los 'log'
            logDeMaterialEnviado = true,
            result,
            resultFinal;

        if (logDeTodo)
            gs.log(this.getMsgMov() + 'Entro a getDatos', global_log);

        // Resumen de tablas complementos
        gs.log(this.getMsgMov() + '\n\nMaterial [0_Layout_Registros] \n\n' + this.tablasComplementoContador(sys_id), global_log);

        if (tipo === 'C')
            tipoLabel = 'Modificación';

        var uniqueValues = {}; // Usar un objeto para almacenar valores únicos

        vQuery = 'u_mdm_task=' + sys_id;
        vQuery += '^u_sap_respuesta!=' + msgAlta + '^ORu_sap_respuesta=NULL';
        vQuery += '^u_sap_respuesta!=' + msgAltaOmitir + '^ORu_sap_respuesta=NULL';
        vQuery += '^u_sap_respuesta!=' + msgCambio + '^ORu_sap_respuesta=NULL';
        vQuery += '^u_sap_respuesta!=' + msgCambioOmitir + '^ORu_sap_respuesta=NULL';

        var vRitmID = this.getNoRITM_ID(sys_id);

        if (logDeTodo) {
            gs.log(this.getMsgMov() + '\n\nMaterial vQuery \n\n' + vQuery + '\n\n', global_log);
            gs.log(this.getMsgMov() + '\n\nMaterial vRitmID \n\n' + vRitmID + '\n\n', global_log);
        }

        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addEncodedQuery(vQuery);
        if (limitar)
            gr.setLimit(limite);
        gr.query();
        while (gr.next()) {
            idCarga = gr.getValue('u_idcarga');
            if (idCarga && !uniqueValues[idCarga]) {
                uniqueValues[idCarga] = true;
            }
            gr.u_sap_respuesta = 'En espera de respuesta SAP';
            gr.u_ritm_relacionado = vRitmID;
            gr.update();
            regTotal++;
        }


        // Si todos los registros contiene respuesta correcta cerrar Task y Ritm
        if (regTotal == 0) {

            // Cerrar TASK y RITM
            this.cerrarTaskRitm(sys_id);
            gs.log(this.getMsgMov() + '\n\nTodos los materiales se encuentran con respuesta correcta.\nSe cerrara la Task y Ritm.\n\n', global_log);

        } else {


            var unicos = Object.keys(uniqueValues);

            if (logDeTodo) {
                gs.log(this.getMsgMov() + 'Valores únicos: ' + unicos.join(','), global_log);
                gs.log(this.getMsgMov() + 'Cantidad de valores únicos: ' + unicos.length, global_log);
            }

            // Dividir los únicos en batches
            var batches = this.chunkArray(unicos, batchSize);

            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Total batches: ' + batches.length, global_log);

            for (var batchIndex = 0; batchIndex < batches.length; batchIndex++) {

                // batchIndex
                gs.log(this.getMsgMov() + 'Procesando batch ' + (batchIndex + 1) + ' de ' + batches.length, global_log);

                currentBatch = batches[batchIndex];
                this.actualizarBatch(batchIndex + 1, sys_id, batches.length);

                resultFinal = []; // Este contendrá todos los resultados finales

                // Procesar cada elemento del batch
                for (var i = 0; i < currentBatch.length; i++) {

                    idCarga = currentBatch[i];
                    result = {};


                    // u_cmdb_mdm_datos_basicos ---------------------------------------------------------------------------
                    var DatosBasicosData = [];
                    gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {

                        var xTRAGR = gr.getValue('u_mara_tragr');

                        /**
                         * Alta el ID se conforma de   #MaterialAnterior_'A'_SysIDTask
                         */

                        xID_CARGA = gr.getValue('u_idcarga');
                        if (tipo === 'C') {
                            if (xID_CARGA.indexOf('_') > -1)
                                xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                            else
                                xID_CARGA = gr.getValue('u_idcarga') + '_C_' + sys_id;
                        }
                        if (tipo === 'A') {
                            if (xID_CARGA.indexOf('_') > -1)
                                xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_A_' + sys_id;
                            else
                                xID_CARGA = gr.getValue('u_idcarga') + '_A_' + sys_id;
                        }
                        logMaterial = xID_CARGA;
                        record = {
                            ID_CARGA: xID_CARGA,
                            MAKTX: gr.getValue('u_makt_maktx'),
                            LABOR: gr.getValue('u_mara_labor'),
                            SPRAS: gr.getValue('u_makt_spras'),
                            WHSTC: gr.getValue('u_mara_whstc'),
                            HNDLCODE: gr.getValue('u_mara_hndlcode'),
                            QGRP: gr.getValue('u_mara_qgrp'),
                            MFRNR: gr.getValue('u_mara_mfrnr'),
                            MSTDV: gr.getValue('u_mara_mstdv'),
                            MHDRZ: gr.getValue('u_mara_mhdrz'),
                            SLED_BBD: gr.getValue('u_mara_sled_bbd'),
                            CADKZx: gr.getValue('u_mara_cadkz'),
                            MHDLP: gr.getValue('u_mara_mhdlp'),
                            NRFHG: gr.getValue('u_mara_nrfhg'),
                            MSTAV: gr.getValue('u_mara_mstav'),
                            RDMHD: gr.getValue('u_mara_rdmhd'),
                            MTPOS_MARA: gr.getValue('u_mara_mtpos_mara'),
                            MSTDE: gr.getValue('u_mara_mstde'),
                            EXTWG: gr.getValue('u_mara_extwg'),
                            IPRKZ: gr.getValue('u_mara_iprkz'),
                            MSTAE: gr.getValue('u_mara_mstae'),
                            XCHPF: gr.getValue('u_mara_xchpf'),
                            MBRSH: gr.getValue('u_mara_mbrsh'),
                            PRDHA: gr.getValue('u_mara_prdha'),
                            MATNR: gr.getValue('u_mara_matnr'),
                            BISMT: gr.getValue('u_mara_bismt'),
                            GEWEI: gr.getValue('u_mara_gewei'),
                            NTGEW: gr.getValue('u_mara_ntgew'),
                            TRAGR: xTRAGR ? xTRAGR.padStart(4, '0') : '',
                            MEINS: gr.getValue('u_mara_meins'),
                            MTART: gr.getValue('u_mara_mtart'),
                            MATKL: gr.getValue('u_mara_matkl'),
                            TEMPB: gr.getValue('u_mara_tempb'),
                            SPART: gr.getValue('u_mara_spart'),
                            GROES: gr.getValue('u_mara_groes'),
                            ID_EBX: ''
                        };
                        DatosBasicosData.push(record);
                    }
                    result.DatosBasicos = DatosBasicosData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de DatosBasicos: \n\n' + JSON.stringify(result.DatosBasicos), global_log);


                    // Unidades Alter ---------------------------------------------------------------------------
                    var unidadesAlterData = [];
                    gr = new GlideRecord('u_cmdb_mdm_unidadesalter');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            MEINH: gr.getValue('u_marm_meinh'),
                            UMREZ: gr.getValue('u_marm_umrez'),
                            UMREN: gr.getValue('u_marm_umren'),
                            EAN11: gr.getValue('u_marm_ean11'),
                            NUMTP: gr.getValue('u_marm_numtp'),
                            LAENG: gr.getValue('u_marm_laeng'),
                            BREIT: gr.getValue('u_marm_breit'),
                            HOEHE: gr.getValue('u_marm_hoehe'),
                            MEABM: gr.getValue('u_marm_meabm'),
                            VOLUM: gr.getValue('u_marm_volum'),
                            VOLEH: gr.getValue('u_marm_voleh'),
                            BRGEW: gr.getValue('u_marm_brgew'),
                            GEWEI: gr.getValue('u_marm_gewei'),
                            ID_EBX: ''
                        };
                        unidadesAlterData.push(record);
                    }
                    result.UnidadesAlter = unidadesAlterData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de UnidadesAlter: \n\n' + JSON.stringify(result.UnidadesAlter), global_log);


                    // Almacen ---------------------------------------------------------------------------
                    var almacenData = [];
                    gr = new GlideRecord('u_cmdb_mdm_almacen');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            LGORT: gr.getValue('u_mard_lgort'),
                            WERKS: gr.getValue('u_mard_werks'),
                            ID_EBX: ''
                        };
                        almacenData.push(record);
                    }
                    result.Almacen = almacenData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de Almacen: \n\n' + JSON.stringify(result.Almacen), global_log);


                    // TaxClassif ---------------------------------------------------------------------------
                    var taxClassifData = [];
                    gr = new GlideRecord('u_cmdb_mdm_taxclassif');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();

                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            taxm2: gr.getValue('u_mlan_taxm2'),
                            taxm1: gr.getValue('u_mlan_taxm1'),
                            ID_EBX: ''
                        };
                        taxClassifData.push(record);
                    }
                    result.TaxClassif = taxClassifData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de TaxClassif: \n\n' + JSON.stringify(result.TaxClassif), global_log);


                    // Ventas ---------------------------------------------------------------------------
                    var ventasData = [];
                    gr = new GlideRecord('u_cmdb_mdm_ventas');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            PRAT6: gr.getValue('u_mvke_prat6'),
                            RDPRF: gr.getValue('u_mvke_rdprf'),
                            VERSG: gr.getValue('u_mvke_versg'),
                            MVGR1: gr.getValue('u_mvke_mvgr1'),
                            VKORG: gr.getValue('u_mvke_vkorg'),
                            SKTOF: gr.getValue('u_mvke_sktof'),
                            KTGRM: gr.getValue('u_mvke_ktgrm'),
                            MVGR2: gr.getValue('u_mvke_mvgr2'),
                            MTPOS: gr.getValue('u_mvke_mtpos'),
                            MVGR4: gr.getValue('u_mvke_mvgr4'),
                            MVGR3: gr.getValue('u_mvke_mvgr3'),
                            PRODH: gr.getValue('u_mvke_prodh'),
                            VMSTA: gr.getValue('u_mvke_vmsta'),
                            VTWEG: gr.getValue('u_mvke_vtweg'),
                            PRAT2: gr.getValue('u_mvke_prat2'),
                            VMSTD: gr.getValue('u_mvke_vmstd'),
                            MVGR5: gr.getValue('u_mvke_mvgr5'),
                            ID_EBX: ''
                        };
                        ventasData.push(record);
                    }
                    result.Ventas = ventasData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de Ventas: \n\n' + JSON.stringify(result.Ventas), global_log);


                    // Planta ---------------------------------------------------------------------------
                    var plantaData = [];
                    gr = new GlideRecord('u_cmdb_mdm_planta');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {

                        var xLADGR = gr.getValue('u_marc_ladgr');

                        record = {
                            ID_CARGA: xID_CARGA,
                            XCHPF: gr.getValue('u_mara_xchpf'),
                            LGFSB: gr.getValue('u_marc_lgfsb'),
                            SHZET: gr.getValue('u_marc_shzet'),
                            LOGGR: gr.getValue('u_marc_loggr'),
                            VSPVB: gr.getValue('u_marc_vspvb'),
                            SCM_STRA1: gr.getValue('u_marc_scm_stra1'),
                            DISGR: gr.getValue('u_marc_disgr'),
                            STRGR: gr.getValue('u_marc_strgr'),
                            MTVFP: gr.getValue('u_marc_mtvfp'),
                            VINT1: gr.getValue('u_marc_vint1'),
                            BSTMI: gr.getValue('u_marc_bstmi'),
                            FHORI: gr.getValue('u_marc_fhori'),
                            VRMOD: gr.getValue('u_marc_vrmod'),
                            ABCIN: gr.getValue('u_marc_abcin'),
                            MINBE: gr.getValue('u_marc_minbe'),
                            KAUTB: gr.getValue('u_marc_kautb'),
                            VINT2: gr.getValue('u_marc_vint2'),
                            QMATV: gr.getValue('u_marc_qmatv'),
                            MABST: gr.getValue('u_marc_mabst'),
                            SERNP: gr.getValue('u_marc_sernp'),
                            PRCTR: gr.getValue('u_marc_prctr'),
                            LADGR: xLADGR ? xLADGR.padStart(4, '0') : '',
                            MAABC: gr.getValue('u_marc_maabc'),
                            WERKS: gr.getValue('u_marc_werks'),
                            MMSTA: gr.getValue('u_marc_mmsta'),
                            EKGRP: gr.getValue('u_marc_ekgrp'),
                            BESKZ: gr.getValue('u_marc_beskz'),
                            DISLS: gr.getValue('u_marc_dislk'),
                            DISMM: gr.getValue('u_marc_dismm'),
                            PLIFZ: gr.getValue('u_marc_plifz'),
                            SOBSL: gr.getValue('u_marc_sobsl'),
                            MMSTD: gr.getValue('u_marc_mmstd'),
                            PERKZ: gr.getValue('u_marc_perkz'),
                            DISPO: gr.getValue('u_marc_dispo'),
                            ID_EBX: ''
                        };
                        plantaData.push(record);
                    }
                    result.Planta = plantaData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'mod Datos de Planta: \n\n' + JSON.stringify(result.Planta), global_log);


                    // Calidad ---------------------------------------------------------------------------
                    var calidadData = [];
                    gr = new GlideRecord('u_cmdb_mdm_calidad');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            DELE: gr.getValue('u_dele'),
                            ART: gr.getValue('u_qmat_art'),
                            AKTIV: gr.getValue('u_qmat_aktiv'),
                            ID_EBX: ''
                        };
                        calidadData.push(record);
                    }
                    result.Calidad = calidadData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de Calidad: \n\n' + JSON.stringify(result.Calidad), global_log);


                    // Características ---------------------------------------------------------------------------
                    var caracteristicasData = [];
                    gr = new GlideRecord('u_cmdb_mdm_caracteristicas');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            CLASSNUM: gr.getValue('u_bapi1003_key_classnum'),
                            ATNAM: gr.getValue('u_ausp_atnam'),
                            CLASSTYPE: gr.getValue('u_bapi1003_key_classtype'),
                            ATWRT: gr.getValue('u_ausp_atwrt'),
                            OBTAB: gr.getValue('u_bapi1003_key_obtab'),
                            ALLOC: gr.getValue('u_alloc'),
                            DELETE: gr.getValue('u_delete'),
                            ID_EBX: ''
                        };
                        caracteristicasData.push(record);
                    }
                    result.Caracteristicas = caracteristicasData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de Caracteristicas: \n\n' + JSON.stringify(result.Caracteristicas), global_log);


                    // Valoración ---------------------------------------------------------------------------
                    var ValoracionData = [];
                    gr = new GlideRecord('u_cmdb_mdm_valoracion');
                    gr.addQuery('u_mdm_task', sys_id);
                    gr.addQuery('u_idcarga', idCarga);
                    gr.query();
                    while (gr.next()) {
                        record = {
                            ID_CARGA: xID_CARGA,
                            BKLAS: gr.getValue('u_mbew_bklas'),
                            VPRSV: gr.getValue('u_mbew_vprsv'),
                            BWTAR: gr.getValue('u_mbew_bwtar'),
                            BWKEY: gr.getValue('u_mbew_bwkey'),
                            ID_EBX: ''
                        };
                        ValoracionData.push(record);
                    }
                    result.Valoracion = ValoracionData;
                    if (logDeTodo)
                        gs.log(this.getMsgMov() + 'Datos de Valoracion: \n\n' + JSON.stringify(result.Valoracion), global_log);


                    // Agrega el resultado a la lista final
                    resultFinal.push(result); // ---------------------------------------------------------------------------
                    if (logDeMaterialEnviado)
                        gs.log(this.getMsgMov() + '\n\nMaterial [' + logMaterial + '] \n\nLayout [si]\n\n' + JSON.stringify(result) + '\n\n\n', global_log);
                }



                var strJSON = JSON.stringify(resultFinal).replace(/\:null/gi, "\:\"\"");
                // gs.log( this.getMsgMov() +httpStatus + ' / batchIndex: ' + batchIndex + ' / Envio a S4H: ' + strJSON, global_log);
                // new ResultadosAPIs().createResultAPI('MDM Material', 'TestEnvioMDM', JSON.stringify(strJSON), 'Test', 'Test', sys_id, 'MDM Material - ' + tipoLabel);

                var sm = new sn_ws.RESTMessageV2('MDM_Materiales', 'enviar');

                // Establece el cuerpo del mensaje POST
                sm.setRequestBody(strJSON);

                // Configura el tipo de contenido como 'application/json'
                sm.setRequestHeader('Content-Type', 'application/json');

                try {
                    // Ejecuta el RESTMessage y obtiene la respuesta
                    response = sm.execute();

                    if (responseBody.length < 5)
                        responseBody = response.getBody();
                    else
                        responseBody = responseBody + ' / ' + response.getBody();

                    httpStatus = response.getStatusCode();

                    new ResultadosAPIs().createResultAPI('MDM Material', sm.getEndpoint(), JSON.stringify(strJSON), responseBody, httpStatus, sys_id, 'MDM Material - ' + tipoLabel);

                    // Maneja la respuesta si es necesario
                    // gs.log( this.getMsgMov() +httpStatus + ' / batchIndex: ' + batchIndex + ' / Cuerpo de la respuesta: ' + responseBody, global_log);
                } catch (ex) {
                    // Maneja cualquier excepción que ocurra durante la llamada
                    var message = ex.getMessage();
                    gs.error('Error al ejecutar RESTMessage: ' + message, global_log);
                }

            }
            // return JSON.parse(strJSON);

        }
        return responseBody;
    },

    // ==============================================================================================================================

    getDatos_mod_MKT: function(sys_id, tipo) { // tipo [C_MKT] 

        // 222

        var logDeTodo = true, // Oculta o Muestra TODOS los 'log'
            logDeMaterialEnviado = true;


        if (logDeTodo)
            gs.log('JJJ', global_log);

        return 'FIN';

    },

    // ==============================================================================================================================

    getDatos_mod: function(sys_id, tipo) { // tipo [C] Layout [S/N]

        global_log = this.getNoRITM(sys_id) + '_' + tipo + '_MDM_getDatos_' + this.generarIdAleatorio();

        var omitirLayout = false;
        /**
         * Verificar si es con layout o no
         */
        var task = new GlideRecord('sc_task');
        if (task.get(sys_id)) {
            omitirLayout = task.u_mdm_mt_layout_omitir.toString();
        }
        if (tipo == 'C_MKT') {
            // Cambio MKT
            return this.getDatos_mod_MKT(sys_id, tipo);
        } else if (omitirLayout == 'true' || omitirLayout == true) {
            // Cambio sin Layout (Info. de formulario)
            return this.getDatos_mod_noLayout(sys_id);
        } else {
            // Cambio con Layout
            return this.getDatos(sys_id, tipo);
        }
    },

    // ==============================================================================================================================

    getDatos_mod_noLayout: function(sys_id_task) { // tipo [C] Layout [N]

        // global_log heredado de getDatos_mod si "tipo" es igual a [C] 

        var tipo = 'C',
            v1,
            v2,
            v3,
            v4,
            record,
            logEAN,
            logEANtipo,
            sys_id = sys_id_task,
            sys_id_cambio = '',
            noMaterial_anterior,
            logDeTodo = false, // Oculta o Muestra TODOS los 'log'
            logDeMaterialEnviado = true,
            logMaterial;

        var u_makt_maktx, u_makt_spras, u_mara_whstc, u_mara_hndlcode, u_mara_qgrp, u_mara_mfrnr, u_mara_mstdv, u_mara_mhdrz, u_mara_sled_bbd, u_mara_cadkz, u_mara_mhdlp, u_mara_nrfhg, u_mara_mstav, u_mara_rdmhd, u_mara_mtpos_mara, u_mara_mstde, u_mara_extwg, u_mara_iprkz, u_mara_mstae, u_mara_xchpf, u_mara_labor, u_mara_mbrsh, u_mara_prdha, u_mara_matnr, u_mara_bismt, u_mara_gewei, u_mara_ntgew, u_mara_tragr, u_mara_meins, u_mara_mtart, u_mara_matkl, u_mara_tempb, u_mara_spart, u_mara_groes, u_idcarga, noMaterial;
        var resultFinal = [];

        var task = new GlideRecord('sc_task');
        if (task.get(sys_id)) {
            var result = {};

            //SysId con los cambios
            sys_id_cambio = task.u_mdm_material_cambio; //Material con los cambios
            noMaterial = task.u_mdm_material_actual.u_mt_no_materia;
            noMaterial_anterior = task.u_mdm_material_actual.u_mt_no_material_anterior;

            // gs.print('Se encontró el registro: ' + noMaterial);			
            logMaterial = noMaterial + '_' + tipo + '_' + sys_id;

            // CREAR nuevo REGISTRO en tablas complemento "Limpia" -> "Crea"
            gs.log(this.getMsgMov() + '\n\nMaterial [0_Layout_Registros] \n\n' + this.tablasComplementoLimpiar(sys_id_cambio, sys_id, noMaterial, noMaterial_anterior), global_log);


            // u_cmdb_mdm_datos_basicos ---------------------------------------------------------------------------
            var DatosBasicosData = [];
            var gr = new GlideRecord('u_mdm_registros');
            gr.get(sys_id_cambio); //Busca material con los cambios
            record = {
                ID_CARGA: logMaterial,
                MAKTX: gr.getValue('u_mt_denomin'),
                LABOR: gr.getValue('u_mt_labor_oficina'),
                SPRAS: gr.u_mt_idioma_ref.u_value.toString(),
                WHSTC: gr.u_mt_cond_almacenamiento_ref.u_value.toString(),
                HNDLCODE: gr.u_mt_indicador_manipulacion.u_value.toString(),
                QGRP: gr.u_mt_grupo_control_calidad.u_value.toString(),
                MFRNR: this.cerosIzquierda(gr.getValue('u_mt_fabricante'), 10),
                MSTDV: this.formatDate(gr.getValue('u_mt_validez_de')),
                MHDRZ: gr.getValue('u_mt_tmpohastacaduc'),
                SLED_BBD: gr.u_mt_fecad_feex_ref.u_value.toString(),
                CADKZx: gr.getValue('u_mt_ind_cad_ref'),
                MHDLP: gr.getValue('u_mt_durtotalconserv'),
                NRFHG: gr.u_mt_susbonifes_ref.u_value.toString(),
                MSTAV: gr.u_mt_status_ref.u_value.toString(),
                RDMHD: gr.u_mt_regla_redondeo_ref.u_value.toString(),
                MTPOS_MARA: gr.u_mt_grposgral_ref.u_value.toString(),
                MSTDE: this.formatDate(gr.getValue('u_mt_valido_de')),
                EXTWG: gr.u_mt_linea_del_proveedor.u_value.toString(),
                IPRKZ: gr.u_mt_ind_periodo_ref.u_value.toString(),
                MSTAE: gr.u_mt_statusmat_ref.u_value.toString(),
                XCHPF: gr.u_mt_sujeto_a_lote.u_value.toString(),
                MBRSH: gr.u_mt_ramo_ref.u_value.toString(),
                PRDHA: gr.u_mt_jerarquia_de_productos.u_value.toString(),
                MATNR: noMaterial.toString(),
                BISMT: gr.getDisplayValue('u_mt_no_material_anterior'),
                GEWEI: gr.u_mt_2_unidad.u_value.toString(),
                NTGEW: gr.getValue('u_mt_pi_pesos_gr'),
                TRAGR: gr.u_mt_grtransp_ref.u_value.toString(),
                MEINS: gr.getValue('u_mt_pi_unidad_id'), // PI (Pieza)
                MTART: gr.u_mt_tpmaterial_ref.u_value.toString(),
                MATKL: gr.u_mt_tipo.u_value.toString(),
                TEMPB: gr.u_mt_condicion_de_temperatura.u_value.toString(),
                SPART: gr.u_mt_sector_ref.u_value.toString(),
                GROES: gr.u_mt_formula.u_value.toString(),
                ID_EBX: ''
            };
            DatosBasicosData.push(record);
            result.DatosBasicos = DatosBasicosData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de UnidadesAlter: \n\n' + JSON.stringify(result.DatosBasicos), global_log);


            // Unidades Alter ---------------------------------------------------------------------------
            var unidadesAlterData = [];
            // u_mt_pi_ean
            if (gr.u_mt_pi_piezas != '') {
                v1 = (gr.u_mt_pi_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pi_longitud_cm.toString());
                v2 = (gr.u_mt_pi_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pi_ancho_cm.toString());
                v3 = (gr.u_mt_pi_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pi_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_pi_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_pi_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_pi_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_pi_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_pi_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_pi_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_pi_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_pi_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_emp_ean
            if (gr.u_mt_emp_piezas != '') {
                v1 = (gr.u_mt_emp_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_emp_longitud_cm.toString());
                v2 = (gr.u_mt_emp_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_emp_ancho_cm.toString());
                v3 = (gr.u_mt_emp_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_emp_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_emp_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_emp_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_emp_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_emp_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_emp_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_emp_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_emp_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_emp_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_sub_ean
            if (gr.u_mt_sub_piezas != '') {
                v1 = (gr.u_mt_sub_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_longitud_cm.toString());
                v2 = (gr.u_mt_sub_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_ancho_cm.toString());
                v3 = (gr.u_mt_sub_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_sub_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_sub_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_sub_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_sub_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_sub_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_sub_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_sub_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_sub_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_sub_ean
            if (gr.u_mt_sub_piezas != '') {
                v1 = (gr.u_mt_sub_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_longitud_cm.toString());
                v2 = (gr.u_mt_sub_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_ancho_cm.toString());
                v3 = (gr.u_mt_sub_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_sub_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_sub_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_sub_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_sub_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_sub_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_sub_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_sub_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_sub_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_sub_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_bto_ean
            if (gr.u_mt_bto_piezas != '') {
                v1 = (gr.u_mt_bto_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_bto_longitud_cm.toString());
                v2 = (gr.u_mt_bto_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_bto_ancho_cm.toString());
                v3 = (gr.u_mt_bto_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_bto_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_bto_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_bto_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_bto_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_bto_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_bto_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_bto_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_bto_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_bto_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_pal_ean
            if (gr.u_mt_pal_piezas != '') {
                v1 = (gr.u_mt_pal_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pal_longitud_cm.toString());
                v2 = (gr.u_mt_pal_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pal_ancho_cm.toString());
                v3 = (gr.u_mt_pal_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pal_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_pal_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_pal_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_pal_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_pal_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_pal_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_pal_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_pal_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_pal_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_zca_ean
            if (gr.u_mt_zca_piezas != '') {
                v1 = (gr.u_mt_zca_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_zca_longitud_cm.toString());
                v2 = (gr.u_mt_zca_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_zca_ancho_cm.toString());
                v3 = (gr.u_mt_zca_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_zca_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_zca_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_zca_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_zca_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_zca_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_zca_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_zca_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_zca_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_zca_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_pa1_ean
            if (gr.u_mt_pa1_piezas != '') {
                v1 = (gr.u_mt_pa1_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pa1_longitud_cm.toString());
                v2 = (gr.u_mt_pa1_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pa1_ancho_cm.toString());
                v3 = (gr.u_mt_pa1_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_pa1_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_pa1_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_pa1_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_pa1_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_pa1_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_pa1_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_pa1_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_pa1_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_pa1_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            // u_mt_ze1_ean
            if (gr.u_mt_ze1_piezas != '') {
                v1 = (gr.u_mt_ze1_longitud_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_ze1_longitud_cm.toString());
                v2 = (gr.u_mt_ze1_ancho_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_ze1_ancho_cm.toString());
                v3 = (gr.u_mt_ze1_altura_cm.toString() == '') ? 0 : parseFloat(gr.u_mt_ze1_altura_cm.toString());
                v4 = v1 * v2 * v3;
                logEANtipo = this.createExcelFile_logEAN(gr.u_mt_ze1_ean.toString().length);
                record = {
                    ID_CARGA: logMaterial, // 01 - ID_CARGA
                    MEINH: gr.u_mt_ze1_unidad_id.toString(), // 02 - UM alt.
                    UMREZ: gr.u_mt_ze1_piezas.toString(), // 03 - Contador
                    UMREN: '1', // 04 - Denominador
                    EAN11: gr.u_mt_ze1_ean.toString(), // 05 - Código EAN/UPC
                    NUMTP: logEANtipo, // 06 - Tipo EAN
                    LAENG: gr.u_mt_ze1_longitud_cm.toString(), // 07 - Longitud
                    BREIT: gr.u_mt_ze1_ancho_cm.toString(), // 08 - Ancho
                    HOEHE: gr.u_mt_ze1_altura_cm.toString(), // 09 - Altura
                    MEABM: 'CM', // 10 - Unidad
                    VOLUM: v4.toString(), // 11 - Volumen
                    VOLEH: 'CM3', // 12 - Unidad volumen
                    BRGEW: gr.u_mt_ze1_pesos_gr.toString(), // 13 - Peso bruto
                    GEWEI: this.regresaOptionValueXLS(gr.u_mt_2_unidad).toString(), // 14 - Unidad de peso
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);
            }
            result.UnidadesAlter = unidadesAlterData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de UnidadesAlter: \n\n' + JSON.stringify(result.UnidadesAlter), global_log);


            result.UnidadesAlter = unidadesAlterData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de UnidadesAlter: \n\n' + JSON.stringify(result.UnidadesAlter), global_log);


            // Almacen ---------------------------------------------------------------------------
            var almacenData = [];
            result.Almacen = almacenData;
            // TaxClassif ---------------------------------------------------------------------------
            var taxClassifData = [];
            result.TaxClassif = taxClassifData;
            // Ventas ---------------------------------------------------------------------------
            var ventasData = [];
            result.Ventas = ventasData;
            // Planta ---------------------------------------------------------------------------
            var plantaData = [];
            result.Planta = plantaData;
            // Calidad ---------------------------------------------------------------------------
            var calidadData = [];
            result.Calidad = calidadData;
            // Características ---------------------------------------------------------------------------
            var caracteristicasData = [];
            result.Caracteristicas = caracteristicasData;
            // Valoración ---------------------------------------------------------------------------
            var ValoracionData = [];
            result.Valoracion = ValoracionData;

            // Agrega el resultado a la lista final ---------------------------------------------------------------------------
            resultFinal.push(result);
            if (logDeMaterialEnviado)
                gs.log(this.getMsgMov() + '\n\nMaterial [' + logMaterial + '] \n\nLayout [no]\n\n' + JSON.stringify(result) + '\n\n\n', global_log);
        }

        var strJSON = JSON.stringify(resultFinal).replace(/\:null/gi, "\:\"\"");
        // gs.log( this.getMsgMov() +'Envio a S4H noLayout: ' + strJSON, global_log);
        //		return strJSON;


        var sm = new sn_ws.RESTMessageV2('MDM_Materiales', 'enviar');
        // Establece el cuerpo del mensaje POST
        sm.setRequestBody(strJSON);
        sm.setRequestHeader('Content-Type', 'application/json');
        try {
            // Ejecuta el RESTMessage y obtiene la respuesta
            var response = sm.execute();
            var responseBody = response.getBody();
            var httpStatus = response.getStatusCode();

            new ResultadosAPIs().createResultAPI('MDM Material', sm.getEndpoint(), JSON.stringify(strJSON), responseBody, httpStatus, sys_id, 'MDM Material - Modificación');

            // Maneja la respuesta si es necesario
            // gs.log( this.getMsgMov() +'Respuesta HTTP: ' + httpStatus, global_log);
            // gs.log( this.getMsgMov() +'Cuerpo de la respuesta: ' + responseBody, global_log);
        } catch (ex) {
            // Maneja cualquier excepción que ocurra durante la llamada
            var message = ex.getMessage();
            gs.error('Error al ejecutar RESTMessage: ' + message, global_log);
        }

        // return JSON.parse(strJSON);
        return responseBody;
    },

    // ==============================================================================================================================

    createExcelFile_logEAN: function(logEAN) {
        logEANtipo = '';
        if (logEAN == 3)
            logEANtipo = 'N0';
        if (logEAN == 4)
            logEANtipo = 'N1';
        if (logEAN == 5)
            logEANtipo = 'N2';
        if (logEAN == 6)
            logEANtipo = 'N3';
        if (logEAN == 7)
            logEANtipo = 'N4';
        if (logEAN == 8)
            logEANtipo = 'N5';
        if (logEAN == 9)
            logEANtipo = 'N6';
        if (logEAN == 10)
            logEANtipo = 'N7';
        if (logEAN == 11)
            logEANtipo = 'N8';
        if (logEAN == 12)
            logEANtipo = 'N9';
        if (logEAN == 13)
            logEANtipo = 'NA';
        if (logEAN == 14)
            logEANtipo = 'NB';
        if (logEAN == 15)
            logEANtipo = 'NC';
        if (logEAN == 16)
            logEANtipo = 'ND';
        if (logEAN == 17)
            logEANtipo = 'NE';
        return logEANtipo;
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

    getDatos_backup: function(sys_id, tipo) {

        global_log = 'getDatos_backup_';

        var tipoLabel = 'Alta',
            logDeTodo = false, // Oculta o Muestra TODOS los 'log'
            logMaterial;

        if (tipo === 'C') {
            tipoLabel = 'Modificación';
        }

        // gs.log( this.getMsgMov() +'Entro a getDatos', global_log);

        var vRitmID = this.getNoRITM_ID(sys_id);

        var uniqueValues = {}; // Usar un objeto para almacenar valores únicos
        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addQuery('u_mdm_task', sys_id);
        gr.query();

        // gs.log( this.getMsgMov() +'Entro a sys_id ' + sys_id, global_log);

        while (gr.next()) {
            var idCarga = gr.getValue('u_idcarga');
            if (idCarga && !uniqueValues[idCarga]) {
                uniqueValues[idCarga] = true;
            }
            gr.u_sap_respuesta = '';
            // gr.u_ritm_relacionado = vRitmID;
            gr.update();
        }

        var unicos = Object.keys(uniqueValues);

        if (logDeTodo) {
            gs.log(this.getMsgMov() + 'Valores únicos: ' + unicos.join(','), global_log);
            gs.log(this.getMsgMov() + 'Cantidad de valores únicos: ' + unicos.length, global_log);
        }


        var resultFinal = []; // Este contendrá todos los resultados finales


        for (var i = 0; i < unicos.length; i++) {

            var idCarga = unicos[i];

            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Procesando idCarga ' + idCarga, global_log);

            var result = {};


            // Unidades Alter ---------------------------------------------------------------------------
            var unidadesAlterData = [];
            gr = new GlideRecord('u_cmdb_mdm_unidadesalter');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                /**
                 * Alta el ID se conforma de   #MaterialAnterior_'A'_SysIDTask
                 */

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;
                logMaterial = xID_CARGA;

                var record = {
                    ID_CARGA: xID_CARGA,
                    MEINH: gr.getValue('u_marm_meinh'),
                    UMREZ: gr.getValue('u_marm_umrez'),
                    UMREN: gr.getValue('u_marm_umren'),
                    EAN11: gr.getValue('u_marm_ean11'),
                    NUMTP: gr.getValue('u_marm_numtp'),
                    LAENG: gr.getValue('u_marm_laeng'),
                    BREIT: gr.getValue('u_marm_breit'),
                    HOEHE: gr.getValue('u_marm_hoehe'),
                    MEABM: gr.getValue('u_marm_meabm'),
                    VOLUM: gr.getValue('u_marm_volum'),
                    VOLEH: gr.getValue('u_marm_voleh'),
                    BRGEW: gr.getValue('u_marm_brgew'),
                    GEWEI: gr.getValue('u_marm_gewei'),
                    ID_EBX: ''
                };
                unidadesAlterData.push(record);

            }
            result.UnidadesAlter = unidadesAlterData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de UnidadesAlter: \n\n' + JSON.stringify(result.UnidadesAlter), global_log);


            // Almacen ---------------------------------------------------------------------------
            var almacenData = [];
            gr = new GlideRecord('u_cmdb_mdm_almacen');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    LGORT: gr.getValue('u_mard_lgort'),
                    WERKS: gr.getValue('u_mard_werks'),
                    ID_EBX: ''
                };
                almacenData.push(record);

            }
            result.Almacen = almacenData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Almacen: \n\n' + JSON.stringify(result.Almacen), global_log);


            // TaxClassif ---------------------------------------------------------------------------
            var taxClassifData = [];
            gr = new GlideRecord('u_cmdb_mdm_taxclassif');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    taxm2: gr.getValue('u_mlan_taxm2'),
                    taxm1: gr.getValue('u_mlan_taxm1'),
                    ID_EBX: ''
                };
                taxClassifData.push(record);

            }
            result.TaxClassif = taxClassifData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de TaxClassif: \n\n' + JSON.stringify(result.TaxClassif), global_log);


            // Ventas ---------------------------------------------------------------------------
            var ventasData = [];
            gr = new GlideRecord('u_cmdb_mdm_ventas');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    PRAT6: gr.getValue('u_mvke_prat6'),
                    RDPRF: gr.getValue('u_mvke_rdprf'),
                    VERSG: gr.getValue('u_mvke_versg'),
                    MVGR1: gr.getValue('u_mvke_mvgr1'),
                    VKORG: gr.getValue('u_mvke_vkorg'),
                    SKTOF: gr.getValue('u_mvke_sktof'),
                    KTGRM: gr.getValue('u_mvke_ktgrm'),
                    MVGR2: gr.getValue('u_mvke_mvgr2'),
                    MTPOS: gr.getValue('u_mvke_mtpos'),
                    MVGR4: gr.getValue('u_mvke_mvgr4'),
                    MVGR3: gr.getValue('u_mvke_mvgr3'),
                    PRODH: gr.getValue('u_mvke_prodh'),
                    VMSTA: gr.getValue('u_mvke_vmsta'),
                    VTWEG: gr.getValue('u_mvke_vtweg'),
                    PRAT2: gr.getValue('u_mvke_prat2'),
                    VMSTD: gr.getValue('u_mvke_vmstd'),
                    MVGR5: gr.getValue('u_mvke_mvgr5'),
                    ID_EBX: ''
                };
                ventasData.push(record);

            }
            result.Ventas = ventasData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Ventas: \n\n' + JSON.stringify(result.Ventas), global_log);


            // Planta ---------------------------------------------------------------------------
            var plantaData = [];
            gr = new GlideRecord('u_cmdb_mdm_planta');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xLADGR = gr.getValue('u_marc_ladgr');

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id

                var record = {
                    ID_CARGA: xID_CARGA,
                    XCHPF: gr.getValue('u_mara_xchpf'),
                    LGFSB: gr.getValue('u_marc_lgfsb'),
                    SHZET: gr.getValue('u_marc_shzet'),
                    LOGGR: gr.getValue('u_marc_loggr'),
                    VSPVB: gr.getValue('u_marc_vspvb'),
                    SCM_STRA1: gr.getValue('u_marc_scm_stra1'),
                    DISGR: gr.getValue('u_marc_disgr'),
                    STRGR: gr.getValue('u_marc_strgr'),
                    MTVFP: gr.getValue('u_marc_mtvfp'),
                    VINT1: gr.getValue('u_marc_vint1'),
                    BSTMI: gr.getValue('u_marc_bstmi'),
                    FHORI: gr.getValue('u_marc_fhori'),
                    VRMOD: gr.getValue('u_marc_vrmod'),
                    ABCIN: gr.getValue('u_marc_abcin'),
                    MINBE: gr.getValue('u_marc_minbe'),
                    KAUTB: gr.getValue('u_marc_kautb'),
                    VINT2: gr.getValue('u_marc_vint2'),
                    QMATV: gr.getValue('u_marc_qmatv'),
                    MABST: gr.getValue('u_marc_mabst'),
                    SERNP: gr.getValue('u_marc_sernp'),
                    PRCTR: gr.getValue('u_marc_prctr'),
                    LADGR: xLADGR ? xLADGR.padStart(4, '0') : '',
                    MAABC: gr.getValue('u_marc_maabc'),
                    WERKS: gr.getValue('u_marc_werks'),
                    MMSTA: gr.getValue('u_marc_mmsta'),
                    EKGRP: gr.getValue('u_marc_ekgrp'),
                    BESKZ: gr.getValue('u_marc_beskz'),
                    DISLS: gr.getValue('u_marc_dislk'),
                    DISMM: gr.getValue('u_marc_dismm'),
                    PLIFZ: gr.getValue('u_marc_plifz'),
                    SOBSL: gr.getValue('u_marc_sobsl'),
                    MMSTD: gr.getValue('u_marc_mmstd'),
                    PERKZ: gr.getValue('u_marc_perkz'),
                    DISPO: gr.getValue('u_marc_dispo'),
                    ID_EBX: ''
                };
                plantaData.push(record);

            }
            result.Planta = plantaData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Planta: \n\n' + JSON.stringify(result.Planta), global_log);


            // Calidad ---------------------------------------------------------------------------
            var calidadData = [];
            gr = new GlideRecord('u_cmdb_mdm_calidad');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    DELE: gr.getValue('u_dele'),
                    ART: gr.getValue('u_qmat_art'),
                    AKTIV: gr.getValue('u_qmat_aktiv'),
                    ID_EBX: ''
                };
                calidadData.push(record);

            }
            result.Calidad = calidadData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Calidad: \n\n' + JSON.stringify(result.Calidad), global_log);


            // Características ---------------------------------------------------------------------------
            var caracteristicasData = [];
            gr = new GlideRecord('u_cmdb_mdm_caracteristicas');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    CLASSNUM: gr.getValue('u_bapi1003_key_classnum'),
                    ATNAM: gr.getValue('u_ausp_atnam'),
                    CLASSTYPE: gr.getValue('u_bapi1003_key_classtype'),
                    ATWRT: gr.getValue('u_ausp_atwrt'),
                    OBTAB: gr.getValue('u_bapi1003_key_obtab'),
                    ALLOC: gr.getValue('u_alloc'),
                    DELETE: gr.getValue('u_delete'),
                    ID_EBX: ''
                };
                caracteristicasData.push(record);

            }
            result.Caracteristicas = caracteristicasData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Caracteristicas: \n\n' + JSON.stringify(result.Caracteristicas), global_log);


            // Valoración ---------------------------------------------------------------------------
            var ValoracionData = [];
            gr = new GlideRecord('u_cmdb_mdm_valoracion');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    BKLAS: gr.getValue('u_mbew_bklas'),
                    VPRSV: gr.getValue('u_mbew_vprsv'),
                    BWTAR: gr.getValue('u_mbew_bwtar'),
                    BWKEY: gr.getValue('u_mbew_bwkey'),
                    ID_EBX: ''
                };
                ValoracionData.push(record);

            }
            result.Valoracion = ValoracionData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de Valoracion: \n\n' + JSON.stringify(result.Valoracion), global_log);


            // u_cmdb_mdm_datos_basicos ---------------------------------------------------------------------------
            var DatosBasicosData = [];
            gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
            gr.addQuery('u_mdm_task', sys_id);
            gr.addQuery('u_idcarga', idCarga);
            gr.query();
            while (gr.next()) {

                var xTRAGR = gr.getValue('u_mara_tragr');

                var xID_CARGA = gr.getValue('u_idcarga');
                if (tipo === 'C')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[1] + '_C_' + sys_id;
                if (tipo === 'A')
                    xID_CARGA = gr.getValue('u_idcarga').split('_')[0] + '_A_' + sys_id;

                var record = {
                    ID_CARGA: xID_CARGA,
                    MAKTX: gr.getValue('u_makt_maktx'),
                    LABOR: gr.getValue('u_mara_labor'),
                    SPRAS: gr.getValue('u_makt_spras'),
                    WHSTC: gr.getValue('u_mara_whstc'),
                    HNDLCODE: gr.getValue('u_mara_hndlcode'),
                    QGRP: gr.getValue('u_mara_qgrp'),
                    MFRNR: gr.getValue('u_mara_mfrnr'),
                    MSTDV: gr.getValue('u_mara_mstdv'),
                    MHDRZ: gr.getValue('u_mara_mhdrz'),
                    SLED_BBD: gr.getValue('u_mara_sled_bbd'),
                    CADKZx: gr.getValue('u_mara_cadkz'),
                    MHDLP: gr.getValue('u_mara_mhdlp'),
                    NRFHG: gr.getValue('u_mara_nrfhg'),
                    MSTAV: gr.getValue('u_mara_mstav'),
                    RDMHD: gr.getValue('u_mara_rdmhd'),
                    MTPOS_MARA: gr.getValue('u_mara_mtpos_mara'),
                    MSTDE: gr.getValue('u_mara_mstde'),
                    EXTWG: gr.getValue('u_mara_extwg'),
                    IPRKZ: gr.getValue('u_mara_iprkz'),
                    MSTAE: gr.getValue('u_mara_mstae'),
                    XCHPF: gr.getValue('u_mara_xchpf'),
                    MBRSH: gr.getValue('u_mara_mbrsh'),
                    PRDHA: gr.getValue('u_mara_prdha'),
                    MATNR: gr.getValue('u_mara_matnr'),
                    BISMT: gr.getValue('u_mara_bismt'),
                    GEWEI: gr.getValue('u_mara_gewei'),
                    NTGEW: gr.getValue('u_mara_ntgew'),
                    TRAGR: xTRAGR ? xTRAGR.padStart(4, '0') : '',
                    MEINS: gr.getValue('u_mara_meins'),
                    MTART: gr.getValue('u_mara_mtart'),
                    MATKL: gr.getValue('u_mara_matkl'),
                    TEMPB: gr.getValue('u_mara_tempb'),
                    SPART: gr.getValue('u_mara_spart'),
                    GROES: gr.getValue('u_mara_groes'),
                    ID_EBX: ''
                };
                DatosBasicosData.push(record);

            }
            result.DatosBasicos = DatosBasicosData;
            if (logDeTodo)
                gs.log(this.getMsgMov() + 'Datos de DatosBasicos: \n\n' + JSON.stringify(result.DatosBasicos), global_log);


            // Agrega el resultado a la lista final
            resultFinal.push(result); // ---------------------------------------------------------------------------
            // gs.log( this.getMsgMov() +'\nMaterial [' + logMaterial + '] \n\n' + JSON.stringify(result) + '\n\n\n', global_log);
        }


        var strJSON = JSON.stringify(resultFinal).replace(/\:null/gi, "\:\"\"");
        // gs.log( this.getMsgMov() +'Envio a S4H: ' + strJSON, global_log);
        // return strJSON;

        var sm = new sn_ws.RESTMessageV2('MDM_Materiales', 'enviar');

        // Establece el cuerpo del mensaje POST
        sm.setRequestBody(strJSON);

        // Configura el tipo de contenido como 'application/json'
        sm.setRequestHeader('Content-Type', 'application/json');

        try {

            // Ejecuta el RESTMessage y obtiene la respuesta
            var response = sm.execute();
            var responseBody = response.getBody();
            var httpStatus = response.getStatusCode();

            new ResultadosAPIs().createResultAPI('MDM Material', sm.getEndpoint(), JSON.stringify(strJSON), responseBody, httpStatus, sys_id, 'MDM Material - ' + tipoLabel);

            // Maneja la respuesta si es necesario
            // gs.log( this.getMsgMov() +'Respuesta HTTP: ' + httpStatus, global_log);
            // gs.log( this.getMsgMov() +'Cuerpo de la respuesta: ' + responseBody, global_log);

        } catch (ex) {
            // Maneja cualquier excepción que ocurra durante la llamada
            var message = ex.getMessage();
            gs.error('Error al ejecutar RESTMessage: ' + message, global_log);
        }

        // return JSON.parse(strJSON);
        return responseBody;
    },

    // ==============================================================================================================================

    getMsgMov: function() {
        var calcularHoraMov;
        calcularHoraMov = '000000' + (global_Movimiento++);
        calcularHoraMov = calcularHoraMov.substring(calcularHoraMov.length - 6, calcularHoraMov.length) + ' ';
        return calcularHoraMov;
    },

    // ==============================================================================================================================

    cerosIzquierda: function(valor, longitud) {
        var str = valor.toString();
        while (str.length < longitud) {
            str = '0' + str;
        }
        return str;
    },

    // ==============================================================================================================================

    getNoRITM_ID: function(sys_id) {
        var result = '';
        var gr01 = new GlideRecord('sc_task');
        gr01.addEncodedQuery('sys_id=' + sys_id);
        gr01.query();
        gr01.next();
        result = gr01.request_item.toString();
        return result;
    },

    // ==============================================================================================================================

    getNoRITM: function(sys_id) {
        var result = '';
        var gr01 = new GlideRecord('sc_task');
        gr01.addEncodedQuery('sys_id=' + sys_id);
        gr01.query();
        gr01.next();
        result = gr01.request_item.getDisplayValue().toString();
        return result;
    },

    // ==============================================================================================================================

    generarIdAleatorio: function() {
        var newRandom = '';
        var charSet = '0123456789';
        for (var i = 0; i < 9; i++) {
            newRandom += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return newRandom;
    },

    // ==============================================================================================================================

    getEmailGrupal: function(varGrupoID) {
        var respUsers = '',
            gr01,
            iCont = 1;
        gr01 = new GlideRecord('sys_user_grmember');
        gr01.addEncodedQuery('group=' + varGrupoID);
        gr01.query();
        while (gr01.next()) {
            respUsers += (iCont == 1) ? '' : ',';
            respUsers += gr01.user.email.toString();
            iCont++;
        }
        // gs.log(respUsers, global_log);
        return respUsers;
    },

    // ==============================================================================================================================

    cerrarTaskRitm: function(sys_id_task) {
        var gr01,
            gr02,
            gr03;

        gr01 = new GlideRecord('sc_task');
        gr01.addEncodedQuery('sys_id=' + sys_id_task);
        gr01.query();
        if (gr01.next()) {
            var ritmTarea = gr01.request_item;

            gr02 = new GlideRecord('sc_req_item');
            gr02.addEncodedQuery('sys_id=' + ritmTarea);
            gr02.query();
            if (gr02.next()) {
                gr02.state = 3; // Closed Complete 
                gr02.u_mdm_resultado = 'Respuesta_Positiva';
                global_Email = this.getEmailGrupal('9b08ff94971b4650cc1ebbdfe153afbc'); // MDM_07_Analista Sr
                gr02.update();
            }

            gr03 = new GlideRecord('sc_task');
            gr03.addEncodedQuery('request_item=' + ritmTarea);
            gr03.query();
            gr03.state = 3; // Closed Complete 
            gr03.updateMultiple();

        }
    },

    // ==============================================================================================================================

    tablasComplementoContador: function(sys_id_task) {
        var respuesta = '',
            gr00,
            sys_id = sys_id_task;

        // Almacen 
        gr00 = new GlideRecord('u_cmdb_mdm_almacen');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_almacen: ' + gr00.getRowCount() + '\n';

        // Calidad 
        gr00 = new GlideRecord('u_cmdb_mdm_calidad');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_calidad: ' + gr00.getRowCount() + '\n';

        // Características
        gr00 = new GlideRecord('u_cmdb_mdm_caracteristicas');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_caracteristicas: ' + gr00.getRowCount() + '\n';

        // Datos Basicos
        gr00 = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_datos_basicos: ' + gr00.getRowCount() + '\n';

        // Planta
        gr00 = new GlideRecord('u_cmdb_mdm_planta');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_planta: ' + gr00.getRowCount() + '\n';

        // TaxClassif 
        gr00 = new GlideRecord('u_cmdb_mdm_taxclassif');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_taxclassif: ' + gr00.getRowCount() + '\n';

        // Unidades Alter 
        gr00 = new GlideRecord('u_cmdb_mdm_unidadesalter');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_unidadesalter: ' + gr00.getRowCount() + '\n';

        // Valoración 
        gr00 = new GlideRecord('u_cmdb_mdm_valoracion');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_valoracion: ' + gr00.getRowCount() + '\n';

        // Ventas 
        gr00 = new GlideRecord('u_cmdb_mdm_ventas');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        respuesta += 'u_cmdb_mdm_ventas: ' + gr00.getRowCount() + '\n';

        return respuesta + '\n';
    },


    // ==============================================================================================================================

    tablasComplementoLimpiar: function(sys_id_MDM, sys_id_task, mtr, mtr_anterior) {
        var respuesta = '',
            gr00,
            sys_id = sys_id_task;

        // Almacen 
        gr00 = new GlideRecord('u_cmdb_mdm_almacen');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_almacen: ' + gr00.getRowCount() + '\n';

        // Calidad 
        gr00 = new GlideRecord('u_cmdb_mdm_calidad');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_calidad: ' + gr00.getRowCount() + '\n';

        // Características
        gr00 = new GlideRecord('u_cmdb_mdm_caracteristicas');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_caracteristicas: ' + gr00.getRowCount() + '\n';

        // Datos Basicos
        gr00 = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_datos_basicos: ' + gr00.getRowCount() + '\n';

        // Planta
        gr00 = new GlideRecord('u_cmdb_mdm_planta');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_planta: ' + gr00.getRowCount() + '\n';

        // TaxClassif 
        gr00 = new GlideRecord('u_cmdb_mdm_taxclassif');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_taxclassif: ' + gr00.getRowCount() + '\n';

        // Unidades Alter 
        gr00 = new GlideRecord('u_cmdb_mdm_unidadesalter');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_unidadesalter: ' + gr00.getRowCount() + '\n';

        // Valoración 
        gr00 = new GlideRecord('u_cmdb_mdm_valoracion');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_valoracion: ' + gr00.getRowCount() + '\n';

        // Ventas 
        gr00 = new GlideRecord('u_cmdb_mdm_ventas');
        gr00.addEncodedQuery('u_mdm_task=' + sys_id);
        gr00.query();
        gr00.deleteMultiple();
        // respuesta += 'u_cmdb_mdm_ventas: ' + gr00.getRowCount() + '\n';

        respuesta += 'Limpieza de tablas complementarias: LISTO\n';

        var vRitmID = this.getNoRITM_ID(sys_id);

        // Datos Basicos -----------------------------------------
        // Nuevo registro
        gr00 = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr00.initialize();
        gr00.u_mdm_task = sys_id;
        gr00.u_idcarga = mtr;
        gr00.u_mara_bismt = mtr_anterior;
        gr00.u_mara_matnr = mtr;
        gr00.u_sap_respuesta = 'En espera de respuesta SAP';
        gr00.u_ritm_relacionado = vRitmID;
        gr00.insert();

        respuesta += 'Nuevo registros.\n';
        respuesta += 'u_cmdb_mdm_datos_basicos: 1\n\n';

        return respuesta + '\n';
    },

    // ==============================================================================================================================

    chunkArray: function(arr, chunkSize) {
        var result = [];
        for (var i = 0; i < arr.length; i += chunkSize) {
            result.push(arr.slice(i, i + chunkSize));
        }
        return result;
    },

    // ==============================================================================================================================

    actualizarBatch: function(numeroBatch, sys_id_task, total) {

        var scTask = new GlideRecord('sc_task');
        scTask.addQuery('sys_id', sys_id_task);
        scTask.query();
        if (scTask.next()) {
            gs.print('Task: ' + sys_id_task);
            gs.print('Buscando ritm: ' + scTask.request_item);

            var actualizar = new GlideRecord('sc_req_item');
            actualizar.addQuery('sys_id', scTask.request_item);
            actualizar.query();

            if (actualizar.next()) {
                actualizar.u_avance_envio_sap = 'Enviando peticion ' + numeroBatch + '/' + total;
                actualizar.update();
            }
        }
    },

    // ==============================================================================================================================

    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate() + 1).padStart(2, '0'); // Agregar 1 porque inicia raro en 0 
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Los meses son 0-11
        const year = d.getFullYear();
        return day + month + year; // Concatenar en formato ddnnyyyy
    },

    // ==============================================================================================================================

    /*
    	Envio SAP S4H
    	Envia modificaciones a SAP - MDM Materiales
    */

    // ==============================================================================================================================























































    // ==============================================================================================================================

    // RESPALDO - PRUEBAS

    // ==============================================================================================================================

    getAllData: function(sys_id) {
        var result = {};
        try {
            //obtener IDS
            // gs.log( this.getMsgMov() +'JSON sys_id: ' + sys_id, 'MDMS4H_Envio');
            var unicos = this.getUniqueIdCargas(sys_id).split(',');

            for (var i = 0; i < unicos.length; i++) {
                idCarga = values[i];

                // Llamar a cada función y almacenar el resultado en el objeto result
                result.UnidadesAlter = JSON.parse(this.getUnidadesAlterData());
                // gs.log( this.getMsgMov() +'JSON UnidadesAlter: ' + JSON.parse(this.getUnidadesAlterData()), 'MDMS4H_Envio');
                result.Almacen = JSON.parse(this.getAlmacenData());
                result.TaxClassif = JSON.parse(this.getTaxClassifData());
                result.Ventas = JSON.parse(this.getVentasData());
                result.Planta = JSON.parse(this.getPlantaData());
                result.Calidad = JSON.parse(this.getCalidadData());
                result.Caracteristicas = JSON.parse(this.getCaracteristicasData());
                result.Valoracion = JSON.parse(this.getValoracionData());
                result.DatosBasicos = JSON.parse(this.getDatosBasicosData());

                //JSON final por ID Carga
                var jsonFinal = JSON.stringify(result);
                // gs.log( this.getMsgMov() +'JSON EnvioS4H: ' + jsonFinal, 'MDMS4H_Envio');
            }

        } catch (e) {
            result.error = 'An error occurred: ' + e.message;
        }
        return 'Procesando';
    },

    // ==============================================================================================================================

    removeEmptyArrays: function(obj) {
        // Si es un array vacío, devuelve undefined para eliminarlo.
        if (Array.isArray(obj) && obj.length === 0) {
            return undefined;
        }
        // Si es un objeto, recorre sus claves.
        if (typeof obj === 'object' && obj !== null) {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const cleanedValue = this.removeEmptyArrays(value); // Limpia el valor.
                // Solo agrega claves que no sean arrays vacíos.
                if (cleanedValue !== undefined) {
                    acc[key] = cleanedValue;
                }
                return acc;
            }, {});
        }
        // Devuelve valores simples tal cual.
        return obj;
    },

    // ==============================================================================================================================

    getUnidadesAlterData: function() {
        var result = {};
        var unidadesAlterData = [];

        // gs.log( this.getMsgMov() +'JSON getUnidadesAlterData entro ', 'MDMS4H_Envio');

        var gr = new GlideRecord('u_cmdb_mdm_unidadesalter');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                NUMTP: gr.getValue('u_marm_numtp'),
                GEWEI: gr.getValue('u_marm_gewei'),
                BREIT: gr.getValue('u_marm_breit'),
                BRGEW: gr.getValue('u_marm_brgew'),
                MEABM: gr.getValue('u_marm_meabm'),
                VOLEH: gr.getValue('u_marm_voleh'),
                VOLUM: gr.getValue('u_marm_volum'),
                HOEHE: gr.getValue('u_marm_hoehe'),
                LAENG: gr.getValue('u_marm_laeng'),
                MEINH: gr.getValue('u_marm_meinh'),
                UMREZ: gr.getValue('u_marm_umrez'),
                ID_CARGA: gr.getValue('u_idcarga'),
                EAN11: gr.getValue('u_marm_ean11'),
                UMREN: gr.getValue('u_marm_umren'),
                ID_EBX: ''
            };
            unidadesAlterData.push(record);
        }

        result.UnidadesAlter = unidadesAlterData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getAlmacenData: function() {
        var result = {};
        var almacenData = [];

        var gr = new GlideRecord('u_cmdb_mdm_almacen');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                ID_CARGA: gr.getValue('u_idcarga'),
                LGORT: gr.getValue('u_mard_lgort'),
                WERKS: gr.getValue('u_mard_werks'),
                ID_EBX: ''
            };
            almacenData.push(record);
        }

        result.Almacen = almacenData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getTaxClassifData: function() {
        var result = {};
        var taxClassifData = [];

        var gr = new GlideRecord('u_cmdb_mdm_taxclassif');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                ID_CARGA: gr.getValue('u_idcarga'),
                taxm2: gr.getValue('u_mlan_taxm2'),
                taxm1: gr.getValue('u_mlan_taxm1'),
                ID_EBX: ''
            };
            taxClassifData.push(record);
        }

        result.TaxClassif = taxClassifData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getVentasData: function() {
        var result = {};
        var ventasData = [];

        var gr = new GlideRecord('u_cmdb_mdm_ventas');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                ID_CARGA: gr.getValue('u_idcarga'),
                PRAT6: gr.getValue('u_mvke_prat6'),
                RDPRF: gr.getValue('u_mvke_rdprf'),
                VERSG: gr.getValue('u_mvke_versg'),
                MVGR1: gr.getValue('u_mvke_mvgr1'),
                VKORG: gr.getValue('u_mvke_vkorg'),
                SKTOF: gr.getValue('u_mvke_sktof'),
                KTGRM: gr.getValue('u_mvke_ktgrm'),
                MVGR2: gr.getValue('u_mvke_mvgr2'),
                MTPOS: gr.getValue('u_mvke_mtpos'),
                MVGR4: gr.getValue('u_mvke_mvgr4'),
                PRODH: gr.getValue('u_mvke_prodh'),
                VMSTA: gr.getValue('u_mvke_vmsta'),
                VTWEG: gr.getValue('u_mvke_vtweg'),
                PRAT2: gr.getValue('u_mvke_prat2'),
                VMSTD: gr.getValue('u_mvke_vmstd'),
                MVGR5: gr.getValue('u_mvke_mvgr5'),
                ID_EBX: ''
            };
            ventasData.push(record);
        }

        result.Ventas = ventasData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getPlantaData: function() {
        var result = {};
        var plantaData = [];

        var gr = new GlideRecord('u_cmdb_mdm_planta');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {

            var xLADGR = gr.getValue('u_marc_ladgr');

            var record = {
                ID_CARGA: gr.getValue('u_idcarga'),
                LGFSB: gr.getValue('u_marc_lgfsb'),
                SHZET: gr.getValue('u_marc_shzet'),
                LOGGR: gr.getValue('u_marc_loggr'),
                A_SC_PR: gr.getValue('u_marc_vspvb'),
                SCM_STRA1: gr.getValue('u_marc_scm_stra1'),
                DISGR: gr.getValue('u_marc_disgr'),
                STRGR: gr.getValue('u_marc_strgr'),
                MTVFP: gr.getValue('u_marc_mtvfp'),
                VINT1: gr.getValue('u_marc_vint1'),
                BSTMI: gr.getValue('u_marc_bstmi'),
                FHORI: gr.getValue('u_marc_fhori'),
                VRMOD: gr.getValue('u_marc_vrmod'),
                ABCIN: gr.getValue('u_marc_abcin'),
                MINBE: gr.getValue('u_marc_minbe'),
                KAUTB: gr.getValue('u_marc_kautb'),
                VINT2: gr.getValue('u_marc_vint2'),
                QMATV: gr.getValue('u_marc_qmatv'),
                MABST: gr.getValue('u_marc_mabst'),
                SERNP: gr.getValue('u_marc_sernp'),
                PRCTR: gr.getValue('u_marc_prctr'),
                LADGR: xLADGR ? xLADGR.padStart(4, '0') : '',
                MAABC: gr.getValue('u_marc_maabc'),
                WERKS: gr.getValue('u_marc_werks'),
                MMSTA: gr.getValue('u_marc_mmsta'),
                EKGRP: gr.getValue('u_marc_ekgrp'),
                BESKZ: gr.getValue('u_marc_beskz'),
                DISLS: gr.getValue('u_marc_dislk'),
                DISMM: gr.getValue('u_marc_dismm'),
                PLIFZ: gr.getValue('u_marc_plifz'),
                SOBSL: gr.getValue('u_marc_sobsl'),
                MMSTD: gr.getValue('u_marc_mmstd'),
                PERKZ: gr.getValue('u_marc_perkz'),
                DISPO: gr.getValue('u_marc_dispo'),
                ID_EBX: ''
            };
            plantaData.push(record);
        }

        result.Planta = plantaData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getCalidadData: function() {
        var result = {};
        var calidadData = [];

        var gr = new GlideRecord('u_cmdb_mdm_calidad');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                DELE: gr.getValue('u_dele'),
                ID_CARGA: gr.getValue('u_idcarga'),
                ART: gr.getValue('u_qmat_art'),
                AKTIV: gr.getValue('u_qmat_aktiv')
            };
            calidadData.push(record);
        }

        result.Calidad = calidadData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getCaracteristicasData: function() {
        var result = {};
        var caracteristicasData = [];

        var gr = new GlideRecord('u_cmdb_mdm_caracteristicas');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                CLASSNUM: gr.getValue('u_bapi1003_key_classnum'),
                ATNAM: gr.getValue('u_ausp_atnam'),
                CLASSTYPE: gr.getValue('u_bapi1003_key_classtype'),
                ATWRT: gr.getValue('u_ausp_atwrt'),
                OBTAB: gr.getValue('u_bapi1003_key_obtab'),
                ALLOC: gr.getValue('u_alloc'),
                DELETE: gr.getValue('u_delete'),
                ID_CARGA: gr.getValue('u_idcarga'),
                ID_EBX: ''
            };
            caracteristicasData.push(record);
        }

        result.Caracteristicas = caracteristicasData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getValoracionData: function() {
        var result = {};
        var ValoracionData = [];

        var gr = new GlideRecord('u_cmdb_mdm_valoracion');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {
            var record = {
                BKLAS: gr.getValue('u_mbew_bklas'),
                VPRSV: gr.getValue('u_mbew_vprsv'),
                BWTAR: gr.getValue('u_mbew_bwtar'),
                BWKEY: gr.getValue('u_mbew_bwkey'),
                ID_CARGA: gr.getValue('u_idcarga'),
                ID_EBX: ''
            };
            ValoracionData.push(record);
        }

        result.Valoracion = ValoracionData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getDatosBasicosData: function() {
        var result = {};
        var DatosBasicosData = [];

        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addQuery('u_mdm_task', sys_id);
        gr.addQuery('u_idcarga', idCarga);
        gr.query();

        while (gr.next()) {

            var xTRAGR = gr.getValue('u_mara_tragr');

            var record = {
                MAKTX: getValue('u_makt_maktx'),
                SPRAS: getValue('u_makt_spras'),
                WHSTC: getValue('u_mara_whstc'),
                HNDLCODE: getValue('u_mara_hndlcode'),
                QGRP: getValue('u_mara_qgrp'),
                MFRNR: getValue('u_mara_mfrnr'),
                MSTDV: getValue('u_mara_mstdv'),
                MHDRZ: getValue('u_mara_mhdrz'),
                SLED_BBD: getValue('u_mara_sled_bbd'),
                CADKZx: getValue('u_mara_cadkz'),
                MHDLP: getValue('u_mara_mhdlp'),
                NRFHG: getValue('u_mara_nrfhg'),
                MSTAV: getValue('u_mara_mstav'),
                RDMHD: getValue('u_mara_rdmhd'),
                MTPOS_MARA: getValue('u_mara_mtpos_mara'),
                MSTDE: getValue('u_mara_mstde'),
                EXTWG: getValue('u_mara_extwg'),
                IPRKZ: getValue('u_mara_iprkz'),
                MSTAE: getValue('u_mara_mstae'),
                XCHPF: getValue('u_mara_xchpf'),
                MBRSH: getValue('u_mara_mbrsh'),
                PRDHA: getValue('u_mara_prdha'),
                MATNR: getValue('u_mara_matnr'),
                BISMT: getValue('u_mara_bismt'),
                GEWEI: getValue('u_mara_gewei'),
                NTGEW: getValue('u_mara_ntgew'),
                TRAGR: xTRAGR ? xTRAGR.padStart(4, '0') : '',
                MEINS: getValue('u_mara_meins'),
                MTART: getValue('u_mara_mtart'),
                MATKL: getValue('u_mara_matkl'),
                TEMPB: getValue('u_mara_tempb'),
                SPART: getValue('u_mara_spart'),
                GROES: getValue('u_mara_groes'),
                ID_CARGA: gr.getValue('u_idcarga'),
                ID_EBX: ''
            };
            DatosBasicosData.push(record);
        }

        result.DatosBasicos = DatosBasicosData;
        return JSON.stringify(result);
    },

    // ==============================================================================================================================

    getUniqueIdCargas: function(sys_id) {
        var uniqueValues = {}; // Usar un objeto para almacenar valores únicos

        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addQuery('u_mdm_task', sys_id);
        gr.query();

        while (gr.next()) {
            var idCarga = gr.getValue('u_idcarga');
            if (idCarga && !uniqueValues[idCarga]) {
                uniqueValues[idCarga] = true;
            }
        }

        return Object.keys(uniqueValues).join(',');
    },

    // ==============================================================================================================================

    type: 'MDM_Rest_Utils'
};