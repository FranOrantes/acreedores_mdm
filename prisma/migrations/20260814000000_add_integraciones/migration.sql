-- CreateTable
CREATE TABLE "IntegracionColeccion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracionColeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracionRequest" (
    "id" TEXT NOT NULL,
    "coleccionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'GET',
    "url" TEXT NOT NULL DEFAULT '',
    "headers" JSONB NOT NULL DEFAULT '[]',
    "body" TEXT,
    "bodyTipo" TEXT NOT NULL DEFAULT 'json',
    "authTipo" TEXT NOT NULL DEFAULT 'none',
    "authConfig" JSONB,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegracionRequest_coleccionId_idx" ON "IntegracionRequest"("coleccionId");

-- AddForeignKey
ALTER TABLE "IntegracionRequest" ADD CONSTRAINT "IntegracionRequest_coleccionId_fkey" FOREIGN KEY ("coleccionId") REFERENCES "IntegracionColeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
