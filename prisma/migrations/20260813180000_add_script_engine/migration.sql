-- Script Includes (funciones JS reutilizables)
CREATE TABLE "ScriptInclude" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "script" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'todos',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptInclude_pkey" PRIMARY KEY ("id")
);

-- Business Rules (server-side, estilo ServiceNow)
CREATE TABLE "BusinessRule" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "entidad" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "condiciones" TEXT,
    "logica" TEXT NOT NULL DEFAULT 'AND',
    "script" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "modulo" TEXT NOT NULL DEFAULT 'todos',
    "dominioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

-- Script en Reglas de Formulario (modo avanzado JS client-side)
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "script" TEXT;

-- Indices
CREATE UNIQUE INDEX "ScriptInclude_nombre_key" ON "ScriptInclude"("nombre");
CREATE INDEX "ScriptInclude_modulo_idx" ON "ScriptInclude"("modulo");
CREATE INDEX "BusinessRule_entidad_evento_idx" ON "BusinessRule"("entidad", "evento");
CREATE INDEX "BusinessRule_modulo_idx" ON "BusinessRule"("modulo");
