"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/auth";
import { backWith, errorAmigable, str, strOrNull } from "@/lib/back";
import { parseNum } from "@/lib/format";

const VOLVER = "/articulos";

export async function guardarArticulo(fd: FormData) {
  const supabase = await db();
  const id = str(fd, "id");
  const datos = {
    nombre: str(fd, "nombre"),
    categoria: strOrNull(fd, "categoria"),
    costo: parseNum(fd.get("costo")),
    precio: parseNum(fd.get("precio")),
  };
  if (!datos.nombre) backWith(VOLVER, undefined, "El artículo necesita un nombre.");

  const { error } = id
    ? await supabase.from("articulos").update(datos).eq("id", id)
    : await supabase.from("articulos").insert(datos);
  if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  revalidatePath(VOLVER);
  backWith(VOLVER, id ? "Artículo actualizado" : "Artículo agregado");
}

export async function cambiarActivo(fd: FormData) {
  const supabase = await db();
  const { error } = await supabase
    .from("articulos")
    .update({ activo: str(fd, "activo") === "true" })
    .eq("id", str(fd, "id"));
  if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  revalidatePath(VOLVER);
  backWith(VOLVER);
}

export async function ajustarPrecios(fd: FormData) {
  const supabase = await db();
  const pct = parseNum(fd.get("pct"));
  if (!pct || pct <= -100) backWith(VOLVER, undefined, "Ingresá un porcentaje válido (ej. 8 o -5).");
  const { data, error } = await supabase.rpc("ajustar_precios", {
    p_pct: pct,
    p_campo: str(fd, "campo") || "ambos",
    p_categoria: strOrNull(fd, "categoria"),
  });
  if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  revalidatePath(VOLVER);
  backWith(VOLVER, `Se actualizaron ${data} artículos (${pct > 0 ? "+" : ""}${pct}%)`);
}

// ---------- Importación desde Excel / CSV ----------

type Fila = { nombre: string; categoria: string | null; costo: number; precio: number };

function normalizarEncabezado(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Detecta qué columna es cuál por el título */
function mapearColumnas(encabezados: string[]) {
  const idx = (pruebas: RegExp[]) => encabezados.findIndex((h) => pruebas.some((p) => p.test(h)));
  return {
    nombre: idx([/^(articulo|nombre|producto|descripcion|detalle)/]),
    categoria: idx([/^(categoria|rubro|tipo|marca)/]),
    costo: idx([/costo/, /compra/]),
    precio: idx([/venta/, /^precio$/, /^pvp/, /publico/]),
  };
}

function celdaTexto(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { result?: unknown; text?: string; richText?: { text: string }[] };
    if (o.result != null) return String(o.result);
    if (o.text) return o.text;
    if (o.richText) return o.richText.map((r) => r.text).join("");
  }
  return String(v);
}

function parseCsv(texto: string): string[][] {
  const sep = (texto.split("\n")[0].match(/;/g)?.length ?? 0) > (texto.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) {
      fila.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else campo += ch;
  }
  if (campo || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c.trim()));
}

async function leerArchivo(file: File): Promise<string[][]> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    return parseCsv(buf.toString("utf8").replace(/^﻿/, ""));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const out: string[][] = [];
  ws?.eachRow({ includeEmpty: false }, (row) => {
    const vals = (row.values as unknown[]).slice(1).map(celdaTexto);
    out.push(vals);
  });
  return out;
}

export async function importarArticulos(fd: FormData) {
  const supabase = await db();
  const file = fd.get("archivo");
  if (!(file instanceof File) || file.size === 0) backWith(VOLVER, undefined, "Elegí un archivo .xlsx o .csv.");
  if (file.size > 5_000_000) backWith(VOLVER, undefined, "El archivo es demasiado grande (máx. 5 MB).");

  let filas: string[][];
  try {
    filas = await leerArchivo(file);
  } catch {
    backWith(VOLVER, undefined, "No se pudo leer el archivo. Guardalo como .xlsx o .csv y probá de nuevo.");
  }

  // Busca la fila de encabezados entre las primeras 10
  let hIdx = -1;
  let cols = { nombre: -1, categoria: -1, costo: -1, precio: -1 };
  for (let i = 0; i < Math.min(filas.length, 10); i++) {
    const c = mapearColumnas(filas[i].map(normalizarEncabezado));
    if (c.nombre >= 0 && (c.precio >= 0 || c.costo >= 0)) {
      hIdx = i;
      cols = c;
      break;
    }
  }
  if (hIdx < 0) {
    backWith(VOLVER, undefined, 'No encontré los encabezados. La primera fila debe decir "Artículo", "Costo" y "Venta".');
  }

  const porNombre = new Map<string, Fila>();
  for (const f of filas.slice(hIdx + 1)) {
    const nombre = (f[cols.nombre] ?? "").trim();
    if (!nombre) continue;
    porNombre.set(nombre.toLowerCase(), {
      nombre,
      categoria: cols.categoria >= 0 ? (f[cols.categoria] ?? "").trim() || null : null,
      costo: cols.costo >= 0 ? parseNum(f[cols.costo]) : 0,
      precio: cols.precio >= 0 ? parseNum(f[cols.precio]) : 0,
    });
  }
  if (porNombre.size === 0) backWith(VOLVER, undefined, "El archivo no tiene artículos debajo de los encabezados.");

  // Actualiza los que ya existen (mismo nombre) y crea el resto
  const { data: existentes } = await supabase.from("articulos").select("id, nombre").limit(10000);
  const ids = new Map((existentes ?? []).map((a) => [String(a.nombre).toLowerCase(), a.id as string]));
  const nuevos: Fila[] = [];
  let actualizados = 0;
  for (const [clave, fila] of porNombre) {
    const id = ids.get(clave);
    if (id) {
      const { error } = await supabase.from("articulos").update({ ...fila, activo: true }).eq("id", id);
      if (error) backWith(VOLVER, undefined, `Error en "${fila.nombre}": ${errorAmigable(error.message)}`);
      actualizados++;
    } else nuevos.push(fila);
  }
  for (let i = 0; i < nuevos.length; i += 500) {
    const { error } = await supabase.from("articulos").insert(nuevos.slice(i, i + 500));
    if (error) backWith(VOLVER, undefined, errorAmigable(error.message));
  }

  revalidatePath(VOLVER);
  backWith(VOLVER, `Importación lista: ${nuevos.length} nuevos y ${actualizados} actualizados.`);
}
