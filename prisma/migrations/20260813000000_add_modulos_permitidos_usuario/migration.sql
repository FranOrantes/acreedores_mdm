-- AlterTable: Add modulosPermitidos to Usuario
ALTER TABLE "Usuario" ADD COLUMN "modulosPermitidos" TEXT NOT NULL DEFAULT '["acreedores","proveedores","clientes","materiales"]';
