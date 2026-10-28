import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Patente } from "@/components/ui";
import { fecha } from "@/lib/format";
import type { VehiculoBusqueda } from "@/lib/types";

/** Grilla de vehículos; `destino` arma el link de cada uno */
export default function VehiculoCards({
  vehiculos,
  destino = (id) => `/vehiculos/${id}`,
}: {
  vehiculos: VehiculoBusqueda[];
  destino?: (id: string) => string;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {vehiculos.map((v) => (
        <li key={v.id}>
          <Link
            href={destino(v.id)}
            className="card flex items-center gap-3 p-4 transition-transform active:scale-[0.99] hover:ring-2 hover:ring-line"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Patente value={v.patente} />
                {v.anio && <span className="tabular text-sm text-muted">{v.anio}</span>}
              </div>
              <p className="mt-2 truncate text-lg font-extrabold">
                {v.marca} {v.modelo}
              </p>
              <p className="truncate text-muted">{v.cliente_nombre}</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {v.ultima_visita ? `Última visita ${fecha(v.ultima_visita)}` : "Sin visitas todavía"}
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
