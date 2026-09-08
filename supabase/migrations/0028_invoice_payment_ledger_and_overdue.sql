-- Vedantix Sales & Billing — payment ledger and overdue status handling
-- Payments become immutable accounting events. Corrections are recorded by voiding a payment,
-- never by silently deleting history.

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null default current_date,
  method text not null default 'BANK_TRANSFER' check (method in ('BANK_TRANSFER','IDEAL','CARD','CASH','MOLLIE','OTHER')),
  reference text,
  notes text,
  external_payment_id text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  void_reason text
);

create index if not exists invoice_payments_invoice_idx
  on public.invoice_payments(invoice_id, payment_date desc, created_at desc);
create index if not exists invoice_payments_active_idx
  on public.invoice_payments(invoice_id)
  where voided_at is null;

alter table public.invoice_payments enable row level security;

drop policy if exists invoice_payments_staff_read on public.invoice_payments;
create policy invoice_payments_staff_read on public.invoice_payments
for select to authenticated
using (public.is_staff());

revoke insert, update, delete on public.invoice_payments from anon, authenticated;
grant select on public.invoice_payments to authenticated;

-- Preserve amounts that were registered before a separate payment ledger existed.
insert into public.invoice_payments (
  invoice_id,
  amount,
  payment_date,
  method,
  reference,
  notes,
  created_by
)
select
  i.id,
  i.amount_paid,
  coalesce(i.paid_at::date, i.invoice_date, current_date),
  'OTHER',
  i.payment_reference,
  'Gemigreerd vanuit het eerdere invoices.amount_paid veld.',
  i.created_by
from public.invoices i
where i.amount_paid > 0
  and not exists (
    select 1 from public.invoice_payments p where p.invoice_id = i.id
  );

-- Compatibility guard for the older Facturen UI, which still writes amount_paid directly.
-- An increase is converted into a ledger event. A decrease must be handled by voiding a payment,
-- otherwise accounting history could be silently rewritten.
create or replace function public.capture_legacy_invoice_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric(12,2);
begin
  if coalesce(current_setting('vedantix.payment_sync', true), '0') = '1' then
    return new;
  end if;

  if new.amount_paid is not distinct from old.amount_paid then
    return new;
  end if;

  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  if new.amount_paid < old.amount_paid then
    raise exception 'Paid amount cannot be reduced directly; void the payment instead';
  end if;

  if old.invoice_number is null or old.status = 'DRAFT' then
    raise exception 'Payments can only be registered on finalized invoices';
  end if;

  if new.amount_paid > old.total_incl_vat + 0.01 then
    raise exception 'Payment exceeds invoice total';
  end if;

  v_delta := round(new.amount_paid - old.amount_paid, 2);
  if v_delta > 0 then
    insert into public.invoice_payments (
      invoice_id,
      amount,
      payment_date,
      method,
      reference,
      notes,
      created_by
    ) values (
      old.id,
      v_delta,
      current_date,
      'OTHER',
      new.payment_reference,
      'Automatisch vastgelegd via bestaande Facturen-actie.',
      auth.uid()
    );
  end if;

  return new;
end;
$$;

revoke all on function public.capture_legacy_invoice_amount_paid() from public, anon, authenticated;

drop trigger if exists capture_legacy_invoice_amount_paid_trigger on public.invoices;
create trigger capture_legacy_invoice_amount_paid_trigger
before update of amount_paid on public.invoices
for each row
execute function public.capture_legacy_invoice_amount_paid();

