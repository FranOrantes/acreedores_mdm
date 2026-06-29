const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

const WEBHOOK_SECRET = process.env.LOGS_WEBHOOK_SECRET || '';

// ── Middleware: validar webhook secret ──
function validarWebhookSecret(req, res, next) {
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'LOGS_WEBHOOK_SECRET no configurado en el servidor' });
  }
  const secret = req.headers['x-webhook-secret'];
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Webhook secret inválido' });
  }
  next();
}

// ══════════════════════════════════════════════════
// WEBHOOKS (sin auth de usuario, protegidos por secret)
// ══════════════════════════════════════════════════

// POST /api/logs/webhook/sistema — Registrar log del sistema desde n8n
router.post('/webhook/sistema', validarWebhookSecret, async (req, res) => {
  try {
    const { tipo, accion, detalle, nivel, usuarioId, usuarioEmail, usuarioNombre, entidadTipo, entidadId, metadata } = req.body;

    if (!tipo || !accion) {
      return res.status(400).json({ error: 'tipo y accion son requeridos' });
    }

    const log = await prisma.logSistema.create({
      data: {
        tipo,
        accion,
        detalle: detalle || null,
        nivel: nivel || 'info',
        usuarioId: usuarioId || null,
        usuarioEmail: usuarioEmail || null,
        usuarioNombre: usuarioNombre || null,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: 'n8n-webhook',
        entidadTipo: entidadTipo || null,
        entidadId: entidadId || null,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    });

    res.status(201).json({ ok: true, id: log.id });
  } catch (e) {
    console.error('[Logs Webhook] Error al registrar log sistema:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/logs/webhook/email — Registrar log de email desde n8n
router.post('/webhook/email', validarWebhookSecret, async (req, res) => {
  try {
    const { asunto, destinatarios, cc, cco, bodyHtml, bodyTexto, remitente, estado, error: errorMsg, solicitudId, usuarioId, metadata } = req.body;

    if (!asunto || !destinatarios) {
      return res.status(400).json({ error: 'asunto y destinatarios son requeridos' });
    }

    const log = await prisma.logEmail.create({
      data: {
        asunto,
        destinatarios: Array.isArray(destinatarios) ? JSON.stringify(destinatarios) : destinatarios,
        cc: cc ? (Array.isArray(cc) ? JSON.stringify(cc) : cc) : null,
        cco: cco ? (Array.isArray(cco) ? JSON.stringify(cco) : cco) : null,
        bodyHtml: bodyHtml || null,
        bodyTexto: bodyTexto || null,
        remitente: remitente || null,
        estado: estado || 'enviado',
        error: errorMsg || null,
        solicitudId: solicitudId || null,
        usuarioId: usuarioId || null,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    });

    res.status(201).json({ ok: true, id: log.id });
  } catch (e) {
    console.error('[Logs Webhook] Error al registrar log email:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
// RUTAS ADMIN (requieren auth de usuario)
// ══════════════════════════════════════════════════

// Middleware: solo admin puede ver logs
function soloAdmin(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
  prisma.usuario.findUnique({ where: { id: req.userId }, select: { rolInterno: true, esSuperAdmin: true } })
    .then((u) => {
      if (!u || (u.rolInterno !== 'admin' && !u.esSuperAdmin)) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: 'Error de autenticación' }));
}

router.use(soloAdmin);

// GET /api/logs/sistema — Listar logs del sistema con filtros y paginación
router.get('/sistema', async (req, res) => {
  try {
    const { tipo, nivel, usuarioId, desde, hasta, buscar, page = 1, limit = 50 } = req.query;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (nivel) where.nivel = nivel;
    if (usuarioId) where.usuarioId = usuarioId;

    if (desde || hasta) {
      where.creadoEn = {};
      if (desde) where.creadoEn.gte = new Date(desde);
      if (hasta) where.creadoEn.lte = new Date(hasta);
    }

    if (buscar) {
      where.OR = [
        { accion: { contains: buscar, mode: 'insensitive' } },
        { detalle: { contains: buscar, mode: 'insensitive' } },
        { usuarioEmail: { contains: buscar, mode: 'insensitive' } },
        { usuarioNombre: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      prisma.logSistema.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.logSistema.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error('[Logs] Error al listar logs sistema:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/logs/emails — Listar logs de email con filtros y paginación
router.get('/emails', async (req, res) => {
  try {
    const { estado, solicitudId, desde, hasta, buscar, page = 1, limit = 50 } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (solicitudId) where.solicitudId = solicitudId;

    if (desde || hasta) {
      where.creadoEn = {};
      if (desde) where.creadoEn.gte = new Date(desde);
      if (hasta) where.creadoEn.lte = new Date(hasta);
    }

    if (buscar) {
      where.OR = [
        { asunto: { contains: buscar, mode: 'insensitive' } },
        { destinatarios: { contains: buscar, mode: 'insensitive' } },
        { remitente: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      prisma.logEmail.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          asunto: true,
          destinatarios: true,
          cc: true,
          remitente: true,
          estado: true,
          error: true,
          solicitudId: true,
          creadoEn: true,
        },
      }),
      prisma.logEmail.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error('[Logs] Error al listar logs email:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/logs/emails/:id — Detalle de un email (incluye body HTML)
router.get('/emails/:id', async (req, res) => {
  try {
    const email = await prisma.logEmail.findUnique({ where: { id: req.params.id } });
    if (!email) return res.status(404).json({ error: 'Log de email no encontrado' });
    res.json(email);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/logs/sistema/stats — Estadísticas rápidas
router.get('/sistema/stats', async (req, res) => {
  try {
    const [totalLogins, totalImpersonaciones, totalErrores, totalEmails] = await Promise.all([
      prisma.logSistema.count({ where: { tipo: 'login' } }),
      prisma.logSistema.count({ where: { tipo: 'impersonacion' } }),
      prisma.logSistema.count({ where: { nivel: 'error' } }),
      prisma.logEmail.count(),
    ]);
    res.json({ totalLogins, totalImpersonaciones, totalErrores, totalEmails });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
