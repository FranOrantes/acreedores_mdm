// Script Include: utilsGaMDM
// sys_id: 060c79221b5e46d0a9f8766dcc4bcb6c | activo: true | updated: 31-07-2025 03:13:08
// description: MDM version final

var utilsGaMDM = Class.create();
utilsGaMDM.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    checkAcreedor: function() {

        var name = this.getParameter('sysparm_acreedor_name');

        var recCompany = new GlideRecord('core_company');
        recCompany.addEncodedQuery('name=' + name);
        recCompany.query();

        return recCompany.next();
    },

    getDataUser: function() {

        //var jsonResponse = {};
        var userID = this.getParameter('sysparm_userID');
        var jsonResponse = {};
        var grUsr = new GlideRecord('sys_user');
        if (grUsr.get(userID)) {
            jsonResponse.u_rea_human = grUsr.u_rea_human.toString();
            jsonResponse.area_solicitante = grUsr.u_user_linea.toString();
            jsonResponse.num_empleado = grUsr.employee_number.toString();
            /*var jsonResponse = {
                u_rea_human: grUsr.u_rea_human.toString(),
                area_solicitante: grUsr.u_user_linea.toString(), //grUsr.department.getDisplayValue()
                num_empleado: grUsr.employee_number.toString()
            };*/
        }

        //Valida si el usuario pertenece al grupo de Centralizado
        if (gs.getUser().isMemberOf('Centralizado')) {
            jsonResponse.isCentralizado = true;
        } else {
            jsonResponse.isCentralizado = false;
        }

        return JSON.stringify(jsonResponse);
    },

    getDataAccount: function() { //

        var jsonResponse = {};
        var accountID = this.getParameter('sysparm_accountID');
        gs.log(accountID, 'ACREEDORES');
        var bp = '';
        var cuenta_bancaria, via_pago = '';
        var calle, nInterior, nExterior, colonia, poblacion, cp, region = '';
        var comprobante_domicilio, constancia_sat, fo_cn_02, edo_cta_bancaria, ine, apoderado_legal = "";
        var condicion_pago, banco_propio = '';
        var n_contacto, ap_contacto, am_contacto, correo_contacto, tel_contacto, ext_contacto = '';
        var solicitante, area = '';
        var bloqueo_contabilizacion = '0';
        var bloqueo_central = '0';
        var razon_social = '';
        var rfc = '';
        var type = 0;
        var pago_unico;
        var gr = new GlideRecord('u_mdm_proveedores');
        if (gr.get(accountID)) {
            bp = gr.getValue("u_bp_partner").toString();
            gs.log('BP:' + bp, 'ACREEDORES');
            //12 longitud -  PERSONA MORAL (1) | 13 longitud -  PERSOSNA FISICA (2) 
            rfc = gr.getValue("u_rfc").toString();
            if (rfc.length == 12 || rfc.length == 13) {
                if (rfc.length == 12) { //Persona Moral
                    type = 1;
                    razon_social = gr.getValue("u_raz_n_social").toString();
                }
                if (rfc.length == 13) { //Persona Fisica
                    type = 2;
                    var nom_completo, nombre, nombre_2, a_paterno, a_materno = '';
                    nom_completo = gr.getValue("u_nombre_completo") != null ? gr.getValue("u_nombre_completo").toString() : '';
                    nombre = gr.getValue("u_primer_nombre") != null ? gr.getValue("u_primer_nombre").toString() : '';
                    nombre_2 = gr.getValue("u_segundo_nombre") != null ? gr.getValue("u_segundo_nombre").toString() : '';
                    a_paterno = gr.getValue("u_apellido_paterno") != null ? gr.getValue("u_apellido_paterno").toString() : '';
                    a_materno = gr.getValue("u_apellido_materno") != null ? gr.getValue("u_apellido_materno").toString() : '';

                    razon_social = nom_completo != '' ? nom_completo : nombre + ' ' + nombre_2 + ' ' + a_paterno + ' ' + a_materno;
                    /*razon_social = gr.getValue("u_primer_nombre").toString() + ' ' + gr.getValue("u_segundo_nombre").toString() + ' ' + gr.getValue("u_apellido_paterno").toString() + ' ' + gr.getValue("u_apellido_materno").toString();*/
                }
            }

            cuenta_bancaria = gr.u_cuenta_bancaria;
			via_pago = gr.u_vias_de_pago;
            fo_cn_02 = gr.getValue("u_fo_cn_02") != null ? gr.getValue("u_fo_cn_02") : '';
            edo_cta_bancaria = gr.getValue("u_estado_de_cuenta_bancario") != null ? gr.getValue("u_estado_de_cuenta_bancario") : '';
            ine = gr.getValue("u_identificacion_oficial_del_representante_legal") != null ? gr.getValue("u_identificacion_oficial_del_representante_legal") : '';

            apoderado_legal = gr.getValue("u_poder_del_representante_legal") != null ? gr.getValue("u_poder_del_representante_legal") : '';
            //Domicilio
            calle = gr.u_calle;
            nInterior = gr.u_n_mero_interior;
            nExterior = gr.u_n_mero_exterior;
            colonia = gr.u_colonia;
            poblacion = gr.u_alcald_a_municipio;
            cp = gr.u_c_digo_postal;
            region = gr.u_estado;
            comprobante_domicilio = gr.getValue("u_comprobante_de_domicilio") != null ? gr.getValue("u_comprobante_de_domicilio") : '';
            constancia_sat = gr.getValue("u_constancia_de_situacion_fiscal") != null ? gr.getValue("u_constancia_de_situacion_fiscal") : '';
            condicion_pago = gr.u_condiciones_de_pago;
            //jsonResponse.activo = '1'; //Desbloqueado
            //Datos del contacto
            /*n_contacto = gr.u_nombre_del_contacto_de_acreedor;
            ap_contacto = gr.u_apellido_paterno_de_contacto_de_acreedor;
            am_contacto = gr.u_apellido_materno_de_contacto_de_acreedor;
            correo_contacto = gr.u_correo_electr_nico;
            tel_contacto = gr.u_tel_fono;
            ext_contacto = gr.u_ext_tel;*/

            //Banco propio
            banco_propio = gr.u_hbkid;

            //Datos del Solicitante
            solicitante = gr.u_nombre_del_solicitante;
            area = gr.u_area_solicitante;

            bloqueo_contabilizacion = gr.u_bloqueo_central_de_contabilizacion == 'X' ? '1' : '0';
            bloqueo_central = gr.u_bloqueo_central == 'X' ? '1' : '0';

            if (gr.u_xpore != '' || gr.u_xpore != null) {
                if (gr.u_xpore.toString() == "True") {
                    pago_unico = true;
                } else {
                    pago_unico = false;
                }
            }
        }

        jsonResponse.razon_social = razon_social.toString();
        jsonResponse.rfc = rfc.toString();
        jsonResponse.type = type.toString();
        jsonResponse.cuenta_bancaria = cuenta_bancaria.toString();
		jsonResponse.via_pago = via_pago.toString();
        jsonResponse.fo_cn_02 = fo_cn_02.toString();
        jsonResponse.edo_cta_bancaria = edo_cta_bancaria.toString();
        jsonResponse.ine = ine.toString();
        jsonResponse.apoderado_legal = apoderado_legal.toString();
        //Domicilio
        jsonResponse.calle = calle.toString();
        jsonResponse.n_interior = nInterior.toString();
        jsonResponse.n_exterior = nExterior.toString();
        jsonResponse.colonia = colonia.toString();
        jsonResponse.poblacion = poblacion.toString();
        jsonResponse.cp = cp.toString();
        jsonResponse.region = region.toString();
        jsonResponse.comprobante_domicilio = comprobante_domicilio.toString();
        jsonResponse.constancia_sat = constancia_sat.toString();

        jsonResponse.condicion_pago = condicion_pago.toString();

        //Datos del contacto
        /*jsonResponse.n_contacto = n_contacto.toString();
        jsonResponse.ap_contacto = ap_contacto.toString();
        jsonResponse.am_contacto = am_contacto.toString();
        jsonResponse.correo_contacto = correo_contacto.toString();
        jsonResponse.tel_contacto = tel_contacto.toString();
        jsonResponse.ext_contacto = ext_contacto.toString();*/

        /*
        var grx = new GlideRecord('u_lfa1');
        grx.addQuery('u_lifnr', bp);
        grx.query();
        if (grx.next()) {
            bloqueo_contabilizacion = grx.u_sperr == 'X' ? '1' : '0';
        }

        var grz = new GlideRecord('u_but000');
        grz.addQuery('u_partner', bp);
        grz.query();
        if (grz.next()) {
            bloqueo_central = grz.u_xblck == 'X' ? '1' : '0';
        }*/


        /*var gry = new GlideRecord('u_lfb1');
        gry.addQuery('u_lifnr', bp);
        gry.query();
        if (gry.next()) {
            pago_unico = gry.u_xpore == 'X' ? '1' : '0';
        }*/

        jsonResponse.bloqueo_contabilizacion = bloqueo_contabilizacion.toString();
        jsonResponse.bloqueo_central = bloqueo_central.toString();
        jsonResponse.pago_unico = pago_unico.toString();
        jsonResponse.banco_propio = banco_propio.toString();

        jsonResponse.solicitante = solicitante.toString();
        jsonResponse.area = area.toString();

        /*var grAccount = new GlideRecord('customer_account');
        if (grAccount.get(accountID)) {
            jsonResponse.legal_entity_name = grAccount.legal_entity_name.toString();
            jsonResponse.u_rfc_f = grAccount.u_rfc_f.toString();
            jsonResponse.u_email_e = grAccount.u_email_e.toString();
            jsonResponse.u_cuentas_bancarias = grAccount.u_cuentas_bancarias.toString();
        }*/
		
		gs.log(JSON.stringify(jsonResponse), 'ACREEDORES');
        return JSON.stringify(jsonResponse);
    },

    acreedorExists: function() {

        var rfc = this.getParameter('sysparm_rfc');

        var checkRfc = new GlideRecord("customer_account");
        checkRfc.addQuery('u_rfc', rfc);
        checkRfc.query();
        gs.log("Check RFC Acreedor " + checkRfc.getEncodedQuery());
        return checkRfc.next();
    },

    getDataContacts: function() {

        var listValue = [];
        var accountID = this.getParameter('sysparm_accountID');
        var gr = new GlideRecord('u_mdm_proveedores');
        if (gr.get(accountID)) {

            if (gr.u_contacto_nombre_1 != '') {
                listValue.push({
                    "contacto_nombre": gr.getValue('u_contacto_nombre_1'), //,'X1'
                    "contacto_correo": gr.getValue('u_contacto_correo_1'), //,'correo1@gmail.com'
                    "contacto_puesto": gr.getValue('u_contacto_puesto_1'), // ,'P1'
                    "contacto_telefono": gr.getValue('u_contacto_telefono_1'), // '1234'
                    "contacto_extension": gr.getValue('u_contacto_extension_1'), //'011'
                    "contacto_cdr": gr.getValue('u_contacto_cdr_1')
                });
            }

            if (gr.u_contacto_nombre_2 != '') {
                listValue.push({
                    "contacto_nombre": gr.getValue('u_contacto_nombre_2'), // ,'X2'
                    "contacto_correo": gr.getValue('u_contacto_correo_2'), //,'correo2@gmail.com'
                    "contacto_puesto": gr.getValue('u_contacto_puesto_2'), //,'P2'
                    "contacto_telefono": gr.getValue('u_contacto_telefono_2'), //,'1234'
                    "contacto_extension": gr.getValue('u_contacto_extension_2'), // '012'
                    "contacto_cdr": gr.getValue('u_contacto_cdr_2')
                });
            }
            if (gr.u_contacto_nombre_3 != '') {
                listValue.push({
                    "contacto_nombre": gr.getValue('u_contacto_nombre_3'), //,'X3'
                    "contacto_correo": gr.getValue('u_contacto_correo_3'), //,'correo3@gmail.com'
                    "contacto_puesto": gr.getValue('u_contacto_puesto_3'), //,'P3'
                    "contacto_telefono": gr.getValue('u_contacto_telefono_3'), //,'1234'
                    "contacto_extension": gr.getValue('u_contacto_extension_3'), // '013'
                    "contacto_cdr": gr.getValue('u_contacto_cdr_3')
                });
            }

            if (gr.u_contacto_nombre_4 != '') {
                listValue.push({
                    "contacto_nombre": gr.getValue('u_contacto_nombre_4'), //,'X4'
                    "contacto_correo": gr.getValue('u_contacto_correo_4'), //,'correo4@gmail.com'
                    "contacto_puesto": gr.getValue('u_contacto_puesto_4'), //,'P4'
                    "contacto_telefono": gr.getValue('u_contacto_telefono_4'), //,'1234'
                    "contacto_extension": gr.getValue('u_contacto_extension_4'), //'014'
                    "contacto_cdr": gr.getValue('u_contacto_cdr_4')
                });
            }
        }
        return JSON.stringify(listValue);
    },

    type: 'utilsGaMDM'

});