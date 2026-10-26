import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { generarPasswordTemporal, hashPassword } from "@/lib/password";
import { prismaError } from "@/lib/api";

// POST /api/usuarios/:id/restablecer — solo administrador.
// Genera una contraseña temporal (se muestra una sola vez), obliga a cambiarla y desbloquea la cuenta.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("administrador");
  if (!auth.ok) return auth.response;

  const passwordTemporal = generarPasswordTemporal();
  try {
    const u = await prisma.$transaction(async (tx) => {
      const usuario = await tx.user.update({
        where: { id: params.id },
        data: {
          passwordHash: hashPassword(passwordTemporal),
          cambioPendiente: true,
          intentosFallidos: 0,
          bloqueadoHasta: null,
        },
        select: { username: true },
      });
      await tx.accesoLog.create({
        data: {
          usuario: auth.user.name,
          accion: "usuario.restablecer_password",
          detalle: { objetivo: usuario.username },
        },
      });
      return usuario;
    });
    return NextResponse.json({ username: u.username, passwordTemporal });
  } catch (e) {
    return prismaError(e);
  }
}
