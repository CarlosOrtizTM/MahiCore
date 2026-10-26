import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { usuarioUpdateSchema } from "@/lib/validators";
import { badRequest, prismaError } from "@/lib/api";

// PUT /api/usuarios/:id — solo administrador (cambiar rol / activar o desactivar)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  const parsed = usuarioUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);
  const d = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({ where: { id: params.id } });
      if (!objetivo) return { ok: false as const, status: 404, error: "Usuario no encontrado" };

      const pierdeAdmin =
        objetivo.role === "administrador" &&
        objetivo.activo &&
        ((d.role !== undefined && d.role !== "administrador") || d.activo === false);

      if (pierdeAdmin) {
        if (objetivo.id === auth.user.id) {
          return { ok: false as const, status: 409, error: "No puedes quitarte tu propio acceso de administrador" };
        }
        const otros = await tx.user.count({
          where: { role: "administrador", activo: true, id: { not: objetivo.id } },
        });
        if (otros === 0) {
          return { ok: false as const, status: 409, error: "Debe quedar al menos un administrador activo" };
        }
      }
      if (objetivo.id === auth.user.id && d.activo === false) {
        return { ok: false as const, status: 409, error: "No puedes desactivar tu propia cuenta" };
      }

      const u = await tx.user.update({
        where: { id: objetivo.id },
        data: d,
        select: { id: true, username: true, role: true, activo: true },
      });
      await tx.accesoLog.create({
        data: {
          usuario: auth.user.name,
          accion: "usuario.modificar",
          detalle: { objetivo: u.username, cambios: d },
        },
      });
      return { ok: true as const, usuario: u };
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }
    return NextResponse.json(resultado.usuario);
  } catch (e) {
    return prismaError(e);
  }
}
