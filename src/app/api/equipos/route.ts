import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { equipoSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";
import { validarUbicacion } from "@/lib/rack";
import { puertosPara } from "@/lib/puertos";

// GET /api/equipos — cualquier rol autenticado
export async function GET() {
  const auth = await requireRole("lector");
  if (!auth.ok) return auth.response;

  const data = await prisma.equipo.findMany({
    orderBy: { creadoEn: "desc" },
    include: { sala: true, rack: true, responsable: true, _count: { select: { puertos: true } } },
  });
  return NextResponse.json(data);
}

// POST /api/equipos — editor o administrador
export async function POST(req: Request) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = equipoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);
  const d = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const ubic = await validarUbicacion(tx, {
        salaId: d.salaId,
        rackId: d.rackId,
        uInicio: d.uInicio,
        alturaU: d.alturaU,
      });
      if (!ubic.ok) return ubic;

      const equipo = await tx.equipo.create({
        data: {
          nombre: d.nombre,
          tipo: d.tipo,
          estado: d.estado,
          salaId: ubic.salaId,
          rackId: d.rackId,
          uInicio: ubic.uInicio,
          alturaU: d.alturaU,
          responsableId: d.responsableId,
          direccionIp: d.direccionIp,
          dns: d.dns,
          marca: d.marca,
          modelo: d.modelo,
          descripcion: d.descripcion,
          puertos: { create: puertosPara(d.tipo, d.cantidadPuertos) },
        },
      });
      return { ok: true as const, equipo };
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }
    return NextResponse.json(resultado.equipo, { status: 201 });
  } catch (e) {
    return prismaError(e);
  }
}
