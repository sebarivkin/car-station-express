import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { SoloInterno } from "@/components/VistaCliente";
import { PageHeader } from "@/components/ui";
import { guardarNegocio } from "@/app/actions/presupuestos";
import { db } from "@/lib/auth";
import type { Negocio } from "@/lib/types";

export default async function DatosNegocioPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const supabase = await db();
  const { data: n } = await supabase.from("negocio").select("*").eq("id", 1).maybeSingle<Negocio>();

  return (
    <SoloInterno>
      <div className="max-w-xl">
        <PageHeader title="Datos del PDF" back={{ href: "/presupuestos", label: "Presupuestos" }} />
        <Flash ok={ok} error={error} />
        <p className="-mt-3 mb-5 text-muted">Lo que aparece en el encabezado y el pie de cada presupuesto.</p>
        <form action={guardarNegocio} className="card flex flex-col gap-4 p-5">
          <label className="field">
            <span className="label">Nombre del negocio</span>
            <input name="nombre" defaultValue={n?.nombre ?? "Car Station Express"} className="input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span className="label">Teléfono / WhatsApp</span>
              <input name="telefono" type="tel" defaultValue={n?.telefono ?? ""} className="input" />
            </label>
            <label className="field">
              <span className="label">Email</span>
              <input name="email" type="email" defaultValue={n?.email ?? ""} className="input" />
            </label>
          </div>
          <label className="field">
            <span className="label">Dirección</span>
            <input name="direccion" defaultValue={n?.direccion ?? ""} className="input" />
          </label>
          <label className="field">
            <span className="label">Texto al pie</span>
            <textarea name="pie_presupuesto" defaultValue={n?.pie_presupuesto ?? ""} className="input" />
          </label>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </div>
    </SoloInterno>
  );
}
