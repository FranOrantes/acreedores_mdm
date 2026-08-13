const { Router } = require('express');
const layoutRouter = require('./layout');
const excelRouter = require('./validarExcel');
const adjuntosRouter = require('./adjuntos');
const validarImagenRouter = require('./validarImagen');
const solicitudesRouter = require('./solicitudes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'materiales' });
});

router.use('/', layoutRouter);
router.use('/', excelRouter);
router.use('/', adjuntosRouter);
router.use('/', validarImagenRouter);
router.use('/', solicitudesRouter);

module.exports = router;
