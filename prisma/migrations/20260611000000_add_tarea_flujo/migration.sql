-- CreateTable
CREATE TABLE "TareaFlujo" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "grupoAsignadoId" TEXT,
    "miembroAsignadoId" TEXT,
    "aprobadorId" TEXT,
    "resumeUrl" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaFlujo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TareaFlujo_solicitudId_idx" ON "TareaFlujo"("solicitudId");

-- CreateIndex
CREATE INDEX "TareaFlujo_estado_idx" ON "TareaFlujo"("estado");

-- AddForeignKey
ALTER TABLE "TareaFlujo" ADD CONSTRAINT "TareaFlujo_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaFlujo" ADD CONSTRAINT "TareaFlujo_grupoAsignadoId_fkey" FOREIGN KEY ("grupoAsignadoId") REFERENCES "GrupoAprobacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaFlujo" ADD CONSTRAINT "TareaFlujo_miembroAsignadoId_fkey" FOREIGN KEY ("miembroAsignadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex (unique constraint: one task per solicitud+grupo)
CREATE UNIQUE INDEX "TareaFlujo_solicitudId_grupoAsignadoId_key" ON "TareaFlujo"("solicitudId", "grupoAsignadoId");

-- AddForeignKey
ALTER TABLE "TareaFlujo" ADD CONSTRAINT "TareaFlujo_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
