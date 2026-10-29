import { notFound } from "next/navigation";
import PresupuestoForm from "@/components/forms/PresupuestoForm";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { fmtPatente } from "@/lib/format";
import { articulosActivos } from "@/lib/queries";
import { numeros, type ItemPresupuesto, type Presupuesto } from "@/lib/types";

export default async function EditarPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await db();
  const [{ data: p }, { data: items }, articulos] = await Promise.all([
    supabase.from("presupuestos").select("*").eq("id", id).maybeSingle<Presupuesto>(),
    supabase.from("presupuesto_items").select("*").eq("presupuesto_id", id).order("orden"),
    articulosActivos(supabase),
  ]);
  if (!p) notFound();

  return (
    <>
      <PageHeader title={`Editar presupuesto N° ${p.numero}`} back={{ href: `/presupuestos/${id}`, label: "Cancelar" }} />
      <PresupuestoForm
        articulos={articulos}
        inicial={{
          id,
          vehiculo_id: p.vehiculo_id,
          fecha: p.fecha,
          validez_dias: p.validez_dias,
          cliente_nombre: p.cliente_nombre,
          cliente_telefono: p.cliente_telefono ?? "",
          vehiculo_texto: p.vehiculo_texto ?? "",
          patente: p.patente ? fmtPatente(p.patente) : "",
          notas: p.notas ?? "",
          items: (items ?? []).map((i) => numeros(i as ItemPresupuesto)),
        }}
      />
    </>
  );
}
