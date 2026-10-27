import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import VehiculoFields from "@/components/VehiculoFields";
import { PageHeader, Patente } from "@/components/ui";
import { actualizarCliente, agregarVehiculo, eliminarCliente } from "@/app/actions/clientes";
import { db } from "@/lib/auth";
import { money } from "@/lib/format";
import { numeros, type Cliente, type Operacion, type Vehiculo } from "@/lib/types";

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const supabase = await db();

  const { data: c } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle<Cliente>();
  if (!c) notFound();

  const [{ data: vehiculos }, { data: opsRaw }] = await Promise.all([
    supabase.from("vehiculos").select("*").eq("cliente_id", id).order("created_at"),
    supabase.from("operaciones").select("total, saldo, tipo").eq("cliente_id", id),
  ]);
  const ops = (opsRaw ?? []).map((o) => numeros(o as Pick<Operacion, "total" | "saldo" | "tipo">));
  const total = ops.reduce((s, o) => s + o.total, 0);
  const deuda = ops.reduce((s, o) => s + o.saldo, 0);

  return (
    <div className="max-w-4xl">
      <PageHeader title={c.nombre} back={{ href: "/", label: "Buscar" }} />
      <Flash ok={ok} error={error} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-sm font-bold text-muted">Trabajos</p>
          <p className="tabular text-xl font-black">{ops.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold text-muted">Facturado</p>
          <p className="tabular text-xl font-black">{money(total)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold text-muted">Debe</p>
          <p className={`tabular text-xl font-black ${deuda > 0 ? "text-warn" : ""}`}>{money(deuda)}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Vehículos</h2>
          <ul className="flex flex-col gap-3">
            {(vehiculos as Vehiculo[] | null)?.map((v) => (
              <li key={v.id}>
                <Link href={`/vehiculos/${v.id}`} className="card flex items-center gap-3 p-4 hover:ring-2 hover:ring-line">
                  <div className="min-w-0 flex-1">
                    <Patente value={v.patente} />
                    <p className="mt-1.5 truncate font-extrabold">
                      {v.marca} {v.modelo} {v.anio ? <span className="font-semibold text-muted">· {v.anio}</span> : null}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
          <details className="card mt-3 p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold text-brand">
              <Plus size={18} strokeWidth={2.6} />
              Agregar otro vehículo
            </summary>
            <form action={agregarVehiculo} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="cliente_id" value={c.id} />
              <VehiculoFields />
              <SubmitButton>Agregar vehículo</SubmitButton>
            </form>
          </details>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">Datos del cliente</h2>
          <form action={actualizarCliente} className="card flex flex-col gap-4 p-5">
            <input type="hidden" name="id" value={c.id} />
            <label className="field">
              <span className="label">Nombre y apellido</span>
              <input name="nombre" required defaultValue={c.nombre} className="input" />
            </label>
            <label className="field">
              <span className="label">Teléfono</span>
              <input name="telefono" type="tel" defaultValue={c.telefono ?? ""} className="input" />
            </label>
            <label className="field">
              <span className="label">Notas</span>
              <textarea name="notas" defaultValue={c.notas ?? ""} className="input" />
            </label>
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
          {(!vehiculos || vehiculos.length === 0) && (
            <form action={eliminarCliente} className="mt-3">
              <input type="hidden" name="id" value={c.id} />
              <SubmitButton className="btn btn-danger btn-sm w-full" confirm="¿Eliminar este cliente?" pendingText="Eliminando…">
                <Trash2 size={15} />
                Eliminar cliente
              </SubmitButton>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
