-- CreateTable: CarpetaDataLake (folders per acreedor/proveedor)
CREATE TABLE "CarpetaDataLake" (
    "id" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'acreedores',
    "nombre" TEXT NOT NULL,
    "parentId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarpetaDataLake_pkey" PRIMARY KEY ("id")
);

-- Add carpetaId to existing Documento table (optional FK for DataLake folder organization)
ALTER TABLE "Documento" ADD COLUMN "carpetaId" TEXT;

-- CreateIndex
CREATE INDEX "CarpetaDataLake_rfc_modulo_idx" ON "CarpetaDataLake"("rfc", "modulo");
CREATE INDEX "CarpetaDataLake_parentId_idx" ON "CarpetaDataLake"("parentId");
CREATE INDEX "Documento_carpetaId_idx" ON "Documento"("carpetaId");

-- AddForeignKey: self-referencing parent folder
ALTER TABLE "CarpetaDataLake" ADD CONSTRAINT "CarpetaDataLake_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CarpetaDataLake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Documento → CarpetaDataLake
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_carpetaId_fkey" FOREIGN KEY ("carpetaId") REFERENCES "CarpetaDataLake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
