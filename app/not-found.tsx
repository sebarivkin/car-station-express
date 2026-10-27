import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="card max-w-sm p-8 text-center">
        <h1 className="h-display text-3xl">No encontrado</h1>
        <p className="mt-2 text-muted">Ese registro no existe o fue eliminado.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
