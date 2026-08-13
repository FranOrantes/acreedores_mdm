// Scheduled Job (sysauto_script): MDM Materiales Styrk - No SAP - SUPER API
// sys_id: 87424fb293f9da102f6cb70e1dba1035 | active: true

/*

		TIEMPO APROXIMADO 30 MINUTOS

*/
var logs = "logTaxonomiaDetails";

var urls = [
	"https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D26487&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=first&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?viewPublication=Especificaciones&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true&pageRecordFilter=./ID%3D2000",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D4000&viewPublication=Especificaciones&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true&pageFirstRecordFilter=",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D6000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D8000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D10000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D12000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D14000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D16000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D18000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D20000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D22000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D24000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D26000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D28000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D30000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D32000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D34000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D36000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D38000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D40000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D42000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
    "https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D44000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
	"https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D46000&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
	"https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D28487&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
	"https://laboratorios-mdm.nadro.mx/ebx-dataservices/rest/data-compact/v1/BMateriales_Maestro/Materiales_Maestros/root/Captura_Materiales/CapMat_ComInf?pageRecordFilter=./ID%3D30487&viewPublication=Especificaciones&pageFirstRecordFilter=&pageAction=next&includeLabel=yes&pageSize=2000&includeDetails=true",
];
var logEBXNoSAP = "dataNoSAP";
var gdt = new GlideDateTime(); // Obtén la fecha y hora actual
var hora = gdt.getDisplayValue(); // Devuelve la fecha y hora en formato legible
gs.log("Inicio: " + hora, logEBXNoSAP);

// Ejecutar las URLs de forma secuencial
function processURLsSequentially(index) {
    if (index >= urls.length) {
		gdt = new GlideDateTime();
		hora = gdt.getDisplayValue();
        gs.info("Se completaron todas las URL.");
        gs.log("Fin: " + hora, logEBXNoSAP);
        return; // Finalizar cuando todas las URLs se hayan procesado
    }

    var url = urls[index];
    getData(url, function() {
        processURLsSequentially(index + 1); // Ejecutar la siguiente URL después de que la actual haya terminado
    });
}

// Función modificada para obtener datos y luego ejecutar el siguiente paso
function getData(url, callback) {
    gs.print("Entro a getData")
    // Crear una instancia del mensaje REST
    var restMessage = new sn_ws.RESTMessageV2('MDM_Materiales', 'SuperAPI');
    restMessage.setEndpoint(url);

    // Enviar la solicitud
    var response = restMessage.execute();

    // Obtener la respuesta
    var responseBody = response.getBody();
    var httpStatus = response.getStatusCode();

    // Parsear la respuesta JSON si es necesario
    gs.log("Response body: " + responseBody)
    var responseJSON = JSON.parse(responseBody);
    obtenerSysIDJson(responseJSON);

    // Llamar al callback cuando se haya completado la solicitud actual
    if (callback) callback();
}




function actualizarDetails() {
    var gr = new GlideRecord('u_mdm_materiales_no_sap');
    gr.addEncodedQuery('u_taxonomia_categoria_detailsISNOTEMPTY^ORu_taxonomia_departamento_detailsISNOTEMPTY');
    gr.setLimit(1);
    gr.query();

    while (gr.next()) {
        gs.print('Buscando: ' + gr.u_id);
        obtenerDetails(gr.u_taxonomia_departamento_details, gr, "departamento");
        obtenerDetails(gr.u_taxonomia_categoria_details, gr, "categoria");
        obtenerDetails(gr.u_taxonomia_subcategoria_details, gr, "subcategoria");

    }
}



function obtenerDetails(url, gr, tipo) {
    var restMessage = new sn_ws.RESTMessageV2('MDM_Materiales', 'SuperAPI');
    restMessage.setEndpoint(url);

    // Enviar la solicitud
    var response = restMessage.execute();

    // Obtener la respuesta
    var responseBody = response.getBody();
    var httpStatus = response.getStatusCode();

    gs.print(responseBody);
    // Parsear la respuesta JSON si es necesario
    var responseJSON = JSON.parse(responseBody);

    gs.print("Campos");
    gs.print("ID: " + responseJSON.ID);
    gs.print("Depto_Cat_SuCat: " + responseJSON.Depto_Cat_SuCat);
    gs.print("Nombre: " + responseJSON.Nombre);


    if (tipo === "departamento") {
        gr.u_taxonomia_departamento_details = responseBody;
        gr.u_details_departamento_id = responseJSON.ID;
        gr.u_details_departamento_depto_cat_sucat = responseJSON.Depto_Cat_SuCat;
        gr.u_details_departamento_nombre = responseJSON.Nombre;
        gr.u_details_departamento_padre_key = responseJSON.padre.label;
    } else if (tipo === "categoria") {
        gr.u_taxonomia_categoria_details = responseBody;
        gr.u_details_categoria_id = responseJSON.ID;
        gr.u_details_categoria_depto_cat_sucat = responseJSON.Depto_Cat_SuCat;
        gr.u_details_categoria_nombre = responseJSON.Nombre;
        gr.u_details_categoria_padre_key = responseJSON.padre.label;
    }
    if (tipo === "subcategoria") {
        gr.u_taxonomia_subcategoria_details = responseBody;
        gr.u_details_subcategoria_id = responseJSON.ID;
        gr.u_details_subcategoria_depto_cat_sucat = responseJSON.Depto_Cat_SuCat;
        gr.u_details_subcategoria_nombre = responseJSON.Nombre;
        gr.u_details_subcategoria_padre = responseJSON.padre.label;
    } else {
        gr.log(tipo + " / Tipo no identificado", logs);
        return true;
    }

    gr.update();
}



