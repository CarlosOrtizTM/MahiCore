import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";

// GET /api/equipos/:id/puertos — puertos del equipo y si están libres (sin enlace activo)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("lector");
  if (!auth.ok) return auth.response;

  const puertos = await prisma.puerto.findMany({
    where: { equipoId: params.id },
    orderBy: { numero: "asc" },
    include: {
      enlacesComoA: { where: { activo: true }, select: { id: true } },
      enlacesComoB: { where: { activo: true }, select: { id: true } },
    },
  });

  return NextResponse.json(
    puertos.map((p) => ({
      id: p.id,
      numero: p.numero,
      tipo: p.tipo,
      etiqueta: p.etiqueta,
      libre: p.enlacesComoA.length + p.enlacesComoB.length === 0,
    })),
  );
}
