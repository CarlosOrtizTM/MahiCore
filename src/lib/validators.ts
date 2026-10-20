import { z } from "zod";

export const responsableSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido").max(160),
  cargo: z.string().trim().max(120).nullish().transform((v) => v || null),
  telefono: z.string().trim().max(40).nullish().transform((v) => v || null),
});

export const responsableUpdateSchema = responsableSchema.partial();

export const cambioPasswordSchema = z
  .object({
    actual: z.string().min(1),
    nueva: z.string().min(10, "Mínimo 10 caracteres").max(128),
  })
  .refine((d) => d.actual !== d.nueva, {
    message: "La nueva contraseña debe ser distinta de la actual",
    path: ["nueva"],
  });
