"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str, strOrNull } from "@/lib/back";
import { parseNum } from "@/lib/format";

function volver(fd: FormData) {
  const mes = str(fd, "mes");
  return mes ? `/empleados?mes=${mes}` : "/empleados";
}

export async function registrarAdelanto(fd: FormData) {
  const supabase = await db();
  const monto = parseNum(fd.get("monto"));
  const empleadoId = str(fd, "empleado_id");
  if (!empleadoId) backWith(volver(fd), undefined, "Elegí el empleado.");
  if (monto <= 0) backWith(volver(fd), undefined, "Ingresá un monto mayor a cero.");

  const { error } = await supabase.from("adelantos").insert({
    empleado_id: empleadoId,
    monto,
    fecha: str(fd, "fecha") || undefined,
    nota: strOrNull(fd, "nota"),
  });
  if (error) backWith(volver(fd), undefined, errorAmigable(error.message));
  revalidatePath("/empleados");
  backWith(volver(fd), "Adelanto registrado");
}

export async function eliminarAdelanto(fd: FormData) {
  const supabase = await db();
  const { error } = await supabase.from("adelantos").delete().eq("id", str(fd, "id"));
  if (error) backWith(volver(fd), undefined, errorAmigable(error.message));
  revalidatePath("/empleados");
  backWith(volver(fd), "Adelanto eliminado");
}

export async function agregarEmpleado(fd: FormData) {
  const supabase = await db();
  const nombre = str(fd, "nombre");
  if (!nombre) backWith(volver(fd), undefined, "Ingresá el nombre.");
  const { error } = await supabase.from("empleados").insert({ nombre });
  if (error) backWith(volver(fd), undefined, error.message.includes("duplicate") ? "Ya existe ese empleado." : errorAmigable(error.message));
  revalidatePath("/empleados");
  backWith(volver(fd), "Empleado agregado");
}

export async function cambiarEmpleadoActivo(fd: FormData) {
  const supabase = await db();
  const { error } = await supabase
    .from("empleados")
    .update({ activo: str(fd, "activo") === "true" })
    .eq("id", str(fd, "id"));
  if (error) backWith(volver(fd), undefined, errorAmigable(error.message));
  revalidatePath("/empleados");
  backWith(volver(fd));
}
