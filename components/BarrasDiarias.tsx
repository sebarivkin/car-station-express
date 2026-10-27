"use client";

import { useState } from "react";
import { money } from "@/lib/format";

export type Punto = { clave: string; etiqueta: string; lub: number; taller: number };

const SERIES = [
  { key: "lub", label: "Lubricentro", color: "var(--chart-1)" },
  { key: "taller", label: "Taller", color: "var(--chart-2)" },
] as const;

/** Barras apiladas de facturación por día (o mes) y rubro */
export default function BarrasDiarias({ datos }: { datos: Punto[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...datos.map((d) => d.lub + d.taller));
  const escala = niceMax(max);
  const W = 720;
  const H = 220;
  const padL = 56;
  const padB = 26;
  const plotH = H - padB - 8;
  const plotW = W - padL;
  const slot = plotW / Math.max(datos.length, 1);
  const barW = Math.max(3, Math.min(28, slot * 0.62));
  const y = (v: number) => (v / escala) * plotH;
  const ticks = [0, 0.5, 1].map((f) => f * escala);
  const cadaN = Math.ceil(datos.length / 10);
  const d = hover != null ? datos[hover] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm font-bold">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-muted">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Facturación por período y rubro" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W} y1={8 + plotH - y(t)} y2={8 + plotH - y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 8} y={8 + plotH - y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" className="tabular">
                {corto(t)}
              </text>
            </g>
          ))}
          {datos.map((p, i) => {
            const x = padL + slot * i + (slot - barW) / 2;
            const hL = y(p.lub);
            const hT = y(p.taller);
            const gap = hL > 0 && hT > 0 ? 2 : 0;
            const base = 8 + plotH;
            const activo = hover === i;
            return (
              <g key={p.clave} opacity={hover == null || activo ? 1 : 0.45}>
                {hL > 0 && <Barra x={x} y={base - hL} w={barW} h={hL} color={SERIES[0].color} redondear={hT === 0} />}
                {hT > 0 && <Barra x={x} y={base - hL - gap - hT} w={barW} h={hT} color={SERIES[1].color} redondear />}
                {(i % cadaN === 0 || datos.length <= 12) && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)" className="tabular">
                    {p.etiqueta}
                  </text>
                )}
                {/* área de hover más grande que la barra */}
                <rect x={padL + slot * i} y={0} width={slot} height={base} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {d && hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 rounded-xl bg-surface p-3 text-sm shadow-card ring-1 ring-line"
            style={{
              left: `${((padL + slot * hover + slot / 2) / W) * 100}%`,
              transform: hover > datos.length / 2 ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
            }}
          >
            <p className="mb-1.5 font-extrabold">{d.etiqueta}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="tabular font-bold">{money(d[s.key])}</span>
              </p>
            ))}
            <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-extrabold">
              <span>Total</span>
              <span className="tabular">{money(d.lub + d.taller)}</span>
            </p>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-bold text-muted">Ver como tabla</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Período</th>
                <th className="text-right">Lubricentro</th>
                <th className="text-right">Taller</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((p) => (
                <tr key={p.clave}>
                  <td className="tabular">{p.etiqueta}</td>
                  <td className="tabular text-right">{money(p.lub)}</td>
                  <td className="tabular text-right">{money(p.taller)}</td>
                  <td className="tabular text-right font-bold">{money(p.lub + p.taller)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Barra({ x, y, w, h, color, redondear }: { x: number; y: number; w: number; h: number; color: string; redondear: boolean }) {
  const r = redondear ? Math.min(4, h, w / 2) : 0;
  const path = `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
  return <path d={path} fill={color} />;
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function corto(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${Math.round(v)}`;
}
