-- CreateTable
CREATE TABLE "ConfiguracionModulo" (
    "id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "grupo" TEXT NOT NULL DEFAULT 'General',
    "descripcion" TEXT,
    "sensible" BOOLEAN NOT NULL DEFAULT false,
    "actualizadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionModulo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionModulo_modulo_clave_key" ON "ConfiguracionModulo"("modulo", "clave");

-- CreateIndex
CREATE INDEX "ConfiguracionModulo_modulo_idx" ON "ConfiguracionModulo"("modulo");
