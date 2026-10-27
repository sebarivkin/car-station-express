import Link from "next/link";
import { ChevronRight, Download, LogOut } from "lucide-react";
import { SECUNDARIOS } from "@/components/navItems";
import ThemeToggle from "@/components/ThemeToggle";
import { PageHeader } from "@/components/ui";
import { cerrarSesion } from "@/app/actions/sesion";

export default function MasPage() {
  const fila = "flex items-center gap-3 px-5 py-4 font-bold";
  return (
    <div className="max-w-lg">
      <PageHeader title="Más" />
      <ul className="card divide-y divide-line overflow-hidden">
        {SECUNDARIOS.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className={`${fila} active:bg-surface-2`}>
              <it.icon size={20} className="text-muted" />
              <span className="flex-1">{it.label}</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          </li>
        ))}
        <li>
          <a href="/api/exportar" className={`${fila} active:bg-surface-2`}>
            <Download size={20} className="text-muted" />
            <span className="flex-1">Exportar todo a Excel</span>
          </a>
        </li>
      </ul>
      <div className="card mt-4 flex flex-col gap-1 p-2">
        <ThemeToggle withLabel />
        <form action={cerrarSesion}>
          <button className="btn btn-ghost w-full justify-start">
            <LogOut size={20} />
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
