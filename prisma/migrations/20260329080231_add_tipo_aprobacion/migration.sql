-- CreateTable
CREATE TABLE "TipoAprobacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "grupoAsignadoId" TEXT,
    "aprobadorAsignadoId" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 100,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoAprobacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TipoAprobacion" ADD CONSTRAINT "TipoAprobacion_grupoAsignadoId_fkey" FOREIGN KEY ("grupoAsignadoId") REFERENCES "GrupoAprobacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoAprobacion" ADD CONSTRAINT "TipoAprobacion_aprobadorAsignadoId_fkey" FOREIGN KEY ("aprobadorAsignadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
