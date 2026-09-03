alter table public.quotes
  add column if not exists billing_activated_at timestamptz;

alter table public.invoices
  add column if not exists subscription_id uuid,
  add column if not exists billing_period_start date,
  add column if not exists billing_period_end date;

create table if not exists public.subscription_sequences (
  sequence_year integer primary key,
  next_number integer not null default 1 check (next_number > 0)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscription_number text not null unique,
  source_quote_id uuid references public.quotes(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  billing_type text not null check (billing_type in ('MONTHLY','YEARLY')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','CANCELLED')),
  start_date date not null,
  next_invoice_date date not null,
  last_invoice_date date,
  auto_finalize boolean not null default true,
  discount_type text not null default 'NONE' check (discount_type in ('NONE','PERCENTAGE')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  first_invoice_discount_ex_vat numeric(12,2) not null default 0 check (first_invoice_discount_ex_vat >= 0),
  company_snapshot jsonb not null,
  customer_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  position integer not null default 0,
  catalog_product_id uuid references public.product_catalog(id) on delete set null,
  code text,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price_ex_vat numeric(12,2) not null default 0 check (unit_price_ex_vat >= 0),
  vat_rate numeric(5,2) not null default 21.00 check (vat_rate between 0 and 100),
  discount_type text not null default 'NONE' check (discount_type in ('NONE','PERCENTAGE','FIXED')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  line_subtotal_ex_vat numeric(12,2) not null default 0,
  line_discount_ex_vat numeric(12,2) not null default 0,
  line_total_ex_vat numeric(12,2) not null default 0,
  line_vat numeric(12,2) not null default 0,
  line_total_incl_vat numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_billing_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_source text not null default 'CRON' check (trigger_source in ('CRON','MANUAL','SYSTEM')),
  as_of_date date not null,
  status text not null default 'RUNNING' check (status in ('RUNNING','COMPLETED','PARTIAL','FAILED')),
  subscriptions_processed integer not null default 0,
  invoices_created integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.invoices drop constraint if exists invoices_subscription_id_fkey;
alter table public.invoices
  add constraint invoices_subscription_id_fkey foreign key (subscription_id) references public.subscriptions(id) on delete set null;

create index if not exists subscriptions_customer_idx on public.subscriptions(customer_id);
create index if not exists subscriptions_source_quote_idx on public.subscriptions(source_quote_id);
create index if not exists subscriptions_due_idx on public.subscriptions(status,next_invoice_date);
create index if not exists subscription_items_subscription_idx on public.subscription_items(subscription_id,position);
create index if not exists subscription_items_catalog_product_idx on public.subscription_items(catalog_product_id);
create index if not exists invoices_subscription_idx on public.invoices(subscription_id);
create unique index if not exists invoices_subscription_period_unique
  on public.invoices(subscription_id,billing_period_start)
  where subscription_id is not null and billing_period_start is not null;

alter table public.subscription_sequences enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.recurring_billing_runs enable row level security;

revoke all on public.subscription_sequences, public.subscriptions, public.subscription_items, public.recurring_billing_runs from anon;
grant select,insert,update on public.subscription_sequences to authenticated;
grant select,insert,update,delete on public.subscriptions to authenticated;
grant select,insert,update,delete on public.subscription_items to authenticated;
grant select on public.recurring_billing_runs to authenticated;

drop policy if exists subscription_sequences_ops on public.subscription_sequences;
create policy subscription_sequences_ops on public.subscription_sequences for all to authenticated
using (public.is_staff(array['ADMIN','OPERATOR']))
with check (public.is_staff(array['ADMIN','OPERATOR']));

drop policy if exists subscriptions_staff_read on public.subscriptions;
create policy subscriptions_staff_read on public.subscriptions for select to authenticated using (public.is_staff());
drop policy if exists subscriptions_ops_insert on public.subscriptions;
create policy subscriptions_ops_insert on public.subscriptions for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
drop policy if exists subscriptions_ops_update on public.subscriptions;
create policy subscriptions_ops_update on public.subscriptions for update to authenticated
using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
drop policy if exists subscriptions_ops_delete on public.subscriptions;
create policy subscriptions_ops_delete on public.subscriptions for delete to authenticated using (public.is_staff(array['ADMIN']));

drop policy if exists subscription_items_staff_read on public.subscription_items;
create policy subscription_items_staff_read on public.subscription_items for select to authenticated using (public.is_staff());
drop policy if exists subscription_items_ops_insert on public.subscription_items;
create policy subscription_items_ops_insert on public.subscription_items for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
drop policy if exists subscription_items_ops_update on public.subscription_items;
create policy subscription_items_ops_update on public.subscription_items for update to authenticated
using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
drop policy if exists subscription_items_ops_delete on public.subscription_items;
create policy subscription_items_ops_delete on public.subscription_items for delete to authenticated using (public.is_staff(array['ADMIN','OPERATOR']));

drop policy if exists recurring_runs_staff_read on public.recurring_billing_runs;
create policy recurring_runs_staff_read on public.recurring_billing_runs for select to authenticated using (public.is_staff());

drop trigger if exists subscription_item_calculate_trigger on public.subscription_items;
create trigger subscription_item_calculate_trigger before insert or update on public.subscription_items
for each row execute function public.calculate_billing_item();

create or replace function public.allocate_subscription_number()
returns text language plpgsql security invoker set search_path='' as $$
declare v_year integer:=extract(year from current_date)::integer; v_number integer;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  insert into public.subscription_sequences(sequence_year,next_number) values(v_year,2)
  on conflict(sequence_year) do update set next_number=public.subscription_sequences.next_number+1
  returning next_number-1 into v_number;
  return format('ABO-%s-%s',v_year,lpad(v_number::text,4,'0'));
end; $$;
revoke all on function public.allocate_subscription_number() from public,anon,authenticated;
grant execute on function public.allocate_subscription_number() to authenticated;

create or replace function public.activate_quote_billing(p_quote_id uuid,p_monthly_start_date date default null,p_yearly_start_date date default null,p_auto_finalize boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  q public.quotes%rowtype;
  v_one numeric(12,2):=0; v_month numeric(12,2):=0; v_year numeric(12,2):=0; v_total numeric(12,2):=0;
  v_fixed numeric(12,2):=0; v_one_disc numeric(12,2):=0; v_month_disc numeric(12,2):=0; v_year_disc numeric(12,2):=0; v_diff numeric(12,2):=0;
  v_invoice uuid; v_month_sub uuid; v_year_sub uuid; v_month_number text; v_year_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into q from public.quotes where id=p_quote_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if q.status<>'ACCEPTED' then raise exception 'Accepted quote required'; end if;
  if q.billing_activated_at is not null then raise exception 'Billing already activated for this quote'; end if;
  if not exists(select 1 from public.quote_items where quote_id=q.id) then raise exception 'Quote has no items'; end if;

  select coalesce(sum(line_total_ex_vat) filter(where billing_type='ONE_TIME'),0),
         coalesce(sum(line_total_ex_vat) filter(where billing_type='MONTHLY'),0),
         coalesce(sum(line_total_ex_vat) filter(where billing_type='YEARLY'),0)
  into v_one,v_month,v_year from public.quote_items where quote_id=q.id;
  v_total:=v_one+v_month+v_year;

  if q.discount_type='FIXED' and v_total>0 then
    v_fixed:=least(q.document_discount_ex_vat,v_total);
    v_one_disc:=round((v_fixed*v_one/v_total)::numeric,2);
    v_month_disc:=round((v_fixed*v_month/v_total)::numeric,2);
    v_year_disc:=round((v_fixed*v_year/v_total)::numeric,2);
    v_diff:=round((v_fixed-v_one_disc-v_month_disc-v_year_disc)::numeric,2);
    if v_year>0 then v_year_disc:=v_year_disc+v_diff;
    elsif v_month>0 then v_month_disc:=v_month_disc+v_diff;
    else v_one_disc:=v_one_disc+v_diff; end if;
  end if;

  if v_one>0 then
    insert into public.invoices(source_quote_id,customer_id,status,title,notes,discount_type,discount_value,company_snapshot,customer_snapshot,created_by)
    values(q.id,q.customer_id,'DRAFT','Factuur',q.notes,
      case when q.discount_type='PERCENTAGE' then 'PERCENTAGE' when v_one_disc>0 then 'FIXED' else 'NONE' end,
      case when q.discount_type='PERCENTAGE' then q.discount_value else v_one_disc end,
      q.company_snapshot,q.customer_snapshot,auth.uid()) returning id into v_invoice;
    insert into public.invoice_items(invoice_id,position,catalog_product_id,code,description,billing_type,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
    select v_invoice,position,catalog_product_id,code,description,'ONE_TIME',quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value
    from public.quote_items where quote_id=q.id and billing_type='ONE_TIME' order by position,id;
  end if;

  if v_month>0 then
    v_month_number:=public.allocate_subscription_number();
    insert into public.subscriptions(subscription_number,source_quote_id,customer_id,billing_type,status,start_date,next_invoice_date,auto_finalize,discount_type,discount_value,first_invoice_discount_ex_vat,company_snapshot,customer_snapshot,created_by)
    values(v_month_number,q.id,q.customer_id,'MONTHLY','ACTIVE',coalesce(p_monthly_start_date,(current_date+interval '1 month')::date),coalesce(p_monthly_start_date,(current_date+interval '1 month')::date),p_auto_finalize,
      case when q.discount_type='PERCENTAGE' then 'PERCENTAGE' else 'NONE' end,
      case when q.discount_type='PERCENTAGE' then q.discount_value else 0 end,v_month_disc,q.company_snapshot,q.customer_snapshot,auth.uid()) returning id into v_month_sub;
    insert into public.subscription_items(subscription_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
    select v_month_sub,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value
    from public.quote_items where quote_id=q.id and billing_type='MONTHLY' order by position,id;
  end if;

  if v_year>0 then
    v_year_number:=public.allocate_subscription_number();
    insert into public.subscriptions(subscription_number,source_quote_id,customer_id,billing_type,status,start_date,next_invoice_date,auto_finalize,discount_type,discount_value,first_invoice_discount_ex_vat,company_snapshot,customer_snapshot,created_by)
    values(v_year_number,q.id,q.customer_id,'YEARLY','ACTIVE',coalesce(p_yearly_start_date,(current_date+interval '1 year')::date),coalesce(p_yearly_start_date,(current_date+interval '1 year')::date),p_auto_finalize,
      case when q.discount_type='PERCENTAGE' then 'PERCENTAGE' else 'NONE' end,
      case when q.discount_type='PERCENTAGE' then q.discount_value else 0 end,v_year_disc,q.company_snapshot,q.customer_snapshot,auth.uid()) returning id into v_year_sub;
    insert into public.subscription_items(subscription_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
    select v_year_sub,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value
    from public.quote_items where quote_id=q.id and billing_type='YEARLY' order by position,id;
  end if;

  update public.quotes set billing_activated_at=now(),updated_at=now() where id=q.id;
  return jsonb_build_object('immediate_invoice_id',v_invoice,'monthly_subscription_id',v_month_sub,'monthly_subscription_number',v_month_number,'yearly_subscription_id',v_year_sub,'yearly_subscription_number',v_year_number);
end; $$;
revoke all on function public.activate_quote_billing(uuid,date,date,boolean) from public,anon,authenticated;
grant execute on function public.activate_quote_billing(uuid,date,date,boolean) to authenticated;

create or replace function public.allocate_document_number_system(p_type text)
returns text language plpgsql security definer set search_path='' as $$
declare v_year integer:=extract(year from current_date)::integer; v_number integer; v_prefix text;
begin
  if p_type not in ('QUOTE','INVOICE','CREDIT') then raise exception 'Unsupported document type'; end if;
  insert into public.document_sequences(document_type,sequence_year,next_number) values(p_type,v_year,2)
  on conflict(document_type,sequence_year) do update set next_number=public.document_sequences.next_number+1
  returning next_number-1 into v_number;
  select case p_type when 'QUOTE' then quote_prefix when 'INVOICE' then invoice_prefix else credit_prefix end into v_prefix from public.company_profile where id=true;
  return format('%s-%s-%s',coalesce(v_prefix,p_type),v_year,lpad(v_number::text,4,'0'));
end; $$;
revoke all on function public.allocate_document_number_system(text) from public,anon,authenticated;

create or replace function public.create_subscription_invoice_system(p_subscription_id uuid,p_billing_date date)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  s public.subscriptions%rowtype; v_invoice uuid; v_number text; v_term integer:=14; v_period_end date;
  v_discount_type text:='NONE'; v_discount_value numeric(12,2):=0;
begin
  select * into s from public.subscriptions where id=p_subscription_id for update;
  if not found then raise exception 'Subscription not found'; end if;
  if s.status<>'ACTIVE' then raise exception 'Subscription is not active'; end if;
  select id into v_invoice from public.invoices where subscription_id=s.id and billing_period_start=p_billing_date limit 1;
  if v_invoice is not null then return v_invoice; end if;
  if s.billing_type='MONTHLY' then v_period_end:=(p_billing_date+interval '1 month'-interval '1 day')::date;
  else v_period_end:=(p_billing_date+interval '1 year'-interval '1 day')::date; end if;
  begin v_term:=coalesce((s.company_snapshot->>'default_payment_term_days')::integer,14); exception when others then v_term:=14; end;
  if s.last_invoice_date is null and s.first_invoice_discount_ex_vat>0 then v_discount_type:='FIXED'; v_discount_value:=s.first_invoice_discount_ex_vat;
  elsif s.discount_type='PERCENTAGE' then v_discount_type:='PERCENTAGE'; v_discount_value:=s.discount_value; end if;
  insert into public.invoices(source_quote_id,subscription_id,billing_period_start,billing_period_end,customer_id,status,invoice_date,delivery_date,due_date,title,notes,discount_type,discount_value,company_snapshot,customer_snapshot,created_by)
  values(s.source_quote_id,s.id,p_billing_date,v_period_end,s.customer_id,'DRAFT',p_billing_date,p_billing_date,p_billing_date+v_term,'Abonnement '||s.subscription_number,
    'Factuurperiode '||to_char(p_billing_date,'DD-MM-YYYY')||' t/m '||to_char(v_period_end,'DD-MM-YYYY'),v_discount_type,v_discount_value,s.company_snapshot,s.customer_snapshot,null)
  returning id into v_invoice;
  insert into public.invoice_items(invoice_id,position,catalog_product_id,code,description,billing_type,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
  select v_invoice,position,catalog_product_id,code,description,s.billing_type,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value
  from public.subscription_items where subscription_id=s.id order by position,id;
  if s.auto_finalize then
    v_number:=public.allocate_document_number_system('INVOICE');
    update public.invoices set invoice_number=v_number,status='FINALIZED',payment_reference=v_number,finalized_at=now(),updated_at=now() where id=v_invoice;
  end if;
  return v_invoice;
end; $$;
revoke all on function public.create_subscription_invoice_system(uuid,date) from public,anon,authenticated;

create or replace function public.run_recurring_billing(p_as_of date default current_date,p_source text default 'CRON')
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_run uuid; r record; s public.subscriptions%rowtype; v_invoice uuid; v_processed integer:=0; v_created integer:=0;
  v_errors jsonb:='[]'::jsonb; v_status text:='COMPLETED';
begin
  insert into public.recurring_billing_runs(trigger_source,as_of_date,status)
  values(case when p_source in ('CRON','MANUAL','SYSTEM') then p_source else 'SYSTEM' end,p_as_of,'RUNNING') returning id into v_run;
  for r in select id from public.subscriptions where status='ACTIVE' and next_invoice_date<=p_as_of order by next_invoice_date,id loop
    loop
      select * into s from public.subscriptions where id=r.id for update;
      exit when not found or s.status<>'ACTIVE' or s.next_invoice_date>p_as_of;
      begin
        v_invoice:=public.create_subscription_invoice_system(s.id,s.next_invoice_date);
        update public.subscriptions set last_invoice_date=s.next_invoice_date,
          next_invoice_date=case when s.billing_type='MONTHLY' then (s.next_invoice_date+interval '1 month')::date else (s.next_invoice_date+interval '1 year')::date end,
          updated_at=now() where id=s.id;
        v_processed:=v_processed+1; v_created:=v_created+1;
      exception when others then
        v_errors:=v_errors||jsonb_build_array(jsonb_build_object('subscription_id',s.id,'message',sqlerrm));
        v_status:='PARTIAL'; exit;
      end;
    end loop;
  end loop;
  update public.recurring_billing_runs set status=v_status,subscriptions_processed=v_processed,invoices_created=v_created,errors=v_errors,completed_at=now() where id=v_run;
  return v_run;
exception when others then
  if v_run is not null then update public.recurring_billing_runs set status='FAILED',errors=jsonb_build_array(jsonb_build_object('message',sqlerrm)),completed_at=now() where id=v_run; end if;
  raise;
end; $$;
revoke all on function public.run_recurring_billing(date,text) from public,anon,authenticated;

create or replace function public.protect_finalized_invoice()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status<>'DRAFT' and (
    old.customer_id is distinct from new.customer_id or old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value or
    old.subtotal_ex_vat is distinct from new.subtotal_ex_vat or old.line_discount_ex_vat is distinct from new.line_discount_ex_vat or old.document_discount_ex_vat is distinct from new.document_discount_ex_vat or
    old.total_ex_vat is distinct from new.total_ex_vat or old.vat_total is distinct from new.vat_total or old.total_incl_vat is distinct from new.total_incl_vat or
    old.invoice_date is distinct from new.invoice_date or old.delivery_date is distinct from new.delivery_date or old.subscription_id is distinct from new.subscription_id or
    old.billing_period_start is distinct from new.billing_period_start or old.billing_period_end is distinct from new.billing_period_end
  ) then raise exception 'Finalized invoice financial fields are immutable; use a credit note'; end if;
  new.updated_at:=now(); return new;
end; $$;

DO $$
declare v_job integer;
begin
  select jobid into v_job from cron.job where jobname='vedantix-recurring-billing-daily' limit 1;
  if v_job is not null then perform cron.unschedule(v_job); end if;
  perform cron.schedule('vedantix-recurring-billing-daily','30 6 * * *','select public.run_recurring_billing(current_date,''CRON'');');
end;
$$;