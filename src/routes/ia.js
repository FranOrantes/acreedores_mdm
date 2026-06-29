const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ══════════════════════════════════════════════════
// POST /api/ia/ocr-extract
// Recibe un documento (PDF/imagen) y retorna campos extraídos
// ══════════════════════════════════════════════════
router.post('/ocr-extract', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const base64 = fileBuffer.toString('base64');

    // ┌──────────────────────────────────────────────────────────────────┐
    // │  TODO: CONECTAR TU API DE OCR AQUÍ                              │
    // │                                                                  │
    // │  Reemplaza el bloque de abajo con la llamada a tu API de OCR.   │
    // │  Tu API debe recibir el documento y retornar un JSON con los    │
    // │  campos extraídos.                                              │
    // │                                                                  │
    // │  Ejemplo con tu API:                                             │
    // │                                                                  │
    // │  const axios = require('axios');                                 │
    // │  const response = await axios.post('https://TU_API_OCR/extract',│
    // │    { file: base64, mimeType },                                  │
    // │    { headers: { 'Authorization': `Bearer ${process.env.OCR_API_KEY}` } } │
    // │  );                                                              │
    // │  const datosExtraidos = response.data;                          │
    // │                                                                  │
    // │  Luego mapea los campos de tu API al formato esperado:          │
    // │  const campos = {                                                │
    // │    rfc: datosExtraidos.rfc,                                      │
    // │    razonSocial: datosExtraidos.razon_social,                     │
    // │    tipoPersona: datosExtraidos.tipo_persona,  // 'moral'|'fisica'│
    // │    nombrePila: datosExtraidos.nombre,                            │
    // │    apellidoPaterno: datosExtraidos.apellido_paterno,             │
    // │    apellidoMaterno: datosExtraidos.apellido_materno,             │
    // │    calle: datosExtraidos.calle,                                  │
    // │    numeroExterior: datosExtraidos.num_exterior,                  │
    // │    numeroInterior: datosExtraidos.num_interior,                  │
    // │    codigoPostal: datosExtraidos.codigo_postal,                   │
    // │    colonia: datosExtraidos.colonia,                              │
    // │    municipio: datosExtraidos.municipio,                          │
    // │    estado_dir: datosExtraidos.estado,                            │
    // │  };                                                              │
    // │  const confianza = datosExtraidos.confidence || 0.95;            │
    // └──────────────────────────────────────────────────────────────────┘

    // ── DATOS DE DEMOSTRACIÓN (eliminar cuando conectes tu API) ──
    const campos = {
      rfc: 'XAXX010101000',
      razonSocial: 'EMPRESA DEMO S.A. DE C.V.',
      tipoPersona: 'moral',
      calle: 'AV. REFORMA',
      numeroExterior: '222',
      codigoPostal: '06600',
      colonia: 'JUÁREZ',
      municipio: 'CUAUHTÉMOC',
      estado_dir: 'CIUDAD DE MÉXICO',
    };
    const confianza = 0.92;
    // ── FIN DATOS DE DEMOSTRACIÓN ──

    res.json({ campos, confianza });
  } catch (error) {
    console.error('[IA/OCR] Error:', error.message);
    res.status(500).json({ error: 'Error al procesar el documento' });
  }
});

