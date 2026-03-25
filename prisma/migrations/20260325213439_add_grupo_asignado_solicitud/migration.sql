-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "grupoAsignadoId" TEXT;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_grupoAsignadoId_fkey" FOREIGN KEY ("grupoAsignadoId") REFERENCES "GrupoAprobacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
