import Link from "next/link";
import { Suspense } from "react";
import { Droplets, UserPlus, Wrench } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import OperacionList from "@/components/OperacionList";
import VehiculoCards from "@/components/VehiculoCards";
import Flash from "@/components/Flash";
import { Empty } from "@/components/ui";
import { db } from "@/lib/auth";
import { buscarVehiculos } from "@/lib/queries";
import { numeros, type Operacion } from "@/lib/types";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const { q = "", ok, error } = await searchParams;
  const supabase = await db();
  const buscando = Boolean(q.trim());

  const resultados = buscando ? await buscarVehiculos(supabase, q) : [];
  let recientes: Operacion[] = [];
  if (!buscando) {
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
      <h1 className="h-display mb-5 text-3xl sm:text-4xl">Inicio</h1>

      <Flash ok={ok} error={error} />

      {/* Acciones principales */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link href="/nuevo/service" className="card flex items-center gap-3 p-4 hover:ring-2 hover:ring-brand sm:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
            <Droplets size={21} strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold">Nuevo service</span>
            <span className="text-sm text-muted">Lubricentro</span>
          </span>
        </Link>
        <Link href="/nuevo/taller" className="card flex items-center gap-3 p-4 hover:ring-2 hover:ring-brand sm:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
            <Wrench size={20} strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold">Nuevo trabajo</span>
            <span className="text-sm text-muted">Taller mecánico</span>
          </span>
        </Link>
        <Link
          href="/clientes/nuevo"
          className="card col-span-2 flex items-center gap-3 p-4 hover:ring-2 hover:ring-line sm:col-span-1 sm:p-5"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-text ring-1 ring-line ring-inset">
            <UserPlus size={20} strokeWidth={2.3} />
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold">Nuevo cliente</span>
            <span className="text-sm text-muted">Con su vehículo</span>
          </span>
        </Link>
      </div>

      <Suspense>
        <SearchBox placeholder="Buscar por dueño, marca, modelo o patente" />
      </Suspense>

      <section className="mt-8">
        {buscando ? (
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
              <VehiculoCards vehiculos={resultados} />
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-extrabold">Últimos trabajos</h2>
            {recientes.length === 0 ? (
              <Empty title="Todavía no hay trabajos cargados">
                Tocá &quot;Nuevo service&quot; o &quot;Nuevo trabajo&quot; para registrar el primero.
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