// ══════════════════════════════════════════════════
// POST /api/ia/duplicados
// Detecta posibles duplicados por RFC, razón social o CLABE
// ══════════════════════════════════════════════════
router.post('/duplicados', async (req, res) => {
  try {
    const { rfc, razonSocial, cuentaClabe } = req.body;
    const duplicados = [];

    // Búsqueda exacta por RFC
    if (rfc && rfc.length >= 10) {
      const porRfc = await prisma.solicitud.findMany({
        where: {
          rfc: { equals: rfc, mode: 'insensitive' },
          estado: { notIn: ['borrador', 'rechazada'] },
          ...(req.dominioId ? { dominioId: req.dominioId } : {}),
        },
        select: { id: true, folio: true, rfc: true, razonSocial: true, estado: true, nombrePila: true, apellidoPaterno: true, creadoEn: true },
        take: 5,
      });
      porRfc.forEach((s) => duplicados.push({
        ...s,
        razon: 'RFC idéntico',
        tipo: 'exacto',
        score: 1.0,
        nombre: s.razonSocial || [s.nombrePila, s.apellidoPaterno].filter(Boolean).join(' '),
      }));
    }

    // Búsqueda fuzzy por razón social (contains)
    if (razonSocial && razonSocial.length >= 4) {
      const palabras = razonSocial.replace(/\b(SA|DE|CV|S\.A\.|S\.A|S DE RL|SAPI|SC)\b/gi, '').trim();
      if (palabras.length >= 4) {
        const porNombre = await prisma.solicitud.findMany({
          where: {
            razonSocial: { contains: palabras.substring(0, 20), mode: 'insensitive' },
            estado: { notIn: ['borrador', 'rechazada'] },
            ...(req.dominioId ? { dominioId: req.dominioId } : {}),
            NOT: rfc ? { rfc: { equals: rfc, mode: 'insensitive' } } : undefined,
          },
          select: { id: true, folio: true, rfc: true, razonSocial: true, estado: true, creadoEn: true },
          take: 5,
        });
        porNombre.forEach((s) => {
          if (!duplicados.find((d) => d.id === s.id)) {
            duplicados.push({
              ...s,
              razon: 'Razón social similar',
              tipo: 'similar',
              score: 0.7,
              nombre: s.razonSocial,
            });
          }
        });
      }
    }

    // Búsqueda por CLABE (riesgo alto — misma cuenta bancaria)
    if (cuentaClabe && cuentaClabe.length >= 18) {
      const porClabe = await prisma.solicitud.findMany({
        where: {
          cuentaClabe,
          estado: { notIn: ['borrador', 'rechazada'] },
          ...(req.dominioId ? { dominioId: req.dominioId } : {}),
          NOT: rfc ? { rfc: { equals: rfc, mode: 'insensitive' } } : undefined,
        },
        select: { id: true, folio: true, rfc: true, razonSocial: true, estado: true, creadoEn: true },
        take: 5,
      });
      porClabe.forEach((s) => {
        if (!duplicados.find((d) => d.id === s.id)) {
          duplicados.push({
            ...s,
            razon: 'Misma cuenta CLABE',
            tipo: 'alerta',
            score: 0.95,
            nombre: s.razonSocial || 'Sin razón social',
          });
        }
      });
    }

    // Ordenar por score descendente
    duplicados.sort((a, b) => b.score - a.score);

    res.json({ duplicados, total: duplicados.length });
  } catch (error) {
    console.error('[IA/Duplicados] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════
// POST /api/ia/asistente
// Chatbot IA contextual — responde preguntas sobre el portal
// ══════════════════════════════════════════════════
router.post('/asistente', async (req, res) => {
  try {
    const { mensaje, contexto } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'mensaje es requerido' });

    // Obtener datos contextuales del usuario
    let userContext = '';
    if (req.userId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.userId },
        select: { nombre: true, rolInterno: true, email: true },
      });
      if (usuario) {
        userContext = `Usuario: ${usuario.nombre} (${usuario.rolInterno})`;
      }

      // Stats rápidas para contexto
      const [totalSolicitudes, pendientes, aprobadas] = await Promise.all([
        prisma.solicitud.count({ where: { ...(req.dominioId ? { dominioId: req.dominioId } : {}) } }),
        prisma.aprobacion.count({ where: { estado: 'solicitado' } }),
        prisma.aprobacion.count({ where: { estado: 'aprobado' } }),
      ]);
      userContext += ` | Solicitudes: ${totalSolicitudes} | Aprobaciones pendientes: ${pendientes} | Aprobadas: ${aprobadas}`;
    }

    // Si el usuario pregunta por una solicitud específica
    let solicitudContext = '';
    const folioMatch = mensaje.match(/\b(SOL|ACT|PV)-\d{4}-\d{4}\b/i);
    if (folioMatch) {
      const sol = await prisma.solicitud.findFirst({
        where: { folio: folioMatch[0].toUpperCase() },
        select: {
          folio: true, estado: true, razonSocial: true, rfc: true, solicitanteNombre: true, creadoEn: true,
          aprobaciones: { select: { estado: true, descripcionCorta: true, aprobadorId: true }, take: 10 },
        },
      });
      if (sol) {
        const aprobsPendientes = sol.aprobaciones.filter((a) => a.estado === 'solicitado').length;
        solicitudContext = `\nSolicitud ${sol.folio}: estado=${sol.estado}, acreedor=${sol.razonSocial || sol.rfc}, solicitante=${sol.solicitanteNombre}, creada=${sol.creadoEn.toISOString().split('T')[0]}, aprobaciones_pendientes=${aprobsPendientes}`;
      }
    }

    // ┌──────────────────────────────────────────────────────────────────┐
    // │  TODO: CONECTAR TU API DE IA (OpenAI, Anthropic, etc.) AQUÍ    │
    // │                                                                  │
    // │  const { OpenAI } = require('openai');                          │
    // │  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });│
    // │  const completion = await openai.chat.completions.create({      │
    // │    model: 'gpt-4o-mini',                                        │
    // │    messages: [                                                   │
    // │      { role: 'system', content: systemPrompt },                 │
    // │      ...historial,                                              │
    // │      { role: 'user', content: mensaje }                         │
    // │    ],                                                           │
    // │  });                                                            │
    // │  const respuesta = completion.choices[0].message.content;       │
    // └──────────────────────────────────────────────────────────────────┘

    const systemPrompt = `Eres el asistente del Portal MDM de Gestión de Acreedores y Proveedores. Contexto: ${userContext}${solicitudContext}`;

    // ── RESPUESTA DE DEMOSTRACIÓN (reemplazar con tu API de IA) ──
    const respuestaDemo = generarRespuestaDemo(mensaje, solicitudContext);

    res.json({ respuesta: respuestaDemo, contexto: systemPrompt });
  } catch (error) {
    console.error('[IA/Asistente] Error:', error.message);
    res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});

