CREATE TABLE "Formulario" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'todos',
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT NOT NULL DEFAULT 'description',
    "tipo" TEXT NOT NULL DEFAULT 'simple',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "definicion" JSONB NOT NULL,
    "dominioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formulario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Formulario_clave_modulo_key" ON "Formulario"("clave", "modulo");
CREATE INDEX "Formulario_modulo_idx" ON "Formulario"("modulo");
