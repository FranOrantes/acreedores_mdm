ALTER TABLE "LogSistema" ADD COLUMN "modulo" TEXT;
CREATE INDEX "LogSistema_modulo_creadoEn_idx" ON "LogSistema"("modulo", "creadoEn");
CREATE INDEX "LogSistema_nivel_creadoEn_idx" ON "LogSistema"("nivel", "creadoEn");
