-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "pasoActual" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "solicitanteNombre" TEXT,
    "solicitanteArea" TEXT,
    "sucursalId" TEXT,
    "rfc" TEXT,
    "tipoAcreedorId" TEXT,
    "grupoCuentasId" TEXT,
    "cuentaAsociada" TEXT,
    "acreedoresNoEspecializados" TEXT,
    "casosEspeciales" TEXT,
    "serviciosEspeciales" TEXT,
    "areasSolicitantes" TEXT,
    "razonSocial" TEXT,
    "nombreComercial" TEXT,
    "apellidoPaterno" TEXT,
    "nombrePila" TEXT,
    "apellidoMaterno" TEXT,
    "tipoPersona" TEXT,
    "type" TEXT,
    "clasificacionAcreedor" TEXT,
    "condicionPagoId" TEXT,
    "monedaPago" TEXT,
    "viaPago" TEXT,
    "cuentaClabe" TEXT,
    "nombreBanco" TEXT,
    "monedaPedido" TEXT,
    "localizacion" TEXT,
    "calle" TEXT,
    "numeroExterior" TEXT,
    "numeroInterior" TEXT,
    "codigoPostal" TEXT,
    "colonia" TEXT,
    "distritoColoniaOpcional" TEXT,
    "estado_dir" TEXT,
    "municipio" TEXT,
    "regionExt" TEXT,
    "paisExt" TEXT,
    "conceptoBusqueda" TEXT,
    "bienServicio" TEXT,
    "empresaReconocida" TEXT,
    "cdrCobertura" TEXT,
    "esquemaResico" TEXT,
    "tipoRetencion" TEXT,
    "indicadorRetencion" TEXT,
    "aceptaClausula" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactoAcreedor" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "extension" TEXT,
    "cdr" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactoAcreedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatSucursal" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatSucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatTipoAcreedor" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatTipoAcreedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatGrupoCuentas" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatGrupoCuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatCuentaAsociada" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoCuentasId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatCuentaAsociada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatCondicionPago" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatCondicionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatTipoDocumento" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "condicional" BOOLEAN NOT NULL DEFAULT false,
    "extensiones" TEXT NOT NULL,
    "maxSizeMb" INTEGER NOT NULL DEFAULT 5,
    "maxArchivos" INTEGER NOT NULL DEFAULT 1,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "icono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatTipoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_folio_key" ON "Solicitud"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "CatSucursal_codigo_key" ON "CatSucursal"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CatTipoAcreedor_clave_key" ON "CatTipoAcreedor"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatGrupoCuentas_clave_key" ON "CatGrupoCuentas"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatCondicionPago_clave_key" ON "CatCondicionPago"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatTipoDocumento_clave_key" ON "CatTipoDocumento"("clave");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "CatSucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_tipoAcreedorId_fkey" FOREIGN KEY ("tipoAcreedorId") REFERENCES "CatTipoAcreedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_grupoCuentasId_fkey" FOREIGN KEY ("grupoCuentasId") REFERENCES "CatGrupoCuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_condicionPagoId_fkey" FOREIGN KEY ("condicionPagoId") REFERENCES "CatCondicionPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoAcreedor" ADD CONSTRAINT "ContactoAcreedor_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatCuentaAsociada" ADD CONSTRAINT "CatCuentaAsociada_grupoCuentasId_fkey" FOREIGN KEY ("grupoCuentasId") REFERENCES "CatGrupoCuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
