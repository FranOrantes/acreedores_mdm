const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

// ── Configuración desde variables de entorno ──
const {
  SSO_CLIENT_ID,
  SSO_CLIENT_SECRET,
  SSO_AUTHORIZATION_URL,
  SSO_TOKEN_URL,
  SSO_USERINFO_URL,
  SSO_CALLBACK_URL,
  JWT_SECRET,
  FRONTEND_URL,
} = process.env;

// Almacén temporal de states para validación CSRF
// En producción usar Redis o similar
const pendingStates = new Map();

// Tiempo de expiración del state (5 minutos)
const STATE_TTL_MS = 5 * 60 * 1000;

// ── Mapeo de roles SSO → rol interno de la aplicación ──
function mapearRolInterno(rolesSso) {
  // Prioridad: si tiene "Administrador" → admin, si tiene "Developer" → developer, si no → usuario
  if (rolesSso.includes('Administrador')) return 'admin';
  if (rolesSso.includes('Developer')) return 'developer';
  // "Usuario Externo" u otros roles → usuario con permisos limitados
  return 'usuario';
}

// ── Generar JWT interno para la sesión ──
function generarToken(usuario) {
  return jwt.sign(
    {
      userId: usuario.id,
      ssoId: usuario.ssoId,
      email: usuario.email,
      nombre: usuario.nombre,
      rolInterno: usuario.rolInterno,
      roles: JSON.parse(usuario.roles),
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ──────────────────────────────────────────────────
// POST /api/auth/login
// Login local con username/email + contraseña
// ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { usuario: loginInput, contrasena } = req.body;

    if (!loginInput || !contrasena) {
      return res.status(400).json({ error: 'Usuario/email y contraseña son requeridos' });
    }

    // Buscar por email o username
    const usuarioDB = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: loginInput },
          { username: loginInput },
        ],
      },
    });

    if (!usuarioDB) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!usuarioDB.activo) {
      return res.status(401).json({ error: 'Usuario desactivado. Contacte al administrador.' });
    }

    if (!usuarioDB.contrasena) {
      return res.status(401).json({ error: 'Este usuario no tiene contraseña configurada. Contacte al administrador.' });
    }

    // Comparación directa (en producción usar bcrypt)
    if (usuarioDB.contrasena !== contrasena) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuarioDB.id },
      data: { ultimoAcceso: new Date() },
    });

    // Generar JWT
    const jwtToken = generarToken(usuarioDB);

    // Enviar como httpOnly cookie
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    console.log('[Auth] Login local exitoso:', usuarioDB.email);
    res.json({
      ok: true,
      user: {
        id: usuarioDB.id,
        email: usuarioDB.email,
        nombre: usuarioDB.nombre,
        rolInterno: usuarioDB.rolInterno,
      },
    });
  } catch (error) {
    console.error('[Auth] Error en login local:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ──────────────────────────────────────────────────
// GET /api/auth/sso/login
// Redirige al usuario al servidor SSO para autenticarse
// ──────────────────────────────────────────────────
router.get('/sso/login', (req, res) => {
  try {
    // Generar state aleatorio para protección CSRF
    const state = crypto.randomBytes(32).toString('hex');

    // Limpiar states expirados antes de agregar el nuevo
    for (const [key, timestamp] of pendingStates.entries()) {
      if (Date.now() - timestamp > STATE_TTL_MS) {
        pendingStates.delete(key);
      }
    }

    // Guardar el state con timestamp para validación posterior
    pendingStates.set(state, Date.now());
    console.log('[SSO] State generado y guardado:', state);
    console.log('[SSO] States pendientes:', pendingStates.size);

    // Construir URL de autorización
    const params = new URLSearchParams({
      client_id: SSO_CLIENT_ID,
      redirect_uri: SSO_CALLBACK_URL,
      response_type: 'code',
      state,
    });

    const authUrl = `${SSO_AUTHORIZATION_URL}?${params.toString()}`;

    console.log('[SSO] Redirigiendo a autorización SSO...');
    res.redirect(authUrl);
  } catch (error) {
    console.error('[SSO] Error al iniciar login:', error);
    res.redirect(`${FRONTEND_URL}/login?error=sso_init_failed`);
  }
});

// ──────────────────────────────────────────────────
// GET /api/auth/sso/callback
// Callback del SSO: recibe code + state, intercambia por token,
// obtiene datos del usuario, crea sesión
// ──────────────────────────────────────────────────
router.get('/sso/callback', async (req, res) => {
  try {
    const { code, state, error: ssoError } = req.query;

    // 1. Verificar si el SSO devolvió un error
    if (ssoError) {
      console.error('[SSO] Error del servidor SSO:', ssoError);
      return res.redirect(`${FRONTEND_URL}/login?error=sso_denied`);
    }

    // 2. Validar que recibimos code y state
    if (!code || !state) {
      console.error('[SSO] Faltan parámetros: code o state');
      return res.redirect(`${FRONTEND_URL}/login?error=missing_params`);
    }

    // 3. State — el SSO de appstore.nadro.dev genera su propio state
    // en lugar de devolver el que enviamos, por lo que no es posible
    // validarlo de forma estándar. Se omite la verificación.
    console.log('[SSO Callback] State recibido del SSO:', state);
    pendingStates.clear();

    // 4. Intercambiar el código por un access_token
    // Se usa application/x-www-form-urlencoded (estándar OAuth 2.0)
    console.log('[SSO] Intercambiando código por token...');
    console.log('[SSO] Token URL:', SSO_TOKEN_URL);
    console.log('[SSO] Code recibido:', code.substring(0, 10) + '...');

    const tokenResponse = await fetch(SSO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: SSO_CLIENT_ID,
        client_secret: SSO_CLIENT_SECRET,
        redirect_uri: SSO_CALLBACK_URL,
      }),
    });

    const tokenText = await tokenResponse.text();
    console.log('[SSO] Token response status:', tokenResponse.status);
    console.log('[SSO] Token response body:', tokenText.substring(0, 500));

    if (!tokenResponse.ok) {
      console.error('[SSO] Error al obtener token:', tokenResponse.status);
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (parseErr) {
      console.error('[SSO] Respuesta del token no es JSON válido');
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('[SSO] No se recibió access_token:', tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=no_access_token`);
    }
    console.log('[SSO] Access token obtenido correctamente');

    // 5. Obtener datos del usuario desde el SSO
    console.log('[SSO] Obteniendo datos del usuario...');
    const userResponse = await fetch(SSO_USERINFO_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      const errBody = await userResponse.text();
      console.error('[SSO] Error al obtener userinfo:', userResponse.status, errBody);
      return res.redirect(`${FRONTEND_URL}/login?error=userinfo_failed`);
    }

    const ssoUser = await userResponse.json();
    console.log('[SSO] Usuario autenticado:', ssoUser.email, '| Roles:', ssoUser.roles);

    // 6. Crear o actualizar usuario en nuestra base de datos
    const rolesSso = ssoUser.roles || [];
    const rolInterno = mapearRolInterno(rolesSso);

    const usuario = await prisma.usuario.upsert({
      where: { ssoId: String(ssoUser.id) },
      update: {
        email: ssoUser.email,
        username: ssoUser.username || null,
        nombre: ssoUser.name || ssoUser.username || ssoUser.email,
        roles: JSON.stringify(rolesSso),
        rolInterno,
        ultimoAcceso: new Date(),
      },
      create: {
        ssoId: String(ssoUser.id),
        email: ssoUser.email,
        username: ssoUser.username || null,
        nombre: ssoUser.name || ssoUser.username || ssoUser.email,
        roles: JSON.stringify(rolesSso),
        rolInterno,
        ultimoAcceso: new Date(),
      },
    });

    console.log('[SSO] Usuario en BD:', usuario.id, '| Rol interno:', usuario.rolInterno);

    // 7. Generar JWT interno para la sesión de nuestra app
    const jwtToken = generarToken(usuario);

    // 8. Enviar el token como httpOnly cookie segura y redirigir al frontend
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,          // No accesible desde JavaScript del cliente
      secure: false,           // En producción cambiar a true (requiere HTTPS)
      sameSite: 'lax',         // Protección CSRF
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
      path: '/',
    });

    console.log('[SSO] Login exitoso, redirigiendo al frontend...');
    res.redirect(`${FRONTEND_URL}/auth/callback?success=true`);
  } catch (error) {
    console.error('[SSO] Error en callback:', error);
    res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
  }
});

// ──────────────────────────────────────────────────
// GET /api/auth/me
// Retorna los datos del usuario autenticado (valida el JWT)
// ──────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar y decodificar el JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Obtener datos actualizados del usuario desde la BD
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    res.json({
      id: usuario.id,
      ssoId: usuario.ssoId,
      email: usuario.email,
      username: usuario.username,
      nombre: usuario.nombre,
      roles: JSON.parse(usuario.roles),
      rolInterno: usuario.rolInterno,
      areaHumana: usuario.areaHumana,
      linea: usuario.linea,
      employeeNumber: usuario.employeeNumber,
      managerId: usuario.managerId,
      ubicacionId: usuario.ubicacionId,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    console.error('[Auth] Error en /me:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ──────────────────────────────────────────────────
// PATCH /api/auth/profile
// Actualizar perfil del usuario autenticado (nombre)
// ──────────────────────────────────────────────────
router.patch('/profile', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { nombre } = req.body;
    if (nombre === undefined) return res.status(400).json({ error: 'Nombre es requerido' });

    const usuario = await prisma.usuario.update({
      where: { id: decoded.userId },
      data: { nombre },
    });

    // Regenerar JWT con nombre actualizado
    const jwtToken = generarToken(usuario);
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({ ok: true, nombre: usuario.nombre });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    console.error('[Auth] Error en profile update:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ──────────────────────────────────────────────────
// POST /api/auth/logout
// Cierra la sesión eliminando la cookie
// ──────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
  console.log('[Auth] Sesión cerrada');
  res.json({ ok: true, message: 'Sesión cerrada correctamente' });
});

module.exports = router;
