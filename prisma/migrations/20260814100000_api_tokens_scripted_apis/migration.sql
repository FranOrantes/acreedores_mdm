CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL, "nombre" TEXT NOT NULL, "token" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true, "expiraEn" TIMESTAMP(3), "ultimoUso" TIMESTAMP(3),
    "creadoPor" TEXT, "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");

CREATE TABLE "ScriptedApi" (
    "id" TEXT NOT NULL, "nombre" TEXT NOT NULL, "metodo" TEXT NOT NULL DEFAULT 'GET',
    "path" TEXT NOT NULL, "script" TEXT NOT NULL, "authTipo" TEXT NOT NULL DEFAULT 'token',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScriptedApi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScriptedApi_metodo_path_key" ON "ScriptedApi"("metodo", "path");
