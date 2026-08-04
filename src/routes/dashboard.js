const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// GET /api/dashboard/metricas?modulo=acreedores
router.get('/metricas', async (req, res) => {
  try {
    const modulo = req.query.modulo || 'acreedores';

    // ── 1. Solicitudes por estado ──
    const porEstado = await prisma.solicitud.groupBy({
      by: ['estado'],
      where: { modulo },
      _count: { id: true },
    });
    const estadoMap = {};
    porEstado.forEach((r) => { estadoMap[r.estado] = r._count.id; });

    // ── 2. Solicitudes por mes (últimos 6 meses) ──
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);
    hace6Meses.setDate(1);
    hace6Meses.setHours(0, 0, 0, 0);

    const solicitudesRecientes = await prisma.solicitud.findMany({
      where: { modulo, creadoEn: { gte: hace6Meses } },
      select: { creadoEn: true, estado: true },
    });

    const porMes = {};
    solicitudesRecientes.forEach((s) => {
      const key = `${s.creadoEn.getFullYear()}-${String(s.creadoEn.getMonth() + 1).padStart(2, '0')}`;
      if (!porMes[key]) porMes[key] = { mes: key, total: 0, completadas: 0 };
      porMes[key].total++;
      if (['aprobada', 'registrado'].includes(s.estado)) porMes[key].completadas++;
    });
    const volumenMensual = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));

    // ── 3. Tiempo promedio total (creación → última tarea completada) ──
    const solicitudesConTareas = await prisma.solicitud.findMany({
      where: {
        modulo,
        estado: { in: ['aprobada', 'registrado'] },
      },
      select: {
        id: true,
        creadoEn: true,
        tareas: {
          where: { estado: 'completado' },
          orderBy: { actualizadoEn: 'desc' },
          take: 1,
          select: { actualizadoEn: true },
        },
      },
    });

    let totalDias = 0;
    let countConTiempo = 0;
    solicitudesConTareas.forEach((s) => {
      if (s.tareas.length > 0) {
        const diff = s.tareas[0].actualizadoEn.getTime() - s.creadoEn.getTime();
        totalDias += diff / (1000 * 60 * 60 * 24);
        countConTiempo++;
      }
    });
    const tiempoPromedioTotal = countConTiempo > 0 ? +(totalDias / countConTiempo).toFixed(1) : null;

    // ── 4. Tiempo promedio por etapa ──
    const tareasCompletadas = await prisma.tareaSolicitud.findMany({
      where: {
        estado: 'completado',
        solicitud: { modulo },
      },
      select: {
        titulo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    const etapaAcc = {};
    tareasCompletadas.forEach((t) => {
      const key = t.titulo;
      if (!etapaAcc[key]) etapaAcc[key] = { titulo: key, totalHoras: 0, count: 0 };
      const diffHoras = (t.actualizadoEn.getTime() - t.creadoEn.getTime()) / (1000 * 60 * 60);
      etapaAcc[key].totalHoras += diffHoras;
      etapaAcc[key].count++;
    });

    const tiempoPorEtapa = Object.values(etapaAcc)
      .map((e) => ({
        etapa: e.titulo,
        promedioHoras: +(e.totalHoras / e.count).toFixed(1),
        promedioDias: +((e.totalHoras / e.count) / 24).toFixed(1),
        cantidad: e.count,
      }))
      .sort((a, b) => b.promedioHoras - a.promedioHoras);

    // ── 5. Resumen rápido ──
    const totalSolicitudes = porEstado.reduce((sum, r) => sum + r._count.id, 0);
    const enProceso = (estadoMap.enviada || 0) + (estadoMap.en_revision || 0);
    const completadas = (estadoMap.aprobada || 0) + (estadoMap.registrado || 0);

    res.json({
      resumen: {
        total: totalSolicitudes,
        enProceso,
        completadas,
        rechazadas: estadoMap.rechazada || 0,
        borradores: estadoMap.borrador || 0,
        tiempoPromedioTotalDias: tiempoPromedioTotal,
      },
      porEstado: estadoMap,
      volumenMensual,
      tiempoPorEtapa,
      cuelloBotella: tiempoPorEtapa[0] || null,
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err);
    res.status(500).json({ error: 'Error al calcular métricas' });
  }
});

module.exports = router;
