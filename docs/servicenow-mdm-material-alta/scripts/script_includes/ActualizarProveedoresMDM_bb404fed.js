// Script Include: ActualizarProveedoresMDM
// sys_id: bb404fed1b57169014b95310604bcbd7 | activo: true | updated: 06-06-2025 13:28:09
// description: MDM

var ActualizarProveedoresMDM = Class.create();
ActualizarProveedoresMDM.prototype = {
    initialize: function() {},

    process: function(data) {
        var modProv = new GlideRecord("u_mdm_proveedores");
        modProv.addQuery("u_bp_partner", data.variables.provm_proveedor.u_bp_partner);
        modProv.query();
        if (modProv.next()) {
            if (data.variables.carta_porte == "true") {
                gs.log("IMPRIME CARTA PORTE");
                modProv.setValue("u_cliente_atwrt_2", data.variables.imprime_carta_porte_new);
            }
            if (data.variables.forma_de_pago == "true") {
                gs.log("TIPO DE ENTREGA");
                modProv.setValue("u_atwrt_8", data.variables.directa_new);
                modProv.setValue("u_atwrt_9", data.variables.centralizada_new);
            }
            if (data.variables.cambio_de_negociador == "true") {
                gs.log("LICENCIA SANITARIA");
                if (data.variables.licencia_sanitariaa) {
                    modProv.setValue("u_proveedor_atwrt_1", data.variables.licencia_sanitariaa);
                }
                if (data.variables.sanitaria_2) {
                    modProv.setValue("u_proveedor_atwrt_2", data.variables.sanitaria_2);
                }
                if (data.variables.sanitaria_3) {
                    modProv.setValue("u_proveedor_atwrt_3", data.variables.sanitaria_3);
                }
                if (data.variables.sanitaria_4) {
                    modProv.setValue("u_proveedor_atwrt_4", data.variables.sanitaria_4);
                }


                if (data.variables.sanitariaa_5) {
                    modProv.setValue("u_proveedor_atwrt_5", data.variables.sanitariaa_5);
                }

                if (data.variables.sanitaria_6) {
                    modProv.setValue("u_proveedor_atwrt_6", data.variables.sanitaria_6);
                }


            }
            if (data.variables.cambio_cfdi == "true") {
                gs.log("CAMBIO USOCFDI");
                modProv.setValue("u_cliente_atwrt_1", data.variables.usocfdi_new);
            }
            if (data.variables.politica_devolucion == "true") {
                gs.log("DEVOLUCIÓN", "SI Mod Proveedores"); // 
                if (data.variables.vencida_new != "no") {
                    modProv.setValue("u_zdev_devolucion", data.variables.vencida_new);

                }
                if (data.variables.deteriorada_new != "no") {
                    modProv.setValue("u_zdev_devolucion_2", data.variables.deteriorada_new);
                }
                if (data.variables.buen_new != "no") {
                    modProv.setValue("u_zdev_devolucion_3", data.variables.buen_new);

                }

                if (data.variables.vencida_new == "no") {
                    modProv.setValue("u_zdev_devolucion", "");

                }
                if (data.variables.deteriorada_new == "no") {
                    modProv.setValue("u_zdev_devolucion_2", "");
                }
                if (data.variables.buen_new == "no") {
                    modProv.setValue("u_zdev_devolucion_3", "");

                }

            }
            if (data.variables.penalizacion == "true") {
                gs.log("PORCENTAJE PENALIZACIÓN");
                modProv.setValue("u_atwrt_11", data.variables.penalizacion_new + "%");

            }
            if (data.variables.fiscal == "true") {
                gs.log("REGIMEN FISCAL");
                modProv.setValue("u_cliente_atwrt_3", data.variables.regimen_fiscal_new);
            }
            if (data.variables.caducidad == "true") {
                gs.log("DIAS DE CADUCIDAD");

                modProv.setValue("u_atwrt_1", data.variables.dias_antes_new);
                modProv.setValue("u_atwrt_2", data.variables.dias_despues_new);
            }
            if (data.variables.existencias == "true") {
                gs.log("TOMA DE EXISTENCIA");
                modProv.setValue("u_atwrt_10", data.variables.agenda_new);
            }
            if (data.variables.compra == "true") {
                gs.log("DIA DE COMPRA");
                modProv.setValue("u_atwrt_7", data.variables.compra_new);
            }


            //Cuenta bancaria
            if (data.variables.provm_cuenta == "true"); {
                modProv.setValue('u_cuenta_bancaria', data.variables.provmnuevo_cuenta_bancaria);

            }

            //Dirección
            if (data.variables.cambio_de_direccion == "true"); {
                modProv.setValue('u_calle', data.variables.provmnuevo_calle);
                modProv.setValue('u_n_mero_exterior', data.variables.provmnuevo_numero_ext);
                if (data.variables.provmnuevo_numero_int) {
                    modProv.setValue('u_n_mero_interior', data.variables.provmnuevo_numero_int);
                }
                if (data.variables.provmnuevo_piso) {
                    modProv.setValue('u_piso', data.variables.provmnuevo_piso);
                }
                if (data.variables.provmnuevo_num_depto) {
                    modProv.setValue('u_n_mero_de_departamento', data.variables.provmnuevo_num_depto);
                }
                modProv.setValue('u_c_digo_postal', data.variables.provmnuevo_cp);
                modProv.setValue('u_estado', data.variables.provmnuevo_estado);
                modProv.setValue('u_alcald_a_municipio', data.variables.provmnuevo_alcaldia);
                if (data.variables.colonia_nueva) {
                    modProv.setValue('u_colonia', data.variables.colonia_nueva);
                }

                if (data.variables.provmnuevo_colonia) {
                    modProv.setValue('u_colonia', data.variables.provmnuevo_colonia);
                }

            }


            //Correo de contacto

            if (data.variables.correo_de_contacto == "true"); {
                modProv.setValue('u_fiscal_nombre', data.variables.provmnuevo_nombre_completo);
                modProv.setValue('u_correo_electr_nico', data.variables.provmnuevo_correo);
            }
            

            //Razón Social

            if (data.variables.cambio_razon_social == "true"); {
                modProv.setValue('u_raz_n_social', data.variables.provmnuevo_razon_social);
               // modProv.setValue('u_correo_electr_nico', data.variables.concepto_de_busqueda);
            }

			//Plazo de pago
			if(data.variables.plazo_de_pago == "true"){
				modProv.setValue('u_plazo_de_pago', data.variables.plazo_de_pago_nuevo_rol_proveedor);
				modProv.setValue('u_condiciones_de_pago', data.variables.plazo_de_pago_nuevo_rol_acreedor);
			}

			//cambio_negociador
			if(data.variables.cambio_negociador == "true"){
				modProv.setValue('u_negociador_asignado_ref', data.variables.provmnuevo_negociador);
				
			}

            modProv.update();

        }
    },

    type: 'ActualizarProveedoresMDM'
};