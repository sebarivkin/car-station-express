"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { money, parseNum } from "@/lib/format";
import type { Articulo } from "@/lib/types";
import { guardarService, type ItemService } from "@/app/actions/operaciones";
import {
  aTexto,
  CobroFields,
  cobroFinal,
  FechaKm,
  FormError,
  MoneyInput,
  Resumen,
  type CobroState,
} from "@/components/forms/shared";

type Fila = {
  key: number;
  articulo_id: string | null;
  descripcion: string;
  cantidad: string;
  costo: string;
  precio: string;
};

let seq = 0;

export default function ServiceForm({
  vehiculoId,
  articulos,
  hoy,
  ultimoKm,
  inicial,
}: {
  vehiculoId: string;
  articulos: Articulo[];
  hoy: string;
  ultimoKm?: number | null;
  inicial?: { id: string; fecha: string; km: number | null; notas: string | null; items: ItemService[] };
}) {
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy);
  const [km, setKm] = useState(inicial?.km ? String(inicial.km) : "");
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [filas, setFilas] = useState<Fila[]>(
    (inicial?.items ?? []).map((i) => ({
      key: ++seq,
      articulo_id: i.articulo_id,
      descripcion: i.descripcion,
      cantidad: aTexto(i.cantidad) || "1",
      costo: aTexto(i.costo_unit),
      precio: aTexto(i.precio_unit),
    }))
  );
  const [cobro, setCobro] = useState<CobroState>({ estado: "completo", medio: "efectivo", parcial: "" });
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const buscadorRef = useRef<HTMLInputElement>(null);

  const sugerencias = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    const palabras = t.split(/\s+/).filter(Boolean);
    const lista = palabras.length
      ? articulos.filter((a) => {
          const txt = `${a.nombre} ${a.categoria ?? ""}`.toLowerCase();
          return palabras.every((p) => txt.includes(p));
        })
      : articulos;
    return lista.slice(0, 8);
  }, [busqueda, articulos]);

  const totales = useMemo(() => {
    let total = 0;
    let costo = 0;
    for (const f of filas) {
      const c = parseNum(f.cantidad);
      total += c * parseNum(f.precio);
      costo += c * parseNum(f.costo);
    }
    return { total, costo, utilidad: total - costo };
  }, [filas]);

  function agregar(a: Articulo | null) {
    setFilas((fs) => [
      ...fs,
      {
        key: ++seq,
        articulo_id: a?.id ?? null,
        descripcion: a?.nombre ?? busqueda.trim(),
        cantidad: "1",
        costo: a ? aTexto(a.costo) : "",
        precio: a ? aTexto(a.precio) : "",
      },
    ]);
    setBusqueda("");
    setAbierto(false);
    buscadorRef.current?.focus();
  }

  function cambiar(key: number, campo: keyof Fila, valor: string) {
    setFilas((fs) => fs.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  function guardar() {
    setError(null);
    if (filas.length === 0) return setError("Agregá al menos un artículo.");
    if (filas.some((f) => !f.descripcion.trim())) return setError("Hay un renglón sin descripción.");
    start(async () => {
      const res = await guardarService({
        id: inicial?.id ?? null,
        vehiculo_id: vehiculoId,
        fecha,
        km: km ? Number(km) : null,
        notas,
        items: filas.map((f) => ({
          articulo_id: f.articulo_id,
          descripcion: f.descripcion,
          cantidad: parseNum(f.cantidad),
          costo_unit: parseNum(f.costo),
          precio_unit: parseNum(f.precio),
        })),
        cobro: inicial ? null : cobroFinal(cobro, totales.total),
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-5">
        <section className="card p-5">
          <FechaKm fecha={fecha} km={km} onFecha={setFecha} onKm={setKm} ultimoKm={ultimoKm} />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-extrabold">Artículos usados</h2>

          <div className="relative">
            <Search size={19} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <input
              ref={buscadorRef}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setAbierto(true);
              }}
              onFocus={() => setAbierto(true)}
              onBlur={() => setTimeout(() => setAbierto(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (sugerencias[0]) agregar(sugerencias[0]);
                  else if (busqueda.trim()) agregar(null);
                }
                if (e.key === "Escape") setAbierto(false);
              }}
              placeholder={articulos.length ? "Buscar artículo (aceite, filtro…)" : "Escribí el artículo y Enter"}
              aria-label="Buscar artículo"
              className="input !pl-11"
              autoComplete="off"
            />
            {abierto && (sugerencias.length > 0 || busqueda.trim()) && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-auto rounded-xl bg-surface p-1.5 shadow-card ring-1 ring-line">
                {sugerencias.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => agregar(a)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{a.nombre}</span>
                        {a.categoria && <span className="text-xs text-muted">{a.categoria}</span>}
                      </span>
                      <span className="tabular font-extrabold">{money(a.precio)}</span>
                    </button>
                  </li>
                ))}
                {busqueda.trim() && (
                  <li>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => agregar(null)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-bold text-brand hover:bg-surface-2"
                    >
                      <Plus size={17} />
                      Agregar &quot;{busqueda.trim()}&quot; sin catálogo
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>

          {filas.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-2 px-4 py-6 text-center text-muted">
              Buscá y tocá un artículo para sumarlo al service.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              <li className="hidden grid-cols-[1fr_5rem_8rem_8rem_2.5rem] gap-2 px-1 text-xs font-extrabold text-muted md:grid">
                <span>Artículo</span>
                <span className="text-right">Cant.</span>
                <span className="text-right">Costo unit.</span>
                <span className="text-right">Venta unit.</span>
                <span />
              </li>
              {filas.map((f) => (
                <li
                  key={f.key}
                  className="grid grid-cols-[1fr_2.5rem] gap-2 rounded-xl bg-surface-2 p-3 md:grid-cols-[1fr_5rem_8rem_8rem_2.5rem] md:items-center md:bg-transparent md:p-0"
                >
                  <input
                    value={f.descripcion}
                    onChange={(e) => cambiar(f.key, "descripcion", e.target.value)}
                    aria-label="Descripción"
                    className="input font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setFilas((fs) => fs.filter((x) => x.key !== f.key))}
                    className="grid h-11 w-10 place-items-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand md:order-last"
                    aria-label={`Quitar ${f.descripcion}`}
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="col-span-2 grid grid-cols-3 gap-2 md:contents">
                    <label className="field md:block">
                      <span className="label md:sr-only">Cant.</span>
                      <input
                        value={f.cantidad}
                        onChange={(e) => cambiar(f.key, "cantidad", e.target.value)}
                        inputMode="decimal"
                        onFocus={(e) => e.target.select()}
                        className="input tabular text-right"
                      />
                    </label>
                    <label className="field md:block">
                      <span className="label md:sr-only">Costo</span>
                      <MoneyInput label="Costo unitario" value={f.costo} onChange={(v) => cambiar(f.key, "costo", v)} />
                    </label>
                    <label className="field md:block">
                      <span className="label md:sr-only">Venta</span>
                      <MoneyInput label="Precio de venta unitario" value={f.precio} onChange={(v) => cambiar(f.key, "precio", v)} />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <label className="field">
            <span className="label">Notas</span>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Próximo cambio, observaciones…" className="input" />
          </label>
        </section>
      </div>

      <aside className="card flex flex-col gap-5 p-5 lg:sticky lg:top-8">
        <Resumen filas={[{ label: "Costo", value: totales.costo }]} total={totales.total} utilidad={totales.utilidad} />
        {!inicial && <CobroFields value={cobro} onChange={setCobro} total={totales.total} />}
        <FormError error={error} />
        <button type="button" onClick={guardar} disabled={pending} className="btn btn-primary !min-h-12 w-full text-base">
          {pending ? "Guardando…" : inicial ? "Guardar cambios" : "Guardar service"}
        </button>
      </aside>
    </div>
  );
}
