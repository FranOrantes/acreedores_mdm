const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

// Contexto de sesión estilo gs de ServiceNow para el sandbox de scripts.
// usuario: id, nombre, email, roles (directos + efectivos de grupos), rolInterno, esSuperAdmin, dominios
// tracking: ip, userAgent, cuando, sesionValida
async function contextoSesion(req) {
  const base = {
    sesionValida: false,
    tracking: {
      ip: req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || null,
      userAgent: req?.headers?.['user-agent'] || null,
      cuando: new Date().toISOString(),
    },
  };
  try {
    const token = req?.cookies?.auth_token;
    if (!token) return { usuario: null, ...base };
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: { membresiaGrupos: { include: { grupo: { select: { roles: true, activo: true } } } } },
    });
    if (!usuario || !usuario.activo) return { usuario: null, ...base };
    const rolesEfectivos = new Set(JSON.parse(usuario.roles || '[]'));
    for (const m of usuario.membresiaGrupos || []) {
      if (!m.grupo?.activo) continue;
      try { JSON.parse(m.grupo.roles || '[]').forEach((r) => rolesEfectivos.add(r)); } catch { /* skip */ }
    }
    if (usuario.rolInterno === 'admin') rolesEfectivos.add('admin');
    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        username: usuario.username,
        rolInterno: usuario.rolInterno,
        esSuperAdmin: usuario.esSuperAdmin,
        roles: [...rolesEfectivos],
        dominioActualId: usuario.dominioActualId,
      },
      sesionValida: true,
      ...base,
    };
  } catch {
    return { usuario: null, ...base };
  }
}

// Construye el objeto gs para el sandbox a partir del contexto de sesión
function construirGs(ctx, logsCaptura) {
  const u = ctx?.usuario || null;
  return {
    user: () => u,
    userId: () => u?.id || null,
    userName: () => u?.username || u?.email || null,
    userEmail: () => u?.email || null,
    nombreCompleto: () => u?.nombre || null,
    roles: () => u?.roles || [],
    tieneRol: (rol) => !!u && (u.roles || []).includes(rol),
    esAdmin: () => !!u && (u.rolInterno === 'admin' || u.esSuperAdmin),
    sesionValida: () => !!ctx?.sesionValida,
    tracking: () => ctx?.tracking || {},
    log: (...a) => logsCaptura?.push(a.map(String).join(' ')),
  };
}

module.exports = { contextoSesion, construirGs };
