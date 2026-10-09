import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";

export default async function ResponsablesPage() {
  const responsables = await prisma.responsable.findMany({
    include: { _count: { select: { equipos: true, cuentas: true } } },
  });

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Responsables
        </h1>

        <div className="overflow-x-auto rounded-md bg-mahiWhite p-6 shadow-lg shadow-1x/30">
          <table className="w-full text-left">
            <thead className="border-b-2 border-mahiDark">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Nombre</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Email</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Cargo</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Tel.</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Equipos</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">Cuentas</th>
              </tr>
            </thead>
            <tbody>
              {responsables.map((r) => (
                <tr key={r.id} className="border-b border-mahiLight">
                  <td className="px-4 py-3 font-mono text-sm">{r.nombre}</td>
                  <td className="px-4 py-3 font-mono text-sm">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-sm">{r.cargo ?? "\u2014"}</td>
                  <td className="px-4 py-3 font-mono text-sm">{r.telefono ?? "\u2014"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-center">{r._count.equipos}</td>
                  <td className="px-4 py-3 font-mono text-sm text-center">{r._count.cuentas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
