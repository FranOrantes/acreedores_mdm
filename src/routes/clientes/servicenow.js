const axios = require('axios');

// ─── ServiceNow Config ───────────────────────────────────────────────────────
const SERVICENOW_BASE_URL = process.env.SERVICENOW_BASE_URL || 'https://nadrocomercialtest.service-now.com';
const SERVICENOW_USER = process.env.SERVICENOW_USER || '';
const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD || '';

// Filtro base: tareas del catalog item "Verificación por Responsables Sanitarios"
const CAT_ITEM_SYS_ID = '814d8aee1ba3305019b9542d1e4bcbfe';
const BASE_QUERY = `request_item.cat_item=${CAT_ITEM_SYS_ID}^short_description=Verificación por Responsables Sanitarios`;

const snowClient = axios.create({
  baseURL: SERVICENOW_BASE_URL,
  auth: {
    username: SERVICENOW_USER,
    password: SERVICENOW_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Listado (lightweight) ───────────────────────────────────────────────────

async function getTareas(params = {}) {
  const queryParts = [BASE_QUERY];
  if (params.state) queryParts.push(`state=${params.state}`);
  queryParts.push('ORDERBYDESCopened_at');

  const response = await snowClient.get('/api/now/table/sc_task', {
    params: {
      sysparm_query: queryParts.join('^'),
      sysparm_display_value: 'true',
      sysparm_fields: 'sys_id,number,opened_at,state,opened_by,short_description,assignment_group,assigned_to,request_item,sys_created_on',
      sysparm_limit: params.limit || 100,
      sysparm_offset: params.offset || 0,
    },
  });
  return response.data.result;
}

// ─── Detalle completo + attachments ──────────────────────────────────────────

async function getTareaById(sysId) {
  const [tareaRes, attachRes] = await Promise.all([
    snowClient.get(`/api/now/table/sc_task/${sysId}`, {
      params: {
        sysparm_display_value: 'all',
      },
    }),
    snowClient.get('/api/now/attachment', {
      params: {
        sysparm_query: `table_sys_id=${sysId}`,
        sysparm_fields: 'sys_id,file_name,size_bytes,content_type,sys_created_on',
      },
    }),
  ]);

  const tarea = tareaRes.data.result;
  const attachments = (attachRes.data.result || []).map((att) => ({
    sys_id: att.sys_id,
    file_name: att.file_name,
    size_bytes: parseInt(att.size_bytes || '0', 10),
    content_type: att.content_type,
    created_on: att.sys_created_on,
    download_url: `/api/clientes/tareas/${sysId}/attachments/${att.sys_id}/file`,
  }));

  return { ...tarea, attachments };
}

// ─── Update ──────────────────────────────────────────────────────────────────

async function updateTarea(sysId, fields) {
  const response = await snowClient.patch(`/api/now/table/sc_task/${sysId}`, fields, {
    params: { sysparm_display_value: 'all' },
  });
  return response.data.result;
}

// ─── Cerrar tarea ────────────────────────────────────────────────────────────

async function cerrarTarea(sysId, payload) {
  const response = await snowClient.patch(`/api/now/table/sc_task/${sysId}`, {
    state: '3',
    close_notes: payload.notas || '',
    ...payload.extraFields,
  }, {
    params: { sysparm_display_value: 'all' },
  });
  return response.data.result;
}

// ─── Attachment stream (proxy) ───────────────────────────────────────────────

async function getAttachmentStream(attSysId) {
  const response = await snowClient.get(`/api/now/attachment/${attSysId}/file`, {
    responseType: 'stream',
  });
  return {
    stream: response.data,
    contentType: response.headers['content-type'] || 'application/octet-stream',
    contentDisposition: response.headers['content-disposition'] || null,
  };
}

module.exports = {
  getTareas,
  getTareaById,
  updateTarea,
  cerrarTarea,
  getAttachmentStream,
};
