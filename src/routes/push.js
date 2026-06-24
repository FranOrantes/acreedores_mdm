const express = require('express');
const prisma = require('../lib/prisma');
const { getVapidPublicKey } = require('../lib/pushNotifications');

const router = express.Router();

// Obtener VAPID public key (necesaria para el frontend)
router.get('/vapid-public-key', (req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: 'Push notifications no configuradas' });
  }
  res.json({ publicKey: key });
});

// Suscribirse a push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }

    // Necesitamos el usuario autenticado
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Upsert: si ya existe el endpoint, actualizar; si no, crear
    const data = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        activo: true,
        usuarioId: req.userId,
      },
      create: {
        usuarioId: req.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ id: data.id, message: 'Suscripción registrada' });
  } catch (err) {
    console.error('[Push] Error al suscribir:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Desuscribirse
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint requerido' });
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { activo: false },
    });

    res.json({ message: 'Desuscripción exitosa' });
  } catch (err) {
    console.error('[Push] Error al desuscribir:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Estado de suscripción del usuario actual
router.get('/status', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const count = await prisma.pushSubscription.count({
      where: { usuarioId: req.userId, activo: true },
    });

    res.json({ subscribed: count > 0, activeSubscriptions: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
