-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "contenidoBase64" TEXT,
ALTER COLUMN "rutaArchivo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "bloqueoContabilizacionActual" BOOLEAN,
ADD COLUMN     "bloqueoContabilizacionNuevo" BOOLEAN,
ADD COLUMN     "justificacion" TEXT;

-- CreateTable
CREATE TABLE "DocumentoTemporal" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "contenidoBase64" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoTemporal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidente" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "modulo" TEXT,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "reportadoPorId" TEXT NOT NULL,
    "asignadoAId" TEXT,
    "comentarioResolucion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incidente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoTemporal_sessionKey_idx" ON "DocumentoTemporal"("sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Incidente_folio_key" ON "Incidente"("folio");

-- AddForeignKey
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
