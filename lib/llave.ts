import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// "Llave" de la gestión: cookie firmada que se entrega al poner la clave correcta.
// Va atada al usuario y vence sola; sin ella, la gestión vuelve a la pantalla de clave.
export const LLAVE_COOKIE = "cse_llave";
const DURACION = 8 * 60 * 60; // 8 horas

function secreto(): string {
  const s = process.env.PIN_SECRET;
  if (!s || s.length < 16) throw new Error("Falta PIN_SECRET en las variables de entorno (ver SETUP.md).");
  return s;
}

function firmar(data: string): string {
  return createHmac("sha256", secreto()).update(data).digest("base64url");
}

export function crearLlave(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + DURACION;
  const data = `${userId}.${exp}`;
  return { value: `${data}.${firmar(data)}`, maxAge: DURACION };
}

function llaveValida(value: string, userId: string): boolean {
  const [uid, exp, firma] = value.split(".");
  if (!uid || !exp || !firma || uid !== userId) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  const esperada = Buffer.from(firmar(`${uid}.${exp}`));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export async function desbloqueado(userId: string): Promise<boolean> {
  const value = (await cookies()).get(LLAVE_COOKIE)?.value;
  return value ? llaveValida(value, userId) : false;
}
