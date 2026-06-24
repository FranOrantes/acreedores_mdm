const webpush = require('web-push');
const prisma = require('./prisma');

// Configurar VAPID keys desde variables de entorno
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@mdmportal.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] VAPID configurado correctamente');
} else {
  console.warn('[Push] VAPID keys no configuradas. Push notifications deshabilitadas.');
}

/**
 * Enviar notificación push a un usuario específico
 * @param {string} usuarioId - ID del usuario destinatario
 * @param {object} payload - { title, body, icon, url, tag }
 */
async function enviarPushAUsuario(usuarioId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { usuarioId, activo: true },
    });

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title || 'MDM Portal',
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      url: payload.url || '/',
      tag: payload.tag || 'default',
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );
        } catch (err) {
          // Si el endpoint ya no es válido (410 Gone o 404), desactivar
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { activo: false },
            });
            console.log(`[Push] Subscription ${sub.id} desactivada (expirada)`);
          } else {
            console.error(`[Push] Error enviando a ${sub.id}:`, err.message);
          }
        }
      })
    );

    return results;
  } catch (err) {
    console.error('[Push] Error general:', err.message);
  }
}

/**
 * Enviar notificación a múltiples usuarios
 * @param {string[]} usuarioIds
 * @param {object} payload
 */
async function enviarPushAUsuarios(usuarioIds, payload) {
  await Promise.allSettled(
    usuarioIds.map((id) => enviarPushAUsuario(id, payload))
  );
}

/**
 * Obtener la VAPID public key para el frontend
 */
function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY || null;
}

module.exports = {
  enviarPushAUsuario,
  enviarPushAUsuarios,
  getVapidPublicKey,
};
