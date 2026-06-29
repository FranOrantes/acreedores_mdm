const prisma = require('./prisma');

/**
 * Registrar un log del sistema
 * @param {object} params
 * @param {string} params.tipo - login, impersonacion, sap_respuesta, error, admin_accion
 * @param {string} params.accion - descripción corta
 * @param {object} [params.options]
 * @param {string} [params.options.detalle]
 * @param {string} [params.options.nivel] - info, warn, error
 * @param {string} [params.options.usuarioId]
 * @param {string} [params.options.usuarioEmail]
 * @param {string} [params.options.usuarioNombre]
 * @param {string} [params.options.ipAddress]
 * @param {string} [params.options.userAgent]
 * @param {string} [params.options.entidadTipo]
 * @param {string} [params.options.entidadId]
 * @param {object} [params.options.metadata] - se serializa a JSON
 */
async function logSistema(tipo, accion, options = {}) {
  try {
    await prisma.logSistema.create({
      data: {
        tipo,
        accion,
        detalle: options.detalle || null,
        nivel: options.nivel || 'info',
        usuarioId: options.usuarioId || null,
        usuarioEmail: options.usuarioEmail || null,
        usuarioNombre: options.usuarioNombre || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        entidadTipo: options.entidadTipo || null,
        entidadId: options.entidadId || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (err) {
    console.error('[Logger] Error al registrar log:', err.message);
  }
}

/**
 * Extraer IP y User-Agent de un request de Express
 */
function reqInfo(req) {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

/**
 * Registrar un log de email
 * @param {object} params
 * @param {string} params.asunto
 * @param {string[]} params.destinatarios
 * @param {object} [params.options]
 */
async function logEmail(params) {
  try {
    await prisma.logEmail.create({
      data: {
        asunto: params.asunto,
        destinatarios: JSON.stringify(params.destinatarios || []),
        cc: params.cc ? JSON.stringify(params.cc) : null,
        cco: params.cco ? JSON.stringify(params.cco) : null,
        bodyHtml: params.bodyHtml || null,
        bodyTexto: params.bodyTexto || null,
        remitente: params.remitente || null,
        estado: params.estado || 'enviado',
        error: params.error || null,
        solicitudId: params.solicitudId || null,
        usuarioId: params.usuarioId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error('[Logger] Error al registrar log de email:', err.message);
  }
}

module.exports = { logSistema, logEmail, reqInfo };
