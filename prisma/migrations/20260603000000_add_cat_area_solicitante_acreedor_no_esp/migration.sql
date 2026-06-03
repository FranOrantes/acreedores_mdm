-- CreateTable
CREATE TABLE "CatAreaSolicitante" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatAreaSolicitante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatAcreedorNoEspecializado" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatAcreedorNoEspecializado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatAreaSolicitante_clave_key" ON "CatAreaSolicitante"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "CatAcreedorNoEspecializado_clave_key" ON "CatAcreedorNoEspecializado"("clave");
