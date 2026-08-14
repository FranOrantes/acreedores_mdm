CREATE TABLE "TablaCustom" (
    "id" TEXT NOT NULL, "clave" TEXT NOT NULL, "label" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'todos', "icono" TEXT NOT NULL DEFAULT 'table',
    "descripcion" TEXT, "activa" BOOLEAN NOT NULL DEFAULT true,
    "storage" TEXT NOT NULL DEFAULT 'json', "autoNumber" TEXT,
    "permisos" JSONB NOT NULL DEFAULT '{"leer":true,"crear":true,"actualizar":true,"eliminar":true}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TablaCustom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TablaCustom_clave_modulo_key" ON "TablaCustom"("clave", "modulo");
CREATE INDEX "TablaCustom_modulo_idx" ON "TablaCustom"("modulo");

CREATE TABLE "ColumnaCustom" (
    "id" TEXT NOT NULL, "tablaId" TEXT NOT NULL, "clave" TEXT NOT NULL, "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string', "opciones" JSONB, "referencia" TEXT,
    "maxLength" INTEGER, "defaultValue" TEXT, "display" BOOLEAN NOT NULL DEFAULT false,
    "requerido" BOOLEAN NOT NULL DEFAULT false, "orden" INTEGER NOT NULL DEFAULT 0, "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ColumnaCustom_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ColumnaCustom_tablaId_fkey" FOREIGN KEY ("tablaId") REFERENCES "TablaCustom"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ColumnaCustom_tablaId_clave_key" ON "ColumnaCustom"("tablaId", "clave");
CREATE INDEX "ColumnaCustom_tablaId_idx" ON "ColumnaCustom"("tablaId");

CREATE TABLE "custom_registros" (
    "id" TEXT NOT NULL, "tablaId" TEXT NOT NULL, "datos" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "custom_registros_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "custom_registros_tablaId_idx" ON "custom_registros"("tablaId");
