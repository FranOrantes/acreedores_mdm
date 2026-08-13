-- CreateIndex (unique constraint: one task per solicitud+grupo)
-- Idempotente: la migracion 20260611000000_add_tarea_flujo ya crea este indice.
CREATE UNIQUE INDEX IF NOT EXISTS "TareaFlujo_solicitudId_grupoAsignadoId_key" ON "TareaFlujo"("solicitudId", "grupoAsignadoId");