// ══════════════════════════════════════════════════
// GET /api/ia/prediccion-aprobacion/:solicitudId
// Predice el tiempo estimado de aprobación basado en históricos
// ══════════════════════════════════════════════════
router.get('/prediccion-aprobacion/:solicitudId', async (req, res) => {
  try {
    const { solicitudId } = req.params;

    // Obtener aprobaciones de la solicitud
    const aprobaciones = await prisma.aprobacion.findMany({
      where: { solicitudId },
      select: { id: true, estado: true, descripcionCorta: true, grupoAsignadoId: true, aprobadorId: true, creadoEn: true, fechaResolucion: true },
    });

    // Calcular tiempo promedio histórico de aprobaciones resueltas
    const resueltas = await prisma.aprobacion.findMany({
      where: { estado: { in: ['aprobado', 'rechazado'] }, fechaResolucion: { not: null } },
      select: { creadoEn: true, fechaResolucion: true },
      take: 200,
      orderBy: { fechaResolucion: 'desc' },
    });

    let tiempoPromedioHoras = 48; // default
    if (resueltas.length > 0) {
      const tiempos = resueltas.map((a) => (new Date(a.fechaResolucion) - new Date(a.creadoEn)) / (1000 * 60 * 60));
      tiempoPromedioHoras = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    // Carga de trabajo por aprobador
    const pendientesPorAprobador = await prisma.aprobacion.groupBy({
      by: ['aprobadorId'],
      where: { estado: 'solicitado', aprobadorId: { not: null } },
      _count: true,
    });

    const aprobadoresCarga = [];
    for (const item of pendientesPorAprobador) {
      if (!item.aprobadorId) continue;
      const usuario = await prisma.usuario.findUnique({ where: { id: item.aprobadorId }, select: { nombre: true, email: true } });
      aprobadoresCarga.push({
        id: item.aprobadorId,
        nombre: usuario?.nombre || 'Desconocido',
        pendientes: item._count,
      });
    }
    aprobadoresCarga.sort((a, b) => b.pendientes - a.pendientes);

    // Aprobaciones que llevan más de 72 horas
    const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const atrasadas = await prisma.aprobacion.count({
      where: { estado: 'solicitado', creadoEn: { lt: hace72h } },
    });

    res.json({
      solicitud: {
        totalAprobaciones: aprobaciones.length,
        pendientes: aprobaciones.filter((a) => a.estado === 'solicitado').length,
        resueltas: aprobaciones.filter((a) => a.estado !== 'solicitado').length,
      },
      prediccion: {
        tiempoEstimadoHoras: Math.round(tiempoPromedioHoras * 10) / 10,
        tiempoEstimadoDias: Math.round(tiempoPromedioHoras / 24 * 10) / 10,
        basadoEn: resueltas.length,
      },
      cargaTrabajo: aprobadoresCarga.slice(0, 10),
      alertas: {
        atrasadas,
        mensaje: atrasadas > 0 ? `${atrasadas} aprobaciones llevan más de 72 horas sin resolverse` : null,
      },
    });
  } catch (error) {
    console.error('[IA/Prediccion] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

function generarRespuestaDemo(mensaje, solicitudContext) {
  const msg = mensaje.toLowerCase();
  if (msg.includes('documento') || msg.includes('requisito')) {
    return 'Para dar de alta un acreedor necesitas:\n\n• **Estado de cuenta bancario** (obligatorio)\n• **Curriculum de la empresa** (obligatorio)\n• **Acta constitutiva** (solo personas morales)\n• **Identificación oficial** (obligatorio)\n• **Referencias comerciales** (3 archivos)\n• **Formato FO-CN-02** (obligatorio)\n• **Opinión de cumplimiento SAT** (obligatorio)\n• **Comprobante de domicilio** (obligatorio)';
  }
  if (msg.includes('estado') || msg.includes('estatus') || msg.includes('sol-') || msg.includes('act-')) {
    if (solicitudContext) return `Aquí están los datos que encontré:\n\n${solicitudContext.trim()}\n\n¿Necesitas más detalles?`;
    return 'Para consultar el estado de una solicitud, proporciona el folio (ej: SOL-2026-0052) y te daré los detalles.';
  }
  if (msg.includes('aprobacion') || msg.includes('aprobar') || msg.includes('pendiente')) {
    return 'Las aprobaciones pueden ser **grupales** o **individuales**. En las grupales, cuando un miembro del grupo aprueba, las demás se marcan automáticamente. Puedes ver tus pendientes en la sección **Aprobaciones** del menú.';
  }
  if (msg.includes('proveedor') || msg.includes('extranjero')) {
    return 'Para proveedores extranjeros, el formulario incluye campos adicionales de dirección internacional (país, región). Asegúrate de seleccionar "Extranjero" en el campo de localización.';
  }
  if (msg.includes('hola') || msg.includes('ayuda')) {
    return '¡Hola! 👋 Soy el asistente del Portal MDM. Puedo ayudarte con:\n\n• **Documentos** necesarios para alta\n• **Estado** de solicitudes (dime el folio)\n• **Aprobaciones** pendientes\n• **Dudas** sobre campos del formulario\n\n¿En qué te puedo ayudar?';
  }
  return 'Entiendo tu consulta. Para darte una respuesta más precisa, ¿podrías darme más detalles? Puedo ayudarte con documentación, estado de solicitudes, aprobaciones y más.';
}

module.exports = router;
