import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";
import PuertosTable from "./puertos-table";

export const dynamic = "force-dynamic";

export default async function EquipoDetallePage({ params }: { params: { id: string } }) {
  const session = await requirePageSession();

  const equipo = await prisma.equipo.findUnique({
    where: { id: params.id },
    include: {
      sala: true,
      rack: true,
      responsable: true,
      puertos: {
        orderBy: { numero: "asc" },
        include: {
          enlacesComoA: {
            where: { activo: true },
            include: { puertoB: { include: { equipo: true } } },
          },
          enlacesComoB: {
            where: { activo: true },
            include: { puertoA: { include: { equipo: true } } },
          },
        },
      },
    },
  });
  if (!equipo) notFound();

  const otros = await prisma.equipo.findMany({
    where: { id: { not: equipo.id } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, tipo: true },
  });

  const puertos = equipo.puertos.map((p) => {
    const a = p.enlacesComoA[0];
    const b = p.enlacesComoB[0];
    const destino = a
      ? { enlaceId: a.id, medio: a.medio, etiquetaCable: a.etiqueta, equipo: a.puertoB.equipo.nombre, equipoId: a.puertoB.equipo.id, puerto: a.puertoB.numero, etiquetaPuerto: a.puertoB.etiqueta }
      : b
        ? { enlaceId: b.id, medio: b.medio, etiquetaCable: b.etiqueta, equipo: b.puertoA.equipo.nombre, equipoId: b.puertoA.equipo.id, puerto: b.puertoA.numero, etiquetaPuerto: b.puertoA.etiqueta }
        : null;
    return { id: p.id, numero: p.numero, tipo: p.tipo, vlan: p.vlan, etiqueta: p.etiqueta, destino };
  });

  const dato = (k: string, v: string | null) => (
    <div>
      <p className="font-mono text-[11px] uppercase text-mahiDark/60">{k}</p>
      <p className="font-mono text-sm text-mahiDark">{v || "—"}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <a href="/equipos" className="font-mono text-xs text-mahiBlue hover:underline">← Volver a equipos</a>
        <h1 className="mb-6 mt-2 font-mono text-2xl font-bold uppercase text-mahiDark">{equipo.nombre}</h1>

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30 md:grid-cols-4">
          {dato("Tipo", equipo.tipo)}
          {dato("Estado", equipo.estado)}
          {dato("IP", equipo.direccionIp)}
          {dato("DNS", equipo.dns)}
          {dato("Sala", equipo.sala.nombre)}
          {dato("Rack / U", equipo.rack ? `${equipo.rack.nombre}${equipo.uInicio ? ` · U${equipo.uInicio}` : ""}` : null)}
          {dato("Marca / modelo", [equipo.marca, equipo.modelo].filter(Boolean).join(" ") || null)}
          {dato("Responsable", equipo.responsable?.nombre ?? null)}
        </div>

        <PuertosTable puertos={puertos} otrosEquipos={otros} rol={session.user.role} />
      </div>
    </main>
  );
}
