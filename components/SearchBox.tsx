"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export default function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  // Actualiza la URL mientras se escribe (con una pequeña espera)
  useEffect(() => {
    const actual = params.get("q") ?? "";
    if (q.trim() === actual) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      sp.delete("ok");
      sp.delete("error");
      start(() => router.replace(sp.size ? `${path}?${sp}` : path, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [q, params, path, router]);

  // "/" enfoca el buscador desde cualquier parte de la pantalla
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <Search
        size={22}
        className={`pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 ${pending ? "text-brand" : "text-muted"}`}
      />
      <input
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="input !min-h-14 !rounded-2xl !bg-surface !pl-12 !pr-12 text-lg font-semibold shadow-card"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            ref.current?.focus();
          }}
          className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
          aria-label="Borrar búsqueda"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
