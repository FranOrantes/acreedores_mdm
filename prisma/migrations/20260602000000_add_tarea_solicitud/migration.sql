-- CreateTable
CREATE TABLE "TareaSolicitud" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "detalle" TEXT,
    "subtexto" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaSolicitud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TareaSolicitud_solicitudId_idx" ON "TareaSolicitud"("solicitudId");

-- AddForeignKey
ALTER TABLE "TareaSolicitud" ADD CONSTRAINT "TareaSolicitud_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
