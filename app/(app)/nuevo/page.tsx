import Link from "next/link";
import { ChevronRight, Droplets, FileText, UserPlus, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui";

// En el celular, el botón "Nuevo" de la barra inferior trae acá
export default function NuevoPage() {
  const opciones = [
    { href: "/nuevo/service", titulo: "Service de lubricentro", sub: "Aceite, filtros y artículos del catálogo", icon: Droplets, brand: true },
    { href: "/nuevo/taller", titulo: "Trabajo de taller", sub: "Mano de obra y repuestos", icon: Wrench, brand: true },
    { href: "/presupuestos/nuevo", titulo: "Presupuesto", sub: "Para pasarle al cliente en PDF", icon: FileText, brand: false },
    { href: "/clientes/nuevo", titulo: "Cliente nuevo", sub: "Dueño y vehículo, sin trabajo todavía", icon: UserPlus, brand: false },
  ];
  return (
    <div className="max-w-lg">
      <PageHeader title="¿Qué vas a registrar?" />
      <ul className="flex flex-col gap-3">
        {opciones.map((o) => (
          <li key={o.href}>
            <Link href={o.href} className="card flex items-center gap-4 p-5 active:scale-[0.99] hover:ring-2 hover:ring-line">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                  o.brand ? "bg-brand text-brand-ink" : "bg-surface-2 text-text ring-1 ring-line ring-inset"
                }`}
              >
                <o.icon size={22} strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">{o.titulo}</span>
                <span className="text-sm text-muted">{o.sub}</span>
              </span>
              <ChevronRight size={20} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
