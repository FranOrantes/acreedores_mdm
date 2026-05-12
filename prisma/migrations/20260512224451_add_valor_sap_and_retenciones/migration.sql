-- AlterTable
ALTER TABLE "CatCuentaAsociada" ADD COLUMN     "valorSap" TEXT;

-- CreateTable
CREATE TABLE "CatRetencion" (
    "id" TEXT NOT NULL,
    "cuentaAsociadaId" TEXT NOT NULL,
    "esquemaResico" TEXT,
    "tipoRetencion" TEXT,
    "indicadorRetencionCuentas" TEXT,
    "aplicaFisica" BOOLEAN NOT NULL DEFAULT false,
    "aplicaMoral" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatRetencion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CatRetencion" ADD CONSTRAINT "CatRetencion_cuentaAsociadaId_fkey" FOREIGN KEY ("cuentaAsociadaId") REFERENCES "CatCuentaAsociada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
