import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";
import ResponsablesTable from "./responsables-table";

export const dynamic = "force-dynamic";

export default async function ResponsablesPage() {
  const session = await requirePageSession();

  const responsables = await prisma.responsable.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { equipos: true, cuentas: true } } },
  });

  const filas = responsables.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    email: r.email,
    cargo: r.cargo,
    telefono: r.telefono,
    equipos: r._count.equipos,
    cuentas: r._count.cuentas,
  }));

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <ResponsablesTable filas={filas} rol={session.user.role} />
      </div>
    </main>
  );
}
