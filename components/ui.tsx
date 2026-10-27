import Link from "next/link";
import { ChevronLeft, CircleCheck, Clock } from "lucide-react";
import { fmtPatente, money } from "@/lib/format";

export function PageHeader({
  title,
  back,
  children,
}: {
  title: React.ReactNode;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-text"
        >
          <ChevronLeft size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-3xl sm:text-4xl">{title}</h1>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function Patente({ value }: { value: string }) {
  return <span className="patente">{fmtPatente(value)}</span>;
}

/** Estado de cobro: nunca solo por color, siempre con ícono y texto */
export function EstadoPago({ saldo, total }: { saldo: number; total: number }) {
  if (saldo <= 0.005) {
    return (
      <span className="chip bg-ok-soft text-ok">
        <CircleCheck size={13} strokeWidth={2.6} />
        Pagado
      </span>
    );
  }
  const parcial = saldo < total - 0.005;
  return (
    <span className="chip bg-warn-soft text-warn">
      <Clock size={13} strokeWidth={2.6} />
      {parcial ? `Debe ${money(saldo)}` : "Pendiente"}
    </span>
  );
}

export function TipoChip({ tipo }: { tipo: "service" | "taller" }) {
  return (
    <span className="chip bg-surface-2 text-muted ring-1 ring-line ring-inset">
      {tipo === "service" ? "Lubricentro" : "Taller"}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="text-lg font-extrabold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: "brand" | "ok" | "warn";
}) {
  const color = tone === "brand" ? "text-brand" : tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "";
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className={`tabular mt-1 text-xl font-black whitespace-nowrap sm:text-[1.75rem] ${color}`}>{value}</p>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}
