import Link from "next/link";
import { Phone } from "lucide-react";
import OperacionList from "@/components/OperacionList";
import Flash from "@/components/Flash";
import { Empty, PageHeader } from "@/components/ui";
import { db } from "@/lib/auth";
import { money } from "@/lib/format";
import { numeros, type Operacion } from "@/lib/types";

export default async function DeudasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await db();
  const { data } = await supabase
    .from("operaciones")
    .select("*")
    .gt("saldo", 0)
    .order("fecha", { ascending: true })
    .limit(1000);
  const ops = (data ?? []).map((o) => numeros(o as Operacion));
  const total = ops.reduce((s, o) => s + o.saldo, 0);

  // Agrupado por cliente: quién debe más primero
  const porCliente = new Map<string, { id: string; nombre: string; telefono: string | null; saldo: number; n: number }>();
  for (const o of ops) {
    const c = porCliente.get(o.cliente_id) ?? { id: o.cliente_id, nombre: o.cliente_nombre, telefono: o.cliente_telefono, saldo: 0, n: 0 };
    c.saldo += o.saldo;
    c.n += 1;
    porCliente.set(o.cliente_id, c);
  }
  const clientes = [...porCliente.values()].sort((a, b) => b.saldo - a.saldo);

  return (
    <>
      <PageHeader title="Deudas" />
      <Flash ok={ok} error={error} />

      {ops.length === 0 ? (
        <Empty title="Nadie debe nada">Todos los trabajos están cobrados.</Empty>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[20rem_1fr]">
          <aside className="flex flex-col gap-4">
            <div className="card p-5">
              <p className="text-sm font-bold text-muted">Total a cobrar</p>
              <p className="tabular text-3xl font-black text-warn">{money(total)}</p>
              <p className="text-sm text-muted">
                {ops.length} {ops.length === 1 ? "trabajo" : "trabajos"} · {clientes.length}{" "}
                {clientes.length === 1 ? "cliente" : "clientes"}
              </p>
            </div>
            <ul className="card divide-y divide-line">
              {clientes.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/clientes/${c.id}`} className="block truncate font-bold hover:text-brand">
                      {c.nombre}
                    </Link>
                    <p className="tabular text-sm text-warn">{money(c.saldo)}</p>
                  </div>
                  {c.telefono && (
                    <a
                      href={`tel:${c.telefono}`}
                      className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted ring-1 ring-line ring-inset hover:text-text"
                      aria-label={`Llamar a ${c.nombre}`}
                    >
                      <Phone size={17} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </aside>
          <section>
            <h2 className="mb-3 text-lg font-extrabold">Trabajos con saldo</h2>
            <OperacionList ops={ops} />
          </section>
        </div>
      )}
    </>
  );
}
