import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { badRequest, prismaError } from "@/lib/api";

const texto = z.string().trim().min(2, "Nombre demasiado corto").max(120);

const sedeUpdate = z.object({
  nombre: texto.optional(),
  direccion: z.string().trim().max(200).nullish().transform((v) => v || null).optional(),
});
const pisoUpdate = z.object({ numero: z.number().int().min(-5).max(200) });
const salaUpdate = z.object({ nombre: texto });
const rackUpdate = z.object({
  nombre: texto.optional(),
  unidadesU: z.number().int().min(1).max(60).optional(),
});

type Ctx = { params: { tipo: string; id: string } };

// PUT /api/ubicaciones/{tipo}/:id — editor o administrador
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const where = { id: params.id };

  try {
    switch (params.tipo) {
      case "sedes": {
        const p = sedeUpdate.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.sede.update({ where, data: p.data }));
      }
      case "pisos": {
        const p = pisoUpdate.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.piso.update({ where, data: p.data }));
      }
      case "salas": {
        const p = salaUpdate.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.sala.update({ where, data: p.data }));
      }
      case "racks": {
        const p = rackUpdate.safeParse(body);
        if (!p.success) return badRequest(p.error);
        if (p.data.unidadesU !== undefined) {
          const ocupados = await prisma.equipo.findMany({
            where: { rackId: params.id, uInicio: { not: null } },
            select: { uInicio: true, alturaU: true },
          });
          const maxU = Math.max(0, ...ocupados.map((e) => (e.uInicio ?? 0) + e.alturaU - 1));
          if (p.data.unidadesU < maxU) {
            return NextResponse.json(
              { error: `No se puede reducir a ${p.data.unidadesU}U: hay equipos hasta la U${maxU}` },
              { status: 409 },
            );
          }
        }
        return NextResponse.json(await prisma.rack.update({ where, data: p.data }));
      }
      default:
        return NextResponse.json({ error: "Tipo desconocido" }, { status: 404 });
    }
  } catch (e) {
    return prismaError(e);
  }
}

// DELETE /api/ubicaciones/{tipo}/:id — solo administrador.
// Borra en cascada todo lo que cuelga de él (regla 4.2 de la especificación).
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  const where = { id: params.id };
  try {
    switch (params.tipo) {
      case "sedes": await prisma.sede.delete({ where }); break;
      case "pisos": await prisma.piso.delete({ where }); break;
      case "salas": await prisma.sala.delete({ where }); break;
      case "racks": await prisma.rack.delete({ where }); break;
      default:
        return NextResponse.json({ error: "Tipo desconocido" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return prismaError(e);
  }
}
