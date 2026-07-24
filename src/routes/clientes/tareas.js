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
    res.status(500).json({ error: 'Error al obtener tareas de ServiceNow' });
  }
});

// GET /api/clientes/tareas/:sysId — Get single task detail
router.get('/:sysId', async (req, res) => {
  try {
    const tarea = await servicenow.getTareaById(req.params.sysId);
    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(tarea);
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
