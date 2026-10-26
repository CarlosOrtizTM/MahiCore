import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { usuarioCrearSchema } from "@/lib/validators";
import { generarPasswordTemporal, hashPassword } from "@/lib/password";
import { badRequest, prismaError } from "@/lib/api";

const select = {
  id: true,
  username: true,
  role: true,
  activo: true,
  cambioPendiente: true,
  bloqueadoHasta: true,
} as const;

// GET /api/usuarios — solo administrador
export async function GET() {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;
  return NextResponse.json(await prisma.user.findMany({ orderBy: { username: "asc" }, select }));
}

// POST /api/usuarios — solo administrador. Devuelve la contraseña temporal UNA sola vez.
export async function POST(req: Request) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  const parsed = usuarioCrearSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error);

  const passwordTemporal = generarPasswordTemporal();
  try {
    const usuario = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username: parsed.data.username,
          role: parsed.data.role,
          passwordHash: hashPassword(passwordTemporal),
          cambioPendiente: true,
        },
        select,
      });
      await tx.accesoLog.create({
        data: {
          usuario: auth.user.name,
          accion: "usuario.crear",
          detalle: { objetivo: u.username, rol: u.role },
        },
      });
      return u;
    });
    return NextResponse.json({ usuario, passwordTemporal }, { status: 201 });
  } catch (e) {
    return prismaError(e);
  }
}
