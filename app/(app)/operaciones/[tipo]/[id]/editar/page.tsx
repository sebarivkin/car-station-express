import { notFound } from "next/navigation";
import ServiceForm from "@/components/forms/ServiceForm";
import TrabajoForm from "@/components/forms/TrabajoForm";
import EliminarOperacion from "@/components/EliminarOperacion";
import VehiculoTitulo from "@/components/VehiculoTitulo";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { articulosActivos, nombresProveedores, vehiculoConDueno } from "@/lib/queries";
import { numeros } from "@/lib/types";

type Item = {
  articulo_id: string | null;
  descripcion: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
  proveedores?: { nombre: string } | null;
};

export default async function EditarOperacionPage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "service" && tipo !== "taller") notFound();
  const supabase = await db();
  const volver = { href: `/operaciones/${tipo}/${id}`, label: "Cancelar" };

  if (tipo === "service") {
    const { data: s } = await supabase.from("services").select("*, service_items(*)").eq("id", id).maybeSingle();
    if (!s) notFound();
    const [v, articulos] = await Promise.all([vehiculoConDueno(supabase, s.vehiculo_id), articulosActivos(supabase)]);
    const items = (s.service_items as Item[]).map((i) => numeros(i));
    return (
      <>
        <PageHeader title="Editar service" back={volver} />
        <VehiculoTitulo v={v} />
        <ServiceForm
          vehiculoId={s.vehiculo_id}
          articulos={articulos}
          hoy={hoy()}
          inicial={{ id, fecha: s.fecha, km: s.km, notas: s.notas, items }}
        />
        <Borrar tipo="service" id={id} vehiculoId={s.vehiculo_id} />
      </>
    );
  }

  const { data: t } = await supabase.from("trabajos").select("*, trabajo_repuestos(*, proveedores(nombre))").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [v, proveedores] = await Promise.all([vehiculoConDueno(supabase, t.vehiculo_id), nombresProveedores(supabase)]);
  const repuestos = (t.trabajo_repuestos as Item[]).map((r) => {
    const n = numeros(r);
    return {
      descripcion: n.descripcion,
      proveedor: n.proveedores?.nombre ?? "",
      cantidad: n.cantidad,
      costo_unit: n.costo_unit,
      precio_unit: n.precio_unit,
    };
  });
  return (
    <>
      <PageHeader title="Editar trabajo" back={volver} />
      <VehiculoTitulo v={v} />
      <TrabajoForm
        vehiculoId={t.vehiculo_id}
        proveedores={proveedores}
        hoy={hoy()}
        inicial={{
          id,
          fecha: t.fecha,
          km: t.km,
          descripcion: t.descripcion,
          mano_obra: Number(t.mano_obra),
          notas: t.notas,
          repuestos,
        }}
      />
      <Borrar tipo="taller" id={id} vehiculoId={t.vehiculo_id} />
    </>
  );
}

function Borrar(props: { tipo: "service" | "taller"; id: string; vehiculoId: string }) {
  return (
    <div className="mt-8 max-w-5xl border-t border-line pt-5">
      <EliminarOperacion {...props} boton="btn btn-danger btn-sm" />
    </div>
  );
}
