import { Phone, Plus, Trash2 } from "lucide-react";
import { SoloInterno } from "@/components/VistaCliente";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHeader } from "@/components/ui";
import { eliminarProveedor, guardarProveedor } from "@/app/actions/proveedores";
import { db, fetchAll } from "@/lib/auth";
import { inicioMes, hoy } from "@/lib/fechas";
import { money, nombreMes } from "@/lib/format";

type Prov = { id: string; nombre: string; telefono: string | null };
type Compra = { proveedor_id: string; cantidad: number; costo_unit: number; trabajos: { fecha: string } };

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await db();
  const desde = inicioMes(hoy());

  const [{ data: provs }, compras] = await Promise.all([
    supabase.from("proveedores").select("*").order("nombre"),
    fetchAll<Compra>((from, to) =>
      supabase
        .from("trabajo_repuestos")
        .select("proveedor_id, cantidad, costo_unit, trabajos!inner(fecha)")
        .not("proveedor_id", "is", null)
        .range(from, to)
    ),
  ]);

  const totales = new Map<string, { mes: number; total: number; n: number }>();
  for (const c of compras) {
    const t = totales.get(c.proveedor_id) ?? { mes: 0, total: 0, n: 0 };
    const monto = Number(c.cantidad) * Number(c.costo_unit);
    t.total += monto;
    t.n += 1;
    if (c.trabajos.fecha >= desde) t.mes += monto;
    totales.set(c.proveedor_id, t);
  }
  const lista = ((provs ?? []) as Prov[]).sort((a, b) => (totales.get(b.id)?.total ?? 0) - (totales.get(a.id)?.total ?? 0));

  return (
    <SoloInterno>
    <div className="max-w-4xl">
      <PageHeader title="Proveedores" />
      <Flash ok={ok} error={error} />
      <p className="-mt-3 mb-5 text-muted">
        Distribuidoras donde se compran los repuestos del taller. Se crean solas al cargar un repuesto con proveedor.
      </p>

      <div className="grid items-start gap-5 md:grid-cols-[1fr_18rem]">
        {lista.length === 0 ? (
          <Empty title="Sin proveedores todavía" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table min-w-[30rem]">
              <thead>
                <tr>
                  <th className="!pl-5">Proveedor</th>
                  <th className="text-right">Compras {nombreMes(desde.slice(0, 7))}</th>
                  <th className="text-right">Total histórico</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => {
                  const t = totales.get(p.id);
                  return (
                    <tr key={p.id}>
                      <td className="!pl-5">
                        <p className="font-bold">{p.nombre}</p>
                        {p.telefono && (
                          <a href={`tel:${p.telefono}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
                            <Phone size={12} />
                            {p.telefono}
                          </a>
                        )}
                      </td>
                      <td className="tabular text-right">{money(t?.mes ?? 0)}</td>
                      <td className="tabular text-right font-extrabold">
                        {money(t?.total ?? 0)}
                        <span className="block text-xs font-semibold text-muted">{t?.n ?? 0} repuestos</span>
                      </td>
                      <td>
                        <form action={eliminarProveedor}>
                          <input type="hidden" name="id" value={p.id} />
                          <SubmitButton
                            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-brand"
                            pendingText="…"
                            confirm={`¿Eliminar ${p.nombre}? Los repuestos ya cargados quedan, sin proveedor.`}
                          >
                            <Trash2 size={16} />
                            <span className="sr-only">Eliminar</span>
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form action={guardarProveedor} className="card flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 font-extrabold">
            <Plus size={18} strokeWidth={2.6} />
            Nuevo proveedor
          </h2>
          <input name="nombre" required placeholder="Nombre" aria-label="Nombre" className="input" />
          <input name="telefono" type="tel" placeholder="Teléfono (opcional)" aria-label="Teléfono" className="input" />
          <SubmitButton>Agregar</SubmitButton>
        </form>
      </div>
    </div>
    </SoloInterno>
  );
}
