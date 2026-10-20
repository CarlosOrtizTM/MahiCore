import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageSession();
  const [totalEquipos, equiposActivos, equiposMantenimiento, equiposBaja] =
    await Promise.all([
      prisma.equipo.count(),
      prisma.equipo.count({ where: { estado: "activo" } }),
      prisma.equipo.count({ where: { estado: "mantenimiento" } }),
      prisma.equipo.count({ where: { estado: "baja" } }),
    ]);

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />

      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Total equipos</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiBlue">{totalEquipos}</p>
          </div>

          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Activos</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiDark">{equiposActivos}</p>
          </div>

          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Mantenimiento</p>
            <p className="mt-2 font-mono text-3xl font-bold text-yellow-500">{equiposMantenimiento}</p>
          </div>

          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Baja</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiRed">{equiposBaja}</p>
          </div>
        </div>
      </div>
    </main>
  );
}