import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";

export default async function UbicacionesPage() {
  const sedes = await prisma.sede.findMany({
    include: {
      pisos: {
        include: {
          salas: {
            include: { racks: true },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Ubicaciones
        </h1>

        {sedes.map((sede) => (
          <div key={sede.id} className="mb-6 rounded-md bg-mahiWhite p-6 shadow-lg shadow-1x/30">
            <h2 className="font-mono text-lg font-bold text-mahiDark">{sede.nombre}</h2>
            {sede.direccion && (
              <p className="font-mono text-xs text-mahiDark/60">{sede.direccion}</p>
            )}

            {sede.pisos.map((piso) => (
              <div key={piso.id} className="ml-4 mt-4">
                <h3 className="font-mono text-sm font-bold text-mahiBlue">
                  Piso {piso.numero}
                </h3>

                {piso.salas.map((sala) => (
                  <div key={sala.id} className="ml-4 mt-2">
                    <p className="font-mono text-sm text-mahiDark">{sala.nombre}</p>

                    {sala.racks.length > 0 && (
                      <div className="ml-4 mt-1 flex gap-2">
                        {sala.racks.map((rack) => (
                          <span
                            key={rack.id}
                            className="bg-mahiLight px-2 py-1 font-mono text-xs text-mahiDark"
                          >
                            {rack.nombre} ({rack.unidadesU}U)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
