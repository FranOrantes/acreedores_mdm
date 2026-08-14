CREATE TABLE "preferencias_usuario" (
    "id" TEXT NOT NULL, "usuarioId" TEXT NOT NULL, "clave" TEXT NOT NULL, "valor" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "preferencias_usuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "preferencias_usuario_usuarioId_clave_key" ON "preferencias_usuario"("usuarioId", "clave");

CREATE TABLE "vistas_formulario" (
    "id" TEXT NOT NULL, "tablaId" TEXT, "formularioClave" TEXT, "nombre" TEXT NOT NULL,
    "layout" JSONB NOT NULL, "esDefault" BOOLEAN NOT NULL DEFAULT false, "roles" JSONB NOT NULL DEFAULT '[]',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vistas_formulario_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vistas_formulario_tablaId_idx" ON "vistas_formulario"("tablaId");

ALTER TABLE "custom_registros" ADD COLUMN "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "custom_registros" ADD COLUMN "eliminadoEn" TIMESTAMP(3);
CREATE INDEX "custom_registros_eliminado_idx" ON "custom_registros"("eliminado");
