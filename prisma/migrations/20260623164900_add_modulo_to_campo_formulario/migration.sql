-- Add modulo column to CampoFormulario
ALTER TABLE "CampoFormulario" ADD COLUMN IF NOT EXISTS "modulo" TEXT NOT NULL DEFAULT 'todos';
