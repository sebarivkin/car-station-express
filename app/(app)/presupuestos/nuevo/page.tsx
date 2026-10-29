import PresupuestoForm from "@/components/forms/PresupuestoForm";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { fmtPatente } from "@/lib/format";
import { articulosActivos } from "@/lib/queries";
import type { Cliente, Vehiculo } from "@/lib/types";

// ?vehiculo=ID completa los datos del cliente y del auto
export default async function NuevoPresupuestoPage({ searchParams }: { searchParams: Promise<{ vehiculo?: string }> }) {
  const { vehiculo } = await searchParams;
  const supabase = await db();
  const [articulos, { data: v }] = await Promise.all([
    articulosActivos(supabase),
    vehiculo
      ? supabase.from("vehiculos").select("*, clientes(*)").eq("id", vehiculo).maybeSingle<Vehiculo & { clientes: Cliente | null }>()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo presupuesto"
        back={v ? { href: `/vehiculos/${v.id}`, label: "Volver al vehículo" } : { href: "/presupuestos", label: "Presupuestos" }}
      />
      <PresupuestoForm
        articulos={articulos}
        inicial={{
          id: null,
          vehiculo_id: v?.id ?? null,
          fecha: hoy(),
          validez_dias: 15,
          cliente_nombre: v?.clientes?.nombre ?? "",
          cliente_telefono: v?.clientes?.telefono ?? "",
          vehiculo_texto: v ? [v.marca, v.modelo, v.anio].filter(Boolean).join(" ") : "",
          patente: v ? fmtPatente(v.patente) : "",
          notas: "",
          items: [],
        }}
      />
    </>
  );
}
