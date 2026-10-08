import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activos — Obtener todos los activos
export async function GET() {
  try {
    const activos = await prisma.activo.findMany({
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(activos);
  } catch (error) {
    console.error("Error al obtener activos:", error);
    return NextResponse.json(
      { error: "Error al obtener activos" },
      { status: 500 }
    );
  }
}

// POST /api/activos — Crear un nuevo activo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, tipo, estado } = body;

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: "Nombre y tipo son obligatorios" },
        { status: 400 }
      );
    }

    const nuevoActivo = await prisma.activo.create({
      data: {
        nombre,
        tipo,
        estado: estado ?? "Activo",
      },
    });

    return NextResponse.json(nuevoActivo, { status: 201 });
  } catch (error) {
    console.error("Error al crear activo:", error);
    return NextResponse.json(
      { error: "Error al crear activo" },
      { status: 500 }
    );
  }
}
