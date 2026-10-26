import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { enlaceSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";

// POST /api/enlaces — editor o administrador.
// Regla de la especificación: un solo enlace activo por puerto.
export async function POST(req: Request) {
  const auth = await requireRole("editor");
  if (!auth.ok) return auth.response;

  const parsed = enlaceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);
  const { puertoAId, puertoBId, medio, etiqueta } = parsed.data;

  if (puertoAId === puertoBId) {
    return NextResponse.json({ error: "Un puerto no puede conectarse consigo mismo" }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Bloqueo de ambos puertos (orden fijo para evitar interbloqueos)
      await tx.$queryRaw`SELECT id FROM "Puerto" WHERE id IN (${Prisma.join([puertoAId, puertoBId].sort())}) ORDER BY id FOR UPDATE`;

      const puertos = await tx.puerto.findMany({
        where: { id: { in: [puertoAId, puertoBId] } },
        include: { equipo: { select: { id: true, nombre: true } } },
      });
      if (puertos.length !== 2) {
        return { ok: false as const, status: 400, error: "Alguno de los puertos no existe" };
      }
      if (puertos[0].equipoId === puertos[1].equipoId) {
        return { ok: false as const, status: 400, error: "No conectes dos puertos del mismo equipo" };
      }

      const ocupado = await tx.enlace.findFirst({
        where: {
          activo: true,
          OR: [
            { puertoAId: { in: [puertoAId, puertoBId] } },
            { puertoBId: { in: [puertoAId, puertoBId] } },
          ],
        },
      });
      if (ocupado) {
        const busy = puertos.find((p) => p.id === ocupado.puertoAId || p.id === ocupado.puertoBId);
        return {
          ok: false as const,
          status: 409,
          error: `El puerto ${busy?.numero} de «${busy?.equipo.nombre}» ya tiene un enlace activo`,
        };
      }

      const enlace = await tx.enlace.create({
        data: { puertoAId, puertoBId, medio, etiqueta },
      });
      return { ok: true as const, enlace };
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }
    return NextResponse.json(resultado.enlace, { status: 201 });
  } catch (e) {
    return prismaError(e);
  }
}
