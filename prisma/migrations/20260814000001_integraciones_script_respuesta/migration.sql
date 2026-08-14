ALTER TABLE "IntegracionColeccion" ADD COLUMN IF NOT EXISTS "modulo" TEXT NOT NULL DEFAULT 'todos';
ALTER TABLE "IntegracionRequest" ADD COLUMN IF NOT EXISTS "scriptRespuesta" TEXT;
