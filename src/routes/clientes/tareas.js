const { Router } = require('express');
const servicenow = require('./servicenow');

const router = Router();

// GET /api/clientes/tareas — List all tasks
router.get('/', async (req, res) => {
  try {
    const tareas = await servicenow.getTareas(req.query);
    res.json(tareas);
  } catch (err) {
    console.error('[Clientes/Tareas] Error fetching tasks:', err.message);
    if (err.response) {
      console.error('[Clientes/Tareas] ServiceNow status:', err.response.status);
      console.error('[Clientes/Tareas] ServiceNow data:', JSON.stringify(err.response.data).substring(0, 500));
    }
    console.error('[Clientes/Tareas] SERVICENOW_BASE_URL:', process.env.SERVICENOW_BASE_URL || '(not set)');
    console.error('[Clientes/Tareas] SERVICENOW_USER:', process.env.SERVICENOW_USER ? '✓ set' : '✗ NOT set');
    console.error('[Clientes/Tareas] SERVICENOW_PASSWORD:', process.env.SERVICENOW_PASSWORD ? '✓ set' : '✗ NOT set');
    res.status(err.response?.status || 500).json({
      error: 'Error al obtener tareas de ServiceNow',
      detail: err.message,
      snowStatus: err.response?.status || null,
    });
  }
});

// GET /api/clientes/tareas/:sysId — Get single task detail + variables/campos
router.get('/:sysId', async (req, res) => {
  try {
    const [tarea, detalle] = await Promise.all([
      servicenow.getTareaById(req.params.sysId),
      servicenow.getDetalleTarea(req.params.sysId).catch((err) => {
        console.warn('[Clientes/Tareas] Detalle API failed, continuing without it:', err.message);
        return {};
      }),
    ]);
    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    // Rewrite adjuntos download_link to local proxy URLs
    const adjuntos = (detalle.adjuntos || []).map((adj, i) => ({
      ...adj,
      download_url: `/api/clientes/tareas/${req.params.sysId}/adjuntos/${i}/file`,
    }));

    res.json({
      ...tarea,
      tabs: detalle.tabs || [],
      adjuntos,
    });
  } catch (err) {
    console.error('[Clientes/Tareas] Error fetching task:', err.message);
    res.status(500).json({ error: 'Error al obtener tarea de ServiceNow' });
  }
});

// PATCH /api/clientes/tareas/:sysId — Update task fields
router.patch('/:sysId', async (req, res) => {
  try {
    const updated = await servicenow.updateTarea(req.params.sysId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(updated);
  } catch (err) {
    console.error('[Clientes/Tareas] Error updating task:', err.message);
    res.status(500).json({ error: 'Error al actualizar tarea en ServiceNow' });
  }
});

// GET /api/clientes/tareas/:sysId/adjuntos/:idx/file — Proxy download for custom API adjuntos
router.get('/:sysId/adjuntos/:idx/file', async (req, res) => {
  try {
    const { sysId, idx } = req.params;
    const detalle = await servicenow.getDetalleTarea(sysId);
    const adjuntos = detalle.adjuntos || [];
    const adjunto = adjuntos[parseInt(idx, 10)];

    if (!adjunto || !adjunto.download_link) {
      return res.status(404).json({ error: 'Adjunto no encontrado' });
    }

    const { stream, contentType, contentDisposition } = await servicenow.proxyDownload(adjunto.download_link);

    res.set('Content-Type', contentType);
    if (contentDisposition) {
      res.set('Content-Disposition', contentDisposition);
    } else {
      res.set('Content-Disposition', `inline; filename="${adjunto.filename || 'archivo'}"`);
    }

    stream.pipe(res);
  } catch (err) {
    console.error('[Clientes/Adjuntos] Error downloading:', err.message);
    res.status(500).json({ error: 'Error al descargar adjunto de ServiceNow' });
  }
});

// GET /api/clientes/tareas/:sysId/attachments/:attSysId/file — Stream attachment (download/preview)
router.get('/:sysId/attachments/:attSysId/file', async (req, res) => {
  try {
    const { attSysId } = req.params;
    const { stream, contentType, contentDisposition } = await servicenow.getAttachmentStream(attSysId);

    res.set('Content-Type', contentType);
    if (contentDisposition) {
      res.set('Content-Disposition', contentDisposition);
    }

    stream.pipe(res);
  } catch (err) {
    console.error('[Clientes/Attachments] Error downloading:', err.message);
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Attachment no encontrado' });
    }
    res.status(500).json({ error: 'Error al descargar archivo de ServiceNow' });
  }
});

// POST /api/clientes/tareas/:sysId/cerrar — Close a task
router.post('/:sysId/cerrar', async (req, res) => {
  try {
    const result = await servicenow.cerrarTarea(req.params.sysId, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(result);
  } catch (err) {
    console.error('[Clientes/Tareas] Error closing task:', err.message);
    res.status(500).json({ error: 'Error al cerrar tarea en ServiceNow' });
  }
});

module.exports = router;
