import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";
import EquiposTable from "./equipos-table";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const session = await requirePageSession();

  const [equipos, salas, racks, responsables] = await Promise.all([
    prisma.equipo.findMany({
      include: { sala: true, rack: true, responsable: true },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.sala.findMany({ include: { piso: { include: { sede: true } } } }),
    prisma.rack.findMany({ include: { sala: { include: { piso: { include: { sede: true } } } } } }),
    prisma.responsable.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const etiquetaSala = (s: (typeof salas)[number]) =>
    `${s.piso.sede.nombre} › Piso ${s.piso.numero} › ${s.nombre}`;

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <EquiposTable
          rol={session.user.role}
          equipos={equipos.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            tipo: e.tipo,
            estado: e.estado,
            salaId: e.salaId,
            salaNombre: e.sala.nombre,
            rackId: e.rackId,
            rackNombre: e.rack?.nombre ?? null,
            uInicio: e.uInicio,
            alturaU: e.alturaU,
            responsableId: e.responsableId,
            responsableNombre: e.responsable?.nombre ?? null,
            direccionIp: e.direccionIp,
            dns: e.dns,
            marca: e.marca,
            modelo: e.modelo,
            descripcion: e.descripcion,
          }))}
          salas={salas.map((s) => ({ id: s.id, etiqueta: etiquetaSala(s) }))}
          racks={racks.map((r) => ({
            id: r.id,
            etiqueta: `${r.nombre} (${r.unidadesU}U) — ${etiquetaSala(r.sala)}`,
            unidadesU: r.unidadesU,
          }))}
          responsables={responsables}
        />
      </div>
    </main>
  );
}
