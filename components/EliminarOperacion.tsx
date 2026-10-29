import { Trash2 } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";
import { eliminarOperacion } from "@/app/actions/operaciones";

/** Botón para borrar un service o trabajo de taller (con sus cobros) */
export default function EliminarOperacion({
  tipo,
  id,
  vehiculoId,
  className = "privado",
  boton = "btn btn-danger",
}: {
  tipo: "service" | "taller";
  id: string;
  vehiculoId: string;
  className?: string;
  boton?: string;
}) {
  const nombre = tipo === "service" ? "service" : "trabajo";
  return (
    <form action={eliminarOperacion} className={className}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="vehiculo_id" value={vehiculoId} />
      <SubmitButton
        className={boton}
        pendingText="Eliminando…"
        confirm={`¿Eliminar este ${nombre} con sus cobros? No se puede deshacer.`}
      >
        <Trash2 size={16} />
        Eliminar
      </SubmitButton>
    </form>
  );
}
