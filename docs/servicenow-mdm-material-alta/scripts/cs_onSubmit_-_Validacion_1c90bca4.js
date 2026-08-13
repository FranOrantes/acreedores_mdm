// Catalog Client Script: onSubmit - Validacion
// sys_id: 1c90bca41b790a10a9f8766dcc4bcbbf
// type: onSubmit

function onSubmit() {
    //Type appropriate comment here, and begin script below

    var varRespuesta = false,
        varVariableSetMsg = '',
        varVariableSetMsgAll = '',
        varVariableSetMsgTemp = '';

    var varValidacionExcel = g_form.getValue('excel_resultado'),
        varContador = g_form.getValue('excel_no_de_registros');

    if (varValidacionExcel == 'Correcto') {

        g_form.setDisplay('archivos_informacion', true);

        // Variables Sets --------------------------------------------------------------------------------------
        var varVariableSet = g_form.getValue('vs_listado_de_registros');

        var count = 0;
        if (varVariableSet != '') {
            var newArray = JSON.parse(varVariableSet);
            count = newArray.length;
        }


        if (varContador != count) {
            g_form.setValue('archivos_resultado', 'Error');
            g_form.setValue('archivos_informacion', 'Los registros mostrados no coinciden con el excel.\nFavor de carcar nuevamente el archivo layout.');
            alert('Error.\nLos registros mostrados no coinciden con el excel.\nFavor de carcar nuevamente el archivo layout.');
            varRespuesta = false;

        } else {

            for (var i = 0; i < count; i++) {
                varVariableSetMsg = '';
                varVariableSetMsgTemp = '';
                varVariableSetMsgTemp += newArray[i].vs_nombre_completo_del_material + ' (' + newArray[i].vs_unidad_del_producto_id_pi + ')\n';
                varVariableSetMsg += (newArray[i].vs_pi_img_01) ? '' : 'PI - Frente\n';
                varVariableSetMsg += (newArray[i].vs_pi_img_02) ? '' : 'PI - Trasera\n';
                varVariableSetMsg += (newArray[i].vs_pi_img_03) ? '' : 'PI - Lateral\n';
                // varVariableSetMsg += (newArray[i].vs_aviso_de_funcionamiento) ? '' : 'Aviso de funcionamiento\n';
                varVariableSetMsg += (newArray[i].vs_carta_de_presentacion_documento) ? '' : 'Carta de presentación/Documento\n';
                varVariableSetMsg += (newArray[i].vs_lista_de_precios) ? '' : 'Lista de precios\n';
                varVariableSetMsg += (newArray[i].vs_marbete_empaque_artes_de_producto) ? '' : 'Marbete/Empaque/Artes de Producto\n';
                varVariableSetMsg += (newArray[i].vs_ficha_tecnica) ? '' : 'Ficha técnica\n';

                varVariableSetMsgAll += (varVariableSetMsg == '') ? '' : varVariableSetMsgTemp + varVariableSetMsg + '\n';
            }

            if (varVariableSetMsgAll != '') {
                g_form.setValue('archivos_resultado', 'Error');
                varVariableSetMsgAll = '\nMateriales con achivos pendientes:\n\n' + varVariableSetMsgAll;
                g_form.setValue('archivos_informacion', varVariableSetMsgAll);
                // alert('Error');
                alert('Favor de cargar los archivos obligatorios en listados en el campo "Archivos Informacion".');
                varRespuesta = false;
            } else {
                g_form.setValue('archivos_resultado', 'Correcto');
                g_form.setValue('archivos_informacion', 'Materiales con todos los archivos obligatorios cargados.');
                // alert('Correcto');
                varRespuesta = true;
            }

        }

    } else {

        var varExcelResultado = g_form.getValue('excel_resultado');
        if (varExcelResultado == '') {
            alert('Favor de cargar layout de materiales.');
        } else {
            alert('Es necesario corregir el archivo excel con respecto a los comentarios del campo "Excel Informacion".');
        }
        varRespuesta = false;
    }

    return varRespuesta;

}