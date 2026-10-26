import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { puertoUpdateSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";

// PUT /api/puertos/:id — editor o administrador (etiqueta y VLAN)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = puertoUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const p = await prisma.puerto.update({
      where: { id: params.id },
      data: { etiqueta: parsed.data.etiqueta, vlan: parsed.data.vlan ?? null },
    });
    return NextResponse.json(p);
  } catch (e) {
    return prismaError(e);
  }
}
