import { BottomNav, Sidebar, TopBar } from "@/components/Nav";
import Logo from "@/components/Logo";
import { getSession, supabaseConfigured } from "@/lib/auth";
import { cerrarSesion } from "@/app/actions/sesion";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="h-display mb-4 text-3xl">Falta configurar Supabase</h1>
        <p className="text-muted">
          Creá el archivo <code className="rounded bg-surface-2 px-1">.env.local</code> con las claves de
          tu proyecto de Supabase. Los pasos están en <code className="rounded bg-surface-2 px-1">SETUP.md</code>.
        </p>
      </main>
    );
  }

  const { user, permitido } = await getSession();

  if (!permitido) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <Logo className="mx-auto h-28" />
          <h1 className="h-display mt-6 text-2xl">Sin acceso</h1>
          <p className="mt-2 text-muted">
            La cuenta <strong className="text-text">{user.email}</strong> no está habilitada. Pedile al
            administrador que la agregue.
          </p>
          <form action={cerrarSesion} className="mt-6">
            <button className="btn btn-secondary w-full">Entrar con otra cuenta</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <Sidebar email={user.email ?? ""} />
      <TopBar />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
          {children}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
