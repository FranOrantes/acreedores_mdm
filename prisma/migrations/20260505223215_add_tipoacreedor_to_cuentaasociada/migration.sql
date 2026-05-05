-- AlterTable
ALTER TABLE "CatCuentaAsociada" ADD COLUMN     "tipoAcreedorId" TEXT;

-- AddForeignKey
ALTER TABLE "CatCuentaAsociada" ADD CONSTRAINT "CatCuentaAsociada_tipoAcreedorId_fkey" FOREIGN KEY ("tipoAcreedorId") REFERENCES "CatTipoAcreedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
