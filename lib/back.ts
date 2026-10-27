import { redirect } from "next/navigation";

/** Redirige a `path` con un mensaje ?ok= o ?error= para mostrar con <Flash>. */
export function backWith(path: string, ok?: string, error?: string): never {
  const params = new URLSearchParams();
  if (ok) params.set("ok", ok);
  if (error) params.set("error", error);
  const qs = params.toString();
  redirect(qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path);
}

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function strOrNull(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}

/** Traduce errores comunes de Postgres a algo entendible */
export function errorAmigable(msg: string): string {
  if (msg.includes("vehiculos_patente_key")) return "Ya existe un vehículo con esa patente.";
  if (msg.includes("articulos_nombre_uq")) return "Ya existe un artículo con ese nombre.";
  if (msg.includes("proveedores_nombre_uq")) return "Ya existe un proveedor con ese nombre.";
  if (msg.includes("violates foreign key")) return "No se puede borrar: tiene registros asociados.";
  if (msg.includes("row-level security")) return "Tu cuenta no tiene permiso para esta acción.";
  return msg;
}
