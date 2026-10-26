import { PrismaClient, TipoEquipo } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

// ── Guard: solo ejecutar contra base local ───────────────
const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.includes("localhost")) {
  console.error(
    "SEED ABORTADO: DATABASE_URL no apunta a localhost.\n" +
    "El seed solo debe ejecutarse contra la base de datos local (Docker).\n" +
    `DATABASE_URL actual contiene: ${dbUrl.replace(/\/\/.*@/, "//***@")}`
  );
  process.exit(1);
}

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
  // Protección: este seed BORRA todo. Si ya hay datos, no se ejecuta salvo
  // que se pida de forma explícita (SEED_FORCE=1), para no perder datos reales.
  const existentes =
    (await prisma.equipo.count()) + (await prisma.responsable.count()) + (await prisma.sede.count());
  if (existentes > 0 && process.env.SEED_FORCE !== "1") {
    console.error(
      "SEED ABORTADO: la base ya contiene datos y este script los borraría.\n" +
      "Si de verdad quieres reiniciar la base: SEED_FORCE=1 (cmd: set SEED_FORCE=1 && npx prisma db seed)."
    );
    process.exit(1);
  }

  // Limpiar. Borrar la Sede elimina en cascada pisos, salas, racks,
  // equipos, puertos y enlaces (regla 4.2 del documento).
  // Limpiar en orden para respetar foreign keys
  await prisma.accesoLog.deleteMany();
  await prisma.cuenta.deleteMany();
  await prisma.enlace.deleteMany();
  await prisma.puerto.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.piso.deleteMany();
  await prisma.sede.deleteMany();
  await prisma.responsable.deleteMany();
  await prisma.user.deleteMany();

  // ── Usuarios de prueba (sección 11.1) ──────────────────
  // Todos con cambioPendiente = true
  const usuarios = [
    { username: "admin",  password: "admin123",  role: "administrador" as const },
    { username: "editor", password: "editor123", role: "editor" as const },
    { username: "lector", password: "lector123", role: "lector" as const },
  ];

  for (const u of usuarios) {
    await prisma.user.create({
      data: {
        username: u.username,
        passwordHash: hashPassword(u.password),
        role: u.role,
        cambioPendiente: true,
      },
    });
  }

  console.log("Usuarios creados: admin, editor, lector (cambioPendiente=true)");

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

  console.log("Seed completado: 3 usuarios, 1 sede, 1 rack, 4 equipos, 1 enlace");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });