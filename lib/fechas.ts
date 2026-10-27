// Todas las fechas en hora de Argentina, como texto yyyy-mm-dd

export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function sumarDias(iso: string, dias: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return toIso(d);
}

export function inicioMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function finMes(iso: string): string {
  const d = parse(inicioMes(iso));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return toIso(d);
}

/** 2026-10 + 1 → 2026-11 */
export function sumarMeses(yyyymm: string, n: number): string {
  const d = parse(`${yyyymm}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return toIso(d).slice(0, 7);
}

/** Lunes de la semana de la fecha */
export function inicioSemana(iso: string): string {
  const dow = (parse(iso).getUTCDay() + 6) % 7;
  return sumarDias(iso, -dow);
}

export function diasEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) out.push(d);
  return out;
}

export type Periodo = "hoy" | "semana" | "mes" | "mes-anterior" | "anio" | "rango";

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Este mes" },
  { value: "mes-anterior", label: "Mes anterior" },
  { value: "anio", label: "Año" },
  { value: "rango", label: "Rango" },
];

export function rangoPeriodo(
  periodo: Periodo,
  desde?: string,
  hasta?: string
): { desde: string; hasta: string } {
  const h = hoy();
  switch (periodo) {
    case "hoy":
      return { desde: h, hasta: h };
    case "semana":
      return { desde: inicioSemana(h), hasta: h };
    case "mes-anterior": {
      const ini = `${sumarMeses(h.slice(0, 7), -1)}-01`;
      return { desde: ini, hasta: finMes(ini) };
    }
    case "anio":
      return { desde: `${h.slice(0, 4)}-01-01`, hasta: h };
    case "rango":
      if (desde && hasta && desde <= hasta) return { desde, hasta };
      return { desde: inicioMes(h), hasta: h };
    default:
      return { desde: inicioMes(h), hasta: h };
  }
}
