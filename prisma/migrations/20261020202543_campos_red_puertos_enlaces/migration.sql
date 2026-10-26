-- AlterEnum
ALTER TYPE "TipoEquipo" ADD VALUE 'patch_panel';

-- AlterTable
ALTER TABLE "Enlace" ADD COLUMN     "etiqueta" TEXT;

-- AlterTable
ALTER TABLE "Equipo" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "direccionIp" TEXT,
ADD COLUMN     "dns" TEXT,
ADD COLUMN     "marca" TEXT,
ADD COLUMN     "modelo" TEXT;

-- AlterTable
ALTER TABLE "Puerto" ADD COLUMN     "etiqueta" TEXT;
