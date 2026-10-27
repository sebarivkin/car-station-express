import TrabajoForm from "@/components/forms/TrabajoForm";
import VehiculoTitulo from "@/components/VehiculoTitulo";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { nombresProveedores, ultimoKm, vehiculoConDueno } from "@/lib/queries";

export default async function NuevoTrabajoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      <TrabajoForm vehiculoId={id} proveedores={proveedores} hoy={hoy()} ultimoKm={km} />
    </>
  );
}
