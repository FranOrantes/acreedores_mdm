const prisma = require('./prisma');

// Field label mappings for human-readable audit entries
const FIELD_LABELS = {
  estado: 'Estado',
  solicitanteNombre: 'Nombre del Solicitante',
  solicitanteArea: 'Área del Solicitante',
  sucursalId: 'Sucursal',
  rfc: 'RFC',
  tipoAcreedorId: 'Tipo de Acreedor',
  grupoCuentasId: 'Grupo de Cuentas',
  cuentaAsociada: 'Cuenta Asociada',
  razonSocial: 'Razón Social',
  nombreComercial: 'Nombre Comercial',
  apellidoPaterno: 'Apellido Paterno',
  nombrePila: 'Nombre',
  apellidoMaterno: 'Apellido Materno',
  tipoPersona: 'Tipo de Persona',
  condicionPagoId: 'Condición de Pago',
  monedaPago: 'Moneda de Pago',
  viaPago: 'Vía de Pago',
  cuentaClabe: 'Cuenta CLABE',
  nombreBanco: 'Banco',
  localizacion: 'Localización',
  calle: 'Calle',
  numeroExterior: 'Número Exterior',
  codigoPostal: 'Código Postal',
  colonia: 'Colonia',
  estado_dir: 'Estado (Dir)',
  municipio: 'Municipio',
  bienServicio: 'Bien o Servicio',
  aceptaClausula: 'Cláusula Aceptada',
  pasoActual: 'Paso Actual',
  comentario: 'Comentario',
  descripcionCorta: 'Descripción Corta',
};

/**
 * Compare old and new objects and create audit activity entries for changed fields.
 * @param {string} entidadTipo - "solicitud" | "aprobacion"
 * @param {string} entidadId - ID of the entity
 * @param {object} oldData - previous state
 * @param {object} newData - new state
 * @param {object} opts - { autorNombre, autorEmail }
 * @param {string[]} fieldsToTrack - list of field keys to audit (if empty, track all FIELD_LABELS keys)
 */
async function registrarCambios(entidadTipo, entidadId, oldData, newData, opts = {}, fieldsToTrack = null) {
  const keys = fieldsToTrack || Object.keys(FIELD_LABELS);
  const actividades = [];

  for (const key of keys) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    const oldStr = oldVal == null ? '' : String(oldVal);
    const newStr = newVal == null ? '' : String(newVal);

    if (oldStr !== newStr) {
      actividades.push({
        entidadTipo,
        entidadId,
        tipo: key === 'estado' ? 'cambio_estado' : 'cambio_campo',
        contenido: `${FIELD_LABELS[key] || key}: ${oldStr || '(vacío)'} → ${newStr || '(vacío)'}`,
        campoModificado: FIELD_LABELS[key] || key,
        valorAnterior: oldStr || null,
        valorNuevo: newStr || null,
        visibleCliente: false,
        autorNombre: opts.autorNombre || null,
        autorEmail: opts.autorEmail || null,
      });
    }
  }

  if (actividades.length > 0) {
    await prisma.actividad.createMany({ data: actividades });
  }

  return actividades.length;
}

/**
 * Create a single system activity entry.
 */
async function registrarActividad(entidadTipo, entidadId, tipo, contenido, opts = {}) {
  return prisma.actividad.create({
    data: {
      entidadTipo,
      entidadId,
      tipo,
      contenido,
      visibleCliente: opts.visibleCliente || false,
      autorNombre: opts.autorNombre || null,
      autorEmail: opts.autorEmail || null,
      campoModificado: opts.campoModificado || null,
      valorAnterior: opts.valorAnterior || null,
      valorNuevo: opts.valorNuevo || null,
    },
  });
}

module.exports = { registrarCambios, registrarActividad, FIELD_LABELS };
