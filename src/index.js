require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// [SSO DESACTIVADO TEMPORALMENTE] const authRouter = require('./routes/auth');
const catalogosRouter = require('./routes/catalogos');
const solicitudesRouter = require('./routes/solicitudes');
const documentosRouter = require('./routes/documentos');
const contactosRouter = require('./routes/contactos');
// [SSO DESACTIVADO TEMPORALMENTE] const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: permitir cookies desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas públicas (no requieren autenticación) ──
// [SSO DESACTIVADO TEMPORALMENTE] app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
