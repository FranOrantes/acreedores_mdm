-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "acreedorNumero" TEXT,
ADD COLUMN     "acreedorReferencia" TEXT,
ADD COLUMN     "movimientoRealizar" TEXT,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'alta';
