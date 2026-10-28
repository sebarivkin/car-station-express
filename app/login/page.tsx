import GoogleButton from "@/components/GoogleButton";
import Logo from "@/components/Logo";
import Flash from "@/components/Flash";
import { supabaseConfigured } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-8 text-center">
        <Logo className="mx-auto h-36" />
        <h1 className="h-display mt-6 text-2xl">Bienvenido</h1>
        <p className="mt-1 mb-7 text-muted">Entrá con tu cuenta para continuar.</p>
        <Flash error={error} />
        {supabaseConfigured() ? (
          <GoogleButton />
        ) : (
          <p className="rounded-xl bg-warn-soft p-3 text-sm font-semibold text-warn">
            Falta configurar Supabase (ver SETUP.md).
          </p>
        )}
      </div>
    </main>
  );
}
