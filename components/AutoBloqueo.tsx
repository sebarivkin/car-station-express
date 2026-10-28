"use client";

import { useEffect } from "react";
import { bloquear } from "@/app/actions/bloqueo";

const INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos sin tocar nada
const CLAVE = "cse_actividad";

// La última actividad se guarda en el dispositivo para que el bloqueo valga
// también si se cerró la pestaña o la app y se vuelve a abrir más tarde.
function leer(): number | null {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function guardar(t: number) {
  try {
    localStorage.setItem(CLAVE, String(t));
  } catch {
    // sin almacenamiento: queda solo el control mientras la página está abierta
  }
}

/** Vuelve a la pantalla de código si la gestión queda abierta sin uso */
export default function AutoBloqueo() {
  useEffect(() => {
    let ultima = leer() ?? Date.now();
    const revisar = () => {
      if (Date.now() - Math.max(ultima, leer() ?? 0) > INACTIVIDAD_MS) {
        guardar(0);
        bloquear();
      }
    };
    revisar();
    ultima = Date.now();
    guardar(ultima);

    let ultimoGuardado = ultima;
    const actividad = () => {
      ultima = Date.now();
      if (ultima - ultimoGuardado > 5000) {
        guardar(ultima);
        ultimoGuardado = ultima;
      }
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, actividad, { passive: true }));
    // Al volver a la app (celular bloqueado, otra pestaña) se revisa enseguida
    document.addEventListener("visibilitychange", revisar);
    const t = setInterval(revisar, 30_000);
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, actividad));
      document.removeEventListener("visibilitychange", revisar);
      clearInterval(t);
    };
  }, []);

  return null;
}
