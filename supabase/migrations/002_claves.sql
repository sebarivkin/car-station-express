-- ============================================================
-- Car Station Express — Pantalla de clave
-- Dos claves numéricas: una abre la gestión y otra abre la agenda.
-- Se guardan cifradas (bcrypt); el código del repo nunca las contiene.
-- Ejecutar en Supabase: SQL Editor → pegar todo → Run
-- ============================================================

create table public.seguridad (
  id int primary key default 1 check (id = 1),
  pin_gestion text,
  pin_agenda text
);
insert into public.seguridad (id) values (1);

-- Intentos fallidos por usuario: 5 errores seguidos bloquean 5 minutos
create table public.pin_intentos (
  user_id uuid primary key,
  fallos int not null default 0,
  bloqueado_hasta timestamptz
);

-- Sin políticas: solo se tocan a través de las funciones de abajo
alter table public.seguridad enable row level security;
alter table public.pin_intentos enable row level security;
revoke all on public.seguridad, public.pin_intentos from anon, authenticated;

-- Devuelve 'gestion', 'agenda' o null (clave incorrecta)
create or replace function public.verificar_pin(p_pin text)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid uuid := auth.uid();
  s public.seguridad;
  i public.pin_intentos;
begin
  if v_uid is null or not public.is_allowed() then
    return null;
  end if;

  select * into i from public.pin_intentos where user_id = v_uid;
  if i.bloqueado_hasta is not null and i.bloqueado_hasta > now() then
    raise exception 'Demasiados intentos';
  end if;

  select * into s from public.seguridad where id = 1;
  if s.pin_gestion is null or s.pin_agenda is null then
    raise exception 'Las claves no están configuradas';
  end if;

  if crypt(p_pin, s.pin_gestion) = s.pin_gestion then
    delete from public.pin_intentos where user_id = v_uid;
    return 'gestion';
  end if;
  if crypt(p_pin, s.pin_agenda) = s.pin_agenda then
    delete from public.pin_intentos where user_id = v_uid;
    return 'agenda';
  end if;

  insert into public.pin_intentos (user_id, fallos) values (v_uid, 1)
  on conflict (user_id) do update
    set fallos = case when pin_intentos.fallos + 1 >= 5 then 0 else pin_intentos.fallos + 1 end,
        bloqueado_hasta = case when pin_intentos.fallos + 1 >= 5 then now() + interval '5 minutes'
                               else pin_intentos.bloqueado_hasta end;
  return null;
end $$;

-- Cambia las dos claves; exige la clave de gestión actual
create or replace function public.cambiar_claves(p_actual text, p_gestion text, p_agenda text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.seguridad;
begin
  if not public.is_allowed() then
    raise exception 'Sin permiso';
  end if;
  select * into s from public.seguridad where id = 1;
  if s.pin_gestion is not null and crypt(p_actual, s.pin_gestion) <> s.pin_gestion then
    raise exception 'La clave actual no es correcta';
  end if;
  if p_gestion !~ '^\d{4}$' or p_agenda !~ '^\d{4}$' then
    raise exception 'Las claves tienen que ser de 4 números';
  end if;
  if p_gestion = p_agenda then
    raise exception 'Las dos claves tienen que ser distintas';
  end if;
  update public.seguridad
     set pin_gestion = crypt(p_gestion, gen_salt('bf')),
         pin_agenda  = crypt(p_agenda,  gen_salt('bf'))
   where id = 1;
end $$;

revoke execute on function public.verificar_pin, public.cambiar_claves from anon, public;
grant execute on function public.verificar_pin, public.cambiar_claves to authenticated;

-- Para cargar las claves la primera vez (NO guardar este paso en el repo):
-- update public.seguridad
--    set pin_gestion = extensions.crypt('XXXX', extensions.gen_salt('bf')),
--        pin_agenda  = extensions.crypt('YYYY', extensions.gen_salt('bf'))
--  where id = 1;
