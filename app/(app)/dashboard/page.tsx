import Link from "next/link";
import BarrasDiarias, { type Punto } from "@/components/BarrasDiarias";
import { PageHeader, Stat } from "@/components/ui";
import { db, fetchAll } from "@/lib/auth";
import { diasEntre, PERIODOS, rangoPeriodo, type Periodo } from "@/lib/fechas";
import { fecha, money, nombreMes, num, pct } from "@/lib/format";
import { MEDIOS, type Operacion } from "@/lib/types";

type OpLite = Pick<
  Operacion,
  "tipo" | "fecha" | "total" | "costo" | "mano_obra" | "repuestos_venta" | "repuestos_costo" | "saldo"
>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (PERIODOS.some((x) => x.value === sp.p) ? sp.p : "mes") as Periodo;
  const { desde, hasta } = rangoPeriodo(periodo, sp.desde, sp.hasta);
  const supabase = await db();

  const [ops, pagos, items, adelantos, deudaRows, empleados] = await Promise.all([
    fetchAll<OpLite>((f, t) =>
      supabase
        .from("operaciones")
        .select("tipo, fecha, total, costo, mano_obra, repuestos_venta, repuestos_costo, saldo")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .range(f, t)
    ),
    fetchAll<{ monto: number; medio: string }>((f, t) =>
      supabase.from("pagos").select("monto, medio").gte("fecha", desde).lte("fecha", hasta).range(f, t)
    ),
    fetchAll<{ descripcion: string; cantidad: number; costo_unit: number; precio_unit: number }>((f, t) =>
      supabase
        .from("service_items")
        .select("descripcion, cantidad, costo_unit, precio_unit, services!inner(fecha)")
        .gte("services.fecha", desde)
        .lte("services.fecha", hasta)
        .range(f, t)
    ),
    fetchAll<{ empleado_id: string; monto: number }>((f, t) =>
      supabase.from("adelantos").select("empleado_id, monto").gte("fecha", desde).lte("fecha", hasta).range(f, t)
    ),
    fetchAll<{ saldo: number }>((f, t) => supabase.from("operaciones").select("saldo").gt("saldo", 0).range(f, t)),
    supabase.from("empleados").select("id, nombre").order("nombre"),
  ]);

  const n = (v: unknown) => Number(v ?? 0);
  const lub = ops.filter((o) => o.tipo === "service");
  const tal = ops.filter((o) => o.tipo === "taller");
  const suma = (arr: OpLite[], k: keyof OpLite) => arr.reduce((s, o) => s + n(o[k]), 0);

  const L = { n: lub.length, venta: suma(lub, "total"), costo: suma(lub, "costo") };
  const T = {
    n: tal.length,
    mo: suma(tal, "mano_obra"),
    repVenta: suma(tal, "repuestos_venta"),
    repCosto: suma(tal, "repuestos_costo"),
  };
  const facturacion = L.venta + T.mo + T.repVenta;
  const costo = L.costo + T.repCosto;
  const utilidad = facturacion - costo;
  const cobrado = pagos.reduce((s, p) => s + n(p.monto), 0);
  const pendientePeriodo = suma(ops, "saldo");
  const deudaTotal = deudaRows.reduce((s, r) => s + n(r.saldo), 0);
  const totalAdelantos = adelantos.reduce((s, a) => s + n(a.monto), 0);
  const margen = (u: number, v: number) => (v > 0 ? pct((u / v) * 100) : "—");

  // Serie temporal: por día, o por mes si el rango es largo
  const dias = diasEntre(desde, hasta);
  const porMes = dias.length > 62;
  const mapa = new Map<string, Punto>();
  for (const d of dias) {
    const clave = porMes ? d.slice(0, 7) : d;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        clave,
        etiqueta: porMes ? nombreMes(clave).slice(0, 3) : fecha(d).slice(0, 5),
        lub: 0,
        taller: 0,
      });
    }
  }
  for (const o of ops) {
    const p = mapa.get(porMes ? o.fecha.slice(0, 7) : o.fecha);
    if (p) p[o.tipo === "service" ? "lub" : "taller"] += n(o.total);
  }
  const serie = [...mapa.values()];

  // Artículos más usados
  const arts = new Map<string, { nombre: string; cant: number; venta: number; util: number }>();
  for (const i of items) {
    const k = i.descripcion.toLowerCase();
    const a = arts.get(k) ?? { nombre: i.descripcion, cant: 0, venta: 0, util: 0 };
    a.cant += n(i.cantidad);
    a.venta += n(i.cantidad) * n(i.precio_unit);
    a.util += n(i.cantidad) * (n(i.precio_unit) - n(i.costo_unit));
    arts.set(k, a);
  }
  const top = [...arts.values()].sort((a, b) => b.venta - a.venta).slice(0, 8);

  const medios = MEDIOS.map((m) => ({
    ...m,
    monto: pagos.filter((p) => p.medio === m.value).reduce((s, p) => s + n(p.monto), 0),
  }));

  const rangoTexto = desde === hasta ? fecha(desde) : `${fecha(desde)} al ${fecha(hasta)}`;

  return (
    <>
      <PageHeader title="Resumen" />

      <div className="mb-6 flex flex-col gap-3">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Período">
          {PERIODOS.filter((x) => x.value !== "rango").map((x) => (
            <Link
              key={x.value}
              href={`/dashboard?p=${x.value}`}
              aria-current={periodo === x.value ? "page" : undefined}
              className={`btn btn-sm shrink-0 ${periodo === x.value ? "btn-primary" : "btn-secondary"}`}
            >
              {x.label}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="p" value="rango" />
          <label className="field">
            <span className="label">Desde</span>
            <input type="date" name="desde" defaultValue={desde} className="input tabular !min-h-10" />
          </label>
          <label className="field">
            <span className="label">Hasta</span>
            <input type="date" name="hasta" defaultValue={hasta} className="input tabular !min-h-10" />
          </label>
          <button className={`btn btn-sm !min-h-10 ${periodo === "rango" ? "btn-primary" : "btn-secondary"}`}>Ver rango</button>
          <span className="pb-2 text-sm font-semibold text-muted">{rangoTexto}</span>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Facturación" value={money(facturacion)} sub={`${ops.length} trabajos · ticket ${money(ops.length ? facturacion / ops.length : 0)}`} />
        <Stat label="Utilidad" value={money(utilidad)} tone="ok" sub={`Margen ${margen(utilidad, facturacion)}`} />
        <Stat label="Cobrado en el período" value={money(cobrado)} sub={pendientePeriodo > 0 ? `${money(pendientePeriodo)} sin cobrar` : "Todo cobrado"} />
        <Stat
          label="Deuda total de clientes"
          value={money(deudaTotal)}
          tone={deudaTotal > 0 ? "warn" : undefined}
          sub={
            <Link href="/deudas" className="font-bold underline">
              Ver deudas
            </Link>
          }
        />
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-3 text-lg font-extrabold">Facturación {porMes ? "por mes" : "por día"}</h2>
        {ops.length === 0 ? (
          <p className="py-8 text-center text-muted">No hay trabajos en este período.</p>
        ) : (
          <BarrasDiarias datos={serie} />
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
            <span className="h-3 w-3 rounded-[3px] bg-[var(--chart-1)]" />
            Lubricentro
          </h2>
          <dl className="flex flex-col gap-2">
            <Fila label="Services" value={num(L.n)} />
            <Fila label="Venta de artículos" value={money(L.venta)} />
            <Fila label="Costo de artículos" value={money(L.costo)} />
            <Fila label="Utilidad" value={`${money(L.venta - L.costo)} · ${margen(L.venta - L.costo, L.venta)}`} fuerte />
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
            <span className="h-3 w-3 rounded-[3px] bg-[var(--chart-2)]" />
            Taller mecánico
          </h2>
          <dl className="flex flex-col gap-2">
            <Fila label="Trabajos" value={num(T.n)} />
            <Fila label="Mano de obra" value={money(T.mo)} />
            <Fila label="Repuestos: venta / costo" value={`${money(T.repVenta)} / ${money(T.repCosto)}`} />
            <Fila label="Ganancia en repuestos" value={money(T.repVenta - T.repCosto)} />
            <Fila
              label="Utilidad"
              value={`${money(T.mo + T.repVenta - T.repCosto)} · ${margen(T.mo + T.repVenta - T.repCosto, T.mo + T.repVenta)}`}
              fuerte
            />
          </dl>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 text-lg font-extrabold">Artículos más vendidos</h2>
          {top.length === 0 ? (
            <p className="px-5 pt-2 pb-5 text-muted">Sin services en el período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table mt-2 min-w-[26rem]">
                <thead>
                  <tr>
                    <th className="!pl-5">Artículo</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">Venta</th>
                    <th className="!pr-5 text-right">Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((a) => (
                    <tr key={a.nombre}>
                      <td className="!pl-5 font-bold">{a.nombre}</td>
                      <td className="tabular text-right">{num(a.cant)}</td>
                      <td className="tabular text-right">{money(a.venta)}</td>
                      <td className="tabular !pr-5 text-right text-muted">{money(a.util)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-extrabold">Cobros por medio</h2>
            <dl className="flex flex-col gap-2">
              {medios.map((m) => (
                <Fila key={m.value} label={m.label} value={money(m.monto)} />
              ))}
              <Fila label="Total cobrado" value={money(cobrado)} fuerte />
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-extrabold">Adelantos de sueldo</h2>
            <dl className="flex flex-col gap-2">
              {(empleados.data ?? []).map((e) => (
                <Fila
                  key={e.id}
                  label={e.nombre}
                  value={money(adelantos.filter((a) => a.empleado_id === e.id).reduce((s, a) => s + n(a.monto), 0))}
                />
              ))}
              <Fila label="Total" value={money(totalAdelantos)} fuerte />
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

function Fila({ label, value, fuerte }: { label: string; value: string; fuerte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${fuerte ? "mt-1 border-t border-line pt-3" : ""}`}>
      <dt className={fuerte ? "font-extrabold" : "text-muted"}>{label}</dt>
      <dd className={`tabular text-right ${fuerte ? "text-lg font-black" : "font-bold"}`}>{value}</dd>
    </div>
  );
}
