import Link from "next/link";
import { notFound } from "next/navigation";
import { Droplets, FileText, Pencil, Phone, Trash2, Wrench } from "lucide-react";
import Flash from "@/components/Flash";
import OperacionList from "@/components/OperacionList";
import SubmitButton from "@/components/SubmitButton";
import VehiculoFields from "@/components/VehiculoFields";
import { Empty, PageHeader, Patente } from "@/components/ui";
import { actualizarVehiculo, eliminarVehiculo } from "@/app/actions/clientes";
import { db } from "@/lib/auth";
import { fecha, money, num } from "@/lib/format";
import { numeros, type Cliente, type Operacion, type Vehiculo } from "@/lib/types";

export default async function VehiculoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const supabase = await db();

  const { data: v } = await supabase.from("vehiculos").select("*").eq("id", id).maybeSingle<Vehiculo>();
  if (!v) notFound();

  const [{ data: cliente }, { data: opsRaw }, { data: otros }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", v.cliente_id).single<Cliente>(),
    supabase
      .from("operaciones")
      .select("*")
      .eq("vehiculo_id", id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("vehiculos").select("id, patente, marca, modelo").eq("cliente_id", v.cliente_id).neq("id", id),
  ]);
  const ops = (opsRaw ?? []).map((o) => numeros(o as Operacion));

  const totalGastado = ops.reduce((s, o) => s + o.total, 0);
  const deuda = ops.reduce((s, o) => s + o.saldo, 0);
  const ultimoKm = ops.find((o) => o.km)?.km;
  const ultimoService = ops.find((o) => o.tipo === "service");

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Buscar" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {v.marca} {v.modelo}
            <Patente value={v.patente} />
          </span>
        }
      >
        <Link href={`/vehiculos/${id}/service`} className="btn btn-primary">
          <Droplets size={18} strokeWidth={2.5} />
          Nuevo service
        </Link>
        <Link href={`/vehiculos/${id}/taller`} className="btn btn-primary">
          <Wrench size={18} strokeWidth={2.5} />
          Nuevo trabajo de taller
        </Link>
        <Link href={`/presupuestos/nuevo?vehiculo=${id}`} className="btn btn-secondary">
          <FileText size={18} />
          Presupuesto
        </Link>
      </PageHeader>

      <Flash ok={ok} error={error} />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="order-2 lg:order-1">
          <h2 className="mb-3 text-lg font-extrabold">Historial</h2>
          {ops.length === 0 ? (
            <Empty title="Sin trabajos registrados">Cargá el primer service o trabajo de taller de este vehículo.</Empty>
          ) : (
            <OperacionList ops={ops} mostrarVehiculo={false} />
          )}
        </section>

        <aside className="order-1 flex flex-col gap-4 lg:order-2">
          <div className="card p-5">
            <p className="text-sm font-bold text-muted">Dueño</p>
            <Link href={`/clientes/${cliente?.id}`} className="mt-0.5 block text-lg font-extrabold hover:text-brand">
              {cliente?.nombre}
            </Link>
            {cliente?.telefono && (
              <a href={`tel:${cliente.telefono}`} className="mt-1 inline-flex items-center gap-1.5 text-muted hover:text-text">
                <Phone size={15} />
                {cliente.telefono}
              </a>
            )}
            {otros && otros.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-xs font-bold text-muted">Otros vehículos</p>
                <ul className="flex flex-col gap-1.5">
                  {otros.map((o) => (
                    <li key={o.id}>
                      <Link href={`/vehiculos/${o.id}`} className="flex items-center gap-2 text-sm font-bold hover:text-brand">
                        <Patente value={o.patente} />
                        <span className="truncate">
                          {o.marca} {o.modelo}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <dl className="card grid grid-cols-2 gap-4 p-5">
            <div>
              <dt className="text-sm font-bold text-muted">Visitas</dt>
              <dd className="tabular text-xl font-black">{ops.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Último km</dt>
              <dd className="tabular text-xl font-black">{ultimoKm ? num(ultimoKm) : "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Total facturado</dt>
              <dd className="tabular text-xl font-black">{money(totalGastado)}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Debe</dt>
              <dd className={`tabular text-xl font-black ${deuda > 0 ? "text-warn" : ""}`}>{money(deuda)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm font-bold text-muted">Último service</dt>
              <dd className="font-bold">
                {ultimoService
                  ? `${fecha(ultimoService.fecha)}${ultimoService.km ? ` · ${num(ultimoService.km)} km` : ""}`
                  : "—"}
              </dd>
            </div>
          </dl>

          <details className="card group p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
              <Pencil size={16} />
              Editar vehículo
            </summary>
            <form action={actualizarVehiculo} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="id" value={v.id} />
              <VehiculoFields v={v} />
              <SubmitButton className="btn btn-primary">Guardar cambios</SubmitButton>
            </form>
            <form action={eliminarVehiculo} className="mt-3">
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="cliente_id" value={v.cliente_id} />
              <SubmitButton
                className="btn btn-danger btn-sm w-full"
                pendingText="Eliminando…"
                confirm="¿Eliminar este vehículo? Solo se puede si no tiene trabajos cargados."
              >
                <Trash2 size={15} />
                Eliminar vehículo
              </SubmitButton>
            </form>
          </details>
        </aside>
      </div>
    </>
  );
}
