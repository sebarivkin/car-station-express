import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil, Trash2, Wrench } from "lucide-react";
import CompartirPdf from "@/components/CompartirPdf";
import { EstadoPresupuestoChip } from "@/components/EstadoPresupuesto";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import ToggleVista from "@/components/VistaCliente";
import { PageHeader, Patente } from "@/components/ui";
import { cambiarEstadoPresupuesto, eliminarPresupuesto, pasarATrabajo } from "@/app/actions/presupuestos";
import { db } from "@/lib/auth";
import { sumarDias } from "@/lib/fechas";
import { fecha, money, num } from "@/lib/format";
import { numeros, type ItemPresupuesto, type Presupuesto } from "@/lib/types";

type Item = ItemPresupuesto & { id: string };

export default async function PresupuestoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const supabase = await db();
  const [{ data: pRaw }, { data: itemsRaw }] = await Promise.all([
    supabase.from("presupuestos_totales").select("*").eq("id", id).maybeSingle(),
    supabase.from("presupuesto_items").select("*").eq("presupuesto_id", id).order("orden"),
  ]);
  if (!pRaw) notFound();
  const p = numeros(pRaw as Presupuesto);
  const items = (itemsRaw ?? []).map((i) => numeros(i as Item));
  const mo = items.filter((i) => i.tipo === "mano_obra");
  const rep = items.filter((i) => i.tipo === "repuesto");
  const pdf = `/api/presupuestos/${id}/pdf`;
  const archivo = `Presupuesto-${String(p.numero).padStart(4, "0")}.pdf`;
  const vence = sumarDias(p.fecha, p.validez_dias);

  return (
    <div className="max-w-5xl">
      <PageHeader
        back={{ href: "/presupuestos", label: "Presupuestos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Presupuesto N° {p.numero}
            <EstadoPresupuestoChip estado={p.estado} />
          </span>
        }
      >
        <ToggleVista />
        <Link href={`/presupuestos/${id}/editar`} className="privado btn btn-secondary">
          <Pencil size={16} />
          Editar
        </Link>
      </PageHeader>

      <p className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-muted">
        <span className="font-bold text-text">{p.cliente_nombre}</span>
        {p.patente && <Patente value={p.patente} />}
        {p.vehiculo_texto && <span>· {p.vehiculo_texto}</span>}
        <span className="tabular">
          · {fecha(p.fecha)} · válido hasta {fecha(vence)}
        </span>
      </p>

      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          {[
            { titulo: "Mano de obra", lista: mo },
            { titulo: "Repuestos y artículos", lista: rep },
          ]
            .filter((s) => s.lista.length)
            .map((s) => (
              <section key={s.titulo} className="card overflow-hidden">
                <h2 className="px-5 pt-5 text-lg font-extrabold">{s.titulo}</h2>
                <div className="overflow-x-auto">
                  <table className="table mt-2 min-w-[30rem]">
                    <thead>
                      <tr>
                        <th className="!pl-5">Descripción</th>
                        <th className="text-right">Cant.</th>
                        <th className="privado text-right">Costo</th>
                        <th className="text-right">Precio</th>
                        <th className="!pr-5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.lista.map((i) => (
                        <tr key={i.id}>
                          <td className="!pl-5 font-bold">{i.descripcion}</td>
                          <td className="tabular text-right">{num(i.cantidad)}</td>
                          <td className="privado tabular text-right text-muted">{money(i.costo_unit)}</td>
                          <td className="tabular text-right">{money(i.precio_unit)}</td>
                          <td className="tabular !pr-5 text-right font-extrabold">{money(i.cantidad * i.precio_unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          {p.notas && (
            <section className="card p-5">
              <h2 className="mb-1 text-sm font-bold text-muted">Observaciones</h2>
              <p className="whitespace-pre-line">{p.notas}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <dl className="card flex flex-col gap-2 p-5">
            <div className="flex justify-between text-sm">
              <dt className="text-muted">Mano de obra</dt>
              <dd className="tabular font-bold">{money(p.mano_obra)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted">Repuestos</dt>
              <dd className="tabular font-bold">{money(p.total - p.mano_obra)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-extrabold">Total</dt>
              <dd className="tabular text-3xl font-black">{money(p.total)}</dd>
            </div>
            <div className="privado flex justify-between text-sm">
              <dt className="text-muted">Ganancia</dt>
              <dd className="tabular font-extrabold text-ok">{money(p.total - p.costo)}</dd>
            </div>
          </dl>

          <section className="card flex flex-col gap-2 p-5">
            <h2 className="mb-1 font-extrabold">PDF para el cliente</h2>
            <p className="mb-1 text-sm text-muted">Sale sin costos ni ganancia.</p>
            <CompartirPdf url={pdf} nombre={archivo} texto={`Presupuesto N° ${p.numero} - Car Station Express`} />
            <a href={pdf} download={archivo} className="btn btn-secondary">
              <Download size={18} />
              Descargar PDF
            </a>
            <a href={pdf} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
              Ver en pantalla
            </a>
          </section>

          <section className="privado card flex flex-col gap-3 p-5">
            <h2 className="font-extrabold">Seguimiento</h2>
            {p.trabajo_id ? (
              <Link href={`/operaciones/taller/${p.trabajo_id}`} className="btn btn-secondary">
                <Wrench size={17} />
                Ver el trabajo de taller
              </Link>
            ) : p.vehiculo_id ? (
              <form action={pasarATrabajo}>
                <input type="hidden" name="id" value={id} />
                <SubmitButton
                  className="btn btn-primary w-full"
                  pendingText="Creando…"
                  confirm="¿El cliente aceptó? Se crea el trabajo de taller con estos importes, como pendiente de cobro."
                >
                  <Wrench size={17} />
                  Aceptado: pasar a trabajo
                </SubmitButton>
              </form>
            ) : (
              <p className="text-sm text-muted">
                Para pasarlo a trabajo de taller, primero cargá el cliente y el vehículo y hacé el presupuesto desde su ficha.
              </p>
            )}
            <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1 ring-1 ring-line ring-inset">
              {(["pendiente", "aceptado", "rechazado"] as const).map((e) => (
                <form key={e} action={cambiarEstadoPresupuesto}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="estado" value={e} />
                  <button
                    className={`w-full rounded-full py-2 text-xs font-extrabold capitalize ${
                      p.estado === e ? "bg-surface text-text shadow-card" : "text-muted hover:text-text"
                    }`}
                    aria-pressed={p.estado === e}
                  >
                    {e}
                  </button>
                </form>
              ))}
            </div>
            <form action={eliminarPresupuesto}>
              <input type="hidden" name="id" value={id} />
              <SubmitButton className="btn btn-danger btn-sm w-full" pendingText="Eliminando…" confirm="¿Eliminar este presupuesto?">
                <Trash2 size={15} />
                Eliminar presupuesto
              </SubmitButton>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
