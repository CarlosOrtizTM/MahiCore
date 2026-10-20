import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Rol } from "@prisma/client";
import { authOptions } from "@/lib/auth";

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
 * Para usar al inicio de CADA Route Handler (el middleware no es una
 * barrera de seguridad suficiente, CVE-2025-29927).
 *
 *   const auth = await requireRole("editor");
 *   if (!auth.ok) return auth.response;
 */
export async function requireRole(minimo: Rol): Promise<GuardOk | GuardFail> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  if (session.user.cambioPendiente) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Debes cambiar tu contraseña antes de continuar" },
        { status: 403 },
      ),
    };
  }
  if (NIVEL[session.user.role] < NIVEL[minimo]) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }),
    };
  }
  return { ok: true, user: session.user };
}

/**
 * Para páginas (Server Components): redirige al login o al cambio de
 * contraseña si corresponde y devuelve la sesión.
 */
export async function requirePageSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.cambioPendiente) redirect("/cambiar-password");
  return session;
}
