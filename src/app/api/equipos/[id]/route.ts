import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { equipoUpdateSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";
import { validarUbicacion } from "@/lib/rack";

type Ctx = { params: { id: string } };

// GET /api/equipos/:id — cualquier rol autenticado
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireRole("lector");
  if (!auth.ok) return auth.response;

  const e = await prisma.equipo.findUnique({
    where: { id: params.id },
    include: { sala: true, rack: true, responsable: true, puertos: { orderBy: { numero: "asc" } } },
  });
  if (!e) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  return NextResponse.json(e);
}

// PUT /api/equipos/:id — editor o administrador
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = equipoUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);
  const d = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const actual = await tx.equipo.findUnique({ where: { id: params.id } });
      if (!actual) return { ok: false as const, status: 404, error: "Registro no encontrado" };

      const rackId = d.rackId !== undefined ? d.rackId : actual.rackId;
      const ubic = await validarUbicacion(tx, {
        salaId: d.salaId ?? actual.salaId,
        rackId,
        uInicio: d.uInicio !== undefined ? d.uInicio : actual.uInicio,
        alturaU: d.alturaU ?? actual.alturaU,
        excluirId: actual.id,
      });
      if (!ubic.ok) return ubic;

      const equipo = await tx.equipo.update({
        where: { id: actual.id },
        data: {
          nombre: d.nombre ?? actual.nombre,
          tipo: d.tipo ?? actual.tipo,
          estado: d.estado ?? actual.estado,
          salaId: ubic.salaId,
          rackId,
          uInicio: ubic.uInicio,
          alturaU: d.alturaU ?? actual.alturaU,
          responsableId: d.responsableId !== undefined ? d.responsableId : actual.responsableId,
          direccionIp: d.direccionIp !== undefined ? d.direccionIp : actual.direccionIp,
          dns: d.dns !== undefined ? d.dns : actual.dns,
          marca: d.marca !== undefined ? d.marca : actual.marca,
          modelo: d.modelo !== undefined ? d.modelo : actual.modelo,
          descripcion: d.descripcion !== undefined ? d.descripcion : actual.descripcion,
        },
      });
      return { ok: true as const, equipo };
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }
    return NextResponse.json(resultado.equipo);
  } catch (e) {
    return prismaError(e);
  }
}

// DELETE /api/equipos/:id — solo administrador (borra también sus puertos y enlaces)
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  try {
    await prisma.equipo.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return prismaError(e);
  }
}