function obtenerSysIDJson(jsonData) {
    // Verifica si el contenido se leyó correctamente
    var nextPage = jsonData.pagination ? jsonData.pagination.nextPage : null;
    gs.print("Siguiente página: " + nextPage);

    if (jsonData && jsonData.rows) {
        gs.print("JSON: " + JSON.stringify(jsonData))
        for (var i = 0; i < jsonData.rows.length; i++) {
            var record = jsonData.rows[i];

            var gr = new GlideRecord('u_mdm_materiales_no_sap');

            // Busca el registro por la clave 'ID'
            gr.addQuery('u_id', record.ID);
            gr.query();
            var actualiza = false;
            if (gr.next()) {
                // Si el registro existe, actualizarlo
                gs.print("Actualizando registro con ID: " + record.ID);
                actualiza == true;
            } else {
                // Si el registro no existe, inicializar para insertarlo
                gs.print("Insertando nuevo registro con ID: " + record.ID);
                gr.initialize();
                gr.setWorkflow(false);
                gr.u_id = record.ID;
            }

            // Asignar valores a los campos
            if (record && Object.keys(record).length > 0) {
                gr.u_ebx = record.EBX;
                gr.u_ean11 = record.EAN11;
                gr.u_taxonomia_departamento_key = record.TAXONOMIA.DEPARTAMENTO.key || '';
                gr.u_taxonomia_departamento_label = record.TAXONOMIA.DEPARTAMENTO.label || '';
                gr.u_taxonomia_departamento_details = record.TAXONOMIA.DEPARTAMENTO.details || ''; // Nuevo campo 'details'
                gr.u_taxonomia_categoria_key = record.TAXONOMIA.CATEGORIA.key || '';
                gr.u_taxonomia_categoria_label = record.TAXONOMIA.CATEGORIA.label || '';
                gr.u_taxonomia_categoria_details = record.TAXONOMIA.CATEGORIA.details || ''; // Nuevo campo 'details'
                gr.u_taxonomia_sub_categoria_key = record.TAXONOMIA.SUB_CATEGORIA.key || '';
                gr.u_taxonomia_sub_categoria_label = record.TAXONOMIA.SUB_CATEGORIA.label || '';
                gr.u_taxonomia_subcategoria_details = record.TAXONOMIA.SUB_CATEGORIA.details || ''; // Nuevo campo 
                gr.u_descripcion_larga_ebx = record.DESCRIPCION_LARGA_EBX || '';
                gr.u_beneficios_del_producto = record.BENEFICIOS_DEL_PRODUCTO || '';
                gr.u_keywords = record.Keywords || '';
                gr.u_metadescripcion = record.Metadescripcion || '';
                gr.u_indicacion_terapeutica = record.Indicacion_terapeutica || '';
                gr.u_contraindicacion = record.Contraindicacion || '';
                gr.u_leyendas_de_proteccion = record.Leyendas_de_proteccion || '';
                gr.u_prescripcion = record.Prescripcion || '';
                gr.u_advertencias = record.Advertencias || '';
                gr.u_interaccion_medicamentosa = record.Interaccion_medicamentosa || '';
                gr.u_reacciones_adversas = record.Reacciones_adversas || '';
                gr.u_manejo_de_sobredosificacion = record.Manejo_de_sobredosificacion || '';
                gr.u_propiedad_farmaceutica = record.Propiedad_Farmaceutica || '';
                gr.u_dosis = record.Dosis || '';
                gr.u_via_de_administracion = record.Via_de_administracion || '';
                gr.u_clave_cnis = record.Clave_CNIS || '';
                gr.u_embarazo = record.Embarazo || '';
                gr.u_lactancia = record.Lactancia || '';
                gr.u_denominacion_generica = record.Denominacion_Generica || '';
                gr.u_datosbasicos_matnr = record.DatosBasicos.MATNR || '';
                gr.u_datosbasicos_lvorm = record.DatosBasicos.LVORM || '';
                gr.u_mercadotecnia_keywords_com = record.Mercadotecnia.Keywords_Com || '';
                gr.u_mercadotecnia_captionlinkdq = record.Mercadotecnia.CaptionLinkDQ || '';
                gr.u_mercadotecnia_imagen_1 = record.Mercadotecnia.Imagen_1 || '';
                gr.u_mercadotecnia_imagen_2 = record.Mercadotecnia.Imagen_2 || '';
                gr.u_mercadotecnia_imagen_3 = record.Mercadotecnia.Imagen_3 || '';
                gr.u_ersda = record.ERSDA ? new GlideDateTime(record.ERSDA) : null;
                gr.u_laeda = record.LAEDA ? new GlideDateTime(record.LAEDA) : null;
                gr.u_id_vtex = record.ID_VTEX || '';

                // Insertar o actualizar
                //inserta_ActualizaMDMRegistros(record.DatosBasicos.LVORM, record.EAN11, record.EBX);

                gr.update();

            }

        }

        gs.info('Process completed for ' + jsonData.rows.length + ' records.');
    } else {
        gs.error('Failed to parse JSON or no records found.');
    }
}


function inserta_ActualizaMDMRegistros(materialID, ean, nombre) {

    var gr = new GlideRecord('u_mdm_registros');

    // Busca el registro por la clave 'ID'
    gr.addQuery('u_mt_no_materia', materialID);
    gr.query();
    var actualiza = false;

    //Si no existe el material, se crea
    if (!gr.next()) {
        gr = new GlideRecord('u_mdm_registros');
        gr.initialize();
        gr.setWorkflow(false);
        gr.u_mt_no_materia = materialID;
        gr.u_ean11 = ean;
        gr.u_mt_nominacion_generica = nombre;
        gr.insert();
    }
}

// Iniciar la ejecución de las URLs de manera secuencial
processURLsSequentially(0);
