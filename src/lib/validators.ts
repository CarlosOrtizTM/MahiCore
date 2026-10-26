import { z } from "zod";
import { EstadoEquipo, MedioEnlace, TipoEquipo } from "@prisma/client";

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

const idOpcional = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null);

const textoOpcional = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => v || null);

const ipOpcional = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null)
  .refine((v) => v === null || z.string().ip().safeParse(v).success, "Dirección IP inválida");

export const equipoSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  tipo: z.nativeEnum(TipoEquipo),
  estado: z.nativeEnum(EstadoEquipo).default("activo"),
  salaId: idOpcional,
  rackId: idOpcional,
  uInicio: z.number().int().min(1, "La unidad U debe ser 1 o mayor").max(100).nullish(),
  alturaU: z.number().int().min(1, "La altura mínima es 1U").max(42).default(1),
  responsableId: idOpcional,
  direccionIp: ipOpcional,
  dns: textoOpcional(200),
  marca: textoOpcional(80),
  modelo: textoOpcional(80),
  descripcion: textoOpcional(300),
  cantidadPuertos: z.number().int().min(0).max(96).nullish(), // solo al crear
});

export const equipoUpdateSchema = equipoSchema.partial();


export const puertoUpdateSchema = z.object({
  etiqueta: z.string().trim().max(120).nullish().transform((v) => v || null),
  vlan: z.number().int().min(1).max(4094).nullish(),
});

export const enlaceSchema = z.object({
  puertoAId: z.string().min(1),
  puertoBId: z.string().min(1),
  medio: z.nativeEnum(MedioEnlace),
  etiqueta: z.string().trim().max(120).nullish().transform((v) => v || null),
});
