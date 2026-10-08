import Navbar from "@/components/navbar";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  // Consultas directas a PostgreSQL
  const [total, activos, inactivos] = await Promise.all([
    prisma.activo.count(),
    prisma.activo.count({ where: { estado: "Activo" } }),
    prisma.activo.count({ where: { estado: "Inactivo" } }),
  ]);
  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />

      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-1x/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Total activos</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiBlue">{total}</p>
          </div>

          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-1x/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Activos activos</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiDark">{activos}</p>
          </div>

          <div className="rounded-md bg-mahiWhite p-6 shadow-lg shadow-1x/30">
            <p className="font-mono text-xs uppercase text-mahiDark">Alertas</p>
            <p className="mt-2 font-mono text-3xl font-bold text-mahiRed">{inactivos}</p>
          </div>
        </div>

        <div className="mt-8 rounded-md shadow-lg shadow-1x/30 bg-mahiWhite p-6">
          <p className="font-mono text-sm text-mahiDark">
            TABLA DE ACTIVOS
          </p>
        </div>
      </div>
    </main>
  );
}