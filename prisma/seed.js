const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Sucursales
  const sucursales = await Promise.all([
    prisma.catSucursal.create({ data: { codigo: '0042', nombre: 'Corporativo CDMX' } }),
    prisma.catSucursal.create({ data: { codigo: '0051', nombre: 'Planta Norte Monterrey' } }),
    prisma.catSucursal.create({ data: { codigo: '0088', nombre: 'Centro de Distribución Bajío' } }),
    prisma.catSucursal.create({ data: { codigo: '0023', nombre: 'Sucursal Guadalajara' } }),
    prisma.catSucursal.create({ data: { codigo: '0015', nombre: 'Sucursal Puebla' } }),
  ]);

  // Tipos de acreedor
  const tiposAcreedor = await Promise.all([
    prisma.catTipoAcreedor.create({ data: { clave: 'locales', nombre: 'Locales' } }),
    prisma.catTipoAcreedor.create({ data: { clave: 'locales_asuntos_regulatorios', nombre: 'Locales Asuntos Regulatorios' } }),
    prisma.catTipoAcreedor.create({ data: { clave: 'de_area_usuaria', nombre: 'De Área Usuaria' } }),
    prisma.catTipoAcreedor.create({ data: { clave: 'centralizados_adquisiciones_obras', nombre: 'Centralizados Adquisiciones y Obras' } }),
    prisma.catTipoAcreedor.create({ data: { clave: 'locales_sin_documentacion', nombre: 'Locales Sin Documentación' } }),
    prisma.catTipoAcreedor.create({ data: { clave: 'locales_opinion_cumplimiento_negativa', nombre: 'Locales Opinión Cumplimiento Negativa' } }),
  ]);

  // Grupos de cuentas
  const gruposCuentas = await Promise.all([
    prisma.catGrupoCuentas.create({ data: { clave: 'PROV', nombre: 'Proveedores Locales' } }),
    prisma.catGrupoCuentas.create({ data: { clave: 'NASO', nombre: 'NASO' } }),
    prisma.catGrupoCuentas.create({ data: { clave: 'BENEF', nombre: 'Beneficiarios' } }),
    prisma.catGrupoCuentas.create({ data: { clave: 'BECAR', nombre: 'Becarios' } }),
    prisma.catGrupoCuentas.create({ data: { clave: 'SERV', nombre: 'Prestadores de Servicios' } }),
    prisma.catGrupoCuentas.create({ data: { clave: 'FLET', nombre: 'Transportistas' } }),
  ]);

  // Cuentas asociadas por grupo
  await Promise.all([
    prisma.catCuentaAsociada.create({ data: { codigo: '2110000000', nombre: 'Proveedores nacionales', grupoCuentasId: gruposCuentas[0].id } }),
    prisma.catCuentaAsociada.create({ data: { codigo: '2110000001', nombre: 'Proveedores extranjeros', grupoCuentasId: gruposCuentas[0].id } }),
    prisma.catCuentaAsociada.create({ data: { codigo: '2120000000 N', nombre: 'NASO General', grupoCuentasId: gruposCuentas[1].id } }),
    prisma.catCuentaAsociada.create({ data: { codigo: '2120000000 B', nombre: 'Becarios', grupoCuentasId: gruposCuentas[3].id } }),
    prisma.catCuentaAsociada.create({ data: { codigo: '2130000000', nombre: 'Servicios profesionales', grupoCuentasId: gruposCuentas[4].id } }),
    prisma.catCuentaAsociada.create({ data: { codigo: '2140000000', nombre: 'Fletes nacionales', grupoCuentasId: gruposCuentas[5].id } }),
  ]);

  // Condiciones de pago
  await Promise.all([
    prisma.catCondicionPago.create({ data: { clave: 'P030', nombre: '30 Días Fijos' } }),
    prisma.catCondicionPago.create({ data: { clave: 'P045', nombre: '45 Días Fijos' } }),
    prisma.catCondicionPago.create({ data: { clave: 'P060', nombre: '60 Días Fijos' } }),
    prisma.catCondicionPago.create({ data: { clave: 'IMME', nombre: 'Pago Inmediato' } }),
  ]);

  // Tipos de documento
  await Promise.all([
    prisma.catTipoDocumento.create({ data: { clave: 'CONST_FISCAL', nombre: 'Constancia de situación fiscal', descripcion: 'No mayor a 3 meses de antigüedad', obligatorio: true, extensiones: 'pdf,jpeg,png,jpg', maxSizeMb: 1, orden: 1, icono: 'receipt_long' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'EDO_CTA_BANC', nombre: 'Estado de cuenta bancario', descripcion: 'Carátula donde sea visible la CLABE interbancaria', obligatorio: true, extensiones: 'pdf,jpeg,jpg,png', maxSizeMb: 5, orden: 2, icono: 'account_balance' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'ACTA_CONSTITUTIVA', nombre: 'Acta constitutiva', descripcion: 'Necesario únicamente en caso de ser sociedad moral', obligatorio: false, condicional: true, extensiones: 'pdf,jpeg,png,jpg', maxSizeMb: 25, orden: 3, icono: 'gavel' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'INE', nombre: 'Identificación oficial del representante legal', descripcion: 'INE o Pasaporte vigente del representante legal', obligatorio: true, extensiones: 'pdf,jpeg,jpg,png', maxSizeMb: 1, orden: 4, icono: 'badge' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'REFERENCIAS', nombre: 'Referencias comerciales', descripcion: 'Adjunte 3 comprobantes de referencias vigentes', obligatorio: true, extensiones: 'pdf,jpeg,jpg,xlsx,xls,pptx,docx,doc,ppt,png', maxSizeMb: 5, maxArchivos: 3, orden: 5, icono: 'groups' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'CURRICULUM', nombre: 'Curriculum de la empresa', descripcion: 'Perfil corporativo con servicios y trayectoria', obligatorio: true, extensiones: 'pdf,jpeg,jpg,xlsx,xls,pptx,docx,doc,ppt,png', maxSizeMb: 6, orden: 6, icono: 'business_center' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'FO_CN_02', nombre: 'Formato FO-CN-02', descripcion: 'Formato institucional debidamente requisitado', obligatorio: true, extensiones: 'pdf,jpeg,jpg,png', maxSizeMb: 1, orden: 7, icono: 'description' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'CUMPL_OBLIG_FISC', nombre: 'Opinión de cumplimiento SAT', descripcion: 'Opinión de cumplimiento emitida por el SAT del mes en curso', obligatorio: true, extensiones: 'pdf,jpeg,jpg', maxSizeMb: 1, orden: 8, icono: 'verified' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'COMPROB_DOM', nombre: 'Comprobante de domicilio', descripcion: 'Antigüedad máxima de 3 meses (luz, agua, teléfono, gas o predio)', obligatorio: true, extensiones: 'pdf,jpeg,jpg,png', maxSizeMb: 1, orden: 9, icono: 'home' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'REPSE', nombre: 'REPSE', descripcion: 'Registro de Prestadoras de Servicios Especializados u Obras Especializadas', obligatorio: false, condicional: true, extensiones: 'pdf,jpeg,jpg,png', maxSizeMb: 5, orden: 10, icono: 'engineering' } }),
    prisma.catTipoDocumento.create({ data: { clave: 'VALIDACION_PROV', nombre: 'Validación de Proveedores', descripcion: 'Solo aplica para Compras Locales', obligatorio: false, condicional: true, extensiones: 'pdf,xls,xlsx', maxSizeMb: 2, orden: 11, icono: 'fact_check' } }),
  ]);

  // Demo solicitud
  const solicitud = await prisma.solicitud.create({
    data: {
      folio: 'AC-9842',
      estado: 'borrador',
      pasoActual: 2,
      solicitanteNombre: 'Fernando Javier Ortega',
      solicitanteArea: 'Logística y Distribución',
      sucursalId: sucursales[0].id,
      rfc: 'ABC123456XYZ',
      tipoAcreedorId: tiposAcreedor[0].id,
      grupoCuentasId: gruposCuentas[0].id,
      tipoPersona: 'moral',
      type: '1',
      razonSocial: 'DISTRIBUIDORA NACIONAL SA DE CV',
      nombreComercial: 'DINASA',
      conceptoBusqueda: 'DINASA',
      bienServicio: 'Distribución de productos farmacéuticos y de consumo',
      empresaReconocida: 'si',
      clasificacionAcreedor: 'persona_moral',
      localizacion: 'nacional',
      condicionPagoId: (await prisma.catCondicionPago.findUnique({ where: { clave: 'P030' } })).id,
      monedaPago: 'MXN',
      viaPago: 'transferencia',
      cuentaClabe: '012345678901234567',
      nombreBanco: 'BBVA BANCOMER',
      calle: 'AV. INSURGENTES SUR',
      numeroExterior: '1234',
      numeroInterior: 'PISO 5',
      codigoPostal: '03100',
      colonia: 'CRÉDITO CONSTRUCTOR',
      estado_dir: 'Ciudad de México',
      municipio: 'Benito Juárez',
    },
  });

  // Demo contactos (multi-row, 4 registros)
  await Promise.all([
    prisma.contactoAcreedor.create({ data: { solicitudId: solicitud.id, orden: 1, nombre: 'María López Hernández', correo: 'maria.lopez@dinasa.com', puesto: 'Gerente de Compras', telefono: '5551234567', extension: '101', cdr: '0042' } }),
    prisma.contactoAcreedor.create({ data: { solicitudId: solicitud.id, orden: 2, nombre: 'Carlos Ramírez Torres', correo: 'carlos.ramirez@dinasa.com', puesto: 'Director Comercial', telefono: '5559876543', extension: '200', cdr: '0042' } }),
    prisma.contactoAcreedor.create({ data: { solicitudId: solicitud.id, orden: 3, nombre: 'Ana García Mendoza', correo: 'ana.garcia@dinasa.com', puesto: 'Coordinadora de Logística', telefono: '5554567890', extension: '', cdr: '0051' } }),
    prisma.contactoAcreedor.create({ data: { solicitudId: solicitud.id, orden: 4, nombre: 'Roberto Sánchez Díaz', correo: 'roberto.sanchez@dinasa.com', puesto: 'Jefe de Facturación', telefono: '5557891234', extension: '305', cdr: '0088' } }),
  ]);

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
