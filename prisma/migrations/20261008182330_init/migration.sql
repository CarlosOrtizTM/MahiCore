-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('lector', 'editor', 'administrador');

-- CreateEnum
CREATE TYPE "TipoEquipo" AS ENUM ('switch', 'router', 'firewall', 'camara', 'access_point', 'servidor', 'otro');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('activo', 'mantenimiento', 'baja');

-- CreateEnum
CREATE TYPE "MedioEnlace" AS ENUM ('fibra', 'utp_cat6', 'coaxial');

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piso" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "Piso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" TEXT NOT NULL,
    "pisoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadesU" INTEGER NOT NULL DEFAULT 42,

    CONSTRAINT "Rack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" TEXT,
    "telefono" TEXT,

    CONSTRAINT "Responsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoEquipo" NOT NULL,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'activo',
    "salaId" TEXT NOT NULL,
    "rackId" TEXT,
    "uInicio" INTEGER,
    "alturaU" INTEGER NOT NULL DEFAULT 1,
    "responsableId" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "configuracion" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puerto" (
    "id" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "vlan" INTEGER,

    CONSTRAINT "Puerto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enlace" (
    "id" TEXT NOT NULL,
    "puertoAId" TEXT NOT NULL,
    "puertoBId" TEXT NOT NULL,
    "medio" "MedioEnlace" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaBaja" TIMESTAMP(3),

    CONSTRAINT "Enlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "responsableId" TEXT,
    "servicio" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "passwordReferencia" TEXT NOT NULL,
    "passwordEsBoveda" BOOLEAN NOT NULL DEFAULT false,
    "fechaVencimiento" TIMESTAMP(3),

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccesoLog" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "cuentaId" TEXT,
    "detalle" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccesoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Rol" NOT NULL DEFAULT 'lector',
    "cambioPendiente" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sede_nombre_key" ON "Sede"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_email_key" ON "Responsable"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Puerto_equipoId_numero_key" ON "Puerto"("equipoId", "numero");

-- CreateIndex
CREATE INDEX "Enlace_puertoAId_idx" ON "Enlace"("puertoAId");

-- CreateIndex
CREATE INDEX "Enlace_puertoBId_idx" ON "Enlace"("puertoBId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Piso" ADD CONSTRAINT "Piso_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_pisoId_fkey" FOREIGN KEY ("pisoId") REFERENCES "Piso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rack" ADD CONSTRAINT "Rack_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Responsable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Puerto" ADD CONSTRAINT "Puerto_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enlace" ADD CONSTRAINT "Enlace_puertoAId_fkey" FOREIGN KEY ("puertoAId") REFERENCES "Puerto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enlace" ADD CONSTRAINT "Enlace_puertoBId_fkey" FOREIGN KEY ("puertoBId") REFERENCES "Puerto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Responsable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoLog" ADD CONSTRAINT "AccesoLog_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
