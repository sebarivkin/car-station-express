import { Percent, Plus, Upload } from "lucide-react";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import ArticuloRow from "@/components/ArticuloRow";
import { Empty, PageHeader } from "@/components/ui";
import { ajustarPrecios, guardarArticulo, importarArticulos } from "@/app/actions/articulos";
import { db } from "@/lib/auth";
import { numeros, type Articulo } from "@/lib/types";

export default async function ArticulosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; q?: string; inactivos?: string }>;
}) {
  const { ok, error, q = "", inactivos } = await searchParams;
  const supabase = await db();
  const { data } = await supabase.from("articulos").select("*").order("categoria", { nullsFirst: false }).order("nombre").limit(5000);
  const todos = (data ?? []).map((a) => numeros(a as Articulo));
  const categorias = [...new Set(todos.map((a) => a.categoria).filter(Boolean))] as string[];

  const palabras = q.toLowerCase().split(/\s+/).filter(Boolean);
  const lista = todos.filter(
    (a) =>
      (inactivos ? true : a.activo) &&
      palabras.every((p) => `${a.nombre} ${a.categoria ?? ""}`.toLowerCase().includes(p))
  );

  return (
    <>
      <PageHeader title="Artículos del lubricentro" />
      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="flex flex-col gap-3">
          <form className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={q}
              type="search"
              placeholder="Buscar artículo o categoría"
              aria-label="Buscar artículo"
              className="input min-w-0 flex-1 !bg-surface shadow-card"
            />
            <label className="btn btn-ghost btn-sm cursor-pointer">
              <input type="checkbox" name="inactivos" value="1" defaultChecked={Boolean(inactivos)} className="accent-[var(--brand)]" />
              Ver inactivos
            </label>
            <button className="btn btn-secondary">Filtrar</button>
          </form>

          {todos.length === 0 ? (
            <Empty title="El catálogo está vacío">
              Importá la lista de precios desde Excel o agregá los artículos uno por uno.
            </Empty>
          ) : lista.length === 0 ? (
            <Empty title="Ningún artículo coincide" />
          ) : (
            <div className="card overflow-hidden">
              <p className="px-4 pt-3 text-sm font-bold text-muted">
                {lista.length} {lista.length === 1 ? "artículo" : "artículos"}
              </p>
              <ul className="divide-y divide-line">
                {lista.map((a) => (
                  <ArticuloRow key={a.id} a={a} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <form action={guardarArticulo} className="card flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 font-extrabold">
              <Plus size={18} strokeWidth={2.6} />
              Nuevo artículo
            </h2>
            <input name="nombre" required placeholder="Ej. Aceite 10W40 semisintético x4L" aria-label="Nombre" className="input" />
            <input name="categoria" list="categorias" placeholder="Categoría (aceite, filtro…)" aria-label="Categoría" className="input" />
            <div className="grid grid-cols-2 gap-2">
              <label className="field">
                <span className="label">Costo</span>
                <input name="costo" inputMode="decimal" className="input tabular text-right" />
              </label>
              <label className="field">
                <span className="label">Venta</span>
                <input name="precio" inputMode="decimal" className="input tabular text-right" />
              </label>
            </div>
            <SubmitButton>Agregar</SubmitButton>
            <datalist id="categorias">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </form>

          <form action={importarArticulos} className="card flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 font-extrabold">
              <Upload size={18} />
              Importar lista de precios
            </h2>
            <p className="text-sm text-muted">
              Excel (.xlsx) o CSV con columnas <strong className="text-text">Artículo</strong>,{" "}
              <strong className="text-text">Categoría</strong> (opcional), <strong className="text-text">Costo</strong> y{" "}
              <strong className="text-text">Venta</strong>. Los que ya existen se actualizan.
            </p>
            <input
              type="file"
              name="archivo"
              required
              accept=".xlsx,.csv"
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:font-bold file:text-text"
            />
            <SubmitButton className="btn btn-secondary" pendingText="Importando…">
              Importar
            </SubmitButton>
          </form>

          <form action={ajustarPrecios} className="card flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 font-extrabold">
              <Percent size={18} />
              Aumento general
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <input name="pct" inputMode="decimal" placeholder="% ej. 8" aria-label="Porcentaje" required className="input tabular text-right" />
              <select name="campo" aria-label="Qué precio" className="input">
                <option value="ambos">Costo y venta</option>
                <option value="precio">Solo venta</option>
                <option value="costo">Solo costo</option>
              </select>
            </div>
            <select name="categoria" aria-label="Categoría" className="input">
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <SubmitButton className="btn btn-secondary" confirm="¿Aplicar el aumento a los artículos activos?" pendingText="Aplicando…">
              Aplicar
            </SubmitButton>
            <p className="text-xs text-muted">Los services ya cargados no cambian: guardan el precio del día.</p>
          </form>
        </aside>
      </div>
    </>
  );
}
