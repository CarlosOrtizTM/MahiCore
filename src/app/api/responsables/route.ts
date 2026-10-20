import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { responsableSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";

// GET /api/responsables — cualquier rol autenticado
export async function GET() {
  const auth = await requireRole("lector");
  if (!auth.ok) return auth.response;

  const data = await prisma.responsable.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { equipos: true, cuentas: true } } },
  });
  return NextResponse.json(data);
}

// POST /api/responsables — editor o administrador
export async function POST(req: Request) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = responsableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const creado = await prisma.responsable.create({ data: parsed.data });
    return NextResponse.json(creado, { status: 201 });
  } catch (e) {
    return prismaError(e);
  }
}
