import Link from "next/link";
import { ChevronRight, Droplets, Wrench } from "lucide-react";
import { EstadoPago, Patente } from "@/components/ui";
import { fecha, money, num } from "@/lib/format";
import type { Operacion } from "@/lib/types";

/** Lista de operaciones: tabla en pantallas grandes, tarjetas en el celular */
export default function OperacionList({
  ops,
  mostrarVehiculo = true,
  mostrarUtilidad = false,
}: {
  ops: Operacion[];
  mostrarVehiculo?: boolean;
  mostrarUtilidad?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Escritorio */}
      <div className="hidden overflow-x-auto md:block">
      <table className="table">
        <thead>
          <tr>
            <th className="w-28">Fecha</th>
            <th>Trabajo</th>
            {mostrarVehiculo && <th>Vehículo</th>}
            <th className="text-right">Km</th>
            <th className="text-right">Total</th>
            {mostrarUtilidad && <th className="text-right">Utilidad</th>}
            <th>Cobro</th>
          </tr>
        </thead>
        <tbody>
          {ops.map((o) => (
            <tr key={o.tipo + o.id} className="relative">
              <td className="tabular whitespace-nowrap text-muted">{fecha(o.fecha)}</td>
              <td className="max-w-80">
                <Link href={`/operaciones/${o.tipo}/${o.id}`} className="flex items-center gap-2.5 font-bold after:absolute after:inset-0">
                  <IconoTipo tipo={o.tipo} />
                  <span className="truncate">{o.descripcion}</span>
                </Link>
              </td>
              {mostrarVehiculo && (
                <td>
                  <div className="flex items-center gap-2">
                    <Patente value={o.patente} />
                    <span className="block max-w-52 truncate text-sm text-muted">
                      {o.marca} {o.modelo} · {o.cliente_nombre}
                    </span>
                  </div>
                </td>
              )}
              <td className="tabular text-right text-muted">{o.km ? num(o.km) : "—"}</td>
              <td className="tabular text-right font-extrabold">{money(o.total)}</td>
              {mostrarUtilidad && <td className="tabular text-right text-muted">{money(o.utilidad)}</td>}
              <td>
                <EstadoPago saldo={o.saldo} total={o.total} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Celular */}
      <ul className="divide-y divide-line md:hidden">
        {ops.map((o) => (
          <li key={o.tipo + o.id}>
            <Link href={`/operaciones/${o.tipo}/${o.id}`} className="flex items-start gap-3 px-4 py-3.5 active:bg-surface-2">
              <IconoTipo tipo={o.tipo} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 font-bold">{o.descripcion}</p>
                  <span className="tabular shrink-0 font-extrabold">{money(o.total)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
                  {mostrarVehiculo && <Patente value={o.patente} />}
                  <span className="tabular">{fecha(o.fecha)}</span>
                  {o.km ? <span className="tabular">· {num(o.km)} km</span> : null}
                  <span className="ml-auto">
                    <EstadoPago saldo={o.saldo} total={o.total} />
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="mt-2 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IconoTipo({ tipo }: { tipo: "service" | "taller" }) {
  const Icon = tipo === "service" ? Droplets : Wrench;
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-text ring-1 ring-line ring-inset"
      title={tipo === "service" ? "Lubricentro" : "Taller"}
    >
      <Icon size={17} strokeWidth={2.3} />
    </span>
  );
}