create or replace function public.sync_invoice_payment_status(p_invoice_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invoices%rowtype;
  v_paid numeric(12,2);
  v_status text;
  v_last_payment_at timestamptz;
begin
  select * into inv
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  select
    coalesce(sum(p.amount), 0),
    max(p.created_at)
  into v_paid, v_last_payment_at
  from public.invoice_payments p
  where p.invoice_id = p_invoice_id
    and p.voided_at is null;

  if inv.status = 'CREDITED' then
    v_status := 'CREDITED';
  elsif v_paid >= inv.total_incl_vat and inv.total_incl_vat > 0 then
    v_status := 'PAID';
  elsif inv.due_date is not null
    and inv.due_date < current_date
    and v_paid < inv.total_incl_vat then
    v_status := 'OVERDUE';
  elsif v_paid > 0 then
    v_status := 'PARTIALLY_PAID';
  elsif inv.status = 'DRAFT' then
    v_status := 'DRAFT';
  elsif inv.sent_at is not null then
    v_status := 'SENT';
  else
    v_status := 'FINALIZED';
  end if;

  perform set_config('vedantix.payment_sync', '1', true);
  update public.invoices
  set amount_paid = round(v_paid, 2),
      status = v_status,
      paid_at = case when v_status = 'PAID' then coalesce(v_last_payment_at, now()) else null end,
      updated_at = now()
  where id = p_invoice_id;
  perform set_config('vedantix.payment_sync', '0', true);

  return v_status;
end;
$$;

revoke all on function public.sync_invoice_payment_status(uuid) from public, anon, authenticated;

create or replace function public.register_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_date date default current_date,
  p_method text default 'BANK_TRANSFER',
  p_reference text default null,
  p_notes text default null,
  p_external_payment_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invoices%rowtype;
  v_existing numeric(12,2);
  v_remaining numeric(12,2);
  v_id uuid;
  v_method text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  v_method := upper(trim(coalesce(p_method, 'BANK_TRANSFER')));
  if v_method not in ('BANK_TRANSFER','IDEAL','CARD','CASH','MOLLIE','OTHER') then
    raise exception 'Unsupported payment method';
  end if;

  select * into inv
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if inv.status in ('DRAFT','CREDITED') or inv.invoice_number is null then
    raise exception 'Payments can only be registered on finalized invoices';
  end if;

  select coalesce(sum(amount), 0)
  into v_existing
  from public.invoice_payments
  where invoice_id = p_invoice_id
    and voided_at is null;

  v_remaining := round(inv.total_incl_vat - v_existing, 2);
  if v_remaining <= 0 then
    raise exception 'Invoice is already fully paid';
  end if;

  if round(p_amount, 2) > v_remaining + 0.01 then
    raise exception 'Payment exceeds outstanding amount';
  end if;

  insert into public.invoice_payments (
    invoice_id,
    amount,
    payment_date,
    method,
    reference,
    notes,
    external_payment_id,
    created_by
  ) values (
    p_invoice_id,
    round(p_amount, 2),
    coalesce(p_payment_date, current_date),
    v_method,
    nullif(left(trim(coalesce(p_reference, '')), 255), ''),
    nullif(left(trim(coalesce(p_notes, '')), 2000), ''),
    nullif(left(trim(coalesce(p_external_payment_id, '')), 255), ''),
    auth.uid()
  )
  returning id into v_id;

  perform public.sync_invoice_payment_status(p_invoice_id);
  return v_id;
end;
$$;

revoke all on function public.register_invoice_payment(uuid,numeric,date,text,text,text,text) from public, anon, authenticated;
grant execute on function public.register_invoice_payment(uuid,numeric,date,text,text,text,text) to authenticated;

create or replace function public.void_invoice_payment(
  p_payment_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.invoice_payments%rowtype;
begin
  if not public.is_staff(array['ADMIN']) then
    raise exception 'Only an admin can void a payment';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'A void reason is required';
  end if;

  select * into p
  from public.invoice_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if p.voided_at is not null then
    return public.sync_invoice_payment_status(p.invoice_id);
  end if;

  update public.invoice_payments
  set voided_at = now(),
      voided_by = auth.uid(),
      void_reason = left(trim(p_reason), 1000)
  where id = p_payment_id;

  return public.sync_invoice_payment_status(p.invoice_id);
end;
$$;

revoke all on function public.void_invoice_payment(uuid,text) from public, anon, authenticated;
grant execute on function public.void_invoice_payment(uuid,text) to authenticated;

create or replace function public.refresh_overdue_invoices()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_count integer := 0;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;

  for r in
    select id
    from public.invoices
    where status not in ('DRAFT','CREDITED')
      and invoice_number is not null
  loop
    perform public.sync_invoice_payment_status(r.id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.refresh_overdue_invoices() from public, anon, authenticated;
grant execute on function public.refresh_overdue_invoices() to authenticated;

-- Normalize legacy statuses once after the ledger has been populated.
do $$
declare r record;
begin
  for r in select id from public.invoices where status <> 'DRAFT' and invoice_number is not null loop
    perform public.sync_invoice_payment_status(r.id);
  end loop;
end $$;
