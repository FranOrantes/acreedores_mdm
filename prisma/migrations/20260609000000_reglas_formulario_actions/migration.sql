-- AlterTable: Add independent action columns + reverseIfFalse to ReglaVisibilidadCampo
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "accionVisible" TEXT NOT NULL DEFAULT 'no_cambiar';
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "accionObligatorio" TEXT NOT NULL DEFAULT 'no_cambiar';
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "accionReadOnly" TEXT NOT NULL DEFAULT 'no_cambiar';
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN "reverseIfFalse" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: map old "accion" column to new "accionVisible"
UPDATE "ReglaVisibilidadCampo" SET "accionVisible" = "accion" WHERE "accion" IS NOT NULL AND "accion" != '' AND "accion" != 'no_cambiar';

-- Migrate existing data: map old "obligatorio" boolean to new "accionObligatorio"
UPDATE "ReglaVisibilidadCampo" SET "accionObligatorio" = 'requerir' WHERE "obligatorio" = true;
