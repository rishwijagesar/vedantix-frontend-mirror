-- Vedantix Sales & Billing — customer delivery, public invoice links and reminders

alter table public.invoices
  add column if not exists public_token uuid not null default gen_random_uuid(),
  add column if not exists reminder_count integer not null default 0 check (reminder_count between 0 and 10),
  add column if not exists last_reminder_at timestamptz;

create unique index if not exists invoices_public_token_uidx on public.invoices(public_token);

create table if not exists public.billing_email_config (
  id boolean primary key default true check (id = true),
  delivery_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  delivery_schedule text not null default '*/5 * * * *',
  reminder_schedule text not null default '0 7 * * *',
  updated_at timestamptz not null default now()
);

insert into public.billing_email_config(id) values (true) on conflict (id) do nothing;

alter table public.billing_email_config enable row level security;
drop policy if exists billing_email_config_staff_read on public.billing_email_config;
create policy billing_email_config_staff_read on public.billing_email_config
for select to authenticated using (public.is_staff());
drop policy if exists billing_email_config_admin_update on public.billing_email_config;
create policy billing_email_config_admin_update on public.billing_email_config
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));

drop trigger if exists billing_email_config_set_updated_at on public.billing_email_config;
create trigger billing_email_config_set_updated_at
before update on public.billing_email_config
for each row execute function public.set_updated_at();

create table if not exists public.billing_email_outbox (
  id uuid primary key default gen_random_uuid(),
  message_type text not null check (message_type in ('QUOTE','INVOICE','REMINDER')),
  quote_id uuid references public.quotes(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  body_text text not null,
  action_url text,
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED','SKIPPED')),
  attempt_count integer not null default 0,
  processed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check (quote_id is not null or invoice_id is not null)
);

create index if not exists billing_email_outbox_queue_idx
  on public.billing_email_outbox(status, created_at);
create index if not exists billing_email_outbox_quote_idx
  on public.billing_email_outbox(quote_id, created_at desc)
  where quote_id is not null;
create index if not exists billing_email_outbox_invoice_idx
  on public.billing_email_outbox(invoice_id, created_at desc)
  where invoice_id is not null;

alter table public.billing_email_outbox enable row level security;
drop policy if exists billing_email_outbox_staff_read on public.billing_email_outbox;
create policy billing_email_outbox_staff_read on public.billing_email_outbox
for select to authenticated using (public.is_staff());
revoke insert, update, delete on public.billing_email_outbox from anon, authenticated;
grant select on public.billing_email_outbox to authenticated;

create or replace function public.get_public_invoice(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'invoice_number', i.invoice_number,
    'status', i.status,
    'invoice_date', i.invoice_date,
    'delivery_date', i.delivery_date,
    'due_date', i.due_date,
    'title', i.title,
    'notes', i.notes,
    'payment_reference', i.payment_reference,
    'subtotal_ex_vat', i.subtotal_ex_vat,
    'document_discount_ex_vat', i.document_discount_ex_vat,
    'total_ex_vat', i.total_ex_vat,
    'vat_total', i.vat_total,
    'total_incl_vat', i.total_incl_vat,
    'amount_paid', i.amount_paid,
    'amount_outstanding', greatest(0, i.total_incl_vat - i.amount_paid),
    'company', jsonb_strip_nulls(jsonb_build_object(
      'trade_name', i.company_snapshot->>'trade_name',
      'legal_name', i.company_snapshot->>'legal_name',
      'address_line1', i.company_snapshot->>'address_line1',
      'address_line2', i.company_snapshot->>'address_line2',
      'postal_code', i.company_snapshot->>'postal_code',
      'city', i.company_snapshot->>'city',
      'country', i.company_snapshot->>'country',
      'kvk_number', i.company_snapshot->>'kvk_number',
      'vat_number', i.company_snapshot->>'vat_number',
      'iban', i.company_snapshot->>'iban',
      'bic', i.company_snapshot->>'bic',
      'email', i.company_snapshot->>'email',
      'phone', i.company_snapshot->>'phone',
      'website', i.company_snapshot->>'website'
    )),
    'customer', jsonb_strip_nulls(jsonb_build_object(
      'company_name', i.customer_snapshot->>'company_name',
      'contact_name', i.customer_snapshot->>'contact_name',
      'address_line1', i.customer_snapshot->>'address_line1',
      'address_line2', i.customer_snapshot->>'address_line2',
      'postal_code', i.customer_snapshot->>'postal_code',
      'city', i.customer_snapshot->>'city',
      'country', i.customer_snapshot->>'country',
      'kvk_number', i.customer_snapshot->>'kvk_number',
      'vat_number', i.customer_snapshot->>'vat_number'
    )),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'position', ii.position,
          'code', ii.code,
          'description', ii.description,
          'billing_type', ii.billing_type,
          'quantity', ii.quantity,
          'unit_price_ex_vat', ii.unit_price_ex_vat,
          'vat_rate', ii.vat_rate,
          'line_discount_ex_vat', ii.line_discount_ex_vat,
          'line_total_ex_vat', ii.line_total_ex_vat,
          'line_vat', ii.line_vat,
          'line_total_incl_vat', ii.line_total_incl_vat
        ) order by ii.position, ii.id
      )
      from public.invoice_items ii
      where ii.invoice_id = i.id
    ), '[]'::jsonb)
  )
  from public.invoices i
  where i.public_token = p_token
    and i.invoice_number is not null
    and i.status in ('SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED')
  limit 1;
