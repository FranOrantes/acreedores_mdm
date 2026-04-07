/*
  Warnings:

  - A unique constraint covering the columns `[employeeNumber]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "areaHumana" TEXT,
ADD COLUMN     "contrasena" TEXT,
ADD COLUMN     "employeeNumber" TEXT,
ADD COLUMN     "linea" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "ubicacionId" TEXT;

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "calle" TEXT,
    "ciudad" TEXT,
    "estadoProvincia" TEXT,
    "codigoPostal" TEXT,
    "pais" TEXT DEFAULT 'MX',
    "ventaNarcoticos" BOOLEAN NOT NULL DEFAULT false,
    "telefono" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "branchOffice" TEXT,
    "branchOfficeManagerId" TEXT,
    "supplyCenter" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ubicacion_nombre_key" ON "Ubicacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_employeeNumber_key" ON "Usuario"("employeeNumber");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_branchOfficeManagerId_fkey" FOREIGN KEY ("branchOfficeManagerId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
