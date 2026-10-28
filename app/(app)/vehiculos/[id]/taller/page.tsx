import TrabajoForm from "@/components/forms/TrabajoForm";
import VehiculoTitulo from "@/components/VehiculoTitulo";
import Flash from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { nombresProveedores, ultimoKm, vehiculoConDueno } from "@/lib/queries";

export default async function NuevoTrabajoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const supabase = await db();
  const [v, proveedores, km] = await Promise.all([
    vehiculoConDueno(supabase, id),
    nombresProveedores(supabase),
    ultimoKm(supabase, id),
  ]);

  return (
    <>
      <PageHeader title="Nuevo trabajo de taller" back={{ href: `/vehiculos/${id}`, label: "Volver al vehículo" }} />
      <VehiculoTitulo v={v} />
      <Flash ok={ok} error={error} />
      <TrabajoForm vehiculoId={id} proveedores={proveedores} hoy={hoy()} ultimoKm={km} />
    </>
  );
}
