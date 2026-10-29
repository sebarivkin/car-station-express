"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";
import { cambiarActivo, guardarArticulo } from "@/app/actions/articulos";
import { money } from "@/lib/format";
import type { Articulo } from "@/lib/types";

export default function ArticuloRow({ a }: { a: Articulo }) {
  const [editando, setEditando] = useState(false);
  const margen = a.precio > 0 ? ((a.precio - a.costo) / a.precio) * 100 : 0;

  if (editando) {
    return (
      <li className="bg-surface-2 p-4">
        <form action={guardarArticulo} className="grid gap-2 sm:grid-cols-[1fr_10rem_7rem_7rem_auto]">
          <input type="hidden" name="id" value={a.id} />
          <input name="nombre" defaultValue={a.nombre} required aria-label="Nombre" className="input" autoFocus />
          <input name="categoria" defaultValue={a.categoria ?? ""} list="categorias" aria-label="Categoría" className="input" />
          <input name="costo" defaultValue={String(a.costo).replace(".", ",")} inputMode="decimal" aria-label="Costo" className="input tabular text-right" />
          <input name="precio" defaultValue={String(a.precio).replace(".", ",")} inputMode="decimal" aria-label="Venta" className="input tabular text-right" />
          <div className="flex gap-2">
            <SubmitButton className="btn btn-primary btn-sm">Guardar</SubmitButton>
            <button type="button" onClick={() => setEditando(false)} className="btn btn-ghost btn-sm">
              Cancelar
            </button>
          </div>
        </form>
        <form action={cambiarActivo} className="mt-2">
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="activo" value={String(!a.activo)} />
          <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
            {a.activo ? "Desactivar (ya no se vende)" : "Volver a activar"}
          </SubmitButton>
        </form>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${a.activo ? "" : "opacity-55"}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{a.nombre}</p>
        <p className="text-xs text-muted">
          {a.categoria ?? "Sin categoría"}
          {!a.activo && " · inactivo"}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular font-extrabold">{money(a.precio)}</p>
        <p className="privado tabular text-xs text-muted">
          costo {money(a.costo)} · {Math.round(margen)}%
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
        aria-label={`Editar ${a.nombre}`}
      >
        <Pencil size={17} />
      </button>
    </li>
  );
}
