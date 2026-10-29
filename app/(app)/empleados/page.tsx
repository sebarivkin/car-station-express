import Link from "next/link";
import { SoloInterno } from "@/components/VistaCliente";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader } from "@/components/ui";
import {
  agregarEmpleado,
  cambiarEmpleadoActivo,
  eliminarAdelanto,
  registrarAdelanto,
} from "@/app/actions/empleados";
import { db } from "@/lib/auth";
import { finMes, hoy, sumarMeses } from "@/lib/fechas";
import { fecha, money, nombreMes } from "@/lib/format";
import { numeros, type Adelanto, type Empleado } from "@/lib/types";

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const actual = hoy().slice(0, 7);
  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : actual;
  const desde = `${mes}-01`;
  const hasta = finMes(desde);
  const supabase = await db();

  const [{ data: emps }, { data: adel }] = await Promise.all([
    supabase.from("empleados").select("*").order("nombre"),
    supabase
      .from("adelantos")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  const empleados = (emps ?? []) as Empleado[];
  const activos = empleados.filter((e) => e.activo);
  const adelantos = (adel ?? []).map((a) => numeros(a as Adelanto));
  const totalMes = adelantos.reduce((s, a) => s + a.monto, 0);
  const fechaDefault = mes === actual ? hoy() : desde;

  return (
    <SoloInterno>
    <div className="max-w-5xl">
      <PageHeader title="Adelantos de sueldo">
        <nav className="flex items-center gap-1 rounded-full bg-surface p-1 shadow-card" aria-label="Mes">
          <Link href={`/empleados?mes=${sumarMeses(mes, -1)}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </Link>
          <span className="min-w-36 text-center font-extrabold capitalize">{nombreMes(mes)}</span>
          {mes < actual ? (
            <Link href={`/empleados?mes=${sumarMeses(mes, 1)}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span className="h-9 w-9" />
          )}
        </nav>
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activos.map((e) => {
          const suyos = adelantos.filter((a) => a.empleado_id === e.id);
          return (
            <div key={e.id} className="card p-4 sm:p-5">
              <p className="font-extrabold">{e.nombre}</p>
              <p className="tabular mt-1 text-2xl font-black">{money(suyos.reduce((s, a) => s + a.monto, 0))}</p>
              <p className="text-sm text-muted">
                {suyos.length} {suyos.length === 1 ? "adelanto" : "adelantos"}
              </p>
            </div>
          );
        })}
        <div className="card col-span-2 p-4 sm:col-span-1 sm:p-5">
          <p className="font-extrabold text-muted">Total del mes</p>
          <p className="tabular mt-1 text-2xl font-black">{money(totalMes)}</p>
        </div>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[1fr_19rem]">
        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 text-lg font-extrabold">Movimientos</h2>
          {adelantos.length === 0 ? (
            <p className="px-5 pt-2 pb-6 text-muted">No hay adelantos en {nombreMes(mes)}.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {adelantos.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{empleados.find((e) => e.id === a.empleado_id)?.nombre}</p>
                    <p className="truncate text-sm text-muted">
                      <span className="tabular">{fecha(a.fecha)}</span>
                      {a.nota && ` · ${a.nota}`}
                    </p>
                  </div>
                  <span className="tabular font-extrabold">{money(a.monto)}</span>
                  <form action={eliminarAdelanto}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="mes" value={mes} />
                    <SubmitButton
                      className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-brand"
                      pendingText="…"
                      confirm={`¿Borrar el adelanto de ${money(a.monto)}?`}
                    >
                      <X size={17} />
                      <span className="sr-only">Borrar adelanto</span>
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <form action={registrarAdelanto} className="card flex flex-col gap-3 p-5">
            <h2 className="font-extrabold">Registrar adelanto</h2>
            <input type="hidden" name="mes" value={mes} />
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="sr-only">Empleado</legend>
              {activos.map((e, i) => (
                <label
                  key={e.id}
                  className="cursor-pointer rounded-full bg-surface-2 py-2.5 text-center font-extrabold text-muted ring-1 ring-line ring-inset has-checked:bg-brand has-checked:text-brand-ink has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-brand"
                >
                  <input type="radio" name="empleado_id" value={e.id} defaultChecked={i === 0} className="sr-only" required />
                  {e.nombre}
                </label>
              ))}
            </fieldset>
            <label className="field">
              <span className="label">Monto</span>
              <input name="monto" inputMode="decimal" required className="input tabular text-right text-lg font-bold" />
            </label>
            <label className="field">
              <span className="label">Fecha</span>
              <input type="date" name="fecha" defaultValue={fechaDefault} className="input tabular" />
            </label>
            <input name="nota" placeholder="Nota (opcional)" aria-label="Nota" className="input" />
            <SubmitButton>Registrar</SubmitButton>
          </form>

          <details className="card p-5">
            <summary className="cursor-pointer list-none font-extrabold">Empleados</summary>
            <ul className="mt-3 flex flex-col gap-2">
              {empleados.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span className={e.activo ? "font-bold" : "text-muted line-through"}>{e.nombre}</span>
                  <form action={cambiarEmpleadoActivo}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="activo" value={String(!e.activo)} />
                    <input type="hidden" name="mes" value={mes} />
                    <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                      {e.activo ? "Dar de baja" : "Reactivar"}
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
            <form action={agregarEmpleado} className="mt-3 flex gap-2 border-t border-line pt-3">
              <input type="hidden" name="mes" value={mes} />
              <input name="nombre" placeholder="Nuevo empleado" aria-label="Nombre del nuevo empleado" className="input" required />
              <SubmitButton className="btn btn-secondary">Agregar</SubmitButton>
            </form>
          </details>
        </aside>
      </div>
    </div>
    </SoloInterno>
  );
}
