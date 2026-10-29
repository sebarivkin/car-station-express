"use client";

import { CircleAlert } from "lucide-react";
import { money, parseNum } from "@/lib/format";
import { MEDIOS, type MedioPago } from "@/lib/types";
import type { Cobro } from "@/app/actions/operaciones";

export function MoneyInput({
  value,
  onChange,
  label,
  className = "",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-muted">$</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        aria-label={label}
        autoFocus={autoFocus}
        onFocus={(e) => e.target.select()}
        className="input tabular !pl-7 text-right"
      />
    </div>
  );
}

export type EstadoCobro = "completo" | "parcial" | "debe";

export type CobroState = { estado: EstadoCobro; medio: MedioPago; parcial: string };

export function cobroFinal(c: CobroState, total: number): Cobro {
  if (c.estado === "debe" || total <= 0) return null;
  const monto = c.estado === "completo" ? total : Math.min(parseNum(c.parcial), total);
  return monto > 0 ? { monto, medio: c.medio } : null;
}

export function CobroFields({
  value,
  onChange,
  total,
}: {
  value: CobroState;
  onChange: (c: CobroState) => void;
  total: number;
}) {
  const opciones: { v: EstadoCobro; label: string }[] = [
    { v: "completo", label: "Cobrado" },
    { v: "parcial", label: "Parcial" },
    { v: "debe", label: "Debe todo" },
  ];
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label mb-2">Cobro</legend>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1 ring-1 ring-line ring-inset">
        {opciones.map((o) => (
          <label
            key={o.v}
            className={`cursor-pointer rounded-full py-2 text-center text-sm font-extrabold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand ${
              value.estado === o.v ? "bg-surface text-text shadow-card" : "text-muted"
            }`}
          >
            <input
              type="radio"
              name="estado_cobro"
              className="sr-only"
              checked={value.estado === o.v}
              onChange={() => onChange({ ...value, estado: o.v })}
            />
            {o.label}
          </label>
        ))}
      </div>
      {value.estado !== "debe" && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={value.medio}
            onChange={(e) => onChange({ ...value, medio: e.target.value as MedioPago })}
            className={`input ${value.estado === "completo" ? "col-span-2" : ""}`}
            aria-label="Medio de pago"
          >
            {MEDIOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {value.estado === "parcial" && (
            <MoneyInput label="Monto cobrado" value={value.parcial} onChange={(p) => onChange({ ...value, parcial: p })} />
          )}
        </div>
      )}
      {value.estado === "parcial" && (
        <p className="text-sm text-muted">
          Queda debiendo{" "}
          <strong className="tabular text-warn">{money(Math.max(total - parseNum(value.parcial), 0))}</strong>
        </p>
      )}
    </fieldset>
  );
}

export function Resumen({
  filas,
  total,
  utilidad,
}: {
  filas: { label: string; value: number; privado?: boolean }[];
  total: number;
  utilidad: number;
}) {
  const margen = total > 0 ? (utilidad / total) * 100 : 0;
  return (
    <dl className="flex flex-col gap-2">
      {filas.map((f) => (
        <div key={f.label} className={`flex justify-between text-sm ${f.privado ? "privado" : ""}`}>
          <dt className="text-muted">{f.label}</dt>
          <dd className="tabular font-bold">{money(f.value)}</dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-extrabold">Total</dt>
        <dd className="tabular text-3xl font-black">{money(total)}</dd>
      </div>
      <div className="privado flex justify-between text-sm">
        <dt className="text-muted">Utilidad</dt>
        <dd className={`tabular font-extrabold ${utilidad < 0 ? "text-brand" : "text-ok"}`}>
          {money(utilidad)} <span className="font-semibold text-muted">({Math.round(margen)}%)</span>
        </dd>
      </div>
    </dl>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm font-bold text-brand">
      <CircleAlert size={17} className="mt-px shrink-0" />
      {error}
    </p>
  );
}

/** Fecha y km, comunes a service y trabajo */
export function FechaKm({
  fecha,
  km,
  onFecha,
  onKm,
  ultimoKm,
}: {
  fecha: string;
  km: string;
  onFecha: (v: string) => void;
  onKm: (v: string) => void;
  ultimoKm?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="field">
        <span className="label">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => onFecha(e.target.value)} required className="input tabular" />
      </label>
      <label className="field">
        <span className="label">Kilometraje</span>
        <input
          value={km}
          onChange={(e) => onKm(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder={ultimoKm ? `Último: ${ultimoKm.toLocaleString("es-AR")}` : "Ej. 85000"}
          className="input tabular"
        />
      </label>
    </div>
  );
}

export function aTexto(n: number | null | undefined): string {
  if (n == null || n === 0) return "";
  return String(n).replace(".", ",");
}
