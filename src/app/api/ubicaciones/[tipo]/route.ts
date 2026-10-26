import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { badRequest, prismaError } from "@/lib/api";

const texto = z.string().trim().min(2, "Nombre demasiado corto").max(120);
const opcional = z.string().trim().max(200).nullish().transform((v) => v || null);

const sedeSchema = z.object({ nombre: texto, direccion: opcional });
const pisoSchema = z.object({
  sedeId: z.string().min(1),
  numero: z.number().int().min(-5).max(200),
});
const salaSchema = z.object({ pisoId: z.string().min(1), nombre: texto });
const rackSchema = z.object({
  salaId: z.string().min(1),
  nombre: texto,
  unidadesU: z.number().int().min(1).max(60).default(42),
});

// POST /api/ubicaciones/{sedes|pisos|salas|racks} — editor o administrador
export async function POST(req: Request, { params }: { params: { tipo: string } }) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);

  try {
    switch (params.tipo) {
      case "sedes": {
        const p = sedeSchema.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.sede.create({ data: p.data }), { status: 201 });
      }
      case "pisos": {
        const p = pisoSchema.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.piso.create({ data: p.data }), { status: 201 });
      }
      case "salas": {
        const p = salaSchema.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.sala.create({ data: p.data }), { status: 201 });
      }
      case "racks": {
        const p = rackSchema.safeParse(body);
        if (!p.success) return badRequest(p.error);
        return NextResponse.json(await prisma.rack.create({ data: p.data }), { status: 201 });
      }
      default:
        return NextResponse.json({ error: "Tipo desconocido" }, { status: 404 });
    }
  } catch (e) {
    return prismaError(e);
  }
}
