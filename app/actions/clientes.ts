"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str, strOrNull } from "@/lib/back";
import { normPatente } from "@/lib/format";

function datosVehiculo(fd: FormData) {
  const anio = Number(str(fd, "anio"));
  return {
    patente: normPatente(str(fd, "patente")),
    marca: str(fd, "marca"),
    modelo: str(fd, "modelo"),
    anio: Number.isInteger(anio) && anio > 1900 ? anio : null,
    notas: strOrNull(fd, "vehiculo_notas"),
  };
}

function validarVehiculo(v: ReturnType<typeof datosVehiculo>): string | null {
  if (v.patente.length < 5) return "Revisá la patente.";
  if (!v.marca || !v.modelo) return "Completá marca y modelo.";
  return null;
}

/** Alta de cliente junto con su primer vehículo */
export async function crearCliente(fd: FormData) {
  const supabase = await db();
  const nombre = str(fd, "nombre");
  const v = datosVehiculo(fd);
  const volver = "/clientes/nuevo";

  if (!nombre) backWith(volver, undefined, "Ingresá el nombre del cliente.");
  const err = validarVehiculo(v);
  if (err) backWith(volver, undefined, err);

  const { data: existente } = await supabase
    .from("vehiculos")
    .select("id")
    .eq("patente", v.patente)
    .maybeSingle();
  if (existente) backWith(`/vehiculos/${existente.id}`, undefined, "Esa patente ya estaba cargada: este es el vehículo.");

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({ nombre, telefono: strOrNull(fd, "telefono"), notas: strOrNull(fd, "notas") })
    .select("id")
    .single();
  if (error || !cliente) backWith(volver, undefined, errorAmigable(error?.message ?? "No se pudo guardar"));

  const { data: vehiculo, error: errV } = await supabase
    .from("vehiculos")
    .insert({ ...v, cliente_id: cliente.id })
    .select("id")
    .single();
  if (errV || !vehiculo) {
    await supabase.from("clientes").delete().eq("id", cliente.id);
    backWith(volver, undefined, errorAmigable(errV?.message ?? "No se pudo guardar el vehículo"));
  }

  revalidatePath("/");
  redirect(`/vehiculos/${vehiculo.id}?ok=${encodeURIComponent("Cliente y vehículo guardados")}`);
}

export async function actualizarCliente(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const nombre = str(fd, "nombre");
  if (!nombre) backWith(`/clientes/${id}`, undefined, "El nombre no puede quedar vacío.");

  const { error } = await supabase
    .from("clientes")
    .update({ nombre, telefono: strOrNull(fd, "telefono"), notas: strOrNull(fd, "notas") })
    .eq("id", id);
  if (error) backWith(`/clientes/${id}`, undefined, errorAmigable(error.message));
  revalidatePath(`/clientes/${id}`);
  backWith(`/clientes/${id}`, "Datos actualizados");
}

export async function eliminarCliente(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const { count } = await supabase
    .from("vehiculos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", id);
  if (count) backWith(`/clientes/${id}`, undefined, "Primero borrá o pasá sus vehículos a otro cliente.");
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) backWith(`/clientes/${id}`, undefined, errorAmigable(error.message));
  revalidatePath("/");
  backWith("/", "Cliente eliminado");
}

export async function agregarVehiculo(fd: FormData) {
  const supabase = await db();
  const clienteId = str(fd, "cliente_id");
  const v = datosVehiculo(fd);
  const err = validarVehiculo(v);
  if (err) backWith(`/clientes/${clienteId}`, undefined, err);

  const { data, error } = await supabase
    .from("vehiculos")
    .insert({ ...v, cliente_id: clienteId })
    .select("id")
    .single();
  if (error || !data) backWith(`/clientes/${clienteId}`, undefined, errorAmigable(error?.message ?? "No se pudo guardar"));
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/vehiculos/${data.id}?ok=${encodeURIComponent("Vehículo agregado")}`);
}

export async function actualizarVehiculo(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const v = datosVehiculo(fd);
  const err = validarVehiculo(v);
  if (err) backWith(`/vehiculos/${id}`, undefined, err);

  const clienteId = strOrNull(fd, "cliente_id");
  const { error } = await supabase
    .from("vehiculos")
    .update(clienteId ? { ...v, cliente_id: clienteId } : v)
    .eq("id", id);
  if (error) backWith(`/vehiculos/${id}`, undefined, errorAmigable(error.message));
  revalidatePath(`/vehiculos/${id}`);
  backWith(`/vehiculos/${id}`, "Vehículo actualizado");
}

export async function eliminarVehiculo(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const clienteId = str(fd, "cliente_id");
  const { error } = await supabase.from("vehiculos").delete().eq("id", id);
  if (error) {
    backWith(
      `/vehiculos/${id}`,
      undefined,
      error.message.includes("foreign key")
        ? "No se puede borrar: el vehículo tiene services o trabajos registrados."
        : errorAmigable(error.message)
    );
  }
  revalidatePath("/");
  backWith(`/clientes/${clienteId}`, "Vehículo eliminado");
}
