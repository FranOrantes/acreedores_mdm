-- AlterTable: Add modulo discriminator to Solicitud
ALTER TABLE "Solicitud" ADD COLUMN "modulo" TEXT NOT NULL DEFAULT 'acreedores';

-- AlterTable: Proveedor - Asignación
ALTER TABLE "Solicitud" ADD COLUMN "compradorJr" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "negociadorAsignado" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "dga" TEXT;

-- AlterTable: Proveedor - Dirección fiscal extra
ALTER TABLE "Solicitud" ADD COLUMN "numDepartamento" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "piso" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "pais" TEXT;

-- AlterTable: Proveedor - Contacto fiscal
ALTER TABLE "Solicitud" ADD COLUMN "contactoFiscalNombre" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "contactoFiscalExtension" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "contactoFiscalTelefono" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "contactoFiscalCorreo" TEXT;

-- AlterTable: Proveedor - Convenio comercial
ALTER TABLE "Solicitud" ADD COLUMN "descuentosFee" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "descuentosRrrp" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "porcentajeNoDevolucion" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "comentarioDescuento" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "modalidad" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "tipoEntrega" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "escalaEntrega" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "plazoPago" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "cuentaBancaria" TEXT;

-- AlterTable: Proveedor - Devolución
ALTER TABLE "Solicitud" ADD COLUMN "mercanciaVencida" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "mercanciaDeteriorada" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "mercanciaBuenEstado" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "penalizacion" TEXT;

-- AlterTable: Proveedor - Contactos de organización (KAM)
ALTER TABLE "Solicitud" ADD COLUMN "nombreKam" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoKam" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoKam" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Ejecutivo)
ALTER TABLE "Solicitud" ADD COLUMN "nombreEjecutivo" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoEjecutivo" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoEjecutivo" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Gerente)
ALTER TABLE "Solicitud" ADD COLUMN "nombreGerente" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoGerente" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoGerente" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Director)
ALTER TABLE "Solicitud" ADD COLUMN "nombreDirector" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoDirector" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoDirector" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Cuentas por pagar)
ALTER TABLE "Solicitud" ADD COLUMN "nombreCuentasPagar" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoCuentasPagar" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoCuentasPagar" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Representante legal)
ALTER TABLE "Solicitud" ADD COLUMN "nombreRepresentante" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoRepresentante" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoRepresentante" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Responsable de calidad)
ALTER TABLE "Solicitud" ADD COLUMN "nombreRCalidad" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoRCalidad" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoRCalidad" TEXT;

-- AlterTable: Proveedor - Contactos de organización (Responsable sanitario)
ALTER TABLE "Solicitud" ADD COLUMN "nombreRSanitario" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "telefonoRSanitario" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN "correoRSanitario" TEXT;

-- AlterTable: Proveedor - Términos
ALTER TABLE "Solicitud" ADD COLUMN "aceptaTerminos" TEXT;

-- AlterTable: Add modulo to CatTipoDocumento
ALTER TABLE "CatTipoDocumento" ADD COLUMN "modulo" TEXT NOT NULL DEFAULT 'acreedores';

-- AlterTable: Add modulo to ReglaVisibilidadCampo
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "modulo" TEXT NOT NULL DEFAULT 'acreedores';

-- CreateIndex
CREATE INDEX "ReglaVisibilidadCampo_modulo_idx" ON "ReglaVisibilidadCampo"("modulo");
