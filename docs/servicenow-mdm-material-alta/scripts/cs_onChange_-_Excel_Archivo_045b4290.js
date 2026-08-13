// Catalog Client Script: onChange - Excel Archivo
// sys_id: 045b42901b298610a9f8766dcc4bcb9e
// type: onChange

function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue == '') {
        return;
    }
    g_form.setValue('excel_id_random', '');
    g_form.setValue('excel_resultado', '');
    g_form.setValue('excel_informacion', '');	
    g_form.setValue('excel_no_de_registros', '');
    // alert(g_form.getValue('vs_listado_de_registros'));
    g_form.setValue('vs_listado_de_registros', '');
    g_form.setValue('archivos_informacion', '');
	g_form.setVisible('archivos_informacion',false); 

    var numRandom = crearRandom();

    var gr = new GlideAjax('jj_MDM_Utils_Client');
    gr.addParam('sysparm_name', 'lecturaExcel');
	gr.addParam('sysparm_vUser', g_user.userID);
	gr.addParam('sysparm_vTipoSolicitud', 'Alta');
    gr.addParam('sysparm_sysid', newValue); // ID del temporal archivo
    gr.addParam('sysparm_numRandom', numRandom);
    gr.getXML(response_archivo);

    function response_archivo(response) {
        var answer = response.responseXML.documentElement.getAttribute('answer');
		// alert(answer); 
		console.log(answer);

        var strArray = answer.toString().split('zzRespUestazz');
        g_form.setValue('excel_resultado', strArray[0]);

        if (strArray[1] == 'NoEsExcel') {
            alert('Error con el archivo Actual. \nFavor de subir un archivo con extencion ".XLSX"');
            g_form.setValue('excel_informacion', 'Archivo invalido.');
        } else {
            g_form.setValue('excel_id_random', numRandom);
            g_form.setValue('excel_informacion', strArray[1]);
            g_form.setValue('excel_no_de_registros', strArray[3]);

            // console.log(strArray[2]); // Texto
            if (strArray[2] != '') {
                var objVariableSets = JSON.parse(strArray[2]);
                // console.log(obj02); // Objet	
                g_form.setValue('vs_listado_de_registros', JSON.stringify(objVariableSets)); // Llenar Varible Sets
            } else {
                g_form.setValue('vs_listado_de_registros', '');
            }

        }
    }






    function crearRandom() {
        var newRandom = '';
        var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 12; i++) {
            newRandom += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return newRandom;
    }

}