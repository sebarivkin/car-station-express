import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Plus } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import OperacionList from "@/components/OperacionList";
import Flash from "@/components/Flash";
import { Empty, Patente } from "@/components/ui";
import { db } from "@/lib/auth";
import { fecha } from "@/lib/format";
import { numeros, type Operacion, type VehiculoBusqueda } from "@/lib/types";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const { q = "", ok, error } = await searchParams;
  const supabase = await db();
  // Minúsculas y sin acentos, igual que la columna "texto" de la vista
  const term = q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[%_\\]/g, " ")
    .trim();

  let resultados: VehiculoBusqueda[] = [];
  let recientes: Operacion[] = [];

  if (term) {
    // Cada palabra tiene que aparecer en el dueño, la marca, el modelo o la patente
    let query = supabase.from("vehiculos_busqueda").select("*");
    for (const palabra of term.split(/\s+/)) {
      query = query.ilike("texto", `%${palabra.replace(/-/g, "") || palabra}%`);
    }
    const { data } = await query.order("ultima_visita", { ascending: false, nullsFirst: false }).limit(50);
    resultados = (data ?? []) as VehiculoBusqueda[];
  } else {
    const { data } = await supabase
      .from("operaciones")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    recientes = (data ?? []).map((o) => numeros(o as Operacion));
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-3xl sm:text-4xl">Buscar vehículo</h1>
        <Link href="/clientes/nuevo" className="btn btn-primary">
          <Plus size={19} strokeWidth={2.6} />
          Nuevo cliente
        </Link>
      </div>

      <Flash ok={ok} error={error} />

      <Suspense>
        <SearchBox placeholder="Dueño, marca, modelo o patente" />
      </Suspense>

      <section className="mt-8">
        {term ? (
          <>
            <h2 className="mb-3 text-sm font-extrabold text-muted">
              {resultados.length === 0
                ? "Sin resultados"
                : `${resultados.length} ${resultados.length === 1 ? "vehículo" : "vehículos"}`}
            </h2>
            {resultados.length === 0 ? (
              <Empty title={`No encontramos "${q}"`}>
                Probá con otra parte del nombre o de la patente, o{" "}
                <Link href="/clientes/nuevo" className="font-bold text-brand underline">
                  cargá un cliente nuevo
                </Link>
                .
              </Empty>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {resultados.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/vehiculos/${v.id}`}
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
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-extrabold">Últimos trabajos</h2>
            {recientes.length === 0 ? (
              <Empty title="Todavía no hay trabajos cargados">
                Buscá un vehículo o cargá un cliente nuevo para registrar el primer service.
              </Empty>
            ) : (
              <OperacionList ops={recientes} />
            )}
          </>
        )}
      </section>
    </>
  );
}
