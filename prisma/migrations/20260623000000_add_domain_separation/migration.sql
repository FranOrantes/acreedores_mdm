-- Domain Separation Migration
-- Non-destructive: assigns default domain to all existing data

-- 1. Create Dominio table
CREATE TABLE IF NOT EXISTS "Dominio" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dominio_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Dominio_clave_key" ON "Dominio"("clave");

-- 2. Create UsuarioDominio pivot table
CREATE TABLE IF NOT EXISTS "UsuarioDominio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dominioId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'usuario',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsuarioDominio_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UsuarioDominio_usuarioId_dominioId_key" ON "UsuarioDominio"("usuarioId", "dominioId");
ALTER TABLE "UsuarioDominio" ADD CONSTRAINT "UsuarioDominio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsuarioDominio" ADD CONSTRAINT "UsuarioDominio_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create CampoFormulario table
CREATE TABLE IF NOT EXISTS "CampoFormulario" (
    "id" TEXT NOT NULL,
    "dominioId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'todos',
    "formulario" TEXT NOT NULL DEFAULT 'alta',
    "seccion" TEXT NOT NULL DEFAULT 'custom',
    "clave" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "requerido" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "opciones" JSONB,
    "validacion" JSONB,
    "placeholder" TEXT,
    "tooltip" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CampoFormulario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CampoFormulario_dominioId_clave_key" ON "CampoFormulario"("dominioId", "clave");
CREATE INDEX IF NOT EXISTS "CampoFormulario_dominioId_formulario_idx" ON "CampoFormulario"("dominioId", "formulario");
ALTER TABLE "CampoFormulario" ADD CONSTRAINT "CampoFormulario_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3b. Add modulo column to CampoFormulario (in case table was created before this column existed)
ALTER TABLE "CampoFormulario" ADD COLUMN IF NOT EXISTS "modulo" TEXT NOT NULL DEFAULT 'todos';

-- 4. Add dominioId columns to existing tables (nullable to avoid breaking existing data)
ALTER TABLE "Solicitud" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;
ALTER TABLE "Solicitud" ADD COLUMN IF NOT EXISTS "camposExtra" JSONB;
ALTER TABLE "GrupoAprobacion" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;
ALTER TABLE "Ubicacion" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;
ALTER TABLE "Incidente" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;
ALTER TABLE "TipoAprobacion" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;
ALTER TABLE "ReglaVisibilidadCampo" ADD COLUMN IF NOT EXISTS "dominioId" TEXT;

-- 5. Add domain fields to Usuario
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "dominioActualId" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "esSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- 6. Add foreign keys for dominioId columns
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GrupoAprobacion" ADD CONSTRAINT "GrupoAprobacion_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TipoAprobacion" ADD CONSTRAINT "TipoAprobacion_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReglaVisibilidadCampo" ADD CONSTRAINT "ReglaVisibilidadCampo_dominioId_fkey" FOREIGN KEY ("dominioId") REFERENCES "Dominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Create indexes for dominioId
CREATE INDEX IF NOT EXISTS "Solicitud_dominioId_idx" ON "Solicitud"("dominioId");
CREATE INDEX IF NOT EXISTS "GrupoAprobacion_dominioId_idx" ON "GrupoAprobacion"("dominioId");
CREATE INDEX IF NOT EXISTS "Ubicacion_dominioId_idx" ON "Ubicacion"("dominioId");
CREATE INDEX IF NOT EXISTS "Incidente_dominioId_idx" ON "Incidente"("dominioId");
CREATE INDEX IF NOT EXISTS "TipoAprobacion_dominioId_idx" ON "TipoAprobacion"("dominioId");
CREATE INDEX IF NOT EXISTS "ReglaVisibilidadCampo_dominioId_idx" ON "ReglaVisibilidadCampo"("dominioId");

-- 8. Seed default domain
INSERT INTO "Dominio" ("id", "clave", "nombre", "activo", "creadoEn", "actualizadoEn")
VALUES ('dom-default-001', 'principal', 'Empresa Principal', true, NOW(), NOW())
ON CONFLICT ("clave") DO NOTHING;

-- 9. Assign default domain to all existing records
UPDATE "Solicitud" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;
UPDATE "GrupoAprobacion" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;
UPDATE "Ubicacion" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;
UPDATE "Incidente" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;
UPDATE "TipoAprobacion" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;
UPDATE "ReglaVisibilidadCampo" SET "dominioId" = 'dom-default-001' WHERE "dominioId" IS NULL;

-- 10. Assign all existing users to default domain + set dominioActualId
UPDATE "Usuario" SET "dominioActualId" = 'dom-default-001' WHERE "dominioActualId" IS NULL;

INSERT INTO "UsuarioDominio" ("id", "usuarioId", "dominioId", "rol", "creadoEn")
SELECT
    gen_random_uuid()::text,
    u."id",
    'dom-default-001',
    CASE WHEN u."rolInterno" = 'admin' THEN 'admin' ELSE 'usuario' END,
    NOW()
FROM "Usuario" u
WHERE NOT EXISTS (
    SELECT 1 FROM "UsuarioDominio" ud WHERE ud."usuarioId" = u."id" AND ud."dominioId" = 'dom-default-001'
);

-- 11. Mark existing admins as superAdmin
UPDATE "Usuario" SET "esSuperAdmin" = true WHERE "rolInterno" = 'admin';
