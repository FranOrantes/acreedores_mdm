CREATE TABLE "materiales_registros" (
    "sysId" TEXT NOT NULL,
    "noMateria" TEXT,
    "nombre" TEXT,
    "estatus" TEXT,
    "tipoSolicitud" TEXT,
    "eanPi" TEXT,
    "razonSocial" TEXT,
    "sysUpdatedOn" TIMESTAMP(3) NOT NULL,
    "raw" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "materiales_registros_pkey" PRIMARY KEY ("sysId")
);
CREATE INDEX "materiales_registros_noMateria_idx" ON "materiales_registros"("noMateria");
CREATE INDEX "materiales_registros_eanPi_idx" ON "materiales_registros"("eanPi");
CREATE INDEX "materiales_registros_sysUpdatedOn_idx" ON "materiales_registros"("sysUpdatedOn");
CREATE INDEX "materiales_registros_estatus_idx" ON "materiales_registros"("estatus");

CREATE TABLE "materiales_sync_log" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'corriendo',
    "registros" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    CONSTRAINT "materiales_sync_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "materiales_sync_log_inicio_idx" ON "materiales_sync_log"("inicio");
