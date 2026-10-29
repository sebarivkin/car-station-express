"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { money, parseNum } from "@/lib/format";
import type { Articulo, ItemPresupuesto, TipoItemPresupuesto } from "@/lib/types";
import { guardarPresupuesto } from "@/app/actions/presupuestos";
import { aTexto, FormError, MoneyInput } from "@/components/forms/shared";
import { useVistaCliente } from "@/components/VistaCliente";

type Fila = {
  key: number;
  tipo: TipoItemPresupuesto;
  descripcion: string;
  cantidad: string;
  costo: string;
  precio: string;
};

let seq = 0;
const nueva = (tipo: TipoItemPresupuesto): Fila => ({ key: ++seq, tipo, descripcion: "", cantidad: "1", costo: "", precio: "" });

export type DatosPresupuesto = {
  id: string | null;
  vehiculo_id: string | null;
  fecha: string;
  validez_dias: number;
  cliente_nombre: string;
  cliente_telefono: string;
  vehiculo_texto: string;
  patente: string;
  notas: string;
  items: ItemPresupuesto[];
};

export default function PresupuestoForm({ inicial, articulos }: { inicial: DatosPresupuesto; articulos: Articulo[] }) {
  const [d, setD] = useState({
    fecha: inicial.fecha,
    validez: String(inicial.validez_dias),
    cliente_nombre: inicial.cliente_nombre,
    cliente_telefono: inicial.cliente_telefono,
    vehiculo_texto: inicial.vehiculo_texto,
    patente: inicial.patente,
    notas: inicial.notas,
  });
  const [filas, setFilas] = useState<Fila[]>(() => {
    const desde = inicial.items.map((i) => ({
      key: ++seq,
      tipo: i.tipo,
      descripcion: i.descripcion,
      cantidad: aTexto(i.cantidad) || "1",
      costo: aTexto(i.costo_unit),
      precio: aTexto(i.precio_unit),
    }));
    return desde.length ? desde : [nueva("mano_obra")];
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cliente = useVistaCliente();
  const porNombre = useMemo(() => new Map(articulos.map((a) => [a.nombre.toLowerCase(), a])), [articulos]);

  const t = useMemo(() => {
    let mo = 0;
    let rep = 0;
    let costo = 0;
    for (const f of filas) {
      const sub = parseNum(f.cantidad) * parseNum(f.precio);
      if (f.tipo === "mano_obra") mo += sub;
      else rep += sub;
      costo += parseNum(f.cantidad) * parseNum(f.costo);
    }
    return { mo, rep, total: mo + rep, ganancia: mo + rep - costo };
  }, [filas]);

  const set = (campo: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((x) => ({ ...x, [campo]: e.target.value }));

  function cambiar(key: number, campo: keyof Fila, valor: string) {
    setFilas((fs) =>
      fs.map((f) => {
        if (f.key !== key) return f;
        const n = { ...f, [campo]: valor };
        // Si eligió un artículo del catálogo, completa costo y precio
        if (campo === "descripcion") {
          const a = porNombre.get(valor.toLowerCase());
          if (a && !f.precio) {
            n.precio = aTexto(a.precio);
            n.costo = aTexto(a.costo);
          }
        }
        return n;
      })
    );
  }

  function guardar() {
    setError(null);
    start(async () => {
      const res = await guardarPresupuesto({
        id: inicial.id,
        vehiculo_id: inicial.vehiculo_id,
        fecha: d.fecha,
        validez_dias: Number(d.validez) || 15,
        cliente_nombre: d.cliente_nombre,
        cliente_telefono: d.cliente_telefono,
        vehiculo_texto: d.vehiculo_texto,
        patente: d.patente,
        notas: d.notas,
        items: filas.map((f) => ({
          tipo: f.tipo,
          descripcion: f.descripcion,
          cantidad: parseNum(f.cantidad),
          costo_unit: parseNum(f.costo),
          precio_unit: parseNum(f.precio),
        })),
      });
      if (res?.error) setError(res.error);
    });
  }

  const seccion = (tipo: TipoItemPresupuesto) => {
    const lista = filas.filter((f) => f.tipo === tipo);
    const esRep = tipo === "repuesto";
    const cols = esRep
      ? cliente
        ? "grid-cols-[4.5rem_1fr_2.5rem]"
        : "grid-cols-[4.5rem_1fr_1fr_2.5rem]"
      : "grid-cols-[1fr_2.5rem]";
    return (
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{esRep ? "Repuestos y artículos" : "Mano de obra"}</h2>
          <button type="button" onClick={() => setFilas((fs) => [...fs, nueva(tipo)])} className="btn btn-secondary btn-sm">
            <Plus size={16} strokeWidth={2.6} />
            Agregar
          </button>
        </div>
        {lista.length === 0 ? (
          <p className="rounded-xl bg-surface-2 px-4 py-5 text-center text-muted">
            {esRep ? "Sin repuestos." : "Sin mano de obra."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lista.map((f) => (
              <li key={f.key} className="grid gap-2 rounded-xl bg-surface-2 p-3">
                <input
                  value={f.descripcion}
                  onChange={(e) => cambiar(f.key, "descripcion", e.target.value)}
                  list={esRep ? "catalogo" : undefined}
                  placeholder={esRep ? "Repuesto o artículo" : "Trabajo a realizar"}
                  aria-label="Descripción"
                  className="input font-bold"
                />
                <div className={`grid items-end gap-2 ${cols}`}>
                  {esRep && (
                    <label className="field">
                      <span className="label">Cant.</span>
                      <input
                        value={f.cantidad}
                        onChange={(e) => cambiar(f.key, "cantidad", e.target.value)}
                        inputMode="decimal"
                        onFocus={(e) => e.target.select()}
                        className="input tabular text-right"
                      />
                    </label>
                  )}
                  {esRep && (
                    <label className="privado field">
                      <span className="label">Costo unit.</span>
                      <MoneyInput label="Costo unitario" value={f.costo} onChange={(v) => cambiar(f.key, "costo", v)} />
                    </label>
                  )}
                  <label className="field">
                    <span className="label">{esRep ? "Precio unit." : "Importe"}</span>
                    <MoneyInput label="Precio" value={f.precio} onChange={(v) => cambiar(f.key, "precio", v)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFilas((fs) => fs.filter((x) => x.key !== f.key))}
                    className="grid h-11 w-10 place-items-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
                    aria-label="Quitar renglón"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-5">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            <span className="label">Cliente *</span>
            <input value={d.cliente_nombre} onChange={set("cliente_nombre")} className="input" autoFocus={!inicial.cliente_nombre} />
          </label>
          <label className="field">
            <span className="label">Teléfono</span>
            <input value={d.cliente_telefono} onChange={set("cliente_telefono")} type="tel" className="input" />
          </label>
          <label className="field">
            <span className="label">Patente</span>
            <input value={d.patente} onChange={set("patente")} className="input font-black tracking-wider uppercase" />
          </label>
          <label className="field sm:col-span-2">
            <span className="label">Vehículo</span>
            <input value={d.vehiculo_texto} onChange={set("vehiculo_texto")} placeholder="Marca, modelo y año" className="input" />
          </label>
          <label className="field">
            <span className="label">Fecha</span>
            <input type="date" value={d.fecha} onChange={set("fecha")} className="input tabular" />
          </label>
          <label className="field">
            <span className="label">Validez (días)</span>
            <input value={d.validez} onChange={set("validez")} inputMode="numeric" className="input tabular" />
          </label>
        </section>

        {seccion("mano_obra")}
        {seccion("repuesto")}

        <datalist id="catalogo">
          {articulos.map((a) => (
            <option key={a.id} value={a.nombre} />
          ))}
        </datalist>

        <section className="card p-5">
          <label className="field">
            <span className="label">Observaciones (salen en el PDF)</span>
            <textarea value={d.notas} onChange={set("notas")} placeholder="Tiempo estimado, garantía, forma de pago…" className="input" />
          </label>
        </section>
      </div>

      <aside className="card flex flex-col gap-4 p-5 lg:sticky lg:top-8">
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Mano de obra</dt>
            <dd className="tabular font-bold">{money(t.mo)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Repuestos</dt>
            <dd className="tabular font-bold">{money(t.rep)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-extrabold">Total</dt>
            <dd className="tabular text-3xl font-black">{money(t.total)}</dd>
          </div>
          <div className="privado flex justify-between text-sm">
            <dt className="text-muted">Ganancia</dt>
            <dd className="tabular font-extrabold text-ok">{money(t.ganancia)}</dd>
          </div>
        </dl>
        <FormError error={error} />
        <button type="button" onClick={guardar} disabled={pending} className="btn btn-primary !min-h-12 w-full text-base">
          {pending ? "Guardando…" : inicial.id ? "Guardar cambios" : "Guardar presupuesto"}
        </button>
      </aside>
    </div>
  );
}
