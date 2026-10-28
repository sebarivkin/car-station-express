"use client";

import { useEffect, useRef } from "react";
import { bloquear } from "@/app/actions/bloqueo";

const INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos sin tocar nada

/** Vuelve a la pantalla de clave si la gestión queda abierta sin uso */
export default function AutoBloqueo() {
  const ultima = useRef(0);

  useEffect(() => {
    ultima.current = Date.now();
    const actividad = () => {
      ultima.current = Date.now();
    };
    const revisar = () => {
      if (Date.now() - ultima.current > INACTIVIDAD_MS) bloquear();
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
