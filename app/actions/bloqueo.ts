"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/auth";
import { backWith, str } from "@/lib/back";
import { crearLlave, LLAVE_COOKIE } from "@/lib/llave";

/** Clave de gestión → abre la gestión; clave de agenda → abre la agenda; otra → error */
export async function verificarPin(pin: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!/^\d{4}$/.test(pin)) return { error: "Clave incorrecta" };

  const { data, error } = await supabase.rpc("verificar_pin", { p_pin: pin });
  if (error) {
    if (error.message.includes("Demasiados")) return { error: "Demasiados intentos. Esperá 5 minutos." };
    if (error.message.includes("configuradas")) return { error: "Las claves todavía no están configuradas." };
    return { error: "No se pudo verificar la clave. Probá de nuevo." };
  }

  const jar = await cookies();
  if (data === "gestion") {
    const llave = crearLlave(user.id);
    jar.set(LLAVE_COOKIE, llave.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: llave.maxAge,
    });
    redirect("/");
  }
  jar.delete(LLAVE_COOKIE);
  if (data === "agenda") redirect("/agenda");
  return { error: "Clave incorrecta" };
}

export async function bloquear() {
  (await cookies()).delete(LLAVE_COOKIE);
  redirect("/bloqueo");
}

export async function cambiarClaves(fd: FormData) {
  const supabase = await db();
  const gestion = str(fd, "gestion");
  if (gestion !== str(fd, "gestion2")) backWith("/claves", undefined, "La nueva clave de gestión no coincide en los dos campos.");

  const { error } = await supabase.rpc("cambiar_claves", {
    p_actual: str(fd, "actual"),
    p_gestion: gestion,
    p_agenda: str(fd, "agenda"),
  });
  if (error) backWith("/claves", undefined, error.message);
  backWith("/claves", "Claves actualizadas");
}
