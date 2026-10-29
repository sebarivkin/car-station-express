"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str, strOrNull } from "@/lib/back";
import type { ItemPresupuesto } from "@/lib/types";

export async function guardarPresupuesto(input: {
  id: string | null;
  vehiculo_id: string | null;
  fecha: string;
  validez_dias: number;
  cliente_nombre: string;
  cliente_telefono: string;
  vehiculo_texto: string;
  patente: string;
  notas: string;
  items: ItemPresupuesto[];
}): Promise<{ error: string } | undefined> {
  const supabase = await db();
  const items = input.items.filter((i) => i.descripcion.trim() && i.cantidad > 0);
  if (!input.cliente_nombre.trim()) return { error: "Ingresá el nombre del cliente." };
  if (items.length === 0) return { error: "Agregá al menos un renglón con descripción." };

  const { data, error } = await supabase.rpc("guardar_presupuesto", {
    p_id: input.id,
    p_vehiculo_id: input.vehiculo_id,
    p_fecha: input.fecha || null,
    p_validez_dias: input.validez_dias || 15,
    p_cliente_nombre: input.cliente_nombre,
    p_cliente_telefono: input.cliente_telefono,
    p_vehiculo_texto: input.vehiculo_texto,
    p_patente: input.patente,
    p_notas: input.notas,
    p_items: items,
  });
  if (error || !data) return { error: errorAmigable(error?.message ?? "No se pudo guardar") };

  revalidatePath("/presupuestos");
  redirect(`/presupuestos/${data}?ok=${encodeURIComponent("Presupuesto guardado")}`);
}

export async function cambiarEstadoPresupuesto(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const estado = str(fd, "estado");
  if (!["pendiente", "aceptado", "rechazado"].includes(estado)) backWith(`/presupuestos/${id}`, undefined, "Estado inválido");
  const { error } = await supabase.from("presupuestos").update({ estado }).eq("id", id);
  if (error) backWith(`/presupuestos/${id}`, undefined, errorAmigable(error.message));
  revalidatePath("/presupuestos");
  backWith(`/presupuestos/${id}`, "Estado actualizado");
}

export async function eliminarPresupuesto(fd: FormData) {
  const supabase = await db();
  const { error } = await supabase.from("presupuestos").delete().eq("id", str(fd, "id"));
  if (error) backWith(`/presupuestos/${str(fd, "id")}`, undefined, errorAmigable(error.message));
  revalidatePath("/presupuestos");
  backWith("/presupuestos", "Presupuesto eliminado");
}

/** Crea el trabajo de taller con la mano de obra y los repuestos del presupuesto */
export async function pasarATrabajo(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const { data, error } = await supabase.rpc("presupuesto_a_trabajo", { p_id: id });
  if (error || !data) backWith(`/presupuestos/${id}`, undefined, errorAmigable(error?.message ?? "No se pudo crear el trabajo"));
  revalidatePath("/presupuestos");
  redirect(`/operaciones/taller/${data}?ok=${encodeURIComponent("Trabajo creado desde el presupuesto. Registrá el cobro cuando paguen.")}`);
}

export async function guardarNegocio(fd: FormData) {
  const supabase = await db();
  const { error } = await supabase
    .from("negocio")
    .update({
      nombre: str(fd, "nombre") || "Car Station Express",
      telefono: strOrNull(fd, "telefono"),
      direccion: strOrNull(fd, "direccion"),
      email: strOrNull(fd, "email"),
      pie_presupuesto: strOrNull(fd, "pie_presupuesto"),
    })
    .eq("id", 1);
  if (error) backWith("/presupuestos/datos", undefined, errorAmigable(error.message));
  backWith("/presupuestos/datos", "Datos guardados");
}
