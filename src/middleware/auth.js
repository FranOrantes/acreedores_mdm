const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;

// ──────────────────────────────────────────────────
// Middleware: requireAuth
// Verifica que el usuario esté autenticado (JWT válido en cookie)
// Agrega req.user con los datos del usuario
// ──────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado. Inicie sesión.' });
    }

    // Verificar y decodificar el JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario siga activo en la BD
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado.' });
    }

    // Adjuntar datos del usuario al request
    req.user = {
      id: usuario.id,
      ssoId: usuario.ssoId,
      email: usuario.email,
      nombre: usuario.nombre,
      rolInterno: usuario.rolInterno,
      roles: JSON.parse(usuario.roles),
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({ error: 'Error de autenticación.' });
  }
}

// ──────────────────────────────────────────────────
// Middleware factory: requireRole(...roles)
// Verifica que el usuario tenga al menos uno de los roles internos especificados
// Uso: requireRole('admin', 'developer')
// ──────────────────────────────────────────────────
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    const tienePermiso = rolesPermitidos.includes(req.user.rolInterno);

    if (!tienePermiso) {
      return res.status(403).json({
        error: 'No tiene permisos para realizar esta acción.',
        rolRequerido: rolesPermitidos,
        rolActual: req.user.rolInterno,
      });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole };
