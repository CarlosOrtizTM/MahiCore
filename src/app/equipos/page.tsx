import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  await requirePageSession();
  const equipos = await prisma.equipo.findMany({
    include: { sala: true, rack: true, responsable: true },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Equipos
        </h1>

        <div className="overflow-x-auto rounded-md shadow-xl/30 bg-mahiWhite p-6">
          <table className="w-full text-left">
            <thead className="border-b-2 border-mahiDark">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Nombre</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Tipo</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Estado</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Sala</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Rack</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => (
                <tr key={equipo.id} className="border-b border-mahiLight">
                  <td className="px-4 py-3 font-mono text-sm">{equipo.nombre}</td>
                  <td className="px-4 py-3 font-mono text-sm">{equipo.tipo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 font-mono text-xs uppercase ${
                        equipo.estado === "activo"
                          ? "bg-mahiBlue text-mahiWhite"
                          : equipo.estado === "mantenimiento"
                            ? "bg-yellow-500 text-mahiDark"
                            : "bg-mahiRed text-mahiWhite"
                      }`}
                    >
                      {equipo.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{equipo.sala.nombre}</td>
                  <td className="px-4 py-3 font-mono text-sm">{equipo.rack?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm">{equipo.responsable?.nombre ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}