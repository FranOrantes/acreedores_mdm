-- CreateIndex (unique constraint: one task per solicitud+grupo)
CREATE UNIQUE INDEX "TareaFlujo_solicitudId_grupoAsignadoId_key" ON "TareaFlujo"("solicitudId", "grupoAsignadoId");
