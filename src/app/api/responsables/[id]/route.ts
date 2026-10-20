import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { responsableUpdateSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";

type Ctx = { params: { id: string } };

// GET /api/responsables/:id — cualquier rol autenticado
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireRole("lector");
  if (!auth.ok) return auth.response;

  const r = await prisma.responsable.findUnique({
    where: { id: params.id },
    include: { _count: { select: { equipos: true, cuentas: true } } },
  });
  if (!r) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  return NextResponse.json(r);
}

// PUT /api/responsables/:id — editor o administrador
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = responsableUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const actualizado = await prisma.responsable.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(actualizado);
  } catch (e) {
    return prismaError(e);
  }
}

// DELETE /api/responsables/:id — solo administrador
// (los equipos y cuentas asociados quedan sin responsable: onDelete SetNull)
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  try {
    await prisma.responsable.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return prismaError(e);
  }
}
