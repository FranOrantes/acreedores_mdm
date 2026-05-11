-- CreateTable
CREATE TABLE "ReglaVisibilidadCampo" (
    "id" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "condiciones" TEXT NOT NULL,
    "accion" TEXT NOT NULL DEFAULT 'mostrar',
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "formulario" TEXT NOT NULL DEFAULT 'alta',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglaVisibilidadCampo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReglaVisibilidadCampo_formulario_idx" ON "ReglaVisibilidadCampo"("formulario");

-- CreateIndex
CREATE INDEX "ReglaVisibilidadCampo_campo_idx" ON "ReglaVisibilidadCampo"("campo");
