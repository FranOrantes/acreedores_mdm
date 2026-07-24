const axios = require('axios');

const SERVICENOW_BASE_URL = process.env.SERVICENOW_BASE_URL || '';
const SERVICENOW_USER = process.env.SERVICENOW_USER || '';
const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD || '';

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

/**
 * Get all tasks from ServiceNow
 * TODO: Replace with actual ServiceNow table/API endpoint
 */
async function getTareas(params = {}) {
  // TODO: Replace with real ServiceNow endpoint when available
  // const response = await snowClient.get('/api/now/table/sc_task', { params });
  // return response.data.result;

  return getMockTareas();
}

/**
 * Get a single task by sys_id from ServiceNow
 */
async function getTareaById(sysId) {
  // TODO: Replace with real ServiceNow endpoint when available
  // const response = await snowClient.get(`/api/now/table/sc_task/${sysId}`);
  // return response.data.result;

  const tareas = getMockTareas();
  return tareas.find((t) => t.sys_id === sysId) || null;
}

/**
 * Update task fields in ServiceNow
 */
async function updateTarea(sysId, fields) {
  // TODO: Replace with real ServiceNow endpoint when available
  // const response = await snowClient.patch(`/api/now/table/sc_task/${sysId}`, fields);
  // return response.data.result;

  const tarea = await getTareaById(sysId);
  if (!tarea) return null;
  return { ...tarea, ...fields, updatedAt: new Date().toISOString() };
}

/**
 * Close a task in ServiceNow
 */
async function cerrarTarea(sysId, payload) {
  // TODO: Replace with real ServiceNow endpoint when available
  // const response = await snowClient.patch(`/api/now/table/sc_task/${sysId}`, {
  //   state: 'closed_complete',
  //   ...payload,
  // });
  // return response.data.result;

  const tarea = await getTareaById(sysId);
  if (!tarea) return null;
  return { ...tarea, state: 'closed_complete', ...payload, closedAt: new Date().toISOString() };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function getMockTareas() {
  return [
    {
      sys_id: 'task-001',
      number: '71-2029-089',
      short_description: 'Client Onboarding - Mexico',
      state: 'in_progress',
      priority: '2',
      assigned_to: 'Juan Pérez',
      opened_at: '2024-10-01T10:00:00Z',
      business_data: {
        rfc: 'ABC12345GXYZ',
        business_name: 'Global Logistics Solutions S.A. de C.',
        fiscal_regimen: '601 - General de Ley Personas Morales',
      },
      fiscal_residency: {
        full_address: 'Av. Insurgentes Sur 1602, Col. Crédito Constructor, Benito Juárez, CDMX, CP 03940',
      },
      delivery_address: {
        full_address: 'Blvd. Manuel Ávila Camacho 40, Lomas de Chapultepec, Miguel Hidalgo, CDMX, CP 11000',
        same_as_fiscal: false,
      },
      regulatory_issues: {
        licencia_sanitaria: true,
        fin_validez: '9999-12-31',
        atributo_6: 'No Autorizado',
        atributo_7: 'Biotecnológicos',
        atributo_8: 'No Autorizado',
        institucion_lic_sanitaria: '',
        atributo_9a: '',
        atributo_9b: 'Grupo IV, V y VI',
        familia_2: 'Si',
        clase_id: '',
        valido_de: '2024-12-03',
        informacion_valida: 'Si',
      },
      attachments: [
        { sys_id: 'att-001', file_name: 'Constancia_Fisc.pdf', size_bytes: 5662310, content_type: 'application/pdf', created_on: '2023-10-14T08:30:00Z' },
        { sys_id: 'att-002', file_name: 'Comprobante_D.pdf', size_bytes: 460800, content_type: 'application/pdf', created_on: '2023-10-14T09:15:00Z' },
      ],
    },
    {
      sys_id: 'task-002',
      number: '71-2029-090',
      short_description: 'Client Onboarding - Guadalajara',
      state: 'open',
      priority: '3',
      assigned_to: 'María López',
      opened_at: '2024-10-05T14:00:00Z',
      business_data: {
        rfc: 'XYZ987654ABC',
        business_name: 'Distribuidora del Norte S.A.',
        fiscal_regimen: '603 - Personas Morales con Fines no Lucrativos',
      },
      fiscal_residency: {
        full_address: 'Av. Vallarta 3233, Col. Vallarta Poniente, Guadalajara, JAL, CP 44110',
      },
      delivery_address: {
        full_address: '',
        same_as_fiscal: true,
      },
      regulatory_issues: {
        licencia_sanitaria: false,
        fin_validez: '',
        atributo_6: '',
        atributo_7: '',
        atributo_8: '',
        institucion_lic_sanitaria: '',
        atributo_9a: '',
        atributo_9b: '',
        familia_2: 'No',
        clase_id: '',
        valido_de: '',
        informacion_valida: 'No',
      },
      attachments: [],
    },
    {
      sys_id: 'task-003',
      number: '71-2029-085',
      short_description: 'Client Onboarding - Monterrey',
      state: 'closed_complete',
      priority: '1',
      assigned_to: 'Carlos García',
      opened_at: '2024-09-15T09:00:00Z',
      business_data: {
        rfc: 'MON456789DEF',
        business_name: 'Tecnología Avanzada de Monterrey S.A. de C.V.',
        fiscal_regimen: '601 - General de Ley Personas Morales',
      },
      fiscal_residency: {
        full_address: 'Av. Constitución 2050, Centro, Monterrey, NL, CP 64000',
      },
      delivery_address: {
        full_address: 'Av. Constitución 2050, Centro, Monterrey, NL, CP 64000',
        same_as_fiscal: true,
      },
      regulatory_issues: {
        licencia_sanitaria: true,
        fin_validez: '2025-06-30',
        atributo_6: 'Autorizado',
        atributo_7: '',
        atributo_8: '',
        institucion_lic_sanitaria: 'COFEPRIS',
        atributo_9a: 'Grupo I',
        atributo_9b: '',
        familia_2: 'Si',
        clase_id: 'Z00001 Licencia Sanitaria',
        valido_de: '2023-07-01',
        informacion_valida: 'Si',
      },
      attachments: [
        { sys_id: 'att-003', file_name: 'Lic_Sanitaria.pdf', size_bytes: 2300000, content_type: 'application/pdf', created_on: '2024-09-15T09:30:00Z' },
      ],
    },
  ];
}

module.exports = {
  getTareas,
  getTareaById,
  updateTarea,
  cerrarTarea,
};
