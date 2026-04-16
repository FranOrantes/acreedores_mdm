-- CreateTable
CREATE TABLE "CatServiciosEspeciales" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatServiciosEspeciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatCasosEspeciales" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatCasosEspeciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatMonedaPago" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatMonedaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatViaPago" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatViaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatMonedaPedido" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatMonedaPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatClasificacionAcreedor" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatClasificacionAcreedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatLocalizacion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatLocalizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatBanco" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatBanco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatServiciosEspeciales_clave_key" ON "CatServiciosEspeciales"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatCasosEspeciales_clave_key" ON "CatCasosEspeciales"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatMonedaPago_clave_key" ON "CatMonedaPago"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatViaPago_clave_key" ON "CatViaPago"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatMonedaPedido_clave_key" ON "CatMonedaPedido"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatClasificacionAcreedor_clave_key" ON "CatClasificacionAcreedor"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatLocalizacion_clave_key" ON "CatLocalizacion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatBanco_clave_key" ON "CatBanco"("clave");
