-- Vedantix Control Center — Sales & Billing V1
-- Mirrors the live `sales_billing_core` migration in the dedicated Control Center Supabase project.

alter table public.customers
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text not null default 'Nederland',
  add column if not exists phone text,
  add column if not exists kvk_number text,
  add column if not exists vat_number text;

create table if not exists public.company_profile (
  id boolean primary key default true check (id = true),
  trade_name text not null default 'Vedantix',
  legal_name text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text not null default 'Nederland',
  kvk_number text,
  vat_number text,
  iban text,
  bic text,
  email text not null default 'info@vedantix.nl',
  phone text,
  website text not null default 'https://vedantix.nl',
  default_payment_term_days integer not null default 14 check (default_payment_term_days between 1 and 120),
  default_quote_valid_days integer not null default 30 check (default_quote_valid_days between 1 and 180),
  default_vat_rate numeric(5,2) not null default 21.00 check (default_vat_rate between 0 and 100),
  quote_prefix text not null default 'OFF',
  invoice_prefix text not null default 'FAC',
  credit_prefix text not null default 'CR',
  accent_hex text not null default '#3b82f6',
  terms_url text default 'https://vedantix.nl/terms',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.company_profile (id) values (true) on conflict (id) do nothing;

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null default 'OVERIG',
  billing_type text not null default 'ONE_TIME' check (billing_type in ('ONE_TIME','MONTHLY','YEARLY')),
  price_incl_vat numeric(12,2) not null default 0 check (price_incl_vat >= 0),
  vat_rate numeric(5,2) not null default 21.00 check (vat_rate between 0 and 100),
  active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.product_catalog (code,name,description,category,billing_type,price_incl_vat,vat_rate,sort_order,metadata)
values
 ('STARTER','Starter — Professionele onepage','Professionele responsive onepage, contactformulier/WhatsApp en technische SEO-basis.','WEBSITE','ONE_TIME',399.00,21.00,10,'{"public_package":true}'::jsonb),
 ('GROWTH','Growth — Complete bedrijfswebsite','Tot 5 pagina’s, SEO/lokale vindbaarheid en AEO-basis.','WEBSITE','ONE_TIME',599.00,21.00,20,'{"public_package":true}'::jsonb),
 ('PRO','Pro — Website voor online groei','Tot 10 pagina’s, uitgebreidere SEO en AEO + GEO/AIO-basis.','WEBSITE','ONE_TIME',999.00,21.00,30,'{"public_package":true}'::jsonb),
 ('HOSTING_YEAR','Hosting & zakelijke e-mail','Hosting en mailboxen vanaf dit jaarlijkse bedrag.','HOSTING','YEARLY',30.00,21.00,40,'{"public_package":true,"from_price":true}'::jsonb),
 ('GOOGLE_GROWTH','Google Growth','Doorlopende Google-vindbaarheid.','GROWTH','MONTHLY',99.00,21.00,50,'{"public_package":true}'::jsonb),
 ('GOOGLE_AI_GROWTH','Google + AI Growth','Doorlopende Google- en AI-vindbaarheid.','GROWTH','MONTHLY',149.00,21.00,60,'{"public_package":true}'::jsonb)
on conflict (code) do nothing;

create table if not exists public.document_sequences (
  document_type text not null check (document_type in ('QUOTE','INVOICE','CREDIT')),
  sequence_year integer not null,
  next_number integer not null default 1 check (next_number > 0),
  primary key (document_type, sequence_year)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
  quote_date date not null default current_date,
  valid_until date,
  title text not null default 'Offerte',
  intro_text text,
  notes text,
  terms text,
  discount_type text not null default 'NONE' check (discount_type in ('NONE','PERCENTAGE','FIXED')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  subtotal_ex_vat numeric(12,2) not null default 0,
  line_discount_ex_vat numeric(12,2) not null default 0,
  document_discount_ex_vat numeric(12,2) not null default 0,
  total_ex_vat numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  total_incl_vat numeric(12,2) not null default 0,
  company_snapshot jsonb,
  customer_snapshot jsonb,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
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

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  source_quote_id uuid references public.quotes(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'DRAFT' check (status in ('DRAFT','FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED')),
  invoice_date date,
  delivery_date date,
  due_date date,
  title text not null default 'Factuur',
  notes text,
  payment_reference text,
  discount_type text not null default 'NONE' check (discount_type in ('NONE','PERCENTAGE','FIXED')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  subtotal_ex_vat numeric(12,2) not null default 0,
  line_discount_ex_vat numeric(12,2) not null default 0,
  document_discount_ex_vat numeric(12,2) not null default 0,
  total_ex_vat numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  total_incl_vat numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  company_snapshot jsonb,
  customer_snapshot jsonb,
  finalized_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
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

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  credit_number text unique,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'DRAFT' check (status in ('DRAFT','FINALIZED','SENT')),
  credit_date date,
  reason text,
  total_ex_vat numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  total_incl_vat numeric(12,2) not null default 0,
  company_snapshot jsonb,
  customer_snapshot jsonb,
  finalized_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists quotes_customer_idx on public.quotes(customer_id);
create index if not exists quote_items_quote_idx on public.quote_items(quote_id, position);
create index if not exists invoices_customer_idx on public.invoices(customer_id);
create index if not exists invoices_source_quote_idx on public.invoices(source_quote_id);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id, position);
create index if not exists credit_notes_invoice_idx on public.credit_notes(invoice_id);

create or replace function public.allocate_document_number(p_type text)
returns text language plpgsql security definer set search_path='' as $$
declare v_year integer:=extract(year from current_date)::integer; v_number integer; v_prefix text;
begin
  if p_type not in ('QUOTE','INVOICE','CREDIT') then raise exception 'Unsupported document type'; end if;
  insert into public.document_sequences(document_type,sequence_year,next_number) values(p_type,v_year,2)
    on conflict(document_type,sequence_year) do update set next_number=public.document_sequences.next_number+1
    returning next_number-1 into v_number;
  select case p_type when 'QUOTE' then quote_prefix when 'INVOICE' then invoice_prefix else credit_prefix end into v_prefix
    from public.company_profile where id=true;
  return format('%s-%s-%s',coalesce(v_prefix,p_type),v_year,lpad(v_number::text,4,'0'));
end; $$;
revoke all on function public.allocate_document_number(text) from public,anon,authenticated;

create or replace function public.snapshot_company_profile()
returns jsonb language sql security definer set search_path='' as $$
  select to_jsonb(cp)-'updated_by' from public.company_profile cp where id=true;
$$;
revoke all on function public.snapshot_company_profile() from public,anon,authenticated;

create or replace function public.snapshot_customer(p_customer_id uuid)
returns jsonb language sql security definer set search_path='' as $$
  select to_jsonb(c) from public.customers c where c.id=p_customer_id;
$$;
revoke all on function public.snapshot_customer(uuid) from public,anon,authenticated;

create or replace function public.prepare_quote()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.quote_number is null then new.quote_number:=public.allocate_document_number('QUOTE'); end if;
  if new.valid_until is null then select new.quote_date+default_quote_valid_days into new.valid_until from public.company_profile where id=true; end if;
  if new.company_snapshot is null then new.company_snapshot:=public.snapshot_company_profile(); end if;
  if new.customer_snapshot is null then new.customer_snapshot:=public.snapshot_customer(new.customer_id); end if;
  if new.created_by is null then new.created_by:=auth.uid(); end if;
  new.updated_at:=now(); return new;
end; $$;
drop trigger if exists prepare_quote_trigger on public.quotes;
create trigger prepare_quote_trigger before insert on public.quotes for each row execute function public.prepare_quote();

create or replace function public.calculate_billing_item()
returns trigger language plpgsql set search_path='' as $$
declare v_sub numeric(12,2); v_disc numeric(12,2);
begin
  v_sub:=round((new.quantity*new.unit_price_ex_vat)::numeric,2);
  v_disc:=case new.discount_type when 'PERCENTAGE' then round((v_sub*least(new.discount_value,100)/100)::numeric,2) when 'FIXED' then least(new.discount_value,v_sub) else 0 end;
  new.line_subtotal_ex_vat:=v_sub; new.line_discount_ex_vat:=v_disc; new.line_total_ex_vat:=round((v_sub-v_disc)::numeric,2);
  new.line_vat:=round((new.line_total_ex_vat*new.vat_rate/100)::numeric,2); new.line_total_incl_vat:=round((new.line_total_ex_vat+new.line_vat)::numeric,2); new.updated_at:=now(); return new;
end; $$;
drop trigger if exists quote_item_calculate_trigger on public.quote_items;
create trigger quote_item_calculate_trigger before insert or update on public.quote_items for each row execute function public.calculate_billing_item();
drop trigger if exists invoice_item_calculate_trigger on public.invoice_items;
create trigger invoice_item_calculate_trigger before insert or update on public.invoice_items for each row execute function public.calculate_billing_item();

create or replace function public.recalculate_quote(p_quote_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype; v_sub numeric(12,2); v_line_disc numeric(12,2); v_net numeric(12,2); v_doc_disc numeric(12,2); v_ratio numeric; v_vat numeric(12,2);
begin
  select * into q from public.quotes where id=p_quote_id; if not found then return; end if;
  select coalesce(sum(line_subtotal_ex_vat),0),coalesce(sum(line_discount_ex_vat),0),coalesce(sum(line_total_ex_vat),0) into v_sub,v_line_disc,v_net from public.quote_items where quote_id=p_quote_id;
  v_doc_disc:=case q.discount_type when 'PERCENTAGE' then round((v_net*least(q.discount_value,100)/100)::numeric,2) when 'FIXED' then least(q.discount_value,v_net) else 0 end;
  v_ratio:=case when v_net>0 then (v_net-v_doc_disc)/v_net else 1 end;
  select coalesce(sum(round((line_total_ex_vat*v_ratio*vat_rate/100)::numeric,2)),0) into v_vat from public.quote_items where quote_id=p_quote_id;
  update public.quotes set subtotal_ex_vat=v_sub,line_discount_ex_vat=v_line_disc,document_discount_ex_vat=v_doc_disc,total_ex_vat=round((v_net-v_doc_disc)::numeric,2),vat_total=v_vat,total_incl_vat=round((v_net-v_doc_disc+v_vat)::numeric,2),updated_at=now() where id=p_quote_id;
end; $$;
revoke all on function public.recalculate_quote(uuid) from public,anon,authenticated;

create or replace function public.recalculate_invoice(p_invoice_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare q public.invoices%rowtype; v_sub numeric(12,2); v_line_disc numeric(12,2); v_net numeric(12,2); v_doc_disc numeric(12,2); v_ratio numeric; v_vat numeric(12,2);
begin
  select * into q from public.invoices where id=p_invoice_id; if not found then return; end if;
  select coalesce(sum(line_subtotal_ex_vat),0),coalesce(sum(line_discount_ex_vat),0),coalesce(sum(line_total_ex_vat),0) into v_sub,v_line_disc,v_net from public.invoice_items where invoice_id=p_invoice_id;
  v_doc_disc:=case q.discount_type when 'PERCENTAGE' then round((v_net*least(q.discount_value,100)/100)::numeric,2) when 'FIXED' then least(q.discount_value,v_net) else 0 end;
  v_ratio:=case when v_net>0 then (v_net-v_doc_disc)/v_net else 1 end;
  select coalesce(sum(round((line_total_ex_vat*v_ratio*vat_rate/100)::numeric,2)),0) into v_vat from public.invoice_items where invoice_id=p_invoice_id;
  update public.invoices set subtotal_ex_vat=v_sub,line_discount_ex_vat=v_line_disc,document_discount_ex_vat=v_doc_disc,total_ex_vat=round((v_net-v_doc_disc)::numeric,2),vat_total=v_vat,total_incl_vat=round((v_net-v_doc_disc+v_vat)::numeric,2),updated_at=now() where id=p_invoice_id;
end; $$;
revoke all on function public.recalculate_invoice(uuid) from public,anon,authenticated;

create or replace function public.quote_items_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.recalculate_quote(coalesce(new.quote_id,old.quote_id)); return coalesce(new,old); end; $$;
drop trigger if exists quote_items_recalc_trigger on public.quote_items;
create trigger quote_items_recalc_trigger after insert or update or delete on public.quote_items for each row execute function public.quote_items_changed();

create or replace function public.invoice_items_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.recalculate_invoice(coalesce(new.invoice_id,old.invoice_id)); return coalesce(new,old); end; $$;
drop trigger if exists invoice_items_recalc_trigger on public.invoice_items;
create trigger invoice_items_recalc_trigger after insert or update or delete on public.invoice_items for each row execute function public.invoice_items_changed();

create or replace function public.recalculate_quote_on_discount_change() returns trigger language plpgsql security definer set search_path='' as $$
begin if old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value then perform public.recalculate_quote(new.id); end if; return new; end; $$;
drop trigger if exists quote_discount_recalc_trigger on public.quotes;
create trigger quote_discount_recalc_trigger after update of discount_type,discount_value on public.quotes for each row execute function public.recalculate_quote_on_discount_change();

create or replace function public.recalculate_invoice_on_discount_change() returns trigger language plpgsql security definer set search_path='' as $$
begin if old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value then perform public.recalculate_invoice(new.id); end if; return new; end; $$;
drop trigger if exists invoice_discount_recalc_trigger on public.invoices;
create trigger invoice_discount_recalc_trigger after update of discount_type,discount_value on public.invoices for each row execute function public.recalculate_invoice_on_discount_change();

create or replace function public.quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype; v_invoice uuid;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into q from public.quotes where id=p_quote_id; if not found then raise exception 'Quote not found'; end if;
  insert into public.invoices(source_quote_id,customer_id,status,title,notes,discount_type,discount_value,company_snapshot,customer_snapshot,created_by)
  values(q.id,q.customer_id,'DRAFT','Factuur',q.notes,q.discount_type,q.discount_value,coalesce(q.company_snapshot,public.snapshot_company_profile()),coalesce(q.customer_snapshot,public.snapshot_customer(q.customer_id)),auth.uid()) returning id into v_invoice;
  insert into public.invoice_items(invoice_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
    select v_invoice,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value from public.quote_items where quote_id=q.id order by position,id;
  perform public.recalculate_invoice(v_invoice); return v_invoice;
end; $$;
grant execute on function public.quote_to_invoice(uuid) to authenticated;

create or replace function public.finalize_invoice(p_invoice_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare inv public.invoices%rowtype; v_term integer; v_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into inv from public.invoices where id=p_invoice_id for update; if not found then raise exception 'Invoice not found'; end if;
  if inv.status<>'DRAFT' then return inv.invoice_number; end if;
  if not exists(select 1 from public.invoice_items where invoice_id=p_invoice_id) then raise exception 'Invoice has no items'; end if;
  select default_payment_term_days into v_term from public.company_profile where id=true;
  v_number:=public.allocate_document_number('INVOICE'); perform public.recalculate_invoice(p_invoice_id);
  update public.invoices set invoice_number=v_number,status='FINALIZED',invoice_date=coalesce(invoice_date,current_date),delivery_date=coalesce(delivery_date,current_date),due_date=coalesce(due_date,current_date+v_term),payment_reference=coalesce(nullif(payment_reference,''),v_number),company_snapshot=coalesce(company_snapshot,public.snapshot_company_profile()),customer_snapshot=coalesce(customer_snapshot,public.snapshot_customer(customer_id)),finalized_at=now(),updated_at=now() where id=p_invoice_id;
  return v_number;
end; $$;
grant execute on function public.finalize_invoice(uuid) to authenticated;

create or replace function public.create_full_credit_note(p_invoice_id uuid,p_reason text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare inv public.invoices%rowtype; v_id uuid; v_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into inv from public.invoices where id=p_invoice_id for update;
  if not found or inv.invoice_number is null then raise exception 'Finalized invoice required'; end if;
  v_number:=public.allocate_document_number('CREDIT');
  insert into public.credit_notes(credit_number,invoice_id,customer_id,status,credit_date,reason,total_ex_vat,vat_total,total_incl_vat,company_snapshot,customer_snapshot,finalized_at,created_by)
    values(v_number,inv.id,inv.customer_id,'FINALIZED',current_date,p_reason,-inv.total_ex_vat,-inv.vat_total,-inv.total_incl_vat,inv.company_snapshot,inv.customer_snapshot,now(),auth.uid()) returning id into v_id;
  update public.invoices set status='CREDITED',updated_at=now() where id=p_invoice_id; return v_id;
end; $$;
grant execute on function public.create_full_credit_note(uuid,text) to authenticated;

create or replace function public.protect_finalized_invoice() returns trigger language plpgsql set search_path='' as $$
begin
  if old.status<>'DRAFT' and (old.customer_id is distinct from new.customer_id or old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value or old.subtotal_ex_vat is distinct from new.subtotal_ex_vat or old.line_discount_ex_vat is distinct from new.line_discount_ex_vat or old.document_discount_ex_vat is distinct from new.document_discount_ex_vat or old.total_ex_vat is distinct from new.total_ex_vat or old.vat_total is distinct from new.vat_total or old.total_incl_vat is distinct from new.total_incl_vat or old.invoice_date is distinct from new.invoice_date or old.delivery_date is distinct from new.delivery_date) then raise exception 'Finalized invoice financial fields are immutable; use a credit note'; end if;
  new.updated_at:=now(); return new;
end; $$;
drop trigger if exists protect_finalized_invoice_trigger on public.invoices;
create trigger protect_finalized_invoice_trigger before update on public.invoices for each row execute function public.protect_finalized_invoice();

create or replace function public.protect_finalized_invoice_items() returns trigger language plpgsql set search_path='' as $$
declare v_invoice_id uuid; v_status text;
begin
  v_invoice_id:=coalesce(new.invoice_id,old.invoice_id); select status into v_status from public.invoices where id=v_invoice_id;
  if v_status<>'DRAFT' then raise exception 'Finalized invoice items are immutable; use a credit note'; end if; return coalesce(new,old);
end; $$;
drop trigger if exists protect_finalized_invoice_items_trigger on public.invoice_items;
create trigger protect_finalized_invoice_items_trigger before insert or update or delete on public.invoice_items for each row execute function public.protect_finalized_invoice_items();

alter table public.company_profile enable row level security;
alter table public.product_catalog enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.credit_notes enable row level security;
alter table public.document_sequences enable row level security;

create policy company_profile_staff_read on public.company_profile for select to authenticated using(public.is_staff());
create policy company_profile_admin_write on public.company_profile for update to authenticated using(public.is_staff(array['ADMIN'])) with check(public.is_staff(array['ADMIN']));
create policy catalog_staff_read on public.product_catalog for select to authenticated using(public.is_staff());
create policy catalog_ops_insert on public.product_catalog for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy catalog_ops_update on public.product_catalog for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy catalog_ops_delete on public.product_catalog for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']));
create policy quotes_staff_read on public.quotes for select to authenticated using(public.is_staff());
create policy quotes_ops_insert on public.quotes for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy quotes_ops_update on public.quotes for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy quotes_ops_delete on public.quotes for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']) and status='DRAFT');
create policy quote_items_staff_read on public.quote_items for select to authenticated using(public.is_staff());
create policy quote_items_ops_insert on public.quote_items for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy quote_items_ops_update on public.quote_items for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy quote_items_ops_delete on public.quote_items for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']));
create policy invoices_staff_read on public.invoices for select to authenticated using(public.is_staff());
create policy invoices_ops_insert on public.invoices for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy invoices_ops_update on public.invoices for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy invoices_ops_delete on public.invoices for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']) and status='DRAFT');
create policy invoice_items_staff_read on public.invoice_items for select to authenticated using(public.is_staff());
create policy invoice_items_ops_insert on public.invoice_items for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy invoice_items_ops_update on public.invoice_items for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy invoice_items_ops_delete on public.invoice_items for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']));
create policy credits_staff_read on public.credit_notes for select to authenticated using(public.is_staff());
create policy credits_ops_insert on public.credit_notes for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy credits_ops_update on public.credit_notes for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));

revoke all on public.document_sequences from anon,authenticated;
