import { Patente } from "@/components/ui";

export default function VehiculoTitulo({
  v,
}: {
  v: { patente: string; marca: string; modelo: string; clientes: { nombre: string } | null };
}) {
  return (
    <p className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-muted">
      <Patente value={v.patente} />
      <span className="font-bold text-text">
        {v.marca} {v.modelo}
      </span>
      {v.clientes && <span>· {v.clientes.nombre}</span>}
    </p>
  );
}
