"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Droplets, LogOut, Menu, Plus, Wrench } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { DEUDAS, INICIO, MAS_MOVIL, PRINCIPALES, RESUMEN, SECUNDARIOS, type NavItem as Item } from "@/components/navItems";
import { cerrarSesion } from "@/app/actions/sesion";

// Formularios de service / trabajo y la elección del vehículo
function esNuevo(path: string) {
  return path.startsWith("/nuevo") || /^\/vehiculos\/[^/]+\/(service|taller)/.test(path);
}

function activo(path: string, href: string) {
  if (href === "/")
    return (
      !esNuevo(path) &&
      (path === "/" || path.startsWith("/clientes") || path.startsWith("/vehiculos") || path.startsWith("/operaciones"))
    );
  return path.startsWith(href);
}

export function Sidebar({ email }: { email: string }) {
  const path = usePathname();
  const link = (it: Item) => {
    const on = activo(path, it.href);
    return (
      <Link
        key={it.href}
        href={it.href}
        aria-current={on ? "page" : undefined}
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 font-bold transition-colors ${
          on ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-text"
        }`}
      >
        <it.icon size={20} strokeWidth={2.2} />
        {it.label}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col gap-6 border-r border-line bg-surface px-4 py-5">
      <Link href="/" className="px-2">
        <Logo className="h-20" />
      </Link>
      <div className="flex flex-col gap-2">
        <Link href="/nuevo/service" className="btn btn-primary justify-start">
          <Droplets size={19} strokeWidth={2.4} />
          Nuevo service
        </Link>
        <Link href="/nuevo/taller" className="btn btn-primary justify-start">
          <Wrench size={18} strokeWidth={2.4} />
          Nuevo trabajo de taller
        </Link>
      </div>
      <nav className="flex flex-col gap-1">{PRINCIPALES.map(link)}</nav>
      <nav className="flex flex-col gap-1 border-t border-line pt-4">
        {SECUNDARIOS.map(link)}
        <a
          href="/api/exportar"
          className="flex items-center gap-3 rounded-full px-4 py-2.5 font-bold text-muted hover:bg-surface-2 hover:text-text"
        >
          <Download size={20} strokeWidth={2.2} />
          Exportar a Excel
        </a>
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <ThemeToggle withLabel />
        <form action={cerrarSesion}>
          <button className="btn btn-ghost w-full justify-start" type="submit">
            <LogOut size={20} />
            Salir
          </button>
        </form>
        <p className="truncate px-4 pt-1 text-xs text-muted" title={email}>
          {email}
        </p>
      </div>
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2 backdrop-blur">
      <Link href="/" aria-label="Inicio">
        <Logo className="h-11 !p-1" />
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  const mas: Item = { href: "/mas", label: "Más", icon: Menu };
  const tab = (it: Item) => {
    const on =
      it.href === "/mas"
        ? path.startsWith("/mas") || MAS_MOVIL.some((s) => path.startsWith(s.href))
        : activo(path, it.href);
    return (
      <Link
        key={it.href}
        href={it.href}
        aria-current={on ? "page" : undefined}
        className={`flex flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-extrabold ${on ? "text-brand" : "text-muted"}`}
      >
        <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${on ? "bg-brand-soft" : ""}`}>
          <it.icon size={21} strokeWidth={on ? 2.5 : 2} />
        </span>
        {it.label}
      </Link>
    );
  };
  const nuevoOn = esNuevo(path);
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Principal"
    >
      {tab(INICIO)}
      {tab(DEUDAS)}
      <Link
        href="/nuevo"
        aria-current={nuevoOn ? "page" : undefined}
        className="flex flex-col items-center gap-0.5 pb-2 text-[0.6875rem] font-extrabold text-brand"
      >
        <span className="-mt-4 grid h-13 w-13 place-items-center rounded-full bg-brand text-brand-ink shadow-card ring-4 ring-surface">
          <Plus size={26} strokeWidth={2.8} />
        </span>
        Nuevo
      </Link>
      {tab(RESUMEN)}
      {tab(mas)}
    </nav>
  );
}
