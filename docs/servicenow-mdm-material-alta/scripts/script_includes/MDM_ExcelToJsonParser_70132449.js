// Script Include: MDM_ExcelToJsonParser
// sys_id: 7013244997c4d610cc1ebbdfe153af23 | activo: true | updated: 24-02-2026 14:52:46
// description: MDM

// ------------------------------------------
var vLog = 'excel_010',
    numMov = 4;
// ------------------------------------------



var MDM_ExcelToJsonParser = Class.create();
MDM_ExcelToJsonParser.prototype = {

    // ----------------------------------------------------------------------------------------------------

    initialize: function() {},

    // ----------------------------------------------------------------------------------------------------

    parseExcel_JJ: function(attachmentSysId, taskSysId, taskNumber, esAlta) {
        var jsonResult = {},
            allLogResumen = false,
            allLogTitulos = false,
            allLogReg = false,
            hojaHeaders,
            hojaHeadersNum,
            hojaHeadersFila,
            hojaTabla,
            hojaReg,
            row,
            i = 0,
            iCelda = 0,
            indixeRow,
            tempHoja,
            tempMsg,
            tempCampo,
            tempValor,
            tempValido,
            record_sys_id,
            horaInicio = new GlideDateTime(),
            msgFinal = '',
            msgFinalReturn = '';

        vLog = taskNumber + '_' + vLog;

        // En los campos agregamos un campo al inicio vacio para que cuadre con la ubiciacion del excel [inicia en 1]
        // El orden debe cuadran con el nuemero de la fila [1] del excel

        var jsonHojas = {
            DatosBasicos: {
                'tabla': 'u_cmdb_mdm_datos_basicos',
                'campos': ['xVaciox', 'u_idcarga', 'u_mara_bismt', 'u_mara_matnr', 'u_mara_mtart', 'u_mara_mbrsh', 'u_mara_matkl', 'u_mara_meins', 'u_mara_groes', 'u_mara_ntgew', 'u_mara_gewei', 'u_mara_tempb', 'u_mara_tragr', 'u_mara_spart', 'u_mara_cadkz', 'u_mara_prdha', 'u_mara_xchpf', 'u_mara_extwg', 'u_mara_mstae', 'u_mara_mstav', 'u_mara_mstde', 'u_mara_mstdv', 'u_mara_mhdrz', 'u_mara_mhdlp', 'u_mara_nrfhg', 'u_mara_mfrnr', 'u_mara_iprkz', 'u_mara_rdmhd', 'u_mara_mtpos_mara', 'u_mara_sled_bbd', 'u_mara_whstc', 'u_mara_hndlcode', 'u_mara_qgrp', 'u_makt_spras', 'u_makt_maktx', 'u_mara_labor']
            },
            UnidadesAlter: {
                'tabla': 'u_cmdb_mdm_unidadesalter',
                'campos': ['xVaciox', 'u_idcarga', 'u_marm_meinh', 'u_marm_umrez', 'u_marm_umren', 'u_marm_ean11', 'u_marm_numtp', 'u_marm_laeng', 'u_marm_breit', 'u_marm_hoehe', 'u_marm_meabm', 'u_marm_volum', 'u_marm_voleh', 'u_marm_brgew', 'u_marm_gewei']
            },
            TaxClassif: {
                'tabla': 'u_cmdb_mdm_taxclassif',
                'campos': ['xVaciox', 'u_idcarga', 'u_mlan_taxm1', 'u_mlan_taxm2']
            },
            Planta: {
                'tabla': 'u_cmdb_mdm_planta',
                'campos': ['xVaciox', 'u_idcarga', 'u_marc_werks', 'u_marc_mmsta', 'u_marc_mmstd', 'u_marc_maabc', 'u_marc_ekgrp', 'u_marc_dismm', 'u_marc_dispo', 'u_marc_plifz', 'u_marc_perkz', 'u_marc_dislk', 'u_marc_beskz', 'u_marc_sobsl', 'u_marc_minbe', 'u_marc_bstmi', 'u_marc_mabst', 'u_marc_fhori', 'u_marc_ladgr', 'u_marc_mtvfp', 'u_marc_kautb', 'u_marc_prctr', 'u_marc_vrmod', 'u_marc_vint1', 'u_marc_vint2', 'u_marc_disgr', 'u_marc_qmatv', 'u_marc_abcin', 'u_marc_sernp', 'u_marc_strgr', 'u_marc_lgfsb', 'u_marc_shzet', 'u_marc_loggr', 'u_marc_vspvb', 'u_marc_scm_stra1', 'u_mara_xchpf']
            },
            Almacen: {
                'tabla': 'u_cmdb_mdm_almacen',
                'campos': ['xVaciox', 'u_idcarga', 'u_mard_werks', 'u_mard_lgort']
            },
            Valoracion: {
                'tabla': 'u_cmdb_mdm_valoracion',
                'campos': ['xVaciox', 'u_idcarga', 'u_mbew_bwkey', 'u_mbew_bwtar', 'u_mbew_vprsv', 'u_mbew_bklas']
            },
            Ventas: {
                'tabla': 'u_cmdb_mdm_ventas',
                'campos': ['xVaciox', 'u_idcarga', 'u_mvke_vkorg', 'u_mvke_vtweg', 'u_mvke_versg', 'u_mvke_sktof', 'u_mvke_vmsta', 'u_mvke_vmstd', 'u_mvke_mtpos', 'u_mvke_prodh', 'u_mvke_ktgrm', 'u_mvke_mvgr1', 'u_mvke_mvgr2', 'u_mvke_mvgr4', 'u_mvke_mvgr5', 'u_mvke_prat2', 'u_mvke_prat6', 'u_mvke_rdprf', 'u_mvke_mvgr3']
            },
            Caracteristicas: {
                'tabla': 'u_cmdb_mdm_caracteristicas',
                'campos': ['xVaciox', 'u_idcarga', 'u_bapi1003_key_obtab', 'u_bapi1003_key_classtype', 'u_bapi1003_key_classnum', 'u_alloc', 'u_ausp_atnam', 'u_ausp_atwrt', 'u_delete']
            },
            Calidad: {
                'tabla': 'u_cmdb_mdm_calidad',
                'campos': ['xVaciox', 'u_idcarga', 'u_qmat_art', 'u_qmat_aktiv', 'u_dele']
            }
        };

        try {
            gs.log('00001 Inicio del proceso attachment: ' + attachmentSysId, vLog);

            // Descargar el archivo adjunto
            var attachment = new GlideSysAttachment();
            var attachmentStream = attachment.getContentStream(attachmentSysId);
            if (!attachmentStream) {
                gs.log('00002 No se pudo recuperar el archivo adjunto.', vLog);
                return '{}'; // Retorna un JSON vacío si no se pudo recuperar el archivo
            }
            gs.log('00002 Archivo adjunto recuperado con éxito.', vLog);

            var parser = new sn_impex.GlideExcelParser();
            parser.setSource(attachmentStream);

            // Obtener los nombres de las hojas
            var sheetNames = parser.getSheetNames();
            if (allLogResumen)
                gs.log('00003 Nombres de las hojas: ' + sheetNames.join(', '), vLog);

            // Procesar cada hoja del archivo
            sheetNames.forEach(function(sheetName) {
                if (allLogResumen)
                    gs.log(this.jjGet00Mov(numMov++) + ' ' + sheetName + ' ****************************************', vLog);
                indixeRow = 1;

                parser.setSheetName(sheetName);
                if (parser.parse()) {



                    hojaReg = 0;
                    hojaTabla = jsonHojas[sheetName].tabla;
                    hojaHeaders = jsonHojas[sheetName].campos;
                    hojaHeadersNum = hojaHeaders.length - 1;
                    /*
                    Obtener los encabezados (nombres de las columnas)
                    IMPORTANTE: Porque si mueves las columnas el orde del recorrido del excel conserva el numero de columna anterior
                    */
                    hojaHeadersFila = parser.getColumnHeaders();

                    tempHoja = sheetName + '\n';
                    tempHoja += 'Table: ' + hojaTabla + '\n';
                    tempHoja += 'Campos numero: ' + hojaHeadersNum + '\n';
                    tempHoja += 'Campos nombres: ' + hojaHeaders + '\n';
                    if (allLogTitulos)
                        gs.log(this.jjGet00Mov(numMov++) + ' ' + tempHoja, vLog);

                    // Iterar por cada fila del Excel
                    while (parser.next()) {

                        // Obtener el objeto de la fila actual
                        row = parser.getRow();

                        // Empezar despes de la fila 5
                        if (indixeRow >= 4) {

                            // if (sheetName == 'DatosBasicos') { // Solo una hoja <-------------------------

                            // RECORD --- 01
                            var record = new GlideRecord(hojaTabla);
                            record.initialize();

                            tempMsg = '';
                            tempValido = true;
                            for (i = 0; i < hojaHeadersNum; i++) {

                                iCelda = parseInt(hojaHeadersFila[i]);

                                tempCampo = hojaHeaders[iCelda];
                                tempValor = row[iCelda];
                                if (i == 1 && tempValor == null) {
                                    tempValido = false;
                                    break;
                                }
                                if (tempValor != null) {
                                    tempMsg += (tempMsg == '') ? '[cel]\n' : '\n';
                                    tempMsg += '[' + iCelda + '] ' + tempCampo + '=' + tempValor;

                                    // RECORD --- 02
                                    record.setValue(tempCampo, tempValor);
                                }
                            }
                            if (tempValido) {

                                // RECORD --- 03
                                record.u_mdm_task = taskSysId;
                                // record.u_tipo_de_movimiento = (esAlta)? 'Alta' : 'Cambio';
                                record_sys_id = record.insert();

                                hojaReg++;
                                tempMsg += '\n';
                                tempMsg += 'u_mdm_task' + '=' + taskSysId;
                                if (allLogReg)
                                    gs.log(this.jjGet00Mov(numMov++) + ' \n ' + tempMsg + ' \n\nID: ' + record_sys_id + '\n\n', vLog);
                            }

                            // } // Solo una hoja <-------------------------

                        }
                        indixeRow++;
                    }
                    if (allLogResumen)
                        gs.log(this.jjGet00Mov(numMov++) + sheetName + ' registros: ' + hojaReg, vLog)
                    msgFinal += hojaTabla + ': ' + hojaReg + '\n';
                }
            });
        } catch (e) {
            return 'Error al procesar el archivo: ' + e.message;
        }

        // Tempo total de ejecucion
        msgFinalReturn = jjTiempoTotal(horaInicio, msgFinal)
        gs.log('99999\n\nNUEVOS_REGISTROS' + msgFinalReturn, vLog);

        return 'Listo ' + msgFinalReturn;
    },

    // ----------------------------------------------------------------------------------------------------

    cleanDataByTask: function(taskSysId, taskNumber) {
        var tables = [
                'u_cmdb_mdm_datos_basicos',
                'u_cmdb_mdm_unidadesalter',
                'u_cmdb_mdm_taxclassif',
                'u_cmdb_mdm_planta',
                'u_cmdb_mdm_almacen',
                'u_cmdb_mdm_valoracion',
                'u_cmdb_mdm_ventas',
                'u_cmdb_mdm_caracteristicas',
                'u_cmdb_mdm_calidad'
            ],
            msgClean = '\n',
			vLogClean = taskNumber + '_' + vLog;

        

        tables.forEach(function(tableName) {
            var gr = new GlideRecord(tableName);
            gr.addQuery('u_mdm_task', taskSysId);
            gr.query();
            var iconta = gr.getRowCount();
            gr.deleteMultiple(); //  Elimina todos los registros en un solo paso
            msgClean += '\n' + tableName + ': ' + iconta ;
        });
        gs.log('00000\n\nELIMINADOS\n\nQuery\nu_mdm_task=' + taskSysId + '' + msgClean + '\n\n\nINICIO\n\n', vLogClean);
    },

    // ----------------------------------------------------------------------------------------------------














































    doInsert: function(tabla, jsonData, taskid, esAlta) {
        var logs = "logXLSX2_insert_" + taskid;
        var tipoMov = "_A"; // ----------------  NADA

        try {
            var table = jsonData.table;
            var material, // ----------------  NADA
                noMaterialAnt; // ----------------  NADA

            var fieldMappings = {
                "u_mard_werks": "u_mard_weks"
            };

            var record = new GlideRecord(tabla);
            record.initialize();

            record.u_mdm_task = taskid;

            if (esAlta) {
                record.u_tipo_de_movimiento = "Alta"; // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX DUDA ???
            } else {
                tipoMov = "_C"; // ----------------  NADA
                record.u_tipo_de_movimiento = "Cambio";
            }

            /*
			if (tabla.indexOf('mdm_datos_basico') > -1) {
				//gs.log("esAlta: " + esAlta + "  doInsert tabla: " + tabla + " jsonData: " + JSON.stringify(jsonData) + " taskid: " + taskid, logs);
				/*if(esAlta){
				record.u_tipo_de_movimiento="Alta";
				}else{
				record.u_tipo_de_movimiento="Cambio";
				}*
			}*/


            // Asignar valores a los campos del registro
            var boolActualiza = false, // ----------------  NADA
                idAnterior = 0, // ----------------  NADA
                tipoMaterial; // ----------------  NADA

            for (var i = 0; i < jsonData.length; i++) {
                var data = jsonData[i];
                var fieldName;




                if (data.campo === 'BISMT' || data.campo === 'MATNR') { // =======================  Completar name del campo (Hoja DatosBasicos)
                    if (data.campo === "BISMT" && data.valor !== "") {
                        noMaterialAnt = true; // ----------------  NADA
                    } else if (data.campo === "MATNR" && data.valor !== "") {
                        material = true; // ----------------  NADA
                    }
                    fieldName = 'u_mara_' + data.campo;
                } else if (data.campo === 'MEINH') { // =======================  Cambiar name del campo (Hoja UnidadesAlter)
                    fieldName = 'u_marm_meinh';
                    tipoMaterial = data.valor; // ----------------  NADA
                } else if (data.campo === 'ID_CARGA') { // =======================  Cambiar todos los campos "u_id_carga" por "u_idcarga"
                    fieldName = 'u_idcarga';
                    if (tabla.indexOf('unidadesalter') > -1) {
                        //gs.log("unidadesalter ID_CARGA: " + data.valor, logs);// ----------------  NADA
                    }
                    if (idAnterior != data.valor) {
                        idAnterior = data.valor; // ----------------  NADA
                        boolActualiza = false; // ----------------  NADA
                    }
                } else {
                    var tb = 'u_' + data.tabla;
                    if (tb === "u__") {
                        tb = "u";
                    }
                    fieldName = tb + "_" + data.campo; // =======================  Correcion en name del campo
                }
                fieldName = fieldName.toLowerCase(); // =======================  Minusculas en name del campo 



                if (tabla.indexOf('caract') > -1) {
                    if (fieldName == "u__alloc") fieldName = "u_alloc"; // =======================  Cambiar name del campo (Hoja Caracteristicas)
                    if (fieldName == "u_ausp_delete") fieldName = "u_delete"; // =======================  Cambiar name del campo (Hoja Caracteristicas)
                } else if (tabla.indexOf('calidad') > -1) {
                    if (fieldName == "u__dele") fieldName = "u_dele"; // =======================  Cambiar name del campo (Hoja Calidad)
                } else if (tabla.indexOf('valoracion') > -1) {
                    //gs.log(fieldName + "/" + data.valor, logs);
                } else if (tabla.indexOf('venta') > -1) {
                    if (fieldName == "u_mcm_task") fieldName = "u_dele"; // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX No lo encontre 
                }

                if (tabla.indexOf('planta') > -1 && fieldName.indexOf('u_marc_disls') > -1) {
                    if (fieldName == "u_marc_disls") fieldName = "u_marc_dislk"; // =======================  Cambiar name del campo (Hoja Planta)
                }

                if (fieldName.indexOf("idcarga") > -1) {
                    //gs.log(tabla+"_"+taskid+"_ID_CARGA: " + data.valor, logs+"_idCarga");
                }

                record.setValue(fieldName, data.valor);
                //gs.log(tabla + " => " + fieldName.toLowerCase() + "/" + data.valor,logs);
            }

            var sys_id = record.insert();
            gs.info("Registro insertado correctamente. sys_id: " + sys_id, logs);

        } catch (e) {
            gs.error("Error al procesar el registro: " + e.message, logs);
        }
    },

    parseExcel: function(attachmentSysId) {
        var jsonResult = {};
        try {
            gs.info('Inicio del proceso para el Sys_id del attachment: ' + attachmentSysId);

            // Descargar el archivo adjunto
            var attachment = new GlideSysAttachment();
            var attachmentStream = attachment.getContentStream(attachmentSysId);

            if (!attachmentStream) {
                gs.info('No se pudo recuperar el archivo adjunto.');
                return '{}'; // Retorna un JSON vacío si no se pudo recuperar el archivo
            }

            gs.info('Archivo adjunto recuperado con éxito.');

            // Crear una instancia de GlideExcelParser
            var parser = new sn_impex.GlideExcelParser();
            parser.setSource(attachmentStream);

            // Obtener los nombres de las hojas
            var sheetNames = parser.getSheetNames();
            gs.info('Nombres de las hojas: ' + sheetNames.join(', '));

            // Procesar cada hoja del archivo
            sheetNames.forEach(function(sheetName) {
                gs.info('**************************************************************************************');
                gs.info('Nombre de la hoja: ' + sheetName);

                parser.setSheetName(sheetName);

                if (parser.parse()) {
                    var headers = parser.getColumnHeaders();
                    if (headers.length === 0) {
                        gs.info('No se encontraron encabezados en la hoja: ' + sheetName);
                        jsonResult[sheetName] = []; // Hacer una entrada vacía para la hoja
                        return;
                    }

                    var headersArray = headers.map(function(header) {
                        return header;
                    });

                    // Obtener los valores de las filas 2, 3, 4 y 5
                    var tableValues = {}; // Valores de la fila 2
                    var fieldValues = {}; // Valores de la fila 3
                    var labelValues = {}; // Valores de la fila 4

                    // Leer la fila 2 para obtener los valores de tabla
                    parser.setRowIndex(2);
                    if (parser.next()) {
                        var tableRowData = parser.getRow();
                        headersArray.forEach(function(header) {
                            tableValues[header] = tableRowData[header] || '';
                        });
                    } else {
                        gs.info('Fila 2 vacía en la hoja: ' + sheetName);
                    }

                    // Leer la fila 3 para obtener los valores de campo
                    parser.setRowIndex(3);
                    if (parser.next()) {
                        var fieldRowData = parser.getRow();
                        headersArray.forEach(function(header) {
                            fieldValues[header] = fieldRowData[header] || '';
                        });
                    } else {
                        gs.info('Fila 3 vacía en la hoja: ' + sheetName);
                    }

                    // Leer la fila 4 para obtener los valores de label
                    parser.setRowIndex(4);
                    if (parser.next()) {
                        var labelRowData = parser.getRow();
                        headersArray.forEach(function(header) {
                            labelValues[header] = labelRowData[header] || '';
                        });
                    } else {
                        gs.info('Fila 4 vacía en la hoja: ' + sheetName);
                    }

                    var sheetData = [];
                    var dataRowIndex = 5; // Comenzar desde la fila 6 para los datos

                    // Procesar datos de las filas siguientes
                    parser.setRowIndex(dataRowIndex);
                    /*while (parser.next()) {
                        var row = parser.getRow();
                        var rowData = [];

                        var isValidRow = false; // Para verificar si la fila es válida

                        headersArray.forEach(function(header, index) {
                            var cellValue = row[header] || ''; // Manejar valores nulos

                            // Crear un objeto con los datos de la celda
                            var dataObj = {
                                idColumna: (index + 1).toString(), // ID de columna dinámico
                                tabla: tableValues[header], // Valor de la celda en la fila 2
                                campo: fieldValues[header], // Valor de la celda en la fila 3
                                label: labelValues[header], // Valor de la celda en la fila 4
                                valor: cellValue // Valor de la celda actual en la fila actual
                            };

                            // Comprobar si la fila es válida
                            if (dataObj.tabla.trim() !== '' || dataObj.campo.trim() !== '' || dataObj.label.trim() !== '') {
                                isValidRow = true; // Marcar la fila como válida si alguno de estos campos tiene valor
                            }

                            rowData.push(dataObj);
                        });

                        // Agregar solo si la fila es válida
                        if (isValidRow) {
                            sheetData.push(rowData);
                        }

                        dataRowIndex++;
                        parser.setRowIndex(dataRowIndex);
                    }*/
                    while (parser.next()) {
                        var row = parser.getRow();
                        var rowData = [];
                        var isValidRow = false; // Para verificar si la fila es válida

                        headersArray.forEach(function(header, index) {
                            var cellValue = row[header]; // Eliminar el `|| ''` para detectar valores vacíos

                            // Crear un objeto con los datos de la celda
                            var dataObj = {
                                idColumna: (index + 1).toString(),
                                tabla: tableValues[header] || "",
                                campo: fieldValues[header] || "",
                                label: labelValues[header] || "",
                                valor: cellValue // No se agrega el valor vacío por defecto
                            };

                            // Comprobar si la celda es válida (evitar celdas vacías)
                            var hasData = cellValue !== undefined && cellValue !== null && cellValue !== '';

                            if (
                                (dataObj.tabla.trim() !== '' ||
                                    dataObj.campo.trim() !== '' ||
                                    dataObj.label.trim() !== '') &&
                                hasData
                            ) {
                                rowData.push(dataObj); // Solo agregar datos no vacíos
                                isValidRow = true; // Marcar la fila como válida si tiene algún dato relevante
                            }
                        });

                        // Agregar solo si la fila es válida
                        if (isValidRow) {
                            sheetData.push(rowData);
                        }

                        // Avanzar al siguiente índice de fila en el parser
                        parser.setRowIndex(++dataRowIndex);
                    }


                    // Agregar la hoja y sus datos al resultado final
                    jsonResult[sheetName] = sheetData.length > 0 ? sheetData : []; // Asegurarse de que no esté vacío
                } else {
                    gs.info('Error al procesar la hoja: ' + parser.getErrorMessage());
                    jsonResult[sheetName] = []; // Hacer una entrada vacía para la hoja en caso de error
                }
            });

        } catch (e) {
            gs.error('Error al procesar el archivo: ' + e.message);
            return '{}'; // Devolver un JSON vacío en caso de error
        }

        //gs.log("Json LECTURA: " + JSON.stringify(jsonResult), 'jsonLecturaXLSX');
        // Retornar el JSON resultante como una cadena
        return JSON.stringify(jsonResult);
    },
























    // No entinedo para que ¿?

    doUpdateEAN: function(taskSysId) {
        // Lista de tablas
        var tables = [
            'u_cmdb_mdm_unidadesalter',
            'u_cmdb_mdm_calidad',
            'u_cmdb_mdm_caracteristicas',
            'u_cmdb_mdm_ventas',
            'u_cmdb_mdm_planta',
            'u_cmdb_mdm_almacen',
            'u_cmdb_mdm_valoracion',
            'u_cmdb_mdm_taxclassif'
        ];

        var MaterialIDCambio = 0;

        // Obtener EAN solo una vez
        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addQuery('u_mdm_task', taskSysId);
        gr.query();

        var updates = [];

        while (gr.next()) {
            var nuevoID = gr.u_mara_bismt; // No. Anterior
            var numeroAnterior = gr.u_mara_matnr;
            var finalUpdate = numeroAnterior || nuevoID;
            var newIdCarga = finalUpdate + "_" + gr.u_id_carga_temporal;

            // Guardar la actualización en memoria
            updates.push({
                idCarga: gr.u_id_carga_temporal,
                idCargaTemporal: gr.u_id_carga_temporal
            });
        }

        // Si no hay registros, salir
        if (updates.length === 0) {
            gs.info("No hay registros para actualizar en u_cmdb_mdm_datos_basicos.");
            return;
        }

        // Recorre cada tabla y actualiza registros
        tables.forEach(function(tableName) {
            var grr = new GlideRecord(tableName);
            grr.addQuery('u_mdm_task', taskSysId);
            grr.addQuery('u_idcarga', 'IN', updates.map(u => u.idCargaTemporal));
            grr.query();

            if (grr.next()) {
                do {
                    var matchingUpdate = updates.find(u => u.idCargaTemporal == grr.u_idcarga);
                    if (matchingUpdate) {
                        grr.setValue('u_idcarga', matchingUpdate.idCarga);
                    }
                } while (grr.next());

                grr.updateMultiple(); // Actualiza todos los registros de una vez
                gs.info('Registros actualizados en la tabla ' + tableName + ' para u_mdm_task: ' + taskSysId);
            }
        });
    },
    doUpdateEAN_old: function(taskSysId) {
        // Lista de tablas
        var tables = [
            'u_cmdb_mdm_unidadesalter',
            'u_cmdb_mdm_calidad',
            'u_cmdb_mdm_caracteristicas',
            'u_cmdb_mdm_ventas',
            'u_cmdb_mdm_planta',
            'u_cmdb_mdm_almacen',
            'u_cmdb_mdm_valoracion',
            'u_cmdb_mdm_taxclassif'
        ];

        var MaterialIDCambio = 0;
        //Obtener EAN
        var gr = new GlideRecord('u_cmdb_mdm_datos_basicos');
        gr.addQuery('u_mdm_task', taskSysId);
        gr.query();
        while (gr.next()) {

            //obtener cada uno de los registros ean
            var ean = gr.u_idcarga;
            MaterialIDCambio = gr.u_mara_matnr;
            //gs.log("Buscando ean... " + ean, "FieldsEAN")
            // Recorre cada tabla y elimina registros
            tables.forEach(function(tableName) {
                var agg = new GlideAggregate(tableName);
                agg.addQuery('u_mdm_task', taskSysId);
                agg.addQuery('u_idcarga', gr.u_id_carga_temporal);
                agg.addAggregate('COUNT');
                agg.query();

                if (agg.next() && agg.getAggregate('COUNT') > 0) {
                    var grr = new GlideRecord(tableName);
                    grr.addQuery('u_mdm_task', taskSysId);
                    grr.addQuery('u_idcarga', gr.u_id_carga_temporal);
                    grr.query();
                    if (grr.next()) {
                        grr.setValue('u_idcarga', ean);
                        grr.updateMultiple();
                    }
                }
                gs.info('Registros eliminados en la tabla ' + tableName + ' para u_mdm_task: ' + taskSysId);
            });
        }
    },



    type: 'MDM_ExcelToJsonParser'
};