$$;

revoke all on function public.get_public_invoice(uuid) from public, anon, authenticated;
grant execute on function public.get_public_invoice(uuid) to anon, authenticated;

create or replace function public.queue_quote_email(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes%rowtype;
  v_email text;
  v_name text;
  v_id uuid;
  v_existing uuid;
  v_url text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;

  select * into q from public.quotes where id = p_quote_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if q.status not in ('DRAFT','SENT') then raise exception 'Quote can no longer be sent'; end if;
  if q.total_incl_vat <= 0 then raise exception 'Quote has no billable items'; end if;

  v_email := nullif(trim(coalesce(q.customer_snapshot->>'email', (select c.email from public.customers c where c.id=q.customer_id), '')), '');
  v_name := nullif(trim(coalesce(q.customer_snapshot->>'contact_name', q.customer_snapshot->>'company_name', '')), '');
  if v_email is null then raise exception 'Customer has no email address'; end if;

  select o.id into v_existing
  from public.billing_email_outbox o
  where o.quote_id=q.id and o.message_type='QUOTE' and o.status='QUEUED'
  order by o.created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  v_url := 'https://vedantix.nl/offerte/' || q.public_token::text;
  insert into public.billing_email_outbox(message_type,quote_id,recipient_email,recipient_name,subject,body_text,action_url,metadata,created_by)
  values(
    'QUOTE', q.id, v_email, v_name,
    'Offerte ' || q.quote_number || ' van Vedantix',
    'Beste ' || coalesce(v_name,'klant') || E',\n\nHierbij ontvang je offerte ' || q.quote_number || ' van Vedantix. Het totaalbedrag is EUR ' || q.total_incl_vat::text || E' inclusief btw.\n\nVia de beveiligde knop kun je de offerte bekijken en direct accepteren of afwijzen.' || case when q.valid_until is not null then E'\n\nGeldig tot: ' || q.valid_until::text else '' end || E'\n\nMet vriendelijke groet,\nVedantix',
    v_url,
    jsonb_build_object('quote_number',q.quote_number,'total_incl_vat',q.total_incl_vat,'valid_until',q.valid_until),
    auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.queue_quote_email(uuid) from public, anon, authenticated;
grant execute on function public.queue_quote_email(uuid) to authenticated;

create or replace function public.queue_invoice_email(p_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  i public.invoices%rowtype;
  v_email text;
  v_name text;
  v_id uuid;
  v_existing uuid;
  v_url text;
  v_iban text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;

  select * into i from public.invoices where id=p_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if i.status='DRAFT' or i.invoice_number is null then raise exception 'Invoice must be finalized first'; end if;

  v_email := nullif(trim(coalesce(i.customer_snapshot->>'email', (select c.email from public.customers c where c.id=i.customer_id), '')), '');
  v_name := nullif(trim(coalesce(i.customer_snapshot->>'contact_name', i.customer_snapshot->>'company_name', '')), '');
  v_iban := nullif(trim(coalesce(i.company_snapshot->>'iban','')), '');
  if v_email is null then raise exception 'Customer has no email address'; end if;

  select o.id into v_existing from public.billing_email_outbox o
  where o.invoice_id=i.id and o.message_type='INVOICE' and o.status='QUEUED'
  order by o.created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  v_url := 'https://vedantix.nl/factuur/' || i.public_token::text;
  insert into public.billing_email_outbox(message_type,invoice_id,recipient_email,recipient_name,subject,body_text,action_url,metadata,created_by)
  values(
    'INVOICE', i.id, v_email, v_name,
    'Factuur ' || i.invoice_number || ' van Vedantix',
    'Beste ' || coalesce(v_name,'klant') || E',\n\nHierbij ontvang je factuur ' || i.invoice_number || ' van Vedantix ter hoogte van EUR ' || i.total_incl_vat::text || E' inclusief btw.' || case when i.due_date is not null then E'\n\nBetaal uiterlijk: ' || i.due_date::text else '' end || case when v_iban is not null then E'\nIBAN: ' || v_iban else '' end || case when i.payment_reference is not null then E'\nBetalingskenmerk: ' || i.payment_reference else '' end || E'\n\nVia de beveiligde knop kun je de factuur bekijken.\n\nMet vriendelijke groet,\nVedantix',
    v_url,
    jsonb_build_object('invoice_number',i.invoice_number,'total_incl_vat',i.total_incl_vat,'due_date',i.due_date,'payment_reference',i.payment_reference),
    auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.queue_invoice_email(uuid) from public, anon, authenticated;
grant execute on function public.queue_invoice_email(uuid) to authenticated;

create or replace function public.queue_due_invoice_reminders_system()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_email text;
  v_name text;
  v_url text;
  v_next integer;
  v_count integer := 0;
  v_enabled boolean := true;
begin
  select reminders_enabled into v_enabled from public.billing_email_config where id=true;
  if coalesce(v_enabled,false)=false then return 0; end if;

  for r in select id from public.invoices where status not in ('DRAFT','CREDITED') and invoice_number is not null loop
    perform public.sync_invoice_payment_status(r.id);
  end loop;

  for r in
    select i.*
    from public.invoices i
    where i.status='OVERDUE'
      and i.sent_at is not null
      and i.amount_paid < i.total_incl_vat
      and i.reminder_count < 3
      and (i.last_reminder_at is null or i.last_reminder_at <= now() - interval '7 days')
      and not exists (
        select 1 from public.billing_email_outbox o
        where o.invoice_id=i.id and o.message_type='REMINDER' and o.status='QUEUED'
      )
  loop
    v_email := nullif(trim(coalesce(r.customer_snapshot->>'email', (select c.email from public.customers c where c.id=r.customer_id), '')), '');
    if v_email is null then continue; end if;
    v_name := nullif(trim(coalesce(r.customer_snapshot->>'contact_name', r.customer_snapshot->>'company_name', '')), '');
    v_next := r.reminder_count + 1;
    v_url := 'https://vedantix.nl/factuur/' || r.public_token::text;

    insert into public.billing_email_outbox(message_type,invoice_id,recipient_email,recipient_name,subject,body_text,action_url,metadata)
    values(
      'REMINDER', r.id, v_email, v_name,
      case v_next when 1 then 'Betaalherinnering ' || r.invoice_number when 2 then 'Tweede betaalherinnering ' || r.invoice_number else 'Laatste betaalherinnering ' || r.invoice_number end,
      'Beste ' || coalesce(v_name,'klant') || E',\n\nVolgens onze administratie staat factuur ' || r.invoice_number || ' nog open. Het resterende bedrag is EUR ' || greatest(0,r.total_incl_vat-r.amount_paid)::text || E'.' || case when r.due_date is not null then E'\nDe oorspronkelijke vervaldatum was ' || r.due_date::text || '.' else '' end || E'\n\nAls je inmiddels hebt betaald, kun je deze herinnering als niet verzonden beschouwen. Via de knop kun je de factuur bekijken.\n\nMet vriendelijke groet,\nVedantix',
      v_url,
      jsonb_build_object('invoice_number',r.invoice_number,'reminder_number',v_next,'amount_outstanding',greatest(0,r.total_incl_vat-r.amount_paid),'due_date',r.due_date)
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.queue_due_invoice_reminders_system() from public, anon, authenticated;

create or replace function public.queue_due_invoice_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  return public.queue_due_invoice_reminders_system();
end;
$$;
revoke all on function public.queue_due_invoice_reminders() from public, anon, authenticated;
grant execute on function public.queue_due_invoice_reminders() to authenticated;

create or replace function public.invoke_billing_email_delivery(p_mode text default 'deliver')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_status integer;
  v_content text;
  v_enabled boolean := true;
  v_queued integer := 0;
  v_url text := 'https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/billing-email-delivery';
begin
  if p_mode='deliver' then
    select delivery_enabled into v_enabled from public.billing_email_config where id=true;
    if coalesce(v_enabled,false)=false then return jsonb_build_object('skipped',true,'reason','delivery_disabled'); end if;
    select count(*)::integer into v_queued from public.billing_email_outbox where status='QUEUED';
    if v_queued=0 then return jsonb_build_object('skipped',true,'reason','queue_empty'); end if;
  end if;

  select d.decrypted_secret into v_token
  from vault.decrypted_secrets d
  where d.name='vedantix_notification_delivery_token'
  order by d.created_at desc limit 1;
  if v_token is null then raise exception 'Billing delivery token is not configured'; end if;

  select (r).status,(r).content into v_status,v_content
  from (
    select extensions.http((
      'POST'::extensions.http_method,
      v_url::varchar,
      array[
        ('x-control-token',v_token)::extensions.http_header,
        ('accept','application/json')::extensions.http_header
      ],
      'application/json'::varchar,
      jsonb_build_object('mode',p_mode)::text::varchar
    )::extensions.http_request) as r
  ) q;

  return jsonb_build_object('http_status',v_status,'response',case when v_content is null or btrim(v_content)='' then null else v_content::jsonb end);
exception when others then
  return jsonb_build_object('http_status',null,'error',sqlerrm);
end;
$$;
revoke all on function public.invoke_billing_email_delivery(text) from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname='vedantix-billing-email-delivery';
select cron.schedule('vedantix-billing-email-delivery','*/5 * * * *',$$select public.invoke_billing_email_delivery('deliver');$$);
select cron.unschedule(jobid) from cron.job where jobname='vedantix-billing-reminder-queue';
select cron.schedule('vedantix-billing-reminder-queue','0 7 * * *',$$select public.queue_due_invoice_reminders_system();$$);
