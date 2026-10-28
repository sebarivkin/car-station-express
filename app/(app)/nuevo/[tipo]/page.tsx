import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import VehiculoCards from "@/components/VehiculoCards";
import { Empty, PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { buscarVehiculos, vehiculosRecientes } from "@/lib/queries";

// Paso 1 de un service / trabajo: elegir el vehículo (o cargar un cliente nuevo)
export default async function ElegirVehiculoPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { tipo } = await params;
  const { q = "" } = await searchParams;
  if (tipo !== "service" && tipo !== "taller") notFound();
  const supabase = await db();

  const buscando = Boolean(q.trim());
  const vehiculos = buscando ? await buscarVehiculos(supabase, q) : await vehiculosRecientes(supabase);
  const titulo = tipo === "service" ? "Nuevo service" : "Nuevo trabajo de taller";

  return (
    <>
      <PageHeader title={titulo} back={{ href: "/", label: "Inicio" }}>
        <Link href={`/clientes/nuevo?siguiente=${tipo}`} className="btn btn-secondary">
          <UserPlus size={18} />
          Es un cliente nuevo
        </Link>
      </PageHeader>

      <p className="-mt-3 mb-4 font-bold text-muted">¿A qué vehículo se lo hacés?</p>

      <Suspense>
        <SearchBox placeholder="Patente, dueño, marca o modelo" />
      </Suspense>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-extrabold text-muted">
          {buscando
            ? vehiculos.length === 0
              ? "Sin resultados"
              : `${vehiculos.length} ${vehiculos.length === 1 ? "vehículo" : "vehículos"}`
            : "Vinieron últimamente"}
        </h2>
        {vehiculos.length === 0 ? (
          <Empty title={buscando ? `No encontramos "${q}"` : "Todavía no hay vehículos cargados"}>
            <Link href={`/clientes/nuevo?siguiente=${tipo}`} className="font-bold text-brand underline">
              Cargá el cliente y su vehículo
            </Link>{" "}
            y seguís directo con el {tipo === "service" ? "service" : "trabajo"}.
          </Empty>
        ) : (
          <VehiculoCards vehiculos={vehiculos} destino={(id) => `/vehiculos/${id}/${tipo}`} />
        )}
      </section>
    </>
  );
}
