const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Listar contactos de una solicitud
router.get('/:solicitudId', async (req, res) => {
  const data = await prisma.contactoAcreedor.findMany({
    where: { solicitudId: req.params.solicitudId },
    orderBy: { orden: 'asc' },
  });
  res.json(data);
});

// Crear o reemplazar todos los contactos de una solicitud (bulk upsert)
router.put('/:solicitudId', async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { contactos } = req.body; // array of contacto objects

    // Delete existing
    await prisma.contactoAcreedor.deleteMany({ where: { solicitudId } });

    // Create new
    const created = [];
    for (let i = 0; i < contactos.length; i++) {
      const c = contactos[i];
      const record = await prisma.contactoAcreedor.create({
        data: {
          solicitudId,
          orden: i + 1,
          nombre: c.nombre,
          correo: c.correo,
          puesto: c.puesto,
          telefono: c.telefono,
          extension: c.extension || '',
          cdr: c.cdr,
        },
      });
      created.push(record);
    }

    res.json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Eliminar un contacto
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contactoAcreedor.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
