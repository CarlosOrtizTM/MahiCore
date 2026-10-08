import { PrismaClient, TipoEquipo } from "@prisma/client";

const prisma = new PrismaClient();

// Puertos que se generan según el tipo (sección 7.2 del documento)
const PUERTOS_POR_TIPO: Partial<Record<TipoEquipo, number>> = {
  switch: 24,
  router: 4,
  firewall: 8,
};

function puertosPara(tipo: TipoEquipo) {
  const cantidad = PUERTOS_POR_TIPO[tipo] ?? 0;
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    tipo: "ethernet",
  }));
}

async function main() {
  // Limpiar. Borrar la Sede elimina en cascada pisos, salas, racks,
  // equipos, puertos y enlaces (regla 4.2 del documento).
  await prisma.accesoLog.deleteMany();
  await prisma.cuenta.deleteMany();
  await prisma.responsable.deleteMany();
  await prisma.sede.deleteMany();

  // SOLO DATOS INVENTADOS. Nada real de la empresa.
  const responsable = await prisma.responsable.create({
    data: {
      nombre: "Responsable de Prueba",
      email: "responsable@ejemplo.com",
      cargo: "Ingeniero de redes",
    },
  });

  const sede = await prisma.sede.create({
    data: {
      nombre: "Sede Principal (demo)",
      pisos: {
        create: {
          numero: 1,
          salas: {
            create: {
              nombre: "Sala de servidores",
              racks: { create: { nombre: "Rack-A", unidadesU: 42 } },
            },
          },
        },
      },
    },
    include: { pisos: { include: { salas: { include: { racks: true } } } } },
  });

  const sala = sede.pisos[0].salas[0];
  const rack = sala.racks[0];

  const equipos = [
    { nombre: "Switch-Core", tipo: TipoEquipo.switch, uInicio: 40, alturaU: 1 },
    { nombre: "Router-GW", tipo: TipoEquipo.router, uInicio: 38, alturaU: 1 },
    { nombre: "Firewall-01", tipo: TipoEquipo.firewall, uInicio: 36, alturaU: 1 },
    { nombre: "Servidor-01", tipo: TipoEquipo.servidor, uInicio: 30, alturaU: 2 },
  ];

  for (const e of equipos) {
    await prisma.equipo.create({
      data: {
        nombre: e.nombre,
        tipo: e.tipo,
        salaId: sala.id,
        rackId: rack.id,
        responsableId: responsable.id,
        uInicio: e.uInicio,
        alturaU: e.alturaU,
        puertos: { create: puertosPara(e.tipo) },
      },
    });
  }

  // Un cable de ejemplo: puerto 1 del switch con puerto 1 del router
  const puerto = (nombreEquipo: string, numero: number) =>
    prisma.puerto.findFirstOrThrow({
      where: { numero, equipo: { nombre: nombreEquipo } },
    });

  const [pA, pB] = await Promise.all([
    puerto("Switch-Core", 1),
    puerto("Router-GW", 1),
  ]);

  await prisma.enlace.create({
    data: { puertoAId: pA.id, puertoBId: pB.id, medio: "utp_cat6" },
  });

  console.log("Seed completado: 1 sede, 1 rack, 4 equipos, 1 enlace");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });