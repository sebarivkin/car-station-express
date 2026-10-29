"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { parseNum } from "@/lib/format";
import { guardarTrabajo, type Repuesto } from "@/app/actions/operaciones";
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
import { useVistaCliente } from "@/components/VistaCliente";

type Fila = {
  key: number;
  descripcion: string;
  proveedor: string;
  cantidad: string;
  costo: string;
  precio: string;
};

let seq = 0;

const filaVacia = (): Fila => ({ key: ++seq, descripcion: "", proveedor: "", cantidad: "1", costo: "", precio: "" });

export default function TrabajoForm({
  vehiculoId,
  proveedores,
  hoy,
  ultimoKm,
  inicial,
}: {
  vehiculoId: string;
  proveedores: string[];
  hoy: string;
  ultimoKm?: number | null;
  inicial?: {
    id: string;
    fecha: string;
    km: number | null;
    descripcion: string;
    mano_obra: number;
    notas: string | null;
    repuestos: Repuesto[];
  };
}) {
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy);
  const [km, setKm] = useState(inicial?.km ? String(inicial.km) : "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [manoObra, setManoObra] = useState(aTexto(inicial?.mano_obra));
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [filas, setFilas] = useState<Fila[]>(
    (inicial?.repuestos ?? []).map((r) => ({
      key: ++seq,
      descripcion: r.descripcion,
      proveedor: r.proveedor,
      cantidad: aTexto(r.cantidad) || "1",
      costo: aTexto(r.costo_unit),
      precio: aTexto(r.precio_unit),
    }))
  );
  const [cobro, setCobro] = useState<CobroState>({ estado: "completo", medio: "efectivo", parcial: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cliente = useVistaCliente();

  const t = useMemo(() => {
    const mo = parseNum(manoObra);
    let venta = 0;
    let costo = 0;
    for (const f of filas) {
      const c = parseNum(f.cantidad);
      venta += c * parseNum(f.precio);
      costo += c * parseNum(f.costo);
    }
    return { mo, venta, costo, total: mo + venta, utilidad: mo + venta - costo };
  }, [manoObra, filas]);

  function cambiar(key: number, campo: keyof Fila, valor: string) {
    setFilas((fs) => fs.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  function guardar() {
    setError(null);
    if (!descripcion.trim()) return setError("Describí el trabajo realizado.");
    if (filas.some((f) => !f.descripcion.trim() && (f.costo || f.precio)))
      return setError("Hay un repuesto con precio pero sin descripción.");
    start(async () => {
      const res = await guardarTrabajo({
        id: inicial?.id ?? null,
        vehiculo_id: vehiculoId,
        fecha,
        km: km ? Number(km) : null,
        descripcion,
        mano_obra: t.mo,
        notas,
        repuestos: filas.map((f) => ({
          descripcion: f.descripcion,
          proveedor: f.proveedor,
          cantidad: parseNum(f.cantidad),
          costo_unit: parseNum(f.costo),
          precio_unit: parseNum(f.precio),
        })),
        cobro: inicial ? null : cobroFinal(cobro, t.total),
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-5">
        <section className="card flex flex-col gap-4 p-5">
          <FechaKm fecha={fecha} km={km} onFecha={setFecha} onKm={setKm} ultimoKm={ultimoKm} />
          <label className="field">
            <span className="label">Trabajo realizado *</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cambio de pastillas y discos delanteros"
              className="input"
              autoFocus={!inicial}
            />
          </label>
          <label className="field sm:max-w-60">
            <span className="label">Mano de obra</span>
            <MoneyInput label="Mano de obra" value={manoObra} onChange={setManoObra} />
          </label>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Repuestos</h2>
            <button type="button" onClick={() => setFilas((fs) => [...fs, filaVacia()])} className="btn btn-secondary btn-sm">
              <Plus size={16} strokeWidth={2.6} />
              Agregar repuesto
            </button>
          </div>

          <datalist id="proveedores">
            {proveedores.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          {filas.length === 0 ? (
            <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-muted">Sin repuestos. Si el trabajo llevó repuestos, agregalos acá.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filas.map((f, i) => (
                <li key={f.key} className="grid gap-2 rounded-xl bg-surface-2 p-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr]">
                  <input
                    value={f.descripcion}
                    onChange={(e) => cambiar(f.key, "descripcion", e.target.value)}
                    placeholder="Repuesto"
                    aria-label="Repuesto"
                    className="input font-bold"
                    autoFocus={i === filas.length - 1 && !f.descripcion}
                  />
                  <input
                    value={f.proveedor}
                    onChange={(e) => cambiar(f.key, "proveedor", e.target.value)}
                    list="proveedores"
                    placeholder="Dónde se compró (opcional)"
                    aria-label="Proveedor"
                    className="input"
                  />
                  <div className={`grid items-end gap-2 sm:col-span-2 ${cliente ? "grid-cols-[4.5rem_1fr_2.5rem]" : "grid-cols-[4.5rem_1fr_1fr_2.5rem]"}`}>
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
                    <label className="privado field">
                      <span className="label">Costo unit.</span>
                      <MoneyInput label="Costo unitario" value={f.costo} onChange={(v) => cambiar(f.key, "costo", v)} />
                    </label>
                    <label className="field">
                      <span className="label">Venta unit.</span>
                      <MoneyInput label="Precio de venta unitario" value={f.precio} onChange={(v) => cambiar(f.key, "precio", v)} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFilas((fs) => fs.filter((x) => x.key !== f.key))}
                      className="grid h-11 w-10 place-items-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
                      aria-label="Quitar repuesto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <label className="field">
            <span className="label">Notas</span>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, trabajos pendientes…" className="input" />
          </label>
        </section>
      </div>

      <aside className="card flex flex-col gap-5 p-5 lg:sticky lg:top-8">
        <Resumen
          filas={[
            { label: "Mano de obra", value: t.mo },
            { label: "Repuestos (venta)", value: t.venta },
            { label: "Repuestos (costo)", value: t.costo, privado: true },
          ]}
          total={t.total}
          utilidad={t.utilidad}
        />
        {!inicial && <CobroFields value={cobro} onChange={setCobro} total={t.total} />}
        <FormError error={error} />
        <button type="button" onClick={guardar} disabled={pending} className="btn btn-primary !min-h-12 w-full text-base">
          {pending ? "Guardando…" : inicial ? "Guardar cambios" : "Guardar trabajo"}
        </button>
      </aside>
    </div>
  );
}
