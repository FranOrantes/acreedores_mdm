// Script Include: MDM_DataLake_Utils
// sys_id: d2625713938366109f8b369d1dba10f7 | activo: true | updated: 04-08-2025 11:51:33
// description: MDM

var url_u="https://dlsanalyticeastusprd.blob.core.windows.net/demand-sensing-raw/";
var url_d="?sp=racwdlm&st=2025-03-14T01:46:35Z&se=2035-03-14T09:46:35Z&spr=https&sv=2022-11-02&sr=d&sig=jo2%2BSDUV0ZI%2BIO300C0mutWRiNPFgFGtXnSb6KeA8AU%3D&sdd=1";
var MDM_DataLake_Utils = Class.create();
MDM_DataLake_Utils.prototype = {
    initialize: function() {},
    extraerDatosBlobs: function() {

        try {
            var r = new sn_ws.RESTMessageV2('sn_customerservice.DataLake', 'getListado');
            var response = r.execute();
            var responseBody = response.getBody();
            var httpStatus = response.getStatusCode();

            var jsonObj = gs.xmlToJSON(responseBody); // Converting XML into a JSON object

            //var resultado = this.getDatos(jsonObj);
            //resultado = this.jerarquia(resultado);
            //resultado = this.unirChildrenDuplicados(resultado);
            var resultado = this.getDatosJerarquizados(jsonObj);
            return resultado;
			

        } catch (ex) {
            var message = ex.message;
            gs.print(message);
        }
    },
    fusionarChildrenDuplicados: function(menuItems) {
        for (var i = 0; i < menuItems.length; i++) {
            var item = menuItems[i];

            if (item.Children && item.Children.length > 0) {
                var childrenMap = {};
                var childrenUnicos = [];

                for (var j = 0; j < item.Children.length; j++) {
                    var child = item.Children[j];
                    var nombre = child.Name;

                    if (!childrenMap[nombre]) {
                        // Clonamos el hijo y lo registramos
                        childrenMap[nombre] = child;

                        // Si tiene Children, nos aseguramos de que sea una copia
                        if (child.Children && child.Children.length > 0) {
                            childrenMap[nombre].Children = child.Children.slice();
                        }

                        childrenUnicos.push(childrenMap[nombre]);
                    } else {
                        // Ya existe un hijo con ese nombre, fusionamos sus Children
                        var existente = childrenMap[nombre];
                        if (child.Children && child.Children.length > 0) {
                            if (!existente.Children) existente.Children = [];

                            for (var k = 0; k < child.Children.length; k++) {
                                var subChild = child.Children[k];
                                // Evitar duplicados exactos
                                var yaExiste = false;
                                for (var l = 0; l < existente.Children.length; l++) {
                                    if (existente.Children[l].Name === subChild.Name) {
                                        yaExiste = true;
                                        break;
                                    }
                                }
                                if (!yaExiste) {
                                    existente.Children.push(subChild);
                                }
                            }
                        }
                    }
                }

                // Actualizamos los children únicos
                item.Children = childrenUnicos;

                // Recursivamente fusionamos los niveles más profundos
                fusionarChildrenDuplicados(item.Children);
            }
        }

        return menuItems;
    },
    getDatosJerarquizados: function(jsonData) {
        var menuItems = [];
        var blobs = jsonData.EnumerationResults.Blobs.Blob;
        var directories = {};

        // First pass: Identify directories and their immediate files/subdirectories
        for (var i = 0; i < blobs.length; i++) {
            var blob = blobs[i];
            var nameParts = blob.Name.split('/');

            if (nameParts.length === 2 && nameParts[1] !== ".placeholder") {
                // Root level directory
                var directoryName = nameParts[1];
                if (!directories[directoryName]) {
                    directories[directoryName] = {
                        Name: directoryName,
                        Children: [],
						URL:"",
                        Parent: "",
                        EsArchivo: false // It's a directory
                    };
                    menuItems.push(directories[directoryName]);
                }
            } else if (nameParts.length === 3 && nameParts[2] !== ".placeholder") {
                // Subdirectory
                var parentDirectoryName = nameParts[1];
                var subDirectoryName = nameParts[2];
                if (directories[parentDirectoryName]) {
                    if (!directories[parentDirectoryName].Children.some(function(item) {
                            return item.Name === subDirectoryName;
                        })) {
                        var subDirectory = {
                            Name: subDirectoryName,
                            Children: [],
                            Parent: parentDirectoryName,
                            EsArchivo: false // It's a directory
                        };
                        directories[parentDirectoryName].Children.push(subDirectory);
                        directories[subDirectoryName] = subDirectory; // Add to directories for easier access later
                    }
                }
            } else if (nameParts.length === 4) {
                // File within a subdirectory
                var parentSubDirectoryName = nameParts[2];
                var fileName = nameParts[3];
                if (directories[parentSubDirectoryName]) {
                    var fileSizeInBytes = parseInt(blob.Properties["Content-Length"], 10);
                    var fileSizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
                    directories[parentSubDirectoryName].Children.push({
                        EsArchivo: true,
                        Name: fileName,
						URL:url_u+blob.Name+url_d,
                        Peso: fileSizeMB,
                        TipoDeArchivo: blob.Properties["Content-Type"]
                    });
                }
            }
        }

        return {
            "menuItems": menuItems
        };
    },
    getDatos: function(datos) {


        const blobs = datos.EnumerationResults.Blobs.Blob;
        const result = [];

        blobs.forEach(blob => {
            // Verificar si el 'Name' contiene "Acreedores/"
            if (blob.Name.includes('Acreedores/')) {
                const pathParts = blob.Name.split('/');
                const fileName = pathParts.pop(); // El último elemento es el archivo.

                // Encontrar o crear la carpeta (si no existe).
                var folder = result.find(folder => folder.Name === pathParts.join('/'));

                if (!folder) {
                    var str = pathParts.join('/');
                    if (str.includes('Acreedores/')) {
                        folder = {
                            Name: str,
                            Parent: "",
							URL:"",
                            Children: [],
                        };
                        result.push(folder);
                    }
                }

                // Detectar si el folder.Name tiene una extensión (como .pdf, .txt, etc.)
                const esArchivo = /\.[a-zA-Z0-9]+$/.test(folder.Name); // Expresión regular que busca extensión

                // Si el archivo es un archivo (no una carpeta), añadirlo como hijo de la carpeta correspondiente.
                if (fileName !== "") {
                    if (!fileName.includes('placeholder')) {
                        const fileData = {
                            Name: fileName,
                        };

                        // Si es un archivo, agregar peso y tipo
                        if (blob.Properties['Content-Length'] && blob.Properties['Content-Type']) {
                            const pesoEnMB = (blob.Properties['Content-Length'] / 1048576).toFixed(2);
                            fileData.Peso = `${pesoEnMB} MB`;
							fileData.URL = url_u+"/"+blob.Name+url_d;
                            fileData.TipoDeArchivo = blob.Properties['Content-Type'];
                        }

                        folder.Children.push(fileData);

                        // Si se detecta que es un archivo, puedes marcarlo como 'esArchivo'
                        fileData.EsArchivo = esArchivo; // La bandera esArchivo en el archivo individual
                    }
                }
            }
        });

        return result;
    },
    jerarquia: function(data) {
        // Índice rápido por path
        const pathIndex = {};

        // Creamos el índice rápido
        data.forEach(item => {
            item.Name = item.Name.replaceAll("Acreedores/", "");
            pathIndex[item.Name] = item;
        });

        const resultado = [];

        // Función recursiva para jerarquizar
        function procesarItem(item) {
            const partes = item.Name.split('/');

            if (partes.length > 1) {

                // Si hay más de un nivel en la ruta, buscamos el padre
                const parentPath = partes.slice(0, -1).join('/');


                item.Parent = partes.slice(0, -1);


                var parent = pathIndex[parentPath];
                item.Name = item.Name.replaceAll(item.Parent + "/", "");
                //item.Name = pathIndex[parentPath];

                if (parent) {
                    // Si el padre existe, anidamos al hijo
                    if (!parent.Children) parent.Children = [];
                    parent.Children.push(item);
                } else {
                    // Si no hay padre, lo dejamos en el nivel raíz
                    resultado.push(item);
                }
            } else {
                // Elementos de nivel raíz
                resultado.push(item);
            }
        }

        // Jerarquización de todos los items
        data.forEach(item => procesarItem(item));

        return resultado;
    },
    getDatos_bkp: function(datos) {

        const blobs = datos.EnumerationResults.Blobs.Blob;
        const result = [];

        blobs.forEach(blob => {
            // Verificar si el 'Name' contiene "Acreedores/"
            if (blob.Name.includes('Acreedores/')) {
                const pathParts = blob.Name.split('/');
                const fileName = pathParts.pop(); // El último elemento es el archivo.

                // Encontrar o crear la carpeta (si no existe).
                var folder = result.find(folder => folder.Name === pathParts.join('/'));

                if (!folder) {
                    var str = pathParts.join('/');
                    if (str.includes('Acreedores/')) {
                        folder = {
                            Name: str,
                            Children: [],
                        };
                        result.push(folder);
                    }
                }

                // Detectar si el folder.Name tiene una extensión (como .pdf, .txt, etc.)
                const esArchivo = /\.[a-zA-Z0-9]+$/.test(folder.Name); // Expresión regular que busca extensión

                // Si el archivo es un archivo (no una carpeta), añadirlo como hijo de la carpeta correspondiente.
                if (fileName !== "") {
                    if (!fileName.includes('placeholder')) {
                        const fileData = {
                            Name: fileName,
                        };

                        // Si es un archivo, agregar peso y tipo
                        if (blob.Properties['Content-Length'] && blob.Properties['Content-Type']) {
                            const pesoEnMB = (blob.Properties['Content-Length'] / 1048576).toFixed(2);
                            fileData.Peso = `${pesoEnMB} MB`;
                            fileData.TipoDeArchivo = blob.Properties['Content-Type'];
                        }

                        folder.Children.push(fileData);

                        // Si se detecta que es un archivo, puedes marcarlo como 'esArchivo'
                        fileData.EsArchivo = esArchivo; // La bandera esArchivo en el archivo individual
                    }
                }
            }
        });

        return result;
    },
    type: 'MDM_DataLake_Utils'
};