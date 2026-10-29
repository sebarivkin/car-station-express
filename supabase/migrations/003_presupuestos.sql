-- ============================================================
-- Car Station Express — Presupuestos
-- Ejecutar en Supabase: SQL Editor → pegar todo → Run
-- ============================================================

-- Datos del negocio que salen en el PDF
create table public.negocio (
  id int primary key default 1 check (id = 1),
  nombre text not null default 'Car Station Express',
  telefono text,
  direccion text,
  email text,
  pie_presupuesto text default 'Presupuesto sin valor fiscal. Los precios pueden variar según disponibilidad de repuestos.'
);
insert into public.negocio (id) values (1);

create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  numero int generated always as identity unique,
  fecha date not null default public.hoy_ar(),
  validez_dias int not null default 15 check (validez_dias > 0),
  -- Vehículo cargado (opcional) o datos sueltos para alguien que todavía no es cliente
  vehiculo_id uuid references public.vehiculos (id) on delete set null,
  cliente_nombre text not null,
  cliente_telefono text,
  vehiculo_texto text,
  patente text,
  notas text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptado', 'rechazado')),
  -- Trabajo de taller creado a partir de este presupuesto
  trabajo_id uuid references public.trabajos (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.presupuestos (vehiculo_id);
create index on public.presupuestos (fecha);

create table public.presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos (id) on delete cascade,
  orden int not null default 0,
  tipo text not null check (tipo in ('mano_obra', 'repuesto')),
  descripcion text not null,
  cantidad numeric(10,2) not null default 1 check (cantidad > 0),
  costo_unit numeric(12,2) not null default 0 check (costo_unit >= 0),
  precio_unit numeric(12,2) not null default 0 check (precio_unit >= 0)
);
create index on public.presupuesto_items (presupuesto_id);

-- Totales por presupuesto
create view public.presupuestos_totales with (security_invoker = true) as
select
  p.*,
  coalesce(sum(i.cantidad * i.precio_unit), 0) as total,
  coalesce(sum(i.cantidad * i.costo_unit), 0) as costo,
  coalesce(sum(i.cantidad * i.precio_unit) filter (where i.tipo = 'mano_obra'), 0) as mano_obra
from public.presupuestos p
left join public.presupuesto_items i on i.presupuesto_id = p.id
group by p.id;

-- Alta o edición con sus renglones en una sola transacción
-- p_items: [{tipo, descripcion, cantidad, costo_unit, precio_unit}]
create or replace function public.guardar_presupuesto(
  p_id uuid,
  p_vehiculo_id uuid,
  p_fecha date,
  p_validez_dias int,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_vehiculo_texto text,
  p_patente text,
  p_notas text,
  p_items jsonb
) returns uuid
language plpgsql as $$
declare
  v_id uuid := p_id;
begin
  if nullif(trim(p_cliente_nombre), '') is null then
    raise exception 'Ingresá el nombre del cliente';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Agregá al menos un renglón';
  end if;

  if v_id is null then
    insert into public.presupuestos (vehiculo_id, fecha, validez_dias, cliente_nombre, cliente_telefono,
                                     vehiculo_texto, patente, notas)
    values (p_vehiculo_id, coalesce(p_fecha, public.hoy_ar()), coalesce(p_validez_dias, 15), trim(p_cliente_nombre),
            nullif(trim(p_cliente_telefono), ''), nullif(trim(p_vehiculo_texto), ''),
            nullif(upper(regexp_replace(coalesce(p_patente, ''), '[^A-Za-z0-9]', '', 'g')), ''),
            nullif(trim(p_notas), ''))
    returning id into v_id;
  else
    update public.presupuestos
       set vehiculo_id = p_vehiculo_id, fecha = coalesce(p_fecha, fecha),
           validez_dias = coalesce(p_validez_dias, validez_dias), cliente_nombre = trim(p_cliente_nombre),
           cliente_telefono = nullif(trim(p_cliente_telefono), ''), vehiculo_texto = nullif(trim(p_vehiculo_texto), ''),
           patente = nullif(upper(regexp_replace(coalesce(p_patente, ''), '[^A-Za-z0-9]', '', 'g')), ''),
           notas = nullif(trim(p_notas), '')
     where id = v_id;
    if not found then raise exception 'Presupuesto no encontrado'; end if;
    delete from public.presupuesto_items where presupuesto_id = v_id;
  end if;

  insert into public.presupuesto_items (presupuesto_id, orden, tipo, descripcion, cantidad, costo_unit, precio_unit)
  select v_id, (e.ord - 1)::int, e.i ->> 'tipo', trim(e.i ->> 'descripcion'),
         coalesce((e.i ->> 'cantidad')::numeric, 1),
         coalesce((e.i ->> 'costo_unit')::numeric, 0),
         coalesce((e.i ->> 'precio_unit')::numeric, 0)
  from jsonb_array_elements(p_items) with ordinality as e(i, ord);

  return v_id;
end $$;

-- Pasa un presupuesto aceptado a trabajo de taller (sin cobro: queda como deuda hasta que paguen)
create or replace function public.presupuesto_a_trabajo(p_id uuid)
returns uuid
language plpgsql as $$
declare
  p public.presupuestos;
  v_trabajo uuid;
  v_desc text;
  v_mo numeric;
begin
  select * into p from public.presupuestos where id = p_id;
  if not found then raise exception 'Presupuesto no encontrado'; end if;
  if p.trabajo_id is not null then return p.trabajo_id; end if;
  if p.vehiculo_id is null then
    raise exception 'El presupuesto no tiene un vehículo cargado';
  end if;

  select coalesce(string_agg(descripcion, ' · ' order by orden), 'Trabajo según presupuesto N° ' || p.numero),
         coalesce(sum(cantidad * precio_unit), 0)
    into v_desc, v_mo
    from public.presupuesto_items where presupuesto_id = p_id and tipo = 'mano_obra';

  insert into public.trabajos (vehiculo_id, descripcion, mano_obra, notas)
  values (p.vehiculo_id, v_desc, v_mo, 'Según presupuesto N° ' || p.numero)
  returning id into v_trabajo;

  insert into public.trabajo_repuestos (trabajo_id, descripcion, cantidad, costo_unit, precio_unit)
  select v_trabajo, descripcion, cantidad, costo_unit, precio_unit
    from public.presupuesto_items where presupuesto_id = p_id and tipo = 'repuesto' order by orden;

  update public.presupuestos set trabajo_id = v_trabajo, estado = 'aceptado' where id = p_id;
  return v_trabajo;
end $$;

-- Seguridad: igual que el resto (solo allowlist)
alter table public.negocio enable row level security;
alter table public.presupuestos enable row level security;
alter table public.presupuesto_items enable row level security;
create policy "solo allowlist" on public.negocio for all to authenticated using (public.is_allowed()) with check (public.is_allowed());
create policy "solo allowlist" on public.presupuestos for all to authenticated using (public.is_allowed()) with check (public.is_allowed());
create policy "solo allowlist" on public.presupuesto_items for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

grant select, update on public.negocio to authenticated;
grant select, insert, update, delete on public.presupuestos, public.presupuesto_items to authenticated;
grant select on public.presupuestos_totales to authenticated;
revoke execute on function public.guardar_presupuesto, public.presupuesto_a_trabajo from anon, public;
grant execute on function public.guardar_presupuesto, public.presupuesto_a_trabajo to authenticated;
