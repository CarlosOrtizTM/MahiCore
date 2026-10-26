import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";
import UbicacionesTree from "./ubicaciones-tree";

export const dynamic = "force-dynamic";

export default async function UbicacionesPage() {
  const session = await requirePageSession();

  const sedes = await prisma.sede.findMany({
    orderBy: { nombre: "asc" },
    include: {
      pisos: {
        orderBy: { numero: "asc" },
        include: {
          salas: {
            orderBy: { nombre: "asc" },
            include: { racks: { orderBy: { nombre: "asc" }, include: { _count: { select: { equipos: true } } } } },
          },
        },
      },
    },
  });

  const arbol = sedes.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    direccion: s.direccion,
    pisos: s.pisos.map((p) => ({
      id: p.id,
      numero: p.numero,
      salas: p.salas.map((sa) => ({
        id: sa.id,
        nombre: sa.nombre,
        racks: sa.racks.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          unidadesU: r.unidadesU,
          equipos: r._count.equipos,
        })),
      })),
    })),
  }));

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <UbicacionesTree sedes={arbol} rol={session.user.role} />
      </div>
    </main>
  );
}
