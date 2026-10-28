import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { desbloqueado } from "@/lib/llave";

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export type DB = Awaited<ReturnType<typeof createClient>>;

/** Usuario logueado y si su mail está en la lista de permitidos. */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: permitido }, abierto] = await Promise.all([supabase.rpc("is_allowed"), desbloqueado(user.id)]);
  return { supabase, user, permitido: Boolean(permitido), desbloqueado: abierto };
}

/** Cliente de Supabase con sesión válida y la gestión desbloqueada con la clave
 *  (para páginas y server actions de la gestión). */
export async function db(): Promise<DB> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await desbloqueado(user.id))) redirect("/bloqueo");
  return supabase;
}

/** Trae todas las filas paginando (PostgREST corta en 1000). */
export async function fetchAll<T>(
  build: (
    from: number,
    to: number
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const res = await build(from, from + size - 1);
    if (res.error) throw new Error(res.error.message);
    const data = res.data as T[] | null;
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}
