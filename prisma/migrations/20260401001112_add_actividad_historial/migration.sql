-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" TEXT,
    "campoModificado" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "visibleCliente" BOOLEAN NOT NULL DEFAULT false,
    "autorNombre" TEXT,
    "autorEmail" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Actividad_entidadTipo_entidadId_idx" ON "Actividad"("entidadTipo", "entidadId");
