import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { desbloqueado } from "@/lib/llave";
import PresupuestoPdf from "@/lib/pdf/PresupuestoPdf";
import { numeros, type ItemPresupuesto, type Negocio, type Presupuesto } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await desbloqueado(user.id))) return new NextResponse("No autorizado", { status: 401 });

  const [{ data: p }, { data: items }, { data: negocio }] = await Promise.all([
    supabase.from("presupuestos_totales").select("*").eq("id", id).maybeSingle(),
    supabase.from("presupuesto_items").select("*").eq("presupuesto_id", id).order("orden"),
    supabase.from("negocio").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (!p) return new NextResponse("Presupuesto no encontrado", { status: 404 });

  // El logo se pide al propio sitio: funciona igual en la PC y en Vercel
  let logo: Buffer | null = null;
  try {
    const res = await fetch(new URL("/logo.png", request.url));
    if (res.ok) logo = Buffer.from(await res.arrayBuffer());
  } catch {
    logo = null;
  }

  const pres = numeros(p as Presupuesto);
  const doc = createElement(PresupuestoPdf, {
    p: pres,
    items: (items ?? []).map((i) => numeros(i as ItemPresupuesto)),
    negocio: (negocio as Negocio | null) ?? { nombre: "Car Station Express", telefono: null, direccion: null, email: null, pie_presupuesto: null },
    logo,
  }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);

  const nombre = `Presupuesto-${String(pres.numero).padStart(4, "0")}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
