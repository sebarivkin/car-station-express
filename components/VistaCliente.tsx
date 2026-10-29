"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSyncExternalStore } from "react";

// "Vista cliente": oculta costos, ganancia y pantallas internas para poder
// mostrarle la pantalla al cliente. Se marca en <html data-vista="cliente">
// y el CSS esconde todo lo que tenga la clase "privado".

function activa(): boolean {
  return document.documentElement.dataset.vista === "cliente";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-vista"] });
  return () => obs.disconnect();
}

/** true cuando la vista cliente está activa (para armar grillas sin las columnas de costo) */
export function useVistaCliente(): boolean {
  return useSyncExternalStore(subscribe, activa, () => false);
}

export function cambiarVista(cliente: boolean) {
  if (cliente) document.documentElement.dataset.vista = "cliente";
  else delete document.documentElement.dataset.vista;
  try {
    localStorage.setItem("vista", cliente ? "cliente" : "");
  } catch {
    // sin almacenamiento: vale para esta pantalla
  }
}

export default function ToggleVista({ variante = "boton" }: { variante?: "boton" | "icono" | "menu" }) {
  const cliente = useVistaCliente();
  const Icono = cliente ? Eye : EyeOff;
  const texto = cliente ? "Mostrar costos" : "Ocultar costos";

  if (variante === "icono") {
    return (
      <button
        type="button"
        onClick={() => cambiarVista(!cliente)}
        className={`btn btn-ghost !px-0 w-11 ${cliente ? "!text-brand" : ""}`}
        aria-label={texto}
        aria-pressed={cliente}
        title={texto}
      >
        <Icono size={20} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => cambiarVista(!cliente)}
      aria-pressed={cliente}
      className={
        variante === "menu"
          ? `btn btn-ghost w-full justify-start ${cliente ? "!text-brand" : ""}`
          : `btn ${cliente ? "btn-primary" : "btn-secondary"}`
      }
    >
      <Icono size={18} />
      {texto}
    </button>
  );
}

/** Reemplaza una pantalla interna mientras está la vista cliente */
export function SoloInterno({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="privado">{children}</div>
      <div className="solo-cliente card px-6 py-12 text-center">
        <p className="text-lg font-extrabold">Pantalla no disponible</p>
        <button type="button" onClick={() => cambiarVista(false)} className="btn btn-secondary mt-4">
          <Eye size={18} />
          Mostrar costos
        </button>
      </div>
    </>
  );
}
