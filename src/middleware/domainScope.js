const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware de Domain Scope (multi-tenant)
 * Inyecta req.dominioId basándose en:
 *   1. Header x-dominio-id (enviado por frontend)
 *   2. dominioActualId del usuario autenticado
 *   3. null si es superAdmin sin header (ve todo)
 *
 * No bloquea si no hay autenticación (las rutas que lo necesiten
 * deben usar requireAuth antes de este middleware).
 */
async function domainScope(req, res, next) {
  try {
    // Intentar obtener usuario del token (sin bloquear)
    const token = req.cookies?.auth_token;
    if (!token) {
      req.dominioId = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      req.dominioId = null;
      return next();
    }

    // Obtener datos de dominio del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { dominioActualId: true, esSuperAdmin: true },
    });

    if (!usuario) {
      req.dominioId = null;
      return next();
    }

    const headerDominio = req.headers['x-dominio-id'];

    if (usuario.esSuperAdmin && !headerDominio) {
      // Super admin sin header específico → ve todo
      req.dominioId = null;
    } else {
      // Usar header si existe, sino el dominio actual del usuario
      req.dominioId = headerDominio || usuario.dominioActualId || null;
    }

    req.esSuperAdmin = usuario.esSuperAdmin || false;
    next();
  } catch (error) {
    console.error('[DomainScope] Error:', error.message);
    req.dominioId = null;
    next();
  }
}

/**
 * Helper: construir filtro where con dominioId
 * Si dominioId es null (super admin viendo todo), no agrega filtro
 */
function withDomainFilter(where = {}, dominioId) {
  if (!dominioId) return where;
  return { ...where, dominioId };
}

module.exports = { domainScope, withDomainFilter };
