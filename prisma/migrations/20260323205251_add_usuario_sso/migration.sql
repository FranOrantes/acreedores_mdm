-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "ssoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "nombre" TEXT,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "rolInterno" TEXT NOT NULL DEFAULT 'usuario',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_ssoId_key" ON "Usuario"("ssoId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
