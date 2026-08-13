/*
  Warnings:

  - You are about to drop the column `accion` on the `ReglaVisibilidadCampo` table. All the data in the column will be lost.
  - You are about to drop the column `obligatorio` on the `ReglaVisibilidadCampo` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GrupoAprobacion_dominioId_idx";

-- DropIndex
DROP INDEX "Incidente_dominioId_idx";

-- DropIndex
DROP INDEX "Solicitud_dominioId_idx";

-- DropIndex
DROP INDEX "TipoAprobacion_dominioId_idx";

-- DropIndex
DROP INDEX "Ubicacion_dominioId_idx";

-- AlterTable
ALTER TABLE "ReglaVisibilidadCampo" DROP COLUMN "accion",
DROP COLUMN "obligatorio";

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
CREATE INDEX "ConfiguracionModulo_modulo_idx" ON "ConfiguracionModulo"("modulo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionModulo_modulo_clave_key" ON "ConfiguracionModulo"("modulo", "clave");
