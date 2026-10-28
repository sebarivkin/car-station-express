// Agenda que se arma sola a partir de la fecha: siempre está al día y,
// como cada día sale de la misma "semilla", muestra lo mismo en cada recarga
// y en cualquier dispositivo. No guarda nada en la base.

import { diasEntre } from "@/lib/fechas";

export type TipoEvento = "reunion" | "cumple" | "compromiso" | "recordatorio";

export type Evento = {
  id: string;
  fecha: string;
  hora: string | null;
  titulo: string;
  detalle: string | null;
  tipo: TipoEvento;
};

const CUMPLES: [string, string][] = [
  ["Mamá", "03-14"], ["Papá", "08-22"], ["Lucía", "01-09"], ["Martín (hermano)", "06-02"],
  ["Abuela Nélida", "11-27"], ["Tío Raúl", "04-18"], ["Caro", "09-05"], ["Diego", "02-23"],
  ["Sofi", "07-11"], ["Nacho", "10-30"], ["Juli (sobrina)", "12-16"], ["Pablo", "05-07"],
  ["Gabi", "03-29"], ["Cristian", "08-03"], ["Vero", "01-26"], ["Seba", "06-19"],
  ["Marcela", "10-12"], ["Hernán", "11-04"], ["Romi", "04-01"], ["Tomás", "09-21"],
  ["Ale", "02-08"], ["Fer", "07-27"], ["Rocío", "12-03"], ["Gustavo", "05-25"],
];

// Fijos de todos los meses (el día se ajusta si el mes es más corto)
const MENSUALES: { dia: number; titulo: string; detalle?: string; tipo: TipoEvento; hora?: string }[] = [
  { dia: 1, titulo: "Pagar cuota del seguro", tipo: "compromiso" },
  { dia: 5, titulo: "Pagar alquiler", detalle: "Transferencia", tipo: "compromiso" },
  { dia: 10, titulo: "Vence factura de luz", tipo: "recordatorio" },
  { dia: 12, titulo: "Vence internet", tipo: "recordatorio" },
  { dia: 18, titulo: "Reunión con el contador", detalle: "Estudio contable", tipo: "reunion", hora: "10:00" },
  { dia: 20, titulo: "Vence monotributo", tipo: "compromiso" },
  { dia: 25, titulo: "Pagar tarjeta", tipo: "compromiso" },
];

// Fijos de la semana (0 = domingo)
const SEMANALES: { dow: number; titulo: string; detalle?: string; tipo: TipoEvento; hora: string }[] = [
  { dow: 1, titulo: "Hacer pedidos de la semana", tipo: "recordatorio", hora: "08:30" },
  { dow: 3, titulo: "Fútbol 5", detalle: "Club del barrio", tipo: "compromiso", hora: "21:00" },
  { dow: 0, titulo: "Almuerzo familiar", detalle: "Casa de mamá", tipo: "compromiso", hora: "13:00" },
];

// Eventos sueltos que aparecen al azar (siempre los mismos para el mismo día)
const SUELTOS: { titulo: string; detalle?: string; tipo: TipoEvento }[] = [
  { titulo: "Reunión con proveedor", detalle: "Nueva lista de precios", tipo: "reunion" },
  { titulo: "Visita del vendedor de lubricantes", tipo: "reunion" },
  { titulo: "Llamar al banco", tipo: "recordatorio" },
  { titulo: "Turno médico", detalle: "Clínica", tipo: "compromiso" },
  { titulo: "Turno con el dentista", tipo: "compromiso" },
  { titulo: "Reunión en el colegio", detalle: "Reunión de padres", tipo: "reunion" },
  { titulo: "Retirar repuestos", detalle: "Distribuidora", tipo: "recordatorio" },
  { titulo: "Llamar al gestor", detalle: "Trámite de la camioneta", tipo: "recordatorio" },
  { titulo: "Pasar por el banco", tipo: "recordatorio" },
  { titulo: "Café con Diego", tipo: "compromiso" },
  { titulo: "Reunión con el seguro", detalle: "Renovar póliza", tipo: "reunion" },
  { titulo: "Comprar regalo", tipo: "recordatorio" },
  { titulo: "Llevar el auto a la VTV", tipo: "compromiso" },
  { titulo: "Reunión con el contador", detalle: "Revisar papeles", tipo: "reunion" },
  { titulo: "Pagar expensas", tipo: "compromiso" },
  { titulo: "Cena con amigos", tipo: "compromiso" },
  { titulo: "Llamar al electricista", tipo: "recordatorio" },
  { titulo: "Retirar análisis", tipo: "recordatorio" },
  { titulo: "Reunión por la mutual", tipo: "reunion" },
  { titulo: "Cumple de un amigo de los chicos", detalle: "Salón de fiestas", tipo: "compromiso" },
];

