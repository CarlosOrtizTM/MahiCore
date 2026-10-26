import type { TipoEquipo } from "@prisma/client";

// Puertos que se generan automáticamente según el tipo (sección 7.2 de la especificación)
const PUERTOS_POR_TIPO: Partial<Record<TipoEquipo, number>> = {
  switch: 24,
  router: 4,
  firewall: 8,
  patch_panel: 24,
};

export function puertosPara(tipo: TipoEquipo, cantidadElegida?: number | null) {
  const cantidad = cantidadElegida ?? PUERTOS_POR_TIPO[tipo] ?? 0;
  const tipoPuerto = tipo === "patch_panel" ? "patch" : "ethernet";
  return Array.from({ length: cantidad }, (_, i) => ({ numero: i + 1, tipo: tipoPuerto }));
}
