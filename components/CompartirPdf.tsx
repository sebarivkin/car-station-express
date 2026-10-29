"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

/** En el celular abre el menú de compartir (WhatsApp, mail…) con el PDF adjunto;
 *  donde no se puede, lo descarga. */
export default function CompartirPdf({ url, nombre, texto }: { url: string; nombre: string; texto: string }) {
  const [estado, setEstado] = useState<"listo" | "cargando">("listo");

  async function compartir() {
    setEstado("cargando");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const archivo = new File([blob], nombre, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: nombre, text: texto });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      // Cancelar el menú de compartir no es un error
      if (!(e instanceof DOMException && e.name === "AbortError")) alert("No se pudo compartir el PDF. Probá con Descargar.");
    } finally {
      setEstado("listo");
    }
  }

  return (
    <button type="button" onClick={compartir} disabled={estado === "cargando"} className="btn btn-primary">
      <Share2 size={18} />
      {estado === "cargando" ? "Preparando…" : "Compartir"}
    </button>
  );
}
