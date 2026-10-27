"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str } from "@/lib/back";
import { parseNum } from "@/lib/format";
import type { MedioPago, TipoOperacion } from "@/lib/types";

export type ItemService = {
  articulo_id: string | null;
  descripcion: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
};

export type Repuesto = {
  descripcion: string;
  proveedor: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
};

export type Cobro = { monto: number; medio: MedioPago } | null;

type Resultado = { error: string } | undefined;

export async function guardarService(input: {
  id: string | null;
  vehiculo_id: string;
  fecha: string;
  km: number | null;
  notas: string;
  items: ItemService[];
  cobro: Cobro;
}): Promise<Resultado> {
  const supabase = await db();
  const items = input.items.filter((i) => i.descripcion.trim() && i.cantidad > 0);
  if (items.length === 0) return { error: "Agregá al menos un artículo." };

  const { data, error } = await supabase.rpc("guardar_service", {
    p_id: input.id,
    p_vehiculo_id: input.vehiculo_id,
    p_fecha: input.fecha || null,
    p_km: input.km,
    p_notas: input.notas,
    p_items: items,
    p_pago_monto: input.cobro?.monto ?? null,
    p_pago_medio: input.cobro?.medio ?? null,
  });
  if (error || !data) return { error: errorAmigable(error?.message ?? "No se pudo guardar") };

  revalidatePath(`/vehiculos/${input.vehiculo_id}`);
  redirect(`/operaciones/service/${data}?ok=${encodeURIComponent("Service guardado")}`);
}

export async function guardarTrabajo(input: {
  id: string | null;
  vehiculo_id: string;
  fecha: string;
  km: number | null;
  descripcion: string;
  mano_obra: number;
  notas: string;
  repuestos: Repuesto[];
  cobro: Cobro;
}): Promise<Resultado> {
  const supabase = await db();
  if (!input.descripcion.trim()) return { error: "Describí el trabajo realizado." };
  const repuestos = input.repuestos.filter((r) => r.descripcion.trim() && r.cantidad > 0);

  const { data, error } = await supabase.rpc("guardar_trabajo", {
    p_id: input.id,
    p_vehiculo_id: input.vehiculo_id,
    p_fecha: input.fecha || null,
    p_km: input.km,
    p_descripcion: input.descripcion,
    p_mano_obra: input.mano_obra,
    p_notas: input.notas,
    p_repuestos: repuestos,
    p_pago_monto: input.cobro?.monto ?? null,
    p_pago_medio: input.cobro?.medio ?? null,
  });
  if (error || !data) return { error: errorAmigable(error?.message ?? "No se pudo guardar") };

  revalidatePath(`/vehiculos/${input.vehiculo_id}`);
  redirect(`/operaciones/taller/${data}?ok=${encodeURIComponent("Trabajo guardado")}`);
}

function tabla(tipo: string) {
  return tipo === "service" ? "services" : "trabajos";
}

export async function eliminarOperacion(fd: FormData) {
  const supabase = await db();
  const tipo = str(fd, "tipo") as TipoOperacion;
  const id = str(fd, "id");
  const vehiculoId = str(fd, "vehiculo_id");
  const { error } = await supabase.from(tabla(tipo)).delete().eq("id", id);
  if (error) backWith(`/operaciones/${tipo}/${id}`, undefined, errorAmigable(error.message));
  revalidatePath(`/vehiculos/${vehiculoId}`);
  backWith(`/vehiculos/${vehiculoId}`, tipo === "service" ? "Service eliminado" : "Trabajo eliminado");
}

export async function registrarPago(fd: FormData) {
  const supabase = await db();
  const tipo = str(fd, "tipo") as TipoOperacion;
  const id = str(fd, "id");
  const volver = str(fd, "volver") || `/operaciones/${tipo}/${id}`;
  const monto = parseNum(fd.get("monto"));
  const medio = str(fd, "medio");
  if (monto <= 0) backWith(volver, undefined, "Ingresá un monto mayor a cero.");

  const { error } = await supabase.from("pagos").insert({
    [tipo === "service" ? "service_id" : "trabajo_id"]: id,
    monto,
    medio,
    fecha: str(fd, "fecha") || undefined,
  });
  if (error) backWith(volver, undefined, errorAmigable(error.message));
  revalidatePath("/deudas");
  backWith(volver, "Pago registrado");
}

export async function eliminarPago(fd: FormData) {
  const supabase = await db();
  const volver = str(fd, "volver");
  const { error } = await supabase.from("pagos").delete().eq("id", str(fd, "pago_id"));
  if (error) backWith(volver, undefined, errorAmigable(error.message));
  revalidatePath("/deudas");
  backWith(volver, "Pago eliminado");
}
