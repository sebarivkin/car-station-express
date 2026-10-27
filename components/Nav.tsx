"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, LogOut, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { PRINCIPALES, SECUNDARIOS, type NavItem as Item } from "@/components/navItems";
import { cerrarSesion } from "@/app/actions/sesion";

function activo(path: string, href: string) {
  if (href === "/") return path === "/" || path.startsWith("/clientes") || path.startsWith("/vehiculos") || path.startsWith("/operaciones");
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
          on ? "bg-brand text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-text"
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
  const items: Item[] = [...PRINCIPALES, { href: "/mas", label: "Más", icon: Menu }];
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Principal"
    >
      {items.map((it) => {
        const on =
          it.href === "/mas"
            ? path.startsWith("/mas") || SECUNDARIOS.some((s) => path.startsWith(s.href))
            : activo(path, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-extrabold ${
              on ? "text-brand" : "text-muted"
            }`}
          >
            <span
              className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                on ? "bg-brand-soft" : ""
              }`}
            >
              <it.icon size={21} strokeWidth={on ? 2.5 : 2} />
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
