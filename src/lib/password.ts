import { pbkdf2Sync, randomBytes, randomInt, timingSafeEqual } from "crypto";

const ITERATIONS = 600_000;
const KEY_LENGTH = 64; // bytes
const DIGEST = "sha512";
const SALT_LENGTH = 16; // bytes

/**
 * Genera un hash PBKDF2-SHA512 con salt aleatorio.
 * Formato almacenado: salt_hex:hash_hex
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = pbkdf2Sync(plain, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verifica una contraseña contra un hash almacenado
 * (comparación en tiempo constante).
 */
export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = pbkdf2Sync(plain, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar o copiar.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Contraseña temporal aleatoria (criptográficamente segura). */
export function generarPasswordTemporal(longitud = 14): string {
  return Array.from({ length: longitud }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}
