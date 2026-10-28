"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Delete, Lock } from "lucide-react";
import { verificarPin } from "@/app/actions/bloqueo";

const LARGO = 4;

export default function PinPad() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sacudir, setSacudir] = useState(false);
  const [pending, start] = useTransition();

  const enviar = useCallback(
    (valor: string) => {
      start(async () => {
        const res = await verificarPin(valor);
        if (res?.error) {
          setError(res.error);
          setSacudir(true);
          setTimeout(() => setSacudir(false), 400);
          setPin("");
        }
      });
    },
    []
  );

  const tecla = useCallback(
    (d: string) => {
      if (pending || pin.length >= LARGO) return;
      setError(null);
      const nuevo = pin + d;
      setPin(nuevo);
      if (nuevo.length === LARGO) enviar(nuevo);
    },
    [pin, pending, enviar]
  );

  const borrar = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  // Teclado físico en la PC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) tecla(e.key);
      else if (e.key === "Backspace") borrar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tecla, borrar]);

  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-text shadow-card">
        <Lock size={24} strokeWidth={2.2} />
      </span>
      <h1 className="mt-5 text-xl font-extrabold">Ingresá tu código</h1>

      <div
        className={`mt-6 flex gap-4 ${sacudir ? "animate-[sacudir_0.4s_ease-in-out]" : ""}`}
        aria-label={`${pin.length} de ${LARGO} números ingresados`}
        role="status"
      >
        {Array.from({ length: LARGO }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition-colors ${
              i < pin.length ? "bg-text" : "bg-transparent ring-2 ring-line ring-inset"
            }`}
          />
        ))}
      </div>
      <p className="mt-4 h-5 text-sm font-bold text-brand" role="alert">
        {pending ? <span className="text-muted">Verificando…</span> : error}
      </p>

      <div className="mt-4 grid w-full grid-cols-3 gap-3">
        {teclas.map((d) => (
          <BotonTecla key={d} onClick={() => tecla(d)} disabled={pending}>
            {d}
          </BotonTecla>
        ))}
        <span />
        <BotonTecla onClick={() => tecla("0")} disabled={pending}>
          0
        </BotonTecla>
        <button
          type="button"
          onClick={borrar}
          disabled={pending || pin.length === 0}
          className="grid h-16 place-items-center rounded-full text-muted transition-colors hover:text-text disabled:opacity-40"
          aria-label="Borrar"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
}

function BotonTecla({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tabular h-16 rounded-full bg-surface text-2xl font-bold shadow-card transition-transform active:scale-95 active:bg-surface-2 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
