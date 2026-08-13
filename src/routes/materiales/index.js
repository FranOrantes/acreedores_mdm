const { Router } = require('express');
const layoutRouter = require('./layout');
const excelRouter = require('./validarExcel');
const adjuntosRouter = require('./adjuntos');
const validarImagenRouter = require('./validarImagen');
const solicitudesRouter = require('./solicitudes');
const configuracionRouter = require('./configuracion');
const configService = require('./configService');

// Sembrar configuración default del módulo (idempotente, bootstrap desde env)
configService.seed().catch((e) => console.error('[Materiales][Config] Error en seed:', e.message));

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'materiales' });
});

router.use('/', layoutRouter);
router.use('/', excelRouter);
router.use('/', adjuntosRouter);
router.use('/', validarImagenRouter);
router.use('/', solicitudesRouter);
router.use('/', configuracionRouter);

module.exports = router;