// ------------------------------------------------------------------------------------------------------------
// Contador auto incremental para mensajes
function jjGet00Mov(vNum) {
    var calculoMov;
    calculoMov = '000000' + (vNum);
    calculoMov = calculoMov.substring(calculoMov.length - 5, calculoMov.length) + ' ';
    return calculoMov;
}
// ------------------------------------------------------------------------------------------------------------
// Calculo tiempo total de ejecucion de codigo
function jjTiempoTotal(vFecha1, vMsg) {
    var vFecha2 = new GlideDateTime(); // Obtener fecha final
    var date1 = new GlideDateTime(vFecha1).getNumericValue(); // Convertir a milisegundos
    var date2 = new GlideDateTime(vFecha2).getNumericValue(); // Convertir a milisegundos
    var diffMillis = date2 - date1; // Calcular la diferencia en milisegundos
    var msgTemp = '\n\n';
    msgTemp += vFecha1 + ' \n';
    msgTemp += vFecha2 + ' \n';
    msgTemp += 'Tiempo de proceso = ' + jjConvertMillisToTime(diffMillis) + '\n\n';
    msgTemp += vMsg + ' \n\n';
    msgTemp += 'FIN \n\n';
    return msgTemp;
}
// ------------------------------------------------------------------------------------------------------------
// Calculo de minutos
function jjConvertMillisToTime(millis) {
    var hours = Math.floor(millis / (1000 * 60 * 60)); // Calcular horas, minutos y segundos
    var minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((millis % (1000 * 60)) / 1000);
    hours = hours.toString().padStart(2, '0'); // Agregar ceros iniciales si es necesario (para formato HH:mm:ss)
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');
    return hours + ':' + minutes + ':' + seconds; // Devolver el formato HH:mm:ss
}
// ------------------------------------------------------------------------------------------------------------