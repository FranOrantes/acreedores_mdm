CREATE TABLE "materiales_options" (
    "sysId" TEXT NOT NULL, "clave" TEXT NOT NULL, "valor" TEXT, "etiqueta" TEXT,
    "sysUpdatedOn" TIMESTAMP(3) NOT NULL, "raw" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "materiales_options_pkey" PRIMARY KEY ("sysId")
);
CREATE INDEX "materiales_options_clave_idx" ON "materiales_options"("clave");
CREATE INDEX "materiales_options_sysUpdatedOn_idx" ON "materiales_options"("sysUpdatedOn");

CREATE TABLE "materiales_matriz_aprobadores" (
    "sysId" TEXT NOT NULL, "comprador" TEXT, "negociador" TEXT, "dga" TEXT, "proyecto" TEXT,
    "sysUpdatedOn" TIMESTAMP(3) NOT NULL, "raw" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "materiales_matriz_aprobadores_pkey" PRIMARY KEY ("sysId")
);
CREATE INDEX "materiales_matriz_aprobadores_comprador_idx" ON "materiales_matriz_aprobadores"("comprador");
