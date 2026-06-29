-- CreateTable
CREATE TABLE "LogSistema" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "nivel" TEXT NOT NULL DEFAULT 'info',
    "usuarioId" TEXT,
    "usuarioEmail" TEXT,
    "usuarioNombre" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "metadata" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEmail" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "destinatarios" TEXT NOT NULL,
    "cc" TEXT,
    "cco" TEXT,
    "bodyHtml" TEXT,
    "bodyTexto" TEXT,
    "remitente" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'enviado',
    "error" TEXT,
    "solicitudId" TEXT,
    "usuarioId" TEXT,
    "metadata" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex LogSistema
CREATE INDEX "LogSistema_tipo_idx" ON "LogSistema"("tipo");
CREATE INDEX "LogSistema_usuarioId_idx" ON "LogSistema"("usuarioId");
CREATE INDEX "LogSistema_creadoEn_idx" ON "LogSistema"("creadoEn");
CREATE INDEX "LogSistema_nivel_idx" ON "LogSistema"("nivel");
CREATE INDEX "LogSistema_entidadTipo_entidadId_idx" ON "LogSistema"("entidadTipo", "entidadId");

-- CreateIndex LogEmail
CREATE INDEX "LogEmail_estado_idx" ON "LogEmail"("estado");
CREATE INDEX "LogEmail_solicitudId_idx" ON "LogEmail"("solicitudId");
CREATE INDEX "LogEmail_usuarioId_idx" ON "LogEmail"("usuarioId");
CREATE INDEX "LogEmail_creadoEn_idx" ON "LogEmail"("creadoEn");
