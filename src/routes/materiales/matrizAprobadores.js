const { Router } = require('express');
const config = require('./configService');
const seedMatriz = require('./data/matrizAprobadores.seed.json');

const router = Router();

// Matriz de aprobadores (réplica de u_matriz_area_aprobadores, u_proyecto=MDM).
// Vive en ConfiguracionModulo (clave matriz.aprobadores) → parametrizable en caliente.
const CLAVE = 'matriz.aprobadores';

async function obtenerMatriz() {
  let matriz = await config.get(CLAVE);
  if (!Array.isArray(matriz) || matriz.length === 0) {
    matriz = seedMatriz;
    await config.set(CLAVE, matriz, 'seed-servicenow');
  }
  return matriz;
}

// GET /api/materiales/matriz-aprobadores — matriz completa
router.get('/matriz-aprobadores', async (req, res) => {
  try {
    res.json(await obtenerMatriz());
  } catch (err) {
    console.error('[Materiales][Matriz] Error al listar:', err);
    res.status(500).json({ error: 'Error al obtener la matriz' });
  }
});

// GET /api/materiales/matriz-aprobadores/opciones — listas únicas para selects del formulario
router.get('/matriz-aprobadores/opciones', async (req, res) => {
  try {
    const matriz = await obtenerMatriz();
    const unicos = (rol) => {
      const mapa = new Map();
      for (const fila of matriz) {
        const p = fila[rol];
        if (p?.nombre) mapa.set(p.nombre, p);
      }
      return [...mapa.values()];
    };
    res.json({ compradores: unicos('comprador'), negociadores: unicos('negociador'), dgas: unicos('dga') });
  } catch (err) {
    console.error('[Materiales][Matriz] Error en opciones:', err);
    res.status(500).json({ error: 'Error al obtener opciones' });
  }
});

// PUT /api/materiales/matriz-aprobadores — reemplazar matriz completa (admin)
// Body: { filas: [...], usuario? }
router.put('/matriz-aprobadores', async (req, res) => {
  try {
    const { filas, usuario } = req.body;
    if (!Array.isArray(filas)) return res.status(400).json({ error: 'filas debe ser un arreglo' });
    for (const [i, f] of filas.entries()) {
      if (!f.comprador?.nombre && !f.negociador?.nombre && !f.dga?.nombre) {
        return res.status(400).json({ error: `Fila ${i + 1}: debe tener al menos comprador, negociador o DGA` });
      }
    }
    await config.set(CLAVE, filas, usuario || 'admin');
    res.json({ ok: true, filas: filas.length });
  } catch (err) {
    console.error('[Materiales][Matriz] Error al guardar:', err);
    res.status(500).json({ error: 'Error al guardar la matriz' });
  }
});

module.exports = router;
