import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { prismaError } from "@/lib/api";

// DELETE /api/enlaces/:id — editor o administrador.
// No borra el registro: lo da de baja (activo=false, fechaBaja) para conservar el historial.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  try {
    const r = await prisma.enlace.updateMany({
      where: { id: params.id, activo: true },
      data: { activo: false, fechaBaja: new Date() },
    });
    if (r.count === 0) {
      return NextResponse.json({ error: "Enlace no encontrado o ya dado de baja" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return prismaError(e);
  }
}
