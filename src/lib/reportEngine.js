const prisma = require('./prisma');

// ══════════════════════════════════════════════════
// Motor de Reportes Dinámico
// Recibe una "intención" estructurada y ejecuta queries dinámicas
// ══════════════════════════════════════════════════

// ── Paso 1: Parsear intención del mensaje (keyword-based) ──
// ┌──────────────────────────────────────────────────────────────────┐
// │  TODO: Cuando conectes tu API de IA, reemplaza esta función     │
// │  para que el LLM retorne directamente el objeto de intención.   │
// │                                                                  │
// │  Ejemplo de prompt para el LLM:                                  │
// │  "Analiza el mensaje del usuario y retorna un JSON con:          │
// │   { entidad, accion, filtros, periodo, agruparPor, limite }     │
// │   Entidades: solicitud, aprobacion, usuario, incidente          │
// │   Acciones: listar, contar, agrupar, ranking, promedio          │
// │   Filtros: { campo: valor }                                     │
// │   Periodo: { desde, hasta } en ISO"                             │
// │                                                                  │
// │  const completion = await openai.chat.completions.create({      │
// │    model: 'gpt-4o-mini',                                        │
// │    response_format: { type: 'json_object' },                    │
// │    messages: [{ role: 'system', content: promptParser },        │
// │               { role: 'user', content: mensaje }]               │
// │  });                                                            │
// │  return JSON.parse(completion.choices[0].message.content);      │
// └──────────────────────────────────────────────────────────────────┘
function parsearIntencion(mensaje) {
  const msg = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const intencion = { entidad: null, accion: 'listar', filtros: {}, periodo: null, agruparPor: null, limite: 20, ordenar: 'desc' };

  // ── Detectar entidad ──
  if (/aprobacion|aprobar|aprobad|rechazad|aprobador/.test(msg)) intencion.entidad = 'aprobacion';
  else if (/incidente|ticket|soporte|reporte de error/.test(msg)) intencion.entidad = 'incidente';
  else if (/usuario|persona|quien|gente/.test(msg)) intencion.entidad = 'usuario';
  else intencion.entidad = 'solicitud'; // default

  // ── Detectar acción ──
  if (/cuantas|cuantos|cuanto|total|numero|cantidad|conteo/.test(msg)) intencion.accion = 'contar';
  else if (/promedio|media|tiempo|tarda|demora|velocidad|rapido|lento/.test(msg)) intencion.accion = 'promedio';
  else if (/por (tipo|estado|acreedor|aprobador|mes|semana|grupo|area|modulo)/.test(msg)) intencion.accion = 'agrupar';
  else if (/ranking|top|mas|mayor|mejor|peor|quien tiene/.test(msg)) intencion.accion = 'ranking';
  else if (/lista|dame|muestra|ver|consulta|busca|encuentra/.test(msg)) intencion.accion = 'listar';

  // ── Detectar filtros de estado ──
  if (/rechazad/.test(msg)) intencion.filtros.estado = 'rechazada';
  else if (/aprobad/.test(msg)) intencion.filtros.estado = intencion.entidad === 'aprobacion' ? 'aprobado' : 'aprobada';
  else if (/pendiente|solicitad|sin resolver|espera/.test(msg)) intencion.filtros.estado = intencion.entidad === 'aprobacion' ? 'solicitado' : 'enviada';
  else if (/en revision|revision/.test(msg)) intencion.filtros.estado = 'en_revision';
  else if (/borrador|draft/.test(msg)) intencion.filtros.estado = 'borrador';
  else if (/registrad|completad|finaliz/.test(msg)) intencion.filtros.estado = 'registrado';
  else if (/error|fall/.test(msg)) intencion.filtros.estado = 'error_sap';

  // ── Detectar módulo ──
  if (/proveedor/.test(msg)) intencion.filtros.modulo = 'proveedores';
  else if (/acreedor/.test(msg)) intencion.filtros.modulo = 'acreedores';

  // ── Detectar tipo ──
  if (/actualizacion|modificacion|cambio/.test(msg)) intencion.filtros.tipo = 'actualizacion';
  else if (/alta|nueva|nuevo|creacion/.test(msg)) intencion.filtros.tipo = 'alta';

  // ── Detectar periodo ──
  const ahora = new Date();
  if (/hoy/.test(msg)) {
    const inicio = new Date(ahora); inicio.setHours(0, 0, 0, 0);
    intencion.periodo = { desde: inicio, hasta: ahora };
  } else if (/ayer/.test(msg)) {
    const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1); ayer.setHours(0, 0, 0, 0);
    const finAyer = new Date(ayer); finAyer.setHours(23, 59, 59, 999);
    intencion.periodo = { desde: ayer, hasta: finAyer };
  } else if (/esta semana|semana actual/.test(msg)) {
    const inicio = new Date(ahora); inicio.setDate(inicio.getDate() - inicio.getDay()); inicio.setHours(0, 0, 0, 0);
    intencion.periodo = { desde: inicio, hasta: ahora };
  } else if (/semana pasada|ultima semana/.test(msg)) {
    const fin = new Date(ahora); fin.setDate(fin.getDate() - fin.getDay()); fin.setHours(0, 0, 0, 0);
    const inicio = new Date(fin); inicio.setDate(inicio.getDate() - 7);
    intencion.periodo = { desde: inicio, hasta: fin };
  } else if (/este mes|mes actual/.test(msg)) {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    intencion.periodo = { desde: inicio, hasta: ahora };
  } else if (/mes pasado|ultimo mes|mes anterior/.test(msg)) {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);
    intencion.periodo = { desde: inicio, hasta: fin };
  } else if (/este ano|este año|año actual|ano actual/.test(msg)) {
    const inicio = new Date(ahora.getFullYear(), 0, 1);
    intencion.periodo = { desde: inicio, hasta: ahora };
  } else if (/q1|primer trimestre/.test(msg)) {
    intencion.periodo = { desde: new Date(ahora.getFullYear(), 0, 1), hasta: new Date(ahora.getFullYear(), 2, 31, 23, 59, 59) };
  } else if (/q2|segundo trimestre/.test(msg)) {
    intencion.periodo = { desde: new Date(ahora.getFullYear(), 3, 1), hasta: new Date(ahora.getFullYear(), 5, 30, 23, 59, 59) };
  } else if (/q3|tercer trimestre/.test(msg)) {
    intencion.periodo = { desde: new Date(ahora.getFullYear(), 6, 1), hasta: new Date(ahora.getFullYear(), 8, 30, 23, 59, 59) };
  } else if (/q4|cuarto trimestre/.test(msg)) {
    intencion.periodo = { desde: new Date(ahora.getFullYear(), 9, 1), hasta: new Date(ahora.getFullYear(), 11, 31, 23, 59, 59) };
  } else {
    // Detectar "últimos N días/meses"
    const matchDias = msg.match(/(?:ultimos?|pasados?)\s+(\d+)\s+dias?/);
    const matchMeses = msg.match(/(?:ultimos?|pasados?)\s+(\d+)\s+meses?/);
    if (matchDias) {
      const dias = parseInt(matchDias[1]);
      const inicio = new Date(ahora); inicio.setDate(inicio.getDate() - dias); inicio.setHours(0, 0, 0, 0);
      intencion.periodo = { desde: inicio, hasta: ahora };
    } else if (matchMeses) {
      const meses = parseInt(matchMeses[1]);
      const inicio = new Date(ahora); inicio.setMonth(inicio.getMonth() - meses); inicio.setHours(0, 0, 0, 0);
      intencion.periodo = { desde: inicio, hasta: ahora };
    }
  }

  // ── Detectar agrupar por ──
  if (/por estado/.test(msg)) intencion.agruparPor = 'estado';
  else if (/por tipo/.test(msg)) intencion.agruparPor = intencion.entidad === 'solicitud' ? 'tipo' : 'estado';
  else if (/por modulo/.test(msg)) intencion.agruparPor = 'modulo';
  else if (/por mes/.test(msg)) intencion.agruparPor = 'mes';
  else if (/por semana/.test(msg)) intencion.agruparPor = 'semana';
  else if (/por (area|departamento)/.test(msg)) intencion.agruparPor = 'solicitanteArea';
  else if (/por aprobador/.test(msg)) intencion.agruparPor = 'aprobadorId';
  else if (/por grupo/.test(msg)) intencion.agruparPor = 'grupoAsignadoId';

  // ── Detectar si es ranking (override)  ──
  if (/quien (tiene|lleva) mas|mas (lento|rapido|pendiente|solicitud|aprobacion)/.test(msg)) intencion.accion = 'ranking';
  if (/top\s*(\d+)/.test(msg)) { intencion.limite = parseInt(msg.match(/top\s*(\d+)/)[1]); intencion.accion = 'ranking'; }

  // ── Detectar búsqueda por nombre / texto libre ──
  const matchBuscar = msg.match(/(?:de|para|del?)\s+"?([a-záéíóúñ\s]{3,})"?$/);
  if (matchBuscar) intencion.filtros.buscar = matchBuscar[1].trim();

  return intencion;
}

