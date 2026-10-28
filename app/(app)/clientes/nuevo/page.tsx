import { PageHeader } from "@/components/ui";
import Flash from "@/components/Flash";
import VehiculoFields from "@/components/VehiculoFields";
import SubmitButton from "@/components/SubmitButton";
import { crearCliente } from "@/app/actions/clientes";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; siguiente?: string }>;
}) {
  const { error, siguiente: sig } = await searchParams;
  const siguiente = sig === "service" || sig === "taller" ? sig : null;
  const back = siguiente
    ? { href: `/nuevo/${siguiente}`, label: siguiente === "service" ? "Nuevo service" : "Nuevo trabajo" }
    : { href: "/", label: "Inicio" };
  const boton = siguiente
    ? `Guardar y seguir con el ${siguiente === "service" ? "service" : "trabajo"}`
    : "Guardar cliente";

  return (
    <div className="max-w-3xl">
      <PageHeader title="Nuevo cliente" back={back} />
      <Flash error={error} />
      <form action={crearCliente} className="flex flex-col gap-5">
        {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Dueño</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2">
              <span className="label">Nombre y apellido *</span>
              <input name="nombre" required autoFocus className="input" />
            </label>
            <label className="field">
              <span className="label">Teléfono</span>
              <input name="telefono" type="tel" inputMode="tel" placeholder="11 2345 6789" className="input" />
            </label>
            <label className="field">
              <span className="label">Notas</span>
              <input name="notas" className="input" />
            </label>
          </div>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Vehículo</h2>
          <VehiculoFields />
        </section>
        <div className="flex justify-end">
          <SubmitButton className="btn btn-primary w-full sm:w-auto">{boton}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
