-- Vedantix production cutover readiness and activation audit

create table if not exists public.commerce_production_activation (
  id boolean primary key default true check (id = true),
  public_base_url text not null default 'https://vedantix.nl',
  expected_release_marker text not null default 'VEDANTIX_LOVABLE_COMMERCE_READY',
  live_marker_ok boolean not null default false,
  preview_marker_ok boolean not null default false,
  last_checked_at timestamptz,
  last_check_details jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  activated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.commerce_production_activation(id) values (true) on conflict (id) do nothing;

alter table public.commerce_production_activation enable row level security;

drop policy if exists commerce_production_activation_staff_read on public.commerce_production_activation;
create policy commerce_production_activation_staff_read on public.commerce_production_activation
for select to authenticated using (public.is_staff());

drop policy if exists commerce_production_activation_admin_update on public.commerce_production_activation;
create policy commerce_production_activation_admin_update on public.commerce_production_activation
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));

drop trigger if exists commerce_production_activation_set_updated_at on public.commerce_production_activation;
create trigger commerce_production_activation_set_updated_at
before update on public.commerce_production_activation
for each row execute function public.set_updated_at();

create index if not exists commerce_production_activation_activated_by_idx
  on public.commerce_production_activation(activated_by)
  where activated_by is not null;
