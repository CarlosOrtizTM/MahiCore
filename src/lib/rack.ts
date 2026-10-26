import type { Prisma } from "@prisma/client";

type Entrada = {
  salaId: string | null;
  rackId: string | null;
  uInicio: number | null | undefined;
  alturaU: number;
  excluirId?: string;
};

type Resultado =
  | { ok: true; salaId: string; uInicio: number | null }
  | { ok: false; status: number; error: string };

/**
 * Valida dónde va un equipo. Debe llamarse DENTRO de una transacción:
 * bloquea la fila del rack (FOR UPDATE) para que dos peticiones simultáneas
 * no puedan ocupar las mismas unidades U.
 */
export async function validarUbicacion(
  tx: Prisma.TransactionClient,
  e: Entrada,
): Promise<Resultado> {
  if (!e.rackId) {
    if (!e.salaId) {
      return { ok: false, status: 400, error: "Indica la sala o un rack para el equipo" };
    }
    return { ok: true, salaId: e.salaId, uInicio: null };
  }

  await tx.$queryRaw`SELECT id FROM "Rack" WHERE id = ${e.rackId} FOR UPDATE`;
  const rack = await tx.rack.findUnique({ where: { id: e.rackId } });
  if (!rack) return { ok: false, status: 400, error: "El rack indicado no existe" };

  if (e.uInicio == null) {
    return { ok: false, status: 400, error: "Indica la unidad U inicial dentro del rack" };
  }
  const inicio = e.uInicio;
  const fin = inicio + e.alturaU - 1;
  if (fin > rack.unidadesU) {
    return {
      ok: false,
      status: 400,
      error: `El equipo ocupa hasta la U${fin}, pero el rack solo tiene ${rack.unidadesU}U`,
    };
  }

  const otros = await tx.equipo.findMany({
    where: {
      rackId: rack.id,
      uInicio: { not: null },
      ...(e.excluirId ? { id: { not: e.excluirId } } : {}),
    },
    select: { nombre: true, uInicio: true, alturaU: true },
  });
  const choque = otros.find((o) => {
    const oi = o.uInicio as number;
    const ofin = oi + o.alturaU - 1;
    return oi <= fin && ofin >= inicio;
  });
  if (choque) {
    const oi = choque.uInicio as number;
    return {
      ok: false,
      status: 409,
      error: `Las unidades U${inicio}–U${fin} chocan con «${choque.nombre}» (U${oi}–U${oi + choque.alturaU - 1})`,
    };
  }

  return { ok: true, salaId: rack.salaId, uInicio: inicio };
}
