import { KeyRound } from "lucide-react";
import { SoloInterno } from "@/components/VistaCliente";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader } from "@/components/ui";
import { cambiarClaves } from "@/app/actions/bloqueo";
import { db } from "@/lib/auth";

export default async function ClavesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await db();
  const { ok, error } = await searchParams;
  const campo = "input tabular text-center text-xl font-black tracking-[0.4em]";
  const pin = { inputMode: "numeric" as const, pattern: "\\d{4}", maxLength: 4, required: true, autoComplete: "off" };

  return (
    <SoloInterno>
    <div className="max-w-lg">
      <PageHeader title="Claves de acceso" />
      <Flash ok={ok} error={error} />
      <p className="-mt-3 mb-5 text-muted">
        Al abrir la app se pide un código de 4 números. La <strong className="text-text">clave de gestión</strong> abre
        este sistema; la <strong className="text-text">clave de agenda</strong> abre solo la agenda. Después de 15
        minutos sin uso, la gestión se bloquea sola.
      </p>
      <form action={cambiarClaves} className="card flex flex-col gap-4 p-5">
        <h2 className="flex items-center gap-2 font-extrabold">
          <KeyRound size={18} />
          Cambiar claves
        </h2>
        <label className="field">
          <span className="label">Clave de gestión actual</span>
          <input name="actual" type="password" {...pin} className={campo} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            <span className="label">Nueva clave de gestión</span>
            <input name="gestion" type="password" {...pin} className={campo} />
          </label>
          <label className="field">
            <span className="label">Repetila</span>
            <input name="gestion2" type="password" {...pin} className={campo} />
          </label>
        </div>
        <label className="field">
          <span className="label">Nueva clave de agenda</span>
          <input name="agenda" type="password" {...pin} className={campo} />
        </label>
        <SubmitButton>Guardar claves</SubmitButton>
      </form>
    </div>
    </SoloInterno>
  );
}
