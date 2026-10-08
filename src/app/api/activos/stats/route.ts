import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activos/stats — Estadísticas para el Dashboard
export async function GET() {
  try {
    const [total, activos, inactivos] = await Promise.all([
      prisma.activo.count(),
      prisma.activo.count({ where: { estado: "Activo" } }),
      prisma.activo.count({ where: { estado: "Inactivo" } }),
    ]);

    return NextResponse.json({ total, activos, inactivos });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
