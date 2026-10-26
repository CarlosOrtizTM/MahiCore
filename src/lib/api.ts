import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";

export function badRequest(error: ZodError) {
  return NextResponse.json(
    { error: error.issues[0]?.message ?? "Datos inválidos", detalles: error.issues },
    { status: 400 },
  );
}

/** Traduce errores conocidos de Prisma a respuestas HTTP. */
export function prismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro con ese valor único" }, { status: 409 });
    }
    if (e.code === "P2003") {
      return NextResponse.json({ error: "El elemento relacionado no existe" }, { status: 400 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
  }
  console.error(e);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
