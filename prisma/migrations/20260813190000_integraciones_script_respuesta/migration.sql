ALTER TABLE "IntegracionColeccion" ADD COLUMN "modulo" TEXT NOT NULL DEFAULT 'todos';
ALTER TABLE "IntegracionRequest" ADD COLUMN "scriptRespuesta" TEXT;
