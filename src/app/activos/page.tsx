import Navbar from "@/components/navbar";
import { prisma } from "@/lib/prisma";

type Activo = {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
};

export default async function ActivosPage() {
  // Consulta directa a PostgreSQL desde el servidor
  const activos: Activo[] = await prisma.activo.findMany({
    orderBy: { creadoEn: "desc" },
  });
  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Activos
        </h1>

        <div className="overflow-x-auto rounded-md shadow-xl/30 bg-mahiWhite p-6">
          <table className="w-full text-left">
            <thead className="border-b-2 border-mahiDark">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">
                  Nombre
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">
                  Tipo
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-mahiDark">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {activos.map((activo) => (
                <tr key={activo.id}>
                  <td className="px-4 py-3 font-mono text-sm">{activo.nombre}</td>
                  <td className="px-4 py-3 font-mono text-sm">{activo.tipo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 font-mono text-xs uppercase ${
                        activo.estado === "Activo"
                          ? "bg-mahiBlue text-mahiWhite"
                          : "bg-mahiRed text-mahiWhite"
                      }`}
                    >
                      {activo.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}