-- ============================================================
-- Car Station Express — Lubricentro y Taller
-- Migración inicial: tablas, vistas, funciones y seguridad (RLS)
-- Ejecutar en Supabase: SQL Editor → pegar todo → Run
-- ============================================================

create extension if not exists pgcrypto;

-- Fecha de hoy en Argentina (la base corre en UTC)
create or replace function public.hoy_ar()
returns date
language sql stable as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- ---------- Acceso: solo los mails de esta lista ----------
create table public.allowlist (
  email text primary key
);

insert into public.allowlist (email) values
  ('rivkin.sebastian@gmail.com'),
  ('franco3625@gmail.com');
  -- Para habilitar otro mail más adelante:
  -- insert into public.allowlist (email) values ('otro.mail@gmail.com');

create or replace function public.is_allowed()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

-- ---------- Clientes y vehículos ----------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  notas text,
  created_at timestamptz not null default now()
);

create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  patente text not null unique,          -- guardada en mayúsculas y sin espacios
  marca text not null,
  modelo text not null,
  anio int,
  notas text,
  created_at timestamptz not null default now()
);
create index on public.vehiculos (cliente_id);

-- ---------- Catálogos ----------
create table public.articulos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  costo numeric(12,2) not null default 0 check (costo >= 0),
  precio numeric(12,2) not null default 0 check (precio >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index articulos_nombre_uq on public.articulos (lower(nombre));

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  created_at timestamptz not null default now()
);
create unique index proveedores_nombre_uq on public.proveedores (lower(nombre));

-- ---------- Lubricentro: services ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  fecha date not null default public.hoy_ar(),
  km int check (km >= 0),
  notas text,
  created_at timestamptz not null default now()
);
create index on public.services (vehiculo_id);
create index on public.services (fecha);

-- Costo y precio se copian al momento: cambiar el catálogo no altera el historial
create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  articulo_id uuid references public.articulos (id) on delete set null,
  descripcion text not null,
  cantidad numeric(10,2) not null check (cantidad > 0),
  costo_unit numeric(12,2) not null default 0 check (costo_unit >= 0),
  precio_unit numeric(12,2) not null default 0 check (precio_unit >= 0)
);
create index on public.service_items (service_id);

-- ---------- Taller: trabajos ----------
create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  fecha date not null default public.hoy_ar(),
  km int check (km >= 0),
  descripcion text not null,
  mano_obra numeric(12,2) not null default 0 check (mano_obra >= 0),
  notas text,
  created_at timestamptz not null default now()
);
create index on public.trabajos (vehiculo_id);
create index on public.trabajos (fecha);

create table public.trabajo_repuestos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  descripcion text not null,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  cantidad numeric(10,2) not null check (cantidad > 0),
  costo_unit numeric(12,2) not null default 0 check (costo_unit >= 0),
  precio_unit numeric(12,2) not null default 0 check (precio_unit >= 0)
);
create index on public.trabajo_repuestos (trabajo_id);
create index on public.trabajo_repuestos (proveedor_id);

-- ---------- Cobros ----------
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services (id) on delete cascade,
  trabajo_id uuid references public.trabajos (id) on delete cascade,
  fecha date not null default public.hoy_ar(),
  monto numeric(12,2) not null check (monto > 0),
  medio text not null check (medio in ('efectivo', 'transferencia', 'tarjeta')),
  created_at timestamptz not null default now(),
  check ((service_id is null) <> (trabajo_id is null))
);
create index on public.pagos (service_id);
create index on public.pagos (trabajo_id);
create index on public.pagos (fecha);

-- ---------- Empleados ----------
create table public.empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true
);

insert into public.empleados (nombre) values ('Walter'), ('Brian');

create table public.adelantos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  fecha date not null default public.hoy_ar(),
  monto numeric(12,2) not null check (monto > 0),
  nota text,
  created_at timestamptz not null default now()
);
create index on public.adelantos (empleado_id, fecha);

-- ============================================================
-- Vistas (security_invoker: respetan el RLS de las tablas)
-- ============================================================

-- Todas las operaciones (services + trabajos) con totales, costo, cobrado y saldo
create view public.operaciones with (security_invoker = true) as
with s as (
  select
    sv.id, sv.vehiculo_id, sv.fecha, sv.km, sv.created_at,
    coalesce(string_agg(si.descripcion, ' · ' order by si.descripcion), 'Service') as descripcion,
    coalesce(sum(si.cantidad * si.precio_unit), 0) as total,
    coalesce(sum(si.cantidad * si.costo_unit), 0) as costo
  from public.services sv
  left join public.service_items si on si.service_id = sv.id
  group by sv.id
),
t as (
  select
    tr.id, tr.vehiculo_id, tr.fecha, tr.km, tr.created_at, tr.descripcion, tr.mano_obra,
    coalesce(sum(r.cantidad * r.precio_unit), 0) as repuestos_venta,
    coalesce(sum(r.cantidad * r.costo_unit), 0) as repuestos_costo
  from public.trabajos tr
  left join public.trabajo_repuestos r on r.trabajo_id = tr.id
  group by tr.id
),
p as (
  select service_id, trabajo_id, sum(monto) as cobrado
  from public.pagos
  group by service_id, trabajo_id
),
u as (
  select 'service'::text as tipo, s.id, s.vehiculo_id, s.fecha, s.km, s.created_at, s.descripcion,
         s.total, s.costo, 0::numeric as mano_obra, 0::numeric as repuestos_venta,
         0::numeric as repuestos_costo, coalesce(p.cobrado, 0) as cobrado
  from s left join p on p.service_id = s.id
  union all
  select 'taller', t.id, t.vehiculo_id, t.fecha, t.km, t.created_at, t.descripcion,
         t.mano_obra + t.repuestos_venta, t.repuestos_costo, t.mano_obra, t.repuestos_venta,
         t.repuestos_costo, coalesce(p.cobrado, 0)
  from t left join p on p.trabajo_id = t.id
)
select
  u.*,
  u.total - u.costo as utilidad,
  greatest(u.total - u.cobrado, 0) as saldo,
  v.patente, v.marca, v.modelo,
  c.id as cliente_id, c.nombre as cliente_nombre, c.telefono as cliente_telefono
from u
join public.vehiculos v on v.id = u.vehiculo_id
join public.clientes c on c.id = v.cliente_id;

-- Vehículos con su dueño, para el buscador
create view public.vehiculos_busqueda with (security_invoker = true) as
select
  v.id, v.patente, v.marca, v.modelo, v.anio, v.created_at,
  c.id as cliente_id, c.nombre as cliente_nombre, c.telefono as cliente_telefono,
  -- texto de búsqueda en minúsculas y sin acentos
  translate(lower(c.nombre || ' ' || v.marca || ' ' || v.modelo || ' ' || v.patente),
            'áéíóúüñàèìòù', 'aeiouunaeiou') as texto,
  (select max(o.fecha) from (
     select fecha from public.services where vehiculo_id = v.id
     union all
     select fecha from public.trabajos where vehiculo_id = v.id
   ) o) as ultima_visita
from public.vehiculos v
join public.clientes c on c.id = v.cliente_id;

-- ============================================================
-- Funciones para guardar operaciones completas en una transacción
-- (security invoker: corren con los permisos del usuario → aplica RLS)
-- ============================================================

-- p_items: [{articulo_id, descripcion, cantidad, costo_unit, precio_unit}]
-- p_id null = alta; con id = edición (reemplaza los renglones)
-- p_pago_monto / p_pago_medio: cobro inicial (solo en el alta)
create or replace function public.guardar_service(
  p_id uuid,
  p_vehiculo_id uuid,
  p_fecha date,
  p_km int,
  p_notas text,
  p_items jsonb,
  p_pago_monto numeric default null,
  p_pago_medio text default null
) returns uuid
language plpgsql as $$
declare
  v_id uuid := p_id;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Agregá al menos un artículo';
  end if;

  if v_id is null then
    insert into public.services (vehiculo_id, fecha, km, notas)
    values (p_vehiculo_id, coalesce(p_fecha, public.hoy_ar()), p_km, nullif(trim(p_notas), ''))
    returning id into v_id;
  else
    update public.services
       set fecha = coalesce(p_fecha, fecha), km = p_km, notas = nullif(trim(p_notas), '')
     where id = v_id;
    if not found then raise exception 'Service no encontrado'; end if;
    delete from public.service_items where service_id = v_id;
  end if;

  insert into public.service_items (service_id, articulo_id, descripcion, cantidad, costo_unit, precio_unit)
  select v_id,
         nullif(i ->> 'articulo_id', '')::uuid,
         trim(i ->> 'descripcion'),
         (i ->> 'cantidad')::numeric,
         coalesce((i ->> 'costo_unit')::numeric, 0),
         coalesce((i ->> 'precio_unit')::numeric, 0)
  from jsonb_array_elements(p_items) i;

  if p_id is null and coalesce(p_pago_monto, 0) > 0 then
    insert into public.pagos (service_id, fecha, monto, medio)
    values (v_id, coalesce(p_fecha, public.hoy_ar()), p_pago_monto, p_pago_medio);
  end if;

  return v_id;
end $$;

-- Busca un proveedor por nombre (sin distinguir mayúsculas) o lo crea
create or replace function public.proveedor_por_nombre(p_nombre text)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
  v_nombre text := nullif(trim(p_nombre), '');
