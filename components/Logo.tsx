// El logo es un PNG con fondo crema: lo mostramos sobre su propia "calcomanía"
// para que se lea igual en modo claro y oscuro.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded-xl bg-[#ede8e2] p-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Car Station Express" className="block h-full w-auto" />
    </span>
  );
}
