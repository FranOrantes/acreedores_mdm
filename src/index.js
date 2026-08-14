require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const catalogosRouter = require('./routes/catalogos');
const solicitudesRouter = require('./routes/solicitudes');
const documentosRouter = require('./routes/documentos');
const contactosRouter = require('./routes/contactos');
const aprobacionesRouter = require('./routes/aprobaciones');
const gruposRouter = require('./routes/grupos');
const usuariosRouter = require('./routes/usuarios');
const adminCatalogosRouter = require('./routes/adminCatalogos');
const tiposAprobacionRouter = require('./routes/tiposAprobacion');
const actividadesRouter = require('./routes/actividades');
const ubicacionesRouter = require('./routes/ubicaciones');
const incidentesRouter = require('./routes/incidentes');
const documentosBase64Router = require('./routes/documentosBase64');
const cargaMasivaRouter = require('./routes/cargaMasiva');
const reglasFormularioRouter = require('./routes/reglasFormulario');
const tareasSolicitudRouter = require('./routes/tareasSolicitud');
const tareasFlujoRouter = require('./routes/tareasFlujo');
const dominiosRouter = require('./routes/dominios');
const camposFormularioRouter = require('./routes/camposFormulario');
const pushRouter = require('./routes/push');
const logsRouter = require('./routes/logs');
const iaRouter = require('./routes/ia');
const datalakeRouter = require('./routes/datalake');
const clientesTareasRouter = require('./routes/clientes/tareas');
const clientesAttachmentsRouter = require('./routes/clientes/attachments');
const materialesRouter = require('./routes/materiales/index');
const dashboardRouter = require('./routes/dashboard');
const integracionesRouter = require('./routes/integraciones');
const scriptIncludesRouter = require('./routes/scriptIncludes');
const businessRulesRouter = require('./routes/businessRules');
const formulariosRouter = require('./routes/formularios');
const tablasRouter = require('./routes/tablas');
const preferenciasRouter = require('./routes/preferencias');
const vistasRouter = require('./routes/vistas');
const logsIARouter = require('./routes/logsIA');
// [SSO DESACTIVADO TEMPORALMENTE] const { requireAuth } = require('./middleware/auth');
const { domainScope } = require('./middleware/domainScope');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: permitir cookies desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas públicas (no requieren autenticación) ──
app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Middleware de dominio (inyecta req.dominioId en todas las rutas protegidas) ──
app.use('/api', domainScope);

// ── Rutas protegidas (requieren autenticación SSO) ──
// [SSO DESACTIVADO TEMPORALMENTE] Descomentar requireAuth cuando se reactive el SSO:
// app.use('/api/catalogos', requireAuth, catalogosRouter);
// app.use('/api/solicitudes', requireAuth, solicitudesRouter);
// app.use('/api/documentos', requireAuth, documentosRouter);
// app.use('/api/contactos', requireAuth, contactosRouter);
app.use('/api/catalogos', catalogosRouter);
app.use('/api/solicitudes', solicitudesRouter);
app.use('/api/documentos', documentosRouter);
app.use('/api/contactos', contactosRouter);
app.use('/api/aprobaciones', aprobacionesRouter);
app.use('/api/grupos', gruposRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/admin/catalogos', adminCatalogosRouter);
app.use('/api/tipos-aprobacion', tiposAprobacionRouter);
app.use('/api/actividades', actividadesRouter);
app.use('/api/ubicaciones', ubicacionesRouter);
app.use('/api/incidentes', incidentesRouter);
app.use('/api/docs', documentosBase64Router);
app.use('/api/carga-masiva', cargaMasivaRouter);
app.use('/api/reglas-formulario', reglasFormularioRouter);
app.use('/api/reglas-visibilidad', reglasFormularioRouter); // backward compat
app.use('/api/tareas-solicitud', tareasSolicitudRouter);
app.use('/api/tareas-flujo', tareasFlujoRouter);
app.use('/api/dominios', dominiosRouter);
app.use('/api/campos-formulario', camposFormularioRouter);
app.use('/api/push', pushRouter);
app.use('/api/logs', logsRouter);
app.use('/api/ia', iaRouter);
app.use('/api/datalake', datalakeRouter);
app.use('/api/clientes/tareas', clientesTareasRouter);
app.use('/api/clientes/attachments', clientesAttachmentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/integraciones', integracionesRouter);
app.use('/api/materiales', materialesRouter);
app.use('/api/script-includes', scriptIncludesRouter);
app.use('/api/business-rules', businessRulesRouter);
app.use('/api/formularios', formulariosRouter);
app.use('/api/tablas', tablasRouter);
app.use('/api/preferencias', preferenciasRouter);
app.use('/api/vistas', vistasRouter);
app.use('/api/logs', logsIARouter);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
