-- CreateTable
CREATE TABLE "ConfiguracionModulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modulo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "grupo" TEXT NOT NULL DEFAULT 'General',
    "descripcion" TEXT,
    "sensible" BOOLEAN NOT NULL DEFAULT false,
    "actualizadoPor" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionModulo_modulo_clave_key" ON "ConfiguracionModulo"("modulo", "clave");

-- CreateIndex
CREATE INDEX "ConfiguracionModulo_modulo_idx" ON "ConfiguracionModulo"("modulo");
