"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Tema = "light" | "dark";

function temaActual(): Tema {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  mq.addEventListener("change", cb);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", cb);
  };
}

export default function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const tema = useSyncExternalStore<Tema | null>(subscribe, temaActual, () => null);

  function toggle() {
    const next: Tema = temaActual() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("tema", next);
    } catch {
      // sin almacenamiento: el cambio vale para esta visita
    }
  }

  const oscuro = tema === "dark";
  const label = oscuro ? "Modo claro" : "Modo oscuro";

  return (
    <button
      type="button"
      onClick={toggle}
      className={withLabel ? "btn btn-ghost w-full justify-start" : "btn btn-ghost !px-0 w-11"}
      aria-label={label}
      title={label}
    >
      {oscuro ? <Sun size={20} /> : <Moon size={20} />}
      {withLabel && <span>{label}</span>}
    </button>
  );
}
