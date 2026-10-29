import Link from "next/link";
import { ChevronRight, Plus, Settings } from "lucide-react";
import Flash from "@/components/Flash";
import { EstadoPresupuestoChip } from "@/components/EstadoPresupuesto";
import { Empty, PageHeader, Patente } from "@/components/ui";
import { db } from "@/lib/auth";
import { fecha, money } from "@/lib/format";
import { numeros, type Presupuesto } from "@/lib/types";

const FILTROS = [
  { v: "", label: "Todos" },
  { v: "pendiente", label: "Pendientes" },
  { v: "aceptado", label: "Aceptados" },
  { v: "rechazado", label: "Rechazados" },
];

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; estado?: string }>;
}) {
  const { ok, error, estado = "" } = await searchParams;
  const supabase = await db();
  let q = supabase.from("presupuestos_totales").select("*").order("numero", { ascending: false }).limit(200);
  if (FILTROS.some((f) => f.v === estado && f.v)) q = q.eq("estado", estado);
  const { data } = await q;
  const lista = (data ?? []).map((p) => numeros(p as Presupuesto));

  return (
    <>
      <PageHeader title="Presupuestos">
        <Link href="/presupuestos/datos" className="privado btn btn-secondary">
          <Settings size={17} />
          Datos del PDF
        </Link>
        <Link href="/presupuestos/nuevo" className="btn btn-primary">
          <Plus size={18} strokeWidth={2.6} />
          Nuevo presupuesto
        </Link>
      </PageHeader>
      <Flash ok={ok} error={error} />

      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Estado">
        {FILTROS.map((f) => (
          <Link
            key={f.v}
            href={f.v ? `/presupuestos?estado=${f.v}` : "/presupuestos"}
            aria-current={estado === f.v ? "page" : undefined}
            className={`btn btn-sm shrink-0 ${estado === f.v ? "btn-primary" : "btn-secondary"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <Empty title="No hay presupuestos">Tocá &quot;Nuevo presupuesto&quot; para hacer el primero.</Empty>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {lista.map((p) => (
            <li key={p.id}>
              <Link href={`/presupuestos/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 sm:px-5">
                <span className="tabular w-14 shrink-0 font-black text-muted">N° {p.numero}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.cliente_nombre}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                    {p.patente && <Patente value={p.patente} />}
                    {p.vehiculo_texto && <span className="truncate">{p.vehiculo_texto}</span>}
                    <span className="tabular">{fecha(p.fecha)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="tabular font-extrabold">{money(p.total)}</span>
                  <EstadoPresupuestoChip estado={p.estado} />
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
