import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Rol } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Jerarquía de roles: administrador > editor > lector.
 * (La propuesta lo llama "Operador"; en el código es "editor".)
 */
const NIVEL: Record<Rol, number> = { lector: 1, editor: 2, administrador: 3 };

export type GuardOk = {
  ok: true;
  user: { id: string; name: string; role: Rol; cambioPendiente: boolean };
};
export type GuardFail = { ok: false; response: NextResponse };

/**
 * Usuario de la sesión, validado contra la base de datos: si el administrador
 * desactiva una cuenta o le cambia el rol, el efecto es inmediato (no espera
 * a que expire el JWT de 1 hora).
 */
async function usuarioVigente() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const db = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, role: true, cambioPendiente: true, activo: true },
  });
  if (!db || !db.activo) return null;

  return { id: db.id, name: db.username, role: db.role, cambioPendiente: db.cambioPendiente };
}

/**
 * Para usar al inicio de CADA Route Handler (el middleware no es una
 * barrera de seguridad suficiente, CVE-2025-29927).
 *
 *   const auth = await requireRole("editor");
 *   if (!auth.ok) return auth.response;
 */
export async function requireRole(minimo: Rol): Promise<GuardOk | GuardFail> {
  const user = await usuarioVigente();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  if (user.cambioPendiente) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Debes cambiar tu contraseña antes de continuar" },
        { status: 403 },
      ),
    };
  }
  if (NIVEL[user.role] < NIVEL[minimo]) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }),
    };
  }
  return { ok: true, user };
}

/**
 * Para páginas (Server Components): redirige al login o al cambio de
 * contraseña si corresponde y devuelve la sesión con el rol vigente.
 */
export async function requirePageSession() {
  const user = await usuarioVigente();
  if (!user) redirect("/login");
  if (user.cambioPendiente) redirect("/cambiar-password");
  return { user };
}
