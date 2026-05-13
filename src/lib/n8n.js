const axios = require('axios');

// ── URLs de webhooks de n8n ──
// TODO: Mover a variables de entorno (.env) en producción
const N8N_WEBHOOKS = {
  solicitudCreada:      process.env.N8N_WEBHOOK_SOLICITUD_CREADA      || 'https://acreedores-flujo.app.n8n.cloud/webhook/40058344-3366-4216-8fa6-3a4d5fe9b97d',
  aprobacionAprobada:   process.env.N8N_WEBHOOK_APROBACION_APROBADA   || 'https://TU_INSTANCIA_N8N.com/webhook/aprobacion-aprobada',
  aprobacionRechazada:  process.env.N8N_WEBHOOK_APROBACION_RECHAZADA  || 'https://TU_INSTANCIA_N8N.com/webhook/aprobacion-rechazada',
};

/**
 * Dispara un webhook POST a n8n de forma async (fire-and-forget).
 * No bloquea el response al usuario; los errores se logean pero no rompen el flujo.
 *
 * @param {'solicitudCreada'|'aprobacionAprobada'|'aprobacionRechazada'} evento
 * @param {Object} payload - datos a enviar al webhook
 */
async function notificarN8N(evento, payload) {
  const url = N8N_WEBHOOKS[evento];
  if (!url || url.includes('TU_INSTANCIA_N8N')) {
    // Webhook no configurado; loguear y salir sin error
    console.log(`[n8n] Webhook "${evento}" no configurado, se omite la notificación.`);
    return;
  }

  try {
    const response = await axios.post(url, {
      evento,
      timestamp: new Date().toISOString(),
      ...payload,
    }, {
      timeout: 10000, // 10s timeout
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`[n8n] Webhook "${evento}" enviado OK → ${response.status}`);
  } catch (error) {
    // No relanzar — el error de n8n no debe afectar al usuario
    console.error(`[n8n] Error al enviar webhook "${evento}":`, error.message);
  }
}

module.exports = { notificarN8N, N8N_WEBHOOKS };
