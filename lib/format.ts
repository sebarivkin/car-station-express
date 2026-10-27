const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const pesosDec = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $ 12.345 (con centavos solo si los tiene) */
export function money(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0) * 100) / 100;
  // espacio duro: "$ 12.345" nunca se parte en dos renglones
  return (Number.isInteger(v) ? pesos.format(v) : pesosDec.format(v)).replace(/\s/g, " ");
}

export function num(n: number | null | undefined): string {
  return new Intl.NumberFormat("es-AR").format(Number(n ?? 0));
}

/** 2026-10-27 → 27/10/2026 */
export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** 2026-10 → octubre 2026 */
export function nombreMes(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return `${MESES[Number(m) - 1]} ${y}`;
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

/** Patente normalizada: mayúsculas, sin espacios ni guiones */
export function normPatente(p: string): string {
  return p.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** AB123CD → AB 123 CD · ABC123 → ABC 123 */
export function fmtPatente(p: string): string {
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(p)) return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
  if (/^[A-Z]{3}\d{3}$/.test(p)) return `${p.slice(0, 3)} ${p.slice(3)}`;
  return p;
}

/** Número desde un input (acepta coma decimal y puntos de miles) */
export function parseNum(v: FormDataEntryValue | string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim().replace(/\$/g, "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
