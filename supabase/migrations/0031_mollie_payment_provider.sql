-- Vedantix Sales & Billing — Mollie payment provider foundation
-- Provider credentials stay in Supabase Vault. Browser clients never receive the API key.

create table if not exists public.payment_provider_config (
  id boolean primary key default true check (id = true),
  provider text not null default 'MOLLIE' check (provider in ('MOLLIE')),
  enabled boolean not null default false,
  mode text not null default 'TEST' check (mode in ('TEST','LIVE')),
  credentials_configured boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.payment_provider_config(id) values (true) on conflict (id) do nothing;

alter table public.payment_provider_config enable row level security;
drop policy if exists payment_provider_config_staff_read on public.payment_provider_config;
create policy payment_provider_config_staff_read on public.payment_provider_config
for select to authenticated using (public.is_staff());
drop policy if exists payment_provider_config_admin_update on public.payment_provider_config;
create policy payment_provider_config_admin_update on public.payment_provider_config
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));

drop trigger if exists payment_provider_config_set_updated_at on public.payment_provider_config;
create trigger payment_provider_config_set_updated_at
before update on public.payment_provider_config
for each row execute function public.set_updated_at();

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  provider text not null default 'MOLLIE' check (provider in ('MOLLIE')),
  provider_payment_id text unique,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  status text not null default 'CREATING' check (status in ('CREATING','OPEN','PENDING','AUTHORIZED','PAID','FAILED','CANCELED','EXPIRED')),
  checkout_url text,
  redirect_url text,
  provider_created_at timestamptz,
  provider_paid_at timestamptz,
  webhook_received_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists payment_requests_invoice_idx
  on public.payment_requests(invoice_id, created_at desc);
create index if not exists payment_requests_status_idx
  on public.payment_requests(status, created_at desc);

alter table public.payment_requests enable row level security;
drop policy if exists payment_requests_staff_read on public.payment_requests;
create policy payment_requests_staff_read on public.payment_requests
for select to authenticated using (public.is_staff());
revoke insert, update, delete on public.payment_requests from anon, authenticated;
grant select on public.payment_requests to authenticated;

drop trigger if exists payment_requests_set_updated_at on public.payment_requests;
create trigger payment_requests_set_updated_at
before update on public.payment_requests
for each row execute function public.set_updated_at();

create or replace function public.store_mollie_api_key(p_api_key text, p_mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := btrim(coalesce(p_api_key,''));
  v_mode text := upper(btrim(coalesce(p_mode,'TEST')));
begin
  if v_mode not in ('TEST','LIVE') then raise exception 'Unsupported Mollie mode'; end if;
  if v_key = '' then raise exception 'Mollie API key is required'; end if;
  if v_mode='TEST' and left(v_key,5) <> 'test_' then raise exception 'Expected a Mollie test API key'; end if;
  if v_mode='LIVE' and left(v_key,5) <> 'live_' then raise exception 'Expected a Mollie live API key'; end if;

  perform public.upsert_vault_secret('mollie_api_key', v_key, 'Mollie API key used by Vedantix billing.');
  update public.payment_provider_config
  set mode=v_mode, credentials_configured=true, updated_at=now()
  where id=true;
end;
$$;
revoke all on function public.store_mollie_api_key(text,text) from public, anon, authenticated;
grant execute on function public.store_mollie_api_key(text,text) to service_role;

create or replace function public.get_mollie_api_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.decrypted_secret
  from vault.decrypted_secrets d
  where d.name='mollie_api_key'
  order by d.created_at desc
  limit 1;
$$;
revoke all on function public.get_mollie_api_key() from public, anon, authenticated;
grant execute on function public.get_mollie_api_key() to service_role;

create or replace function public.has_mollie_api_key()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(select 1 from vault.secrets s where s.name='mollie_api_key');
$$;
revoke all on function public.has_mollie_api_key() from public, anon, authenticated;
grant execute on function public.has_mollie_api_key() to service_role;

create or replace function public.register_mollie_payment_system(
  p_payment_request_id uuid,
  p_provider_payment_id text,
  p_amount numeric,
  p_paid_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.payment_requests%rowtype;
  v_payment_id uuid;
begin
  select * into r from public.payment_requests where id=p_payment_request_id for update;
  if not found then raise exception 'Payment request not found'; end if;
  if r.provider_payment_id is distinct from p_provider_payment_id then raise exception 'Provider payment mismatch'; end if;
  if round(p_amount,2) is distinct from round(r.amount,2) then raise exception 'Payment amount mismatch'; end if;

  select p.id into v_payment_id
  from public.invoice_payments p
  where p.external_payment_id=p_provider_payment_id
  limit 1;

  if v_payment_id is null then
    insert into public.invoice_payments(
      invoice_id, amount, payment_date, method, reference, notes,
      external_payment_id, metadata
    ) values (
      r.invoice_id, round(p_amount,2), coalesce(p_paid_at::date,current_date), 'MOLLIE',
      p_provider_payment_id, 'Automatisch geregistreerd via Mollie.',
      p_provider_payment_id, jsonb_build_object('payment_request_id',r.id,'provider','MOLLIE')
    ) returning id into v_payment_id;
  end if;

  update public.payment_requests
  set status='PAID', provider_paid_at=coalesce(p_paid_at,now()), updated_at=now()
  where id=r.id;

  perform public.sync_invoice_payment_status(r.invoice_id);
  return v_payment_id;
end;
$$;
revoke all on function public.register_mollie_payment_system(uuid,text,numeric,timestamptz) from public, anon, authenticated;
grant execute on function public.register_mollie_payment_system(uuid,text,numeric,timestamptz) to service_role;
