// Script Include: MDM_Attachment_EQVIA
// sys_id: f68687bf1b905e10a9f8766dcc4bcbf4 | activo: true | updated: 04-02-2026 14:37:47
// description: MDM

var MDM_Attachment_EQVIA = Class.create();
MDM_Attachment_EQVIA.prototype = {
    initialize: function() {
    },
processExcelFile: function(id, msgLog) {
    var attachmentSysId = id;
	 var jsonResult = {};
        try {
            gs.log('Inicio del proceso para el Sys_id del attachment: ' + attachmentSysId,msgLog);

            // Descargar el archivo adjunto
            var attachment = new GlideSysAttachment();
            var attachmentStream = attachment.getContentStream(attachmentSysId);

            if (!attachmentStream) {
                gs.log('No se pudo recuperar el archivo adjunto.',msgLog);
                return '{}'; // Retorna un JSON vacío si no se pudo recuperar el archivo
            }

            gs.log('Archivo adjunto recuperado con éxito.',msgLog);

            // Crear una instancia de GlideExcelParser
            var parser = new sn_impex.GlideExcelParser();
            parser.setSource(attachmentStream);

            // Obtener los nombres de las hojas
            var sheetNames = parser.getSheetNames();
            gs.log('Nombres de las hojas: ' + sheetNames.join(', '), msgLog);


        } catch (e) {
            gs.log('Error al procesar el archivo: ' + e.message, msgLog);
            return '{}'; // Devolver un JSON vacío en caso de error
        }

        gs.log("Json LECTURA: " + JSON.stringify(jsonResult), msgLog);
        // Retornar el JSON resultante como una cadena
        return JSON.stringify(jsonResult);
    // gs.log("Procesando ID: " + attachmentSysId, msgLog);
    
    // // Crear una instancia del GlideExcelParser para leer el archivo Excel
    // var excelParser = new sn_impex.GlideExcelParser();
    
    // try {
    //     excelParser.setSheetNumber(1); // Si deseas leer una hoja específica
    //     var parseResult = excelParser.parse(attachmentSysId);
        
    //     if (!parseResult) {
    //         gs.error("No se pudo analizar el archivo Excel con ID: " + attachmentSysId, msgLog);
    //         return null;
    //     }
        
    //     var result = [];
    //     while (excelParser.hasNext()) {
    //         var row = excelParser.next();
    //         var rowData = {};

    //         // Leer y asignar los valores de las 5 columnas específicas
    //         rowData.ean = row.getCellValue('A') || '';        // Columna A - EAN
    //         rowData.atc4 = row.getCellValue('B') || '';       // Columna B - ATC4
    //         rowData.categoria = row.getCellValue('C') || '';  // Columna C - Categoría
    //         rowData.sub_genero = row.getCellValue('D') || ''; // Columna D - Sub Género
    //         rowData.genero = row.getCellValue('E') || '';     // Columna E - Género
            
    //         result.push(rowData);
    //     }
        
    //     gs.log("Resultado xls: " + JSON.stringify(result), msgLog);
    //     return JSON.stringify(result);
        
    // } catch (e) {
    //     gs.error("Error procesando el archivo Excel: " + e.message, msgLog);
    //     return null;
    // }
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


        } catch (e) {
            gs.error('Error al procesar el archivo: ' + e.message);
            return '{}'; // Devolver un JSON vacío en caso de error
        }

        gs.log("Json LECTURA: " + JSON.stringify(jsonResult), 'jsonLecturaXLSX');
        // Retornar el JSON resultante como una cadena
        return JSON.stringify(jsonResult);
    },
    type: 'MDM_Attachment_EQVIA'
};