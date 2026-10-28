import Link from "next/link";
import ServiceForm from "@/components/forms/ServiceForm";
import VehiculoTitulo from "@/components/VehiculoTitulo";
import Flash from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { articulosActivos, ultimoKm, vehiculoConDueno } from "@/lib/queries";

export default async function NuevoServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const supabase = await db();
  const [v, articulos, km] = await Promise.all([
    vehiculoConDueno(supabase, id),
    articulosActivos(supabase),
    ultimoKm(supabase, id),
  ]);

  return (
    <>
      <PageHeader title="Nuevo service" back={{ href: `/vehiculos/${id}`, label: "Volver al vehículo" }} />
      <VehiculoTitulo v={v} />
      <Flash ok={ok} error={error} />
      {articulos.length === 0 && (
        <p className="mb-5 rounded-xl bg-warn-soft px-4 py-3 text-sm font-bold text-warn">
          Todavía no hay artículos en el catálogo. Podés escribirlos a mano o{" "}
          <Link href="/articulos" className="underline">
            cargar la lista de precios
          </Link>
          .
        </p>
      )}
      <ServiceForm vehiculoId={id} articulos={articulos} hoy={hoy()} ultimoKm={km} />
    </>
  );
}