// ── Paso 2: Ejecutar query dinámica ──
async function ejecutarReporte(intencion, dominioId) {
  const { entidad, accion, filtros, periodo, agruparPor, limite } = intencion;

  // Construir where base
  const where = {};
  if (dominioId) where.dominioId = dominioId;

  // Aplicar filtros
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.modulo) where.modulo = filtros.modulo;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.buscar) {
    if (entidad === 'solicitud') {
      where.OR = [
        { razonSocial: { contains: filtros.buscar, mode: 'insensitive' } },
        { rfc: { contains: filtros.buscar, mode: 'insensitive' } },
        { folio: { contains: filtros.buscar, mode: 'insensitive' } },
        { solicitanteNombre: { contains: filtros.buscar, mode: 'insensitive' } },
      ];
    } else if (entidad === 'aprobacion') {
      where.OR = [
        { descripcionCorta: { contains: filtros.buscar, mode: 'insensitive' } },
      ];
    }
  }

  // Aplicar periodo
  if (periodo) {
    where.creadoEn = {};
    if (periodo.desde) where.creadoEn.gte = periodo.desde;
    if (periodo.hasta) where.creadoEn.lte = periodo.hasta;
  }

  const modelo = entidad === 'aprobacion' ? prisma.aprobacion
    : entidad === 'incidente' ? prisma.incidente
    : entidad === 'usuario' ? prisma.usuario
    : prisma.solicitud;

  // ── CONTAR ──
  if (accion === 'contar') {
    const total = await modelo.count({ where });
    let desglose = null;

    // Siempre dar un desglose por estado
    if (entidad !== 'usuario') {
      const grupos = await modelo.groupBy({ by: ['estado'], where, _count: true, orderBy: { _count: { estado: 'desc' } } });
      desglose = grupos.map((g) => ({ grupo: g.estado, cantidad: g._count }));
    }

    const periodoLabel = periodo ? formatearPeriodo(periodo) : 'todo el tiempo';
    return {
      tipo: 'estadistica',
      titulo: `Total de ${entidadLabel(entidad, true)}`,
      subtitulo: periodoLabel,
      valor: total,
      desglose,
      resumen: `Se encontraron **${total}** ${entidadLabel(entidad, true)}${filtros.estado ? ` en estado **${filtros.estado}**` : ''}${periodo ? ` (${periodoLabel})` : ''}.`,
    };
  }

  // ── AGRUPAR ──
  if (accion === 'agrupar' && agruparPor) {
    if (agruparPor === 'mes' || agruparPor === 'semana') {
      // Agrupación por tiempo — hacemos raw query o iteramos
      const items = await modelo.findMany({ where, select: { creadoEn: true, estado: true }, orderBy: { creadoEn: 'asc' } });
      const grupos = {};
      items.forEach((item) => {
        const d = new Date(item.creadoEn);
        const key = agruparPor === 'mes'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
        grupos[key] = (grupos[key] || 0) + 1;
      });
      const filas = Object.entries(grupos).map(([k, v]) => ({ grupo: k, cantidad: v }));
      return {
        tipo: 'tabla',
        titulo: `${entidadLabel(entidad, true)} por ${agruparPor}`,
        columnas: [agruparPor === 'mes' ? 'Mes' : 'Semana', 'Cantidad'],
        filas: filas.map((f) => [f.grupo, f.cantidad]),
        resumen: `${filas.length} ${agruparPor === 'mes' ? 'meses' : 'semanas'} con actividad. Total: **${items.length}**.`,
        csv: true,
      };
    }

    // Agrupación por campo
    let byField = agruparPor;
    if (!['estado', 'tipo', 'modulo', 'solicitanteArea', 'aprobadorId', 'grupoAsignadoId', 'categoria', 'prioridad'].includes(byField)) {
      byField = 'estado';
    }

    try {
      const grupos = await modelo.groupBy({ by: [byField], where, _count: true, orderBy: { _count: { [byField]: 'desc' } } });
      // Enriquecer nombres si es aprobadorId o grupoAsignadoId
      const filas = [];
      for (const g of grupos) {
        let label = g[byField] || 'Sin valor';
        if (byField === 'aprobadorId' && g[byField]) {
          const u = await prisma.usuario.findUnique({ where: { id: g[byField] }, select: { nombre: true } });
          label = u?.nombre || g[byField];
        }
        if (byField === 'grupoAsignadoId' && g[byField]) {
          const gr = await prisma.grupoAprobacion.findUnique({ where: { id: g[byField] }, select: { nombre: true } });
          label = gr?.nombre || g[byField];
        }
        filas.push([label, g._count]);
      }
      return {
        tipo: 'tabla',
        titulo: `${entidadLabel(entidad, true)} por ${byField}`,
        columnas: [byField, 'Cantidad'],
        filas,
        resumen: `${filas.length} grupos encontrados.`,
        csv: true,
      };
    } catch {
      // Field doesn't exist on this model, fallback
      return { tipo: 'error', resumen: `No se puede agrupar ${entidadLabel(entidad, true)} por "${agruparPor}".` };
    }
  }

  // ── RANKING ──
  if (accion === 'ranking') {
    if (entidad === 'aprobacion') {
      // Ranking de aprobadores por pendientes o velocidad
      const isVelocidad = /lento|rapido|tarda|demora|tiempo|velocidad/.test(intencion._rawMsg || '');

      if (isVelocidad) {
        const resueltas = await prisma.aprobacion.findMany({
          where: { estado: { in: ['aprobado', 'rechazado'] }, fechaResolucion: { not: null }, aprobadorId: { not: null } },
          select: { aprobadorId: true, creadoEn: true, fechaResolucion: true },
        });
        const tiempos = {};
        resueltas.forEach((a) => {
          const hrs = (new Date(a.fechaResolucion) - new Date(a.creadoEn)) / (1000 * 60 * 60);
          if (!tiempos[a.aprobadorId]) tiempos[a.aprobadorId] = [];
          tiempos[a.aprobadorId].push(hrs);
        });
        const ranking = [];
        for (const [id, hrs] of Object.entries(tiempos)) {
          const u = await prisma.usuario.findUnique({ where: { id }, select: { nombre: true } });
          const prom = hrs.reduce((a, b) => a + b, 0) / hrs.length;
          ranking.push([u?.nombre || 'Desconocido', `${Math.round(prom)} hrs`, hrs.length]);
        }
        ranking.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
        return {
          tipo: 'tabla',
          titulo: 'Ranking de aprobadores por tiempo promedio',
          columnas: ['Aprobador', 'Tiempo promedio', 'Total resueltas'],
          filas: ranking.slice(0, limite),
          resumen: `Ranking de los ${Math.min(ranking.length, limite)} aprobadores por tiempo promedio de resolución.`,
          csv: true,
        };
      }

      // Ranking por pendientes
      const grupos = await prisma.aprobacion.groupBy({
        by: ['aprobadorId'],
        where: { estado: 'solicitado', aprobadorId: { not: null } },
        _count: true,
        orderBy: { _count: { aprobadorId: 'desc' } },
        take: limite,
      });
      const filas = [];
      for (const g of grupos) {
        const u = await prisma.usuario.findUnique({ where: { id: g.aprobadorId }, select: { nombre: true } });
        filas.push([u?.nombre || 'Desconocido', g._count]);
      }
      return {
        tipo: 'tabla',
        titulo: 'Aprobadores con más pendientes',
        columnas: ['Aprobador', 'Pendientes'],
        filas,
        resumen: `Top ${filas.length} aprobadores con más aprobaciones pendientes.`,
        csv: true,
      };
    }

    // Ranking genérico por solicitante
    const grupos = await prisma.solicitud.groupBy({
      by: ['solicitanteNombre'],
      where,
      _count: true,
      orderBy: { _count: { solicitanteNombre: 'desc' } },
      take: limite,
    });
    return {
      tipo: 'tabla',
      titulo: 'Top solicitantes',
      columnas: ['Solicitante', 'Solicitudes'],
      filas: grupos.map((g) => [g.solicitanteNombre || 'Desconocido', g._count]),
      resumen: `Top ${grupos.length} solicitantes con más solicitudes.`,
      csv: true,
    };
  }

  // ── PROMEDIO ──
  if (accion === 'promedio') {
    if (entidad === 'aprobacion') {
      const resueltas = await prisma.aprobacion.findMany({
        where: { estado: { in: ['aprobado', 'rechazado'] }, fechaResolucion: { not: null }, ...where },
        select: { creadoEn: true, fechaResolucion: true },
      });
      if (resueltas.length === 0) {
        return { tipo: 'estadistica', titulo: 'Tiempo promedio de aprobación', valor: 'Sin datos', resumen: 'No hay aprobaciones resueltas en el periodo seleccionado.' };
      }
      const tiempos = resueltas.map((a) => (new Date(a.fechaResolucion) - new Date(a.creadoEn)) / (1000 * 60 * 60));
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      const minimo = Math.min(...tiempos);
      const maximo = Math.max(...tiempos);

      return {
        tipo: 'estadistica',
        titulo: 'Tiempo de resolución de aprobaciones',
        valor: `${Math.round(promedio)} hrs`,
        desglose: [
          { grupo: 'Promedio', cantidad: `${Math.round(promedio)} hrs (${(promedio / 24).toFixed(1)} días)` },
          { grupo: 'Mínimo', cantidad: `${Math.round(minimo)} hrs` },
          { grupo: 'Máximo', cantidad: `${Math.round(maximo)} hrs` },
          { grupo: 'Basado en', cantidad: `${resueltas.length} aprobaciones` },
        ],
        resumen: `El tiempo promedio de aprobación es de **${Math.round(promedio)} horas** (${(promedio / 24).toFixed(1)} días), basado en ${resueltas.length} aprobaciones resueltas.`,
      };
    }
    return { tipo: 'estadistica', titulo: 'Promedio', valor: 'N/A', resumen: 'El cálculo de promedio solo está disponible para aprobaciones.' };
  }

  // ── LISTAR (default) ──
  const selectFields = entidad === 'solicitud'
    ? { id: true, folio: true, razonSocial: true, rfc: true, estado: true, tipo: true, modulo: true, solicitanteNombre: true, creadoEn: true }
    : entidad === 'aprobacion'
    ? { id: true, descripcionCorta: true, estado: true, creadoEn: true, fechaResolucion: true, solicitud: { select: { folio: true, razonSocial: true } } }
    : entidad === 'incidente'
    ? { id: true, folio: true, categoria: true, prioridad: true, estado: true, descripcion: true, creadoEn: true }
    : { id: true, nombre: true, email: true, rolInterno: true, activo: true };

  const items = await modelo.findMany({
    where,
    select: selectFields,
    orderBy: { creadoEn: 'desc' },
    take: limite,
  });

  const total = await modelo.count({ where });

  // Formatear filas según entidad
  let columnas, filas;
  if (entidad === 'solicitud') {
    columnas = ['Folio', 'Acreedor/Proveedor', 'RFC', 'Estado', 'Tipo', 'Solicitante', 'Fecha'];
    filas = items.map((s) => [s.folio, s.razonSocial || '-', s.rfc || '-', s.estado, s.tipo || 'alta', s.solicitanteNombre || '-', formatDate(s.creadoEn)]);
  } else if (entidad === 'aprobacion') {
    columnas = ['Solicitud', 'Descripción', 'Estado', 'Creada', 'Resuelta'];
    filas = items.map((a) => [a.solicitud?.folio || '-', a.descripcionCorta || '-', a.estado, formatDate(a.creadoEn), a.fechaResolucion ? formatDate(a.fechaResolucion) : 'Pendiente']);
  } else if (entidad === 'incidente') {
    columnas = ['Folio', 'Categoría', 'Prioridad', 'Estado', 'Fecha'];
    filas = items.map((i) => [i.folio, i.categoria, i.prioridad, i.estado, formatDate(i.creadoEn)]);
  } else {
    columnas = ['Nombre', 'Email', 'Rol', 'Activo'];
    filas = items.map((u) => [u.nombre || '-', u.email, u.rolInterno, u.activo ? 'Sí' : 'No']);
  }

  return {
    tipo: 'tabla',
    titulo: `${entidadLabel(entidad, true)}${filtros.estado ? ` (${filtros.estado})` : ''}`,
    subtitulo: periodo ? formatearPeriodo(periodo) : null,
    columnas,
    filas,
    total,
    resumen: `Mostrando ${filas.length} de ${total} ${entidadLabel(entidad, true)}${filtros.estado ? ` en estado **${filtros.estado}**` : ''}${periodo ? ` (${formatearPeriodo(periodo)})` : ''}.`,
    csv: true,
  };
}

// ── Helpers ──
function entidadLabel(e, plural) {
  const labels = { solicitud: ['solicitud', 'solicitudes'], aprobacion: ['aprobación', 'aprobaciones'], incidente: ['incidente', 'incidentes'], usuario: ['usuario', 'usuarios'] };
  return labels[e]?.[plural ? 1 : 0] || e;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearPeriodo(p) {
  const desde = new Date(p.desde).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  const hasta = new Date(p.hasta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${desde} — ${hasta}`;
}

function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}

module.exports = { parsearIntencion, ejecutarReporte };
