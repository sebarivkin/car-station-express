import { notFound } from "next/navigation";
import type { DB } from "@/lib/auth";
import { numeros, type Articulo, type Vehiculo, type VehiculoBusqueda } from "@/lib/types";

/** Busca por dueño, marca, modelo o patente: cada palabra tiene que aparecer */
export async function buscarVehiculos(supabase: DB, q: string): Promise<VehiculoBusqueda[]> {
  // Minúsculas y sin acentos, igual que la columna "texto" de la vista
  const term = q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[%_\\]/g, " ")
    .trim();
  if (!term) return [];
  let query = supabase.from("vehiculos_busqueda").select("*");
  for (const palabra of term.split(/\s+/)) {
    query = query.ilike("texto", `%${palabra.replace(/-/g, "") || palabra}%`);
  }
  const { data } = await query.order("ultima_visita", { ascending: false, nullsFirst: false }).limit(50);
  return (data ?? []) as VehiculoBusqueda[];
}

/** Los vehículos que vinieron últimamente (o los últimos cargados) */
export async function vehiculosRecientes(supabase: DB, limite = 9): Promise<VehiculoBusqueda[]> {
  const { data } = await supabase
    .from("vehiculos_busqueda")
    .select("*")
    .order("ultima_visita", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limite);
  return (data ?? []) as VehiculoBusqueda[];
}

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
