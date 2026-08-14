const { Router } = require('express');
const prisma = require('../../lib/prisma');
const config = require('./configService');
const { ejecutarBusinessRules } = require('../../lib/scriptEngine');

const router = Router();

async function siguienteFolio() {
  const prefijo = await config.get('flujo.folio_prefijo');
  const count = await prisma.solicitud.count({ where: { modulo: 'materiales' } });
  return `${prefijo || 'MT'}-${String(count + 1).padStart(4, '0')}`;
}

// POST /api/materiales/alta — crea la solicitud de alta de materiales
// Body: { session, materiales: [...], solicitanteNombre?, solicitanteArea? }
// Réplica del submit de ServiceNow: los adjuntos temporales (sessionKey) pasan a Documento.
router.post('/alta', async (req, res) => {
  try {
    const { session, materiales = [], solicitanteNombre, solicitanteArea } = req.body;
    if (!Array.isArray(materiales) || materiales.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un material' });
    }

    // Réplica de la validación onSubmit: conteo contra el Excel validado
    const excelInfo = req.body.excelNoRegistros;
    if (excelInfo !== undefined && Number(excelInfo) !== materiales.length) {
      return res.status(400).json({ error: 'Los registros mostrados no coinciden con el excel. Favor de cargar nuevamente el archivo layout.' });
    }

    // Réplica de archivos obligatorios por material (parametrizable desde Configuración)
    const OBLIGATORIOS = await config.get('validacion.adjuntos.obligatorios');
    const faltantes = [];
    for (const m of materiales) {
      const falta = OBLIGATORIOS.filter((k) => !m.adjuntos?.[k]);
      if (falta.length) {
        faltantes.push(`${m.vs_nombre_completo_del_material} (${m.vs_unidad_del_producto_id_pi})\n${falta.join('\n')}`);
      }
    }
    if (faltantes.length) {
      return res.status(400).json({ error: `Materiales con archivos pendientes:\n\n${faltantes.join('\n\n')}` });
    }

    const solicitud = await prisma.solicitud.create({
      data: {
        folio: await siguienteFolio(),
        modulo: 'materiales',
        tipo: 'alta',
        estado: 'enviada',
        solicitanteNombre: solicitanteNombre || null,
        solicitanteArea: solicitanteArea || null,
        dominioId: req.body.dominioId || null,
        camposExtra: {
          flujo: 'MDM Material Alta (réplica ServiceNow)',
          etapa: await config.get('flujo.etapa_inicial'),
          excelNoRegistros: Number(excelInfo) || materiales.length,
          materiales,
        },
      },
    });

    // Mover adjuntos temporales de la sesión a Documento definitivo
    if (session) {
      const temporales = await prisma.documentoTemporal.findMany({ where: { sessionKey: session } });
      for (const t of temporales) {
        await prisma.documento.create({
          data: {
            solicitudId: solicitud.id,
            tipoDocumento: t.tipoDocumento,
            nombreArchivo: t.nombreArchivo,
            contenidoBase64: t.contenidoBase64,
            tamanio: t.tamanio,
            mimeType: t.mimeType,
          },
        });
        await prisma.documentoTemporal.delete({ where: { id: t.id } });
      }
    }

    // Business Rules: after_create del formulario mt_alta (fire-and-forget)
    ejecutarBusinessRules({
      entidad: 'mt_alta',
      evento: 'after_create',
      datos: { solicitudId: solicitud.id, folio: solicitud.folio, materiales, noMateriales: materiales.length },
      modulo: 'materiales',
      dominioId: solicitud.dominioId,
    }).catch((err) => console.error('[BusinessRules] mt_alta after_create:', err.message));

    res.status(201).json({ ok: true, folio: solicitud.folio, id: solicitud.id });
  } catch (err) {
    console.error('[Materiales] Error creando alta:', err);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
});

// GET /api/materiales/solicitudes — listado
router.get('/solicitudes', async (req, res) => {
  try {
    const solicitudes = await prisma.solicitud.findMany({
      where: { modulo: 'materiales' },
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true, folio: true, estado: true, tipo: true, creadoEn: true,
        solicitanteNombre: true, camposExtra: true,
        _count: { select: { documentos: true } },
      },
    });
    res.json(solicitudes.map((s) => ({
      ...s,
      noMateriales: Array.isArray(s.camposExtra?.materiales) ? s.camposExtra.materiales.length : 0,
      etapa: s.camposExtra?.etapa || null,
    })));
  } catch (err) {
    console.error('[Materiales] Error listando solicitudes:', err);
    res.status(500).json({ error: 'Error al listar solicitudes' });
  }
});

// GET /api/materiales/solicitudes/:id — detalle (modo lectura)
router.get('/solicitudes/:id', async (req, res) => {
  try {
    const solicitud = await prisma.solicitud.findFirst({
      where: { id: req.params.id, modulo: 'materiales' },
      include: { documentos: { select: { id: true, tipoDocumento: true, nombreArchivo: true, tamanio: true, mimeType: true } } },
    });
    if (!solicitud) return res.status(404).json({ error: 'No encontrada' });
    res.json(solicitud);
  } catch (err) {
    console.error('[Materiales] Error obteniendo solicitud:', err);
    res.status(500).json({ error: 'Error al obtener la solicitud' });
  }
});

module.exports = router;
