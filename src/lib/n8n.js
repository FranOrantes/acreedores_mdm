const axios = require('axios');

// ── URLs de webhooks de n8n ──
// Flujos independientes por módulo: acreedores y proveedores tienen sus propios webhooks
const N8N_WEBHOOKS = {
  // ── Acreedores ──
  acreedores: {
    solicitudCreada:     process.env.N8N_WEBHOOK_ACR_SOLICITUD_CREADA     || 'https://n8n.tudespensia.com/webhook/40058344-3366-4216-8fa6-3a4d5fe9b97d',
    aprobacionAprobada:  process.env.N8N_WEBHOOK_ACR_APROBACION_APROBADA  || 'https://TU_INSTANCIA_N8N.com/webhook/acr-aprobacion-aprobada',
    aprobacionRechazada: process.env.N8N_WEBHOOK_ACR_APROBACION_RECHAZADA || 'https://TU_INSTANCIA_N8N.com/webhook/acr-aprobacion-rechazada',
  },
  // ── Proveedores ──
  proveedores: {
    solicitudCreada:     process.env.N8N_WEBHOOK_PROV_SOLICITUD_CREADA     || 'https://TU_INSTANCIA_N8N.com/webhook/prov-solicitud-creada',
    aprobacionAprobada:  process.env.N8N_WEBHOOK_PROV_APROBACION_APROBADA  || 'https://TU_INSTANCIA_N8N.com/webhook/prov-aprobacion-aprobada',
    aprobacionRechazada: process.env.N8N_WEBHOOK_PROV_APROBACION_RECHAZADA || 'https://TU_INSTANCIA_N8N.com/webhook/prov-aprobacion-rechazada',
  },
};

// Backward compat: variables .env antiguas siguen funcionando para acreedores
if (process.env.N8N_WEBHOOK_SOLICITUD_CREADA) N8N_WEBHOOKS.acreedores.solicitudCreada = process.env.N8N_WEBHOOK_SOLICITUD_CREADA;
if (process.env.N8N_WEBHOOK_APROBACION_APROBADA) N8N_WEBHOOKS.acreedores.aprobacionAprobada = process.env.N8N_WEBHOOK_APROBACION_APROBADA;
if (process.env.N8N_WEBHOOK_APROBACION_RECHAZADA) N8N_WEBHOOKS.acreedores.aprobacionRechazada = process.env.N8N_WEBHOOK_APROBACION_RECHAZADA;

/**
 * Dispara un webhook POST a n8n de forma async (fire-and-forget).
 * No bloquea el response al usuario; los errores se logean pero no rompen el flujo.
 * Rutea al webhook correcto según el módulo (acreedores o proveedores).
 *
 * @param {'solicitudCreada'|'aprobacionAprobada'|'aprobacionRechazada'} evento
 * @param {Object} payload - datos a enviar al webhook (debe incluir `modulo`)
 */
async function notificarN8N(evento, payload) {
  const modulo = payload?.modulo === 'proveedores' ? 'proveedores' : 'acreedores';
  const webhooksModulo = N8N_WEBHOOKS[modulo];
  const url = webhooksModulo?.[evento];

  if (!url || url.includes('TU_INSTANCIA_N8N')) {
    console.log(`[n8n:${modulo}] Webhook "${evento}" no configurado, se omite la notificación.`);
    return;
  }

  try {
    const response = await axios.post(url, {
      evento,
      modulo,
      timestamp: new Date().toISOString(),
      ...payload,
    }, {
      timeout: 10000, // 10s timeout
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`[n8n:${modulo}] Webhook "${evento}" enviado OK → ${response.status}`);
  } catch (error) {
    console.error(`[n8n:${modulo}] Error al enviar webhook "${evento}":`, error.message);
  }
}

module.exports = { notificarN8N, N8N_WEBHOOKS };
