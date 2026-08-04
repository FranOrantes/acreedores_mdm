-- AlterTable: Add completadoEn to TareaSolicitud
ALTER TABLE "TareaSolicitud" ADD COLUMN "completadoEn" TIMESTAMP(3);

-- Seed existing completed tasks: set completadoEn = actualizadoEn for tasks already in "completado"
UPDATE "TareaSolicitud" SET "completadoEn" = "actualizadoEn" WHERE "estado" = 'completado' AND "completadoEn" IS NULL;
