# Puesta en marcha — Car Station Express

Pasos que hay que hacer **una sola vez**. Todo es gratis.

## Quién es dueño de qué

| Servicio | Cuenta | Nota |
|---|---|---|
| Supabase (base de datos + login) | **Franco** | Vos entrás como miembro *Developer*: no ocupa tu cupo de 2 proyectos gratis. |
| Google Cloud (login con Google) | **Franco** | Así todo lo del negocio queda a su nombre. |
| GitHub | **Sebastián** | Repo **público**: Vercel gratis no deploya repos privados de otra persona. El código no tiene claves; los datos están protegidos por login + lista de mails + RLS. |
| Vercel (hosting) | **Franco** | Conectado al repo público; cada `git push` publica solo. |

## 1. Crear el proyecto en Supabase (cuenta de Franco)

1. Entrá a https://supabase.com con la cuenta de Google de **Franco** (`franco3625@gmail.com`).
2. **New project** → nombre `car-station-express`, región *South America (São Paulo)*, y una contraseña de base de datos (guardala).
3. **Organization Settings → Team → Invite** → tu mail (`rivkin.sebastian@gmail.com`) con rol **Developer**.
   Importante: *Developer*, no *Owner* ni *Administrator*, porque esos roles sí cuentan para tu límite de proyectos gratis.
   Aceptá la invitación desde tu mail; desde ahí manejás la base con tu propio usuario.
4. Cuando termine, andá a **Project Settings → API** y copiá:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / publishable key**

## 2. Configurar las claves en la app

1. En la carpeta del proyecto, copiá `.env.example` como `.env.local`.
2. Pegá la URL y la key:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Crear las tablas

1. En Supabase: **SQL Editor** → **New query**.
2. Abrí `supabase/migrations/001_init.sql`, copiá TODO, pegalo y tocá **Run**. Tiene que decir "Success".

Ya quedan habilitados `rivkin.sebastian@gmail.com` y `franco3625@gmail.com`. Cualquier otro mail que entre ve la pantalla "Sin acceso".
Para sumar otro más adelante:

```sql
insert into public.allowlist (email) values ('otro.mail@gmail.com');
```

## 4. Login con Google (cuenta de Franco)

1. En https://console.cloud.google.com, con la cuenta de **Franco**, creá un proyecto `car-station-express`.
2. **APIs & Services → OAuth consent screen** → *External* → completá nombre y mail → guardá.
3. **Credentials → Create credentials → OAuth Client ID** → tipo *Web application*.
   En **Authorized redirect URIs** pegá la que muestra Supabase en
   **Authentication → Sign In / Providers → Google** (`https://xxxx.supabase.co/auth/v1/callback`).
4. Copiá **Client ID** y **Client Secret** y pegalos en Supabase (**Authentication → Providers → Google**) → **Save**.
5. En Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3010` (después la cambiás por la de Vercel)
   - **Redirect URLs**: agregá `http://localhost:3010/**` y, cuando la tengas, `https://TU-APP.vercel.app/**`

## 5. Probar en tu PC

```bash
npm install
npm run dev -- -p 3010
```

Abrí http://localhost:3010 y entrá con Google.

## 6. Cargar la lista de precios

En **Artículos → Importar lista de precios** subí el Excel de Franco. La primera fila tiene que tener
los títulos **Artículo**, **Categoría** (opcional), **Costo** y **Venta**. Si un artículo ya existe
(mismo nombre) se actualiza el precio; si no, se crea.

## 7. Publicar en internet (GitHub tuyo + Vercel de Franco)

1. Subí el proyecto a **tu** GitHub como repo **público** `car-station-express`.
   Antes de subir, confirmá que `.env.local` no aparece en `git status` (está en `.gitignore`).
2. En https://vercel.com, con la cuenta de **Franco** (registrate con su GitHub o su mail) → **Add New → Project**
   → **Import Third-Party Git Repository** → pegá la URL del repo `https://github.com/sebarivkin/car-station-express`.
   Si Vercel pide conectar GitHub, Franco puede usar cualquier cuenta de GitHub suya: al ser público, no necesita permisos sobre tu repo.
3. En **Environment Variables** cargá las mismas dos variables del `.env.local`.
4. **Deploy**. Te da una URL tipo `https://car-station-express.vercel.app`.
5. Volvé al paso 4.5 y agregá esa URL en Supabase (Site URL y Redirect URLs).
6. Desde ahí, cada `git push` publica la nueva versión sola.

En el celular de Franco: abrir la URL en Chrome → menú ⋮ → **Agregar a la pantalla principal**. Queda como una app.

## Respaldo

**Exportar a Excel** (menú lateral, o **Más** en el celular) baja todo en un archivo. Conviene hacerlo
una vez por mes: el plan gratis de Supabase no guarda copias automáticas.

> El plan gratis de Supabase pausa el proyecto si pasa una semana sin uso. Con uso diario no pasa;
> si alguna vez se pausa, se reactiva desde el panel de Supabase con un clic.
