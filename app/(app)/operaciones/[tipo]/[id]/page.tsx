import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, X } from "lucide-react";
import EliminarOperacion from "@/components/EliminarOperacion";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import ToggleVista from "@/components/VistaCliente";
import { IconoTipo } from "@/components/OperacionList";
import { EstadoPago, PageHeader, Patente } from "@/components/ui";
import { eliminarPago, registrarPago } from "@/app/actions/operaciones";
import { db } from "@/lib/auth";
import { hoy } from "@/lib/fechas";
import { fecha, money, num } from "@/lib/format";
import { MEDIOS, numeros, type Operacion, type Pago } from "@/lib/types";

type Renglon = {
  id: string;
  descripcion: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
  proveedores?: { nombre: string } | null;
};

export default async function OperacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string; id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { tipo, id } = await params;
  const { ok, error } = await searchParams;
  if (tipo !== "service" && tipo !== "taller") notFound();
  const esService = tipo === "service";
  const supabase = await db();

  const { data: opRaw } = await supabase.from("operaciones").select("*").eq("tipo", tipo).eq("id", id).maybeSingle();
  if (!opRaw) notFound();
  const op = numeros(opRaw as Operacion);

  const [{ data: renglonesRaw }, { data: pagosRaw }, { data: extra }] = await Promise.all([
    esService
      ? supabase.from("service_items").select("*").eq("service_id", id)
      : supabase.from("trabajo_repuestos").select("*, proveedores(nombre)").eq("trabajo_id", id),
    supabase
      .from("pagos")
      .select("*")
      .eq(esService ? "service_id" : "trabajo_id", id)
      .order("fecha")
      .order("created_at"),
    supabase.from(esService ? "services" : "trabajos").select("notas").eq("id", id).single(),
  ]);
  const renglones = (renglonesRaw ?? []).map((r) => numeros(r as Renglon));
  const pagos = (pagosRaw ?? []).map((p) => numeros(p as Pago));
  const volver = `/operaciones/${tipo}/${id}`;

  return (
    <div className="max-w-5xl">
      <PageHeader
        back={{ href: `/vehiculos/${op.vehiculo_id}`, label: "Volver al vehículo" }}
        title={
          <span className="flex items-center gap-3">
            <IconoTipo tipo={op.tipo} />
            {esService ? "Service" : "Trabajo de taller"}
          </span>
        }
      >
        <ToggleVista />
        <Link href={`${volver}/editar`} className="privado btn btn-secondary">
          <Pencil size={16} />
          Editar
        </Link>
        <EliminarOperacion tipo={tipo} id={id} vehiculoId={op.vehiculo_id} />
      </PageHeader>

      <p className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-muted">
        <Patente value={op.patente} />
        <Link href={`/vehiculos/${op.vehiculo_id}`} className="font-bold text-text hover:text-brand">
          {op.marca} {op.modelo}
        </Link>
        <span>· {op.cliente_nombre}</span>
        <span>· {fecha(op.fecha)}</span>
        {op.km ? <span className="tabular">· {num(op.km)} km</span> : null}
      </p>

      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          {!esService && (
            <section className="card p-5">
              <h2 className="mb-1 text-sm font-bold text-muted">Trabajo realizado</h2>
              <p className="text-lg font-bold whitespace-pre-line">{op.descripcion}</p>
              <p className="mt-3 flex justify-between border-t border-line pt-3">
                <span className="text-muted">Mano de obra</span>
                <span className="tabular font-extrabold">{money(op.mano_obra)}</span>
              </p>
            </section>
          )}

          <section className="card overflow-hidden">
            <h2 className="px-5 pt-5 text-lg font-extrabold">{esService ? "Artículos" : "Repuestos"}</h2>
            {renglones.length === 0 ? (
              <p className="px-5 pt-2 pb-5 text-muted">Sin repuestos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table mt-2 min-w-[34rem]">
                  <thead>
                    <tr>
                      <th className="!pl-5">Descripción</th>
                      <th className="text-right">Cant.</th>
                      <th className="privado text-right">Costo</th>
                      <th className="text-right">Venta</th>
                      <th className="!pr-5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renglones.map((r) => (
                      <tr key={r.id}>
                        <td className="!pl-5">
                          <span className="font-bold">{r.descripcion}</span>
                          {r.proveedores?.nombre && <span className="block text-xs text-muted">{r.proveedores.nombre}</span>}
                        </td>
                        <td className="tabular text-right">{num(r.cantidad)}</td>
                        <td className="privado tabular text-right text-muted">{money(r.costo_unit)}</td>
                        <td className="tabular text-right">{money(r.precio_unit)}</td>
                        <td className="tabular !pr-5 text-right font-extrabold">{money(r.cantidad * r.precio_unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {extra?.notas && (
            <section className="card p-5">
              <h2 className="mb-1 text-sm font-bold text-muted">Notas</h2>
              <p className="whitespace-pre-line">{extra.notas}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <dl className="card flex flex-col gap-2 p-5">
            <div className="privado flex justify-between text-sm">
              <dt className="text-muted">Costo</dt>
              <dd className="tabular font-bold">{money(op.costo)}</dd>
            </div>
            <div className="privado flex justify-between text-sm">
              <dt className="text-muted">Utilidad</dt>
              <dd className="tabular font-extrabold text-ok">{money(op.utilidad)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-extrabold">Total</dt>
              <dd className="tabular text-3xl font-black">{money(op.total)}</dd>
            </div>
          </dl>

          <section className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Cobros</h2>
              <EstadoPago saldo={op.saldo} total={op.total} />
            </div>
            {pagos.length === 0 ? (
              <p className="text-sm text-muted">Sin cobros registrados.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {pagos.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <div className="flex-1">
                      <p className="tabular font-extrabold">{money(p.monto)}</p>
                      <p className="text-xs text-muted">
                        {fecha(p.fecha)} · {MEDIOS.find((m) => m.value === p.medio)?.label}
                      </p>
                    </div>
                    <form action={eliminarPago}>
                      <input type="hidden" name="pago_id" value={p.id} />
                      <input type="hidden" name="volver" value={volver} />
                      <SubmitButton
                        className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-brand"
                        pendingText="…"
                        confirm={`¿Borrar el cobro de ${money(p.monto)}?`}
                      >
                        <X size={17} />
                        <span className="sr-only">Borrar cobro</span>
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            {op.saldo > 0 && (
              <form action={registrarPago} className="flex flex-col gap-2 border-t border-line pt-3">
                <input type="hidden" name="tipo" value={tipo} />
                <input type="hidden" name="id" value={id} />
                <p className="text-sm">
                  Saldo <strong className="tabular text-warn">{money(op.saldo)}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input name="monto" defaultValue={String(op.saldo).replace(".", ",")} inputMode="decimal" aria-label="Monto" className="input tabular text-right" />
                  <select name="medio" className="input" aria-label="Medio de pago">
                    {MEDIOS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input type="date" name="fecha" defaultValue={hoy()} aria-label="Fecha del cobro" className="input tabular" />
                <SubmitButton>Registrar cobro</SubmitButton>
              </form>
            )}
          </section>

        </aside>
      </div>
    </div>
  );
}