const HORAS = ["09:00", "09:30", "10:30", "11:00", "12:00", "14:30", "15:00", "16:00", "17:30", "18:00", "19:30", "20:30"];

// Generador pseudoaleatorio con semilla (mulberry32)
function rng(semilla: string) {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) h = Math.imul(h ^ semilla.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ultimoDiaMes(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function eventosDelDia(iso: string): Evento[] {
  const out: Evento[] = [];
  const mmdd = iso.slice(5);
  const dia = Number(iso.slice(8));
  const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
  const r = rng(`agenda-${iso}`);

  for (const [nombre, fecha] of CUMPLES) {
    if (fecha === mmdd) out.push({ id: `${iso}-c-${nombre}`, fecha: iso, hora: null, titulo: `Cumpleaños de ${nombre}`, detalle: null, tipo: "cumple" });
  }
  const ult = ultimoDiaMes(iso);
  for (const m of MENSUALES) {
    if (Math.min(m.dia, ult) === dia) {
      out.push({ id: `${iso}-m-${m.dia}`, fecha: iso, hora: m.hora ?? null, titulo: m.titulo, detalle: m.detalle ?? null, tipo: m.tipo });
    }
  }
  for (const s of SEMANALES) {
    if (s.dow === dow) out.push({ id: `${iso}-s-${s.dow}`, fecha: iso, hora: s.hora, titulo: s.titulo, detalle: s.detalle ?? null, tipo: s.tipo });
  }

  // De lunes a viernes, 0 a 2 sueltos; el sábado, a veces uno
  const habil = dow >= 1 && dow <= 5;
  const n = habil ? (r() < 0.7 ? 1 : 0) + (r() < 0.35 ? 1 : 0) : dow === 6 && r() < 0.4 ? 1 : 0;
  const usados = new Set<number>();
  const horas = new Set(out.map((e) => e.hora));
  for (let k = 0; k < n; k++) {
    let idx = Math.floor(r() * SUELTOS.length);
    while (usados.has(idx)) idx = (idx + 1) % SUELTOS.length;
    usados.add(idx);
    let hora = HORAS[Math.floor(r() * HORAS.length)];
    while (horas.has(hora)) hora = HORAS[(HORAS.indexOf(hora) + 1) % HORAS.length];
    horas.add(hora);
    const e = SUELTOS[idx];
    out.push({ id: `${iso}-r-${idx}`, fecha: iso, hora, titulo: e.titulo, detalle: e.detalle ?? null, tipo: e.tipo });
  }

  // Sin hora (cumpleaños, vencimientos) primero; después por hora
  return out.sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
}

export function eventosEntre(desde: string, hasta: string): Map<string, Evento[]> {
  return new Map(diasEntre(desde, hasta).map((d) => [d, eventosDelDia(d)]));
}

export function cumplesDelMes(yyyymm: string): { nombre: string; fecha: string }[] {
  const mm = yyyymm.slice(5);
  return CUMPLES.filter(([, f]) => f.startsWith(mm))
    .map(([nombre, f]) => ({ nombre, fecha: `${yyyymm.slice(0, 4)}-${f}` }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
