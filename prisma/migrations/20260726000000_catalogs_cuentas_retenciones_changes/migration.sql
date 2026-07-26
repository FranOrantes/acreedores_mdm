-- ============================================================================
-- Migration: Cambios en catálogos Cuentas Asociadas y Retenciones
-- 1. Eliminar campo tipoAcreedorId de CatCuentaAsociada
-- 2. Cambiar grupoCuentasId a relación many-to-many (multi-select)
-- 3. valorSap ya permite duplicados (sin cambios necesarios)
-- 4. Agregar grupoCuentasId a CatRetencion
-- ============================================================================

-- 1. Eliminar tipoAcreedorId de CatCuentaAsociada
ALTER TABLE "CatCuentaAsociada" DROP CONSTRAINT IF EXISTS "CatCuentaAsociada_tipoAcreedorId_fkey";
ALTER TABLE "CatCuentaAsociada" DROP COLUMN IF EXISTS "tipoAcreedorId";

-- 2. Crear tabla intermedia para relación M2M entre CatCuentaAsociada y CatGrupoCuentas
CREATE TABLE "_CatCuentaAsociadaToCatGrupoCuentas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_CatCuentaAsociadaToCatGrupoCuentas_AB_unique" ON "_CatCuentaAsociadaToCatGrupoCuentas"("A", "B");
CREATE INDEX "_CatCuentaAsociadaToCatGrupoCuentas_B_index" ON "_CatCuentaAsociadaToCatGrupoCuentas"("B");

ALTER TABLE "_CatCuentaAsociadaToCatGrupoCuentas" ADD CONSTRAINT "_CatCuentaAsociadaToCatGrupoCuentas_A_fkey" FOREIGN KEY ("A") REFERENCES "CatCuentaAsociada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CatCuentaAsociadaToCatGrupoCuentas" ADD CONSTRAINT "_CatCuentaAsociadaToCatGrupoCuentas_B_fkey" FOREIGN KEY ("B") REFERENCES "CatGrupoCuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar datos existentes: copiar la relación 1:N actual al M2M
INSERT INTO "_CatCuentaAsociadaToCatGrupoCuentas" ("A", "B")
SELECT "id", "grupoCuentasId" FROM "CatCuentaAsociada" WHERE "grupoCuentasId" IS NOT NULL;

-- Eliminar la columna FK antigua
ALTER TABLE "CatCuentaAsociada" DROP CONSTRAINT IF EXISTS "CatCuentaAsociada_grupoCuentasId_fkey";
ALTER TABLE "CatCuentaAsociada" DROP COLUMN "grupoCuentasId";

-- 4. Agregar grupoCuentasId a CatRetencion (solo 1 grupo, FK simple)
ALTER TABLE "CatRetencion" ADD COLUMN "grupoCuentasId" TEXT;
ALTER TABLE "CatRetencion" ADD CONSTRAINT "CatRetencion_grupoCuentasId_fkey" FOREIGN KEY ("grupoCuentasId") REFERENCES "CatGrupoCuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
