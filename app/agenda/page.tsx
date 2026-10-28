import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Briefcase, Cake, CalendarCheck, ChevronLeft, ChevronRight, Lock, type LucideIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { bloquear } from "@/app/actions/bloqueo";
import { cumplesDelMes, eventosDelDia, eventosEntre, type Evento, type TipoEvento } from "@/lib/agenda";
import { hoy, inicioSemana, sumarDias } from "@/lib/fechas";

export const metadata: Metadata = { title: "Agenda" };

const TIPOS: Record<TipoEvento, { label: string; icon: LucideIcon; color: string }> = {
  reunion: { label: "Reunión", icon: Briefcase, color: "var(--chart-2)" },
  cumple: { label: "Cumpleaños", icon: Cake, color: "var(--brand)" },
  compromiso: { label: "Compromiso", icon: CalendarCheck, color: "var(--ok)" },
  recordatorio: { label: "Recordatorio", icon: Bell, color: "var(--warn)" },
};

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function largo(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", ...opts }).format(new Date(`${iso}T12:00:00Z`));
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia: diaParam } = await searchParams;
  const h = hoy();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(diaParam ?? "") ? diaParam! : h;
  const lunes = inicioSemana(dia);
  const semana = eventosEntre(lunes, sumarDias(lunes, 6));
  const delDia = eventosDelDia(dia);
  const proximos = [...eventosEntre(sumarDias(dia, 1), sumarDias(dia, 5)).entries()].filter(([, evs]) => evs.length);
  const cumples = cumplesDelMes(dia.slice(0, 7));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-16 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl">Agenda</h1>
          <p className="font-bold text-muted first-letter:uppercase">{largo(h, { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={bloquear}>
            <button className="btn btn-ghost !px-0 w-11" aria-label="Bloquear" title="Bloquear">
              <Lock size={20} />
            </button>
          </form>
        </div>
      </header>

      {/* Semana */}
      <section className="card p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <Link href={`/agenda?dia=${sumarDias(lunes, -7)}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Semana anterior">
            <ChevronLeft size={18} />
          </Link>
          <p className="font-extrabold first-letter:uppercase">{largo(lunes, { month: "long", year: "numeric" })}</p>
          <Link href={`/agenda?dia=${sumarDias(lunes, 7)}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Semana siguiente">
            <ChevronRight size={18} />
          </Link>
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {[...semana.entries()].map(([d, evs], i) => {
            const sel = d === dia;
            const esHoy = d === h;
            return (
              <li key={d}>
                <Link
                  href={`/agenda?dia=${d}`}
                  aria-current={sel ? "date" : undefined}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                    sel ? "bg-brand text-brand-ink" : "hover:bg-surface-2"
                  }`}
                >
                  <span className={`text-xs font-bold ${sel ? "" : "text-muted"}`}>{DIAS_CORTOS[i]}</span>
                  <span className={`tabular text-lg font-black ${esHoy && !sel ? "text-brand" : ""}`}>{Number(d.slice(8))}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: sel ? "currentColor" : TIPOS[e.tipo].color }} />
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Día elegido */}
      <section className="mt-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-extrabold first-letter:uppercase">
            {dia === h ? "Hoy" : largo(dia, { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          {dia !== h && (
            <Link href="/agenda" className="text-sm font-bold text-brand">
              Volver a hoy
            </Link>
          )}
        </div>
        {delDia.length === 0 ? (
          <p className="card px-5 py-8 text-center text-muted">Nada agendado para este día.</p>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {delDia.map((e) => (
              <EventoFila key={e.id} e={e} pasado={dia < h} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Próximos días</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {proximos.map(([d, evs]) => (
              <li key={d} className="px-5 py-3">
                <Link href={`/agenda?dia=${d}`} className="block text-sm font-extrabold text-muted first-letter:uppercase hover:text-text">
                  {largo(d, { weekday: "long", day: "numeric" })}
                </Link>
                <ul className="mt-1 flex flex-col gap-1">
                  {evs.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIPOS[e.tipo].color }} />
                      <span className="tabular w-11 shrink-0 text-muted">{e.hora ?? "—"}</span>
                      <span className="truncate font-bold">{e.titulo}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Cumpleaños del mes</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {cumples.length === 0 ? (
              <li className="px-5 py-4 text-muted">Ninguno este mes.</li>
            ) : (
              cumples.map((c) => (
                <li key={c.nombre} className={`flex items-center gap-3 px-5 py-3 ${c.fecha < h ? "opacity-55" : ""}`}>
                  <Cake size={17} className="shrink-0 text-brand" />
                  <span className="flex-1 truncate font-bold">{c.nombre}</span>
                  <span className="tabular text-sm text-muted">
                    {c.fecha.slice(8)}/{c.fecha.slice(5, 7)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

function EventoFila({ e, pasado }: { e: Evento; pasado: boolean }) {
  const t = TIPOS[e.tipo];
  return (
    <li className={`flex items-center gap-4 px-5 py-4 ${pasado ? "opacity-60" : ""}`}>
      <span className="tabular w-12 shrink-0 text-sm font-extrabold text-muted">{e.hora ?? "Todo el día"}</span>
      <span className="w-1 self-stretch rounded-full" style={{ background: t.color }} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{e.titulo}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <t.icon size={13} />
          {t.label}
          {e.detalle && ` · ${e.detalle}`}
        </p>
      </div>
    </li>
  );
}
