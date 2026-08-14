const { Router } = require('express');
const prisma = require('../../lib/prisma');
const config = require('./configService');
const seedMatriz = require('./data/matrizAprobadores.seed.json');

const router = Router();

// Matriz de aprobadores (réplica de u_matriz_area_aprobadores, u_proyecto=MDM).
// Fuente principal: tabla materiales_matriz_aprobadores (sincronizada de SN, siempre actualizada).
// Fallback: ConfiguracionModulo matriz.aprobadores / seed (hasta que corra el primer sync).
const CLAVE = 'matriz.aprobadores';

// Normaliza fila de la tabla SN al formato del módulo { comprador: {nombre}, negociador: {nombre}, dga: {nombre} }
const filaModulo = (r) => ({
  comprador: r.comprador ? { nombre: r.comprador } : null,
  negociador: r.negociador ? { nombre: r.negociador } : null,
  dga: r.dga ? { nombre: r.dga } : null,
});

async function obtenerMatriz() {
  const filas = await prisma.materialesMatrizAprobador.findMany({ orderBy: { comprador: 'asc' } });
  if (filas.length) return filas.map(filaModulo); // tabla sincronizada de ServiceNow
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
// Escribe en la tabla sincronizada (el próximo delta de SN la vuelve a igualar si cambió allá)
router.put('/matriz-aprobadores', async (req, res) => {
  try {
    const { filas, usuario } = req.body;
    if (!Array.isArray(filas)) return res.status(400).json({ error: 'filas debe ser un arreglo' });
    for (const [i, f] of filas.entries()) {
      if (!f.comprador?.nombre && !f.negociador?.nombre && !f.dga?.nombre) {
        return res.status(400).json({ error: `Fila ${i + 1}: debe tener al menos comprador, negociador o DGA` });
      }
    }
    await prisma.materialesMatrizAprobador.deleteMany({});
    const ahora = new Date();
    await prisma.materialesMatrizAprobador.createMany({
      data: filas.map((f, i) => ({
        sysId: `local_${i + 1}_${Date.now()}`,
        comprador: f.comprador?.nombre || null,
        negociador: f.negociador?.nombre || null,
        dga: f.dga?.nombre || null,
        proyecto: 'MDM',
        sysUpdatedOn: ahora,
        raw: { origen: 'edicion-local', usuario: usuario || 'admin' },
      })),
    });
    await config.set(CLAVE, filas, usuario || 'admin'); // espejo en config por compatibilidad
    res.json({ ok: true, filas: filas.length });
  } catch (err) {
    console.error('[Materiales][Matriz] Error al guardar:', err);
    res.status(500).json({ error: 'Error al guardar la matriz' });
  }
});

module.exports = router;