begin
  if v_nombre is null then return null; end if;
  select id into v_id from public.proveedores where lower(nombre) = lower(v_nombre);
  if v_id is null then
    insert into public.proveedores (nombre) values (v_nombre) returning id into v_id;
  end if;
  return v_id;
end $$;

-- p_repuestos: [{descripcion, proveedor, cantidad, costo_unit, precio_unit}]
create or replace function public.guardar_trabajo(
  p_id uuid,
  p_vehiculo_id uuid,
  p_fecha date,
  p_km int,
  p_descripcion text,
  p_mano_obra numeric,
  p_notas text,
  p_repuestos jsonb,
  p_pago_monto numeric default null,
  p_pago_medio text default null
) returns uuid
language plpgsql as $$
declare
  v_id uuid := p_id;
begin
  if nullif(trim(p_descripcion), '') is null then
    raise exception 'Describí el trabajo realizado';
  end if;

  if v_id is null then
    insert into public.trabajos (vehiculo_id, fecha, km, descripcion, mano_obra, notas)
    values (p_vehiculo_id, coalesce(p_fecha, public.hoy_ar()), p_km, trim(p_descripcion),
            coalesce(p_mano_obra, 0), nullif(trim(p_notas), ''))
    returning id into v_id;
  else
    update public.trabajos
       set fecha = coalesce(p_fecha, fecha), km = p_km, descripcion = trim(p_descripcion),
           mano_obra = coalesce(p_mano_obra, 0), notas = nullif(trim(p_notas), '')
     where id = v_id;
    if not found then raise exception 'Trabajo no encontrado'; end if;
    delete from public.trabajo_repuestos where trabajo_id = v_id;
  end if;

  insert into public.trabajo_repuestos (trabajo_id, descripcion, proveedor_id, cantidad, costo_unit, precio_unit)
  select v_id,
         trim(r ->> 'descripcion'),
         public.proveedor_por_nombre(r ->> 'proveedor'),
         (r ->> 'cantidad')::numeric,
         coalesce((r ->> 'costo_unit')::numeric, 0),
         coalesce((r ->> 'precio_unit')::numeric, 0)
  from jsonb_array_elements(coalesce(p_repuestos, '[]'::jsonb)) r;

  if p_id is null and coalesce(p_pago_monto, 0) > 0 then
    insert into public.pagos (trabajo_id, fecha, monto, medio)
    values (v_id, coalesce(p_fecha, public.hoy_ar()), p_pago_monto, p_pago_medio);
  end if;

  return v_id;
end $$;

-- Ajuste masivo de precios por porcentaje (opcionalmente solo una categoría)
-- p_campo: 'precio', 'costo' o 'ambos'
create or replace function public.ajustar_precios(p_pct numeric, p_campo text, p_categoria text default null)
returns int
language plpgsql as $$
declare
  n int;
begin
  update public.articulos
     set precio = case when p_campo in ('precio', 'ambos') then round(precio * (1 + p_pct / 100), 2) else precio end,
         costo  = case when p_campo in ('costo', 'ambos')  then round(costo  * (1 + p_pct / 100), 2) else costo  end
   where activo
     and (nullif(p_categoria, '') is null or categoria = p_categoria);
  get diagnostics n = row_count;
  return n;
end $$;

-- ============================================================
-- Seguridad: solo usuarios de la allowlist leen y escriben
-- ============================================================
alter table public.allowlist enable row level security; -- sin políticas: nadie la lee desde la app

do $$
declare
  t text;
begin
  foreach t in array array[
    'clientes', 'vehiculos', 'articulos', 'proveedores', 'services', 'service_items',
    'trabajos', 'trabajo_repuestos', 'pagos', 'empleados', 'adelantos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "solo allowlist" on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())',
      t
    );
  end loop;
end $$;

-- Permisos explícitos para la API (funciona aunque el proyecto tenga
-- desactivado "Automatically expose new tables"). Solo usuarios logueados;
-- además el RLS exige que el mail esté en la allowlist.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.clientes, public.vehiculos, public.articulos, public.proveedores,
  public.services, public.service_items, public.trabajos, public.trabajo_repuestos,
  public.pagos, public.empleados, public.adelantos
  to authenticated;
grant select on public.operaciones, public.vehiculos_busqueda to authenticated;
grant execute on function public.hoy_ar, public.is_allowed, public.guardar_service,
  public.guardar_trabajo, public.proveedor_por_nombre, public.ajustar_precios
  to authenticated;

revoke all on public.allowlist from anon, authenticated;
revoke execute on function public.guardar_service, public.guardar_trabajo,
  public.proveedor_por_nombre, public.ajustar_precios from anon, public;
