import { notFound } from "next/navigation";
import type { DB } from "@/lib/auth";
import { numeros, type Articulo, type Vehiculo } from "@/lib/types";

export async function vehiculoConDueno(supabase: DB, id: string) {
  const { data } = await supabase
    .from("vehiculos")
    .select("*, clientes(nombre)")
    .eq("id", id)
    .maybeSingle<Vehiculo & { clientes: { nombre: string } | null }>();
  if (!data) notFound();
  return data;
}

export async function ultimoKm(supabase: DB, vehiculoId: string): Promise<number | null> {
  const { data } = await supabase
    .from("operaciones")
    .select("km")
    .eq("vehiculo_id", vehiculoId)
    .not("km", "is", null)
    .order("fecha", { ascending: false })
    .limit(1);
  return data?.[0]?.km ?? null;
}

export async function articulosActivos(supabase: DB): Promise<Articulo[]> {
  const { data } = await supabase.from("articulos").select("*").eq("activo", true).order("nombre").limit(5000);
  return (data ?? []).map((a) => numeros(a as Articulo));
}

export async function nombresProveedores(supabase: DB): Promise<string[]> {
  const { data } = await supabase.from("proveedores").select("nombre").order("nombre");
  return (data ?? []).map((p) => p.nombre as string);
}
