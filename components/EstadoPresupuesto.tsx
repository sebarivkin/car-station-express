import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { EstadoPresupuesto } from "@/lib/types";

export function EstadoPresupuestoChip({ estado }: { estado: EstadoPresupuesto }) {
  if (estado === "aceptado")
    return (
      <span className="chip bg-ok-soft text-ok">
        <CircleCheck size={13} strokeWidth={2.6} />
        Aceptado
      </span>
    );
  if (estado === "rechazado")
    return (
      <span className="chip bg-surface-2 text-muted ring-1 ring-line ring-inset">
        <CircleX size={13} strokeWidth={2.6} />
        Rechazado
      </span>
    );
  return (
    <span className="chip bg-warn-soft text-warn">
      <Clock size={13} strokeWidth={2.6} />
      Pendiente
    </span>
  );
}
