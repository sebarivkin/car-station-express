import type { Metadata } from "next";
import PinPad from "@/components/PinPad";

// Pantalla neutra: no dice qué hay detrás de cada código
export const metadata: Metadata = { title: "Bloqueado" };

export default function BloqueoPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <PinPad />
    </main>
  );
}
