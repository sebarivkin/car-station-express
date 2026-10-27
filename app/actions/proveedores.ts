"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str, strOrNull } from "@/lib/back";

const VOLVER = "/proveedores";

export async function guardarProveedor(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const datos = { nombre: str(fd, "nombre"), telefono: strOrNull(fd, "telefono") };
  if (!datos.nombre) backWith(VOLVER, undefined, "Ingresá el nombre.");
  const { error } = id
    ? await supabase.from("proveedores").update(datos).eq("id", id)
    : await supabase.from("proveedores").insert(datos);
  if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  revalidatePath(VOLVER);
  backWith(VOLVER, id ? "Proveedor actualizado" : "Proveedor agregado");
}

export async function eliminarProveedor(fd: FormData) {
  const supabase = await db();
  // Los repuestos quedan registrados, solo pierden el dato del proveedor
  const { error } = await supabase.from("proveedores").delete().eq("id", str(fd, "id"));
  if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  revalidatePath(VOLVER);
  backWith(VOLVER, "Proveedor eliminado");
}
