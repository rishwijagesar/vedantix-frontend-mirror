-- Private evidence and an auditable purchase/bank register. No automatic tax filing.
create schema if not exists administration_private;
revoke all on schema administration_private from public, anon, authenticated;

create table public.administration_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  due_date date,
  supplier text not null check(length(btrim(supplier)) between 1 and 250),
  document_number text not null default '' check(length(document_number)<=150),
  document_kind text not null default 'PURCHASE' check(document_kind in ('PURCHASE','CREDIT')),
  description text not null check(length(btrim(description)) between 1 and 2000),
  category text not null check(category in ('software','hosting','hardware','office','marketing','travel','education','professional','insurance','bank','depreciation','other')),
  treatment text not null default 'EXPENSE' check(treatment in ('EXPENSE','ASSET','PRIVATE','TAX','TRANSFER')),
  business_percent numeric(5,2) not null default 100 check(business_percent between 0 and 100),
  lines jsonb not null check(jsonb_typeof(lines)='array' and jsonb_array_length(lines) between 1 and 50),
  vat_reviewed boolean not null default false,
  notes text not null default '' check(length(notes)<=5000),
  void_reason text check(length(btrim(void_reason)) between 3 and 1000),
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid default auth.uid()
);
create unique index administration_supplier_document_unique on public.administration_entries(lower(btrim(supplier)),lower(btrim(document_number)),document_kind) where void_reason is null and btrim(document_number)<>'';
create index administration_entries_date_idx on public.administration_entries(entry_date);

create table public.administration_bank (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  account text not null check(length(btrim(account)) between 1 and 100),
  description text not null check(length(btrim(description)) between 1 and 2000),
  amount numeric(12,2) not null check(amount<>0),
  reference text not null default '' check(length(reference)<=250),
  kind text not null default 'OTHER' check(kind in ('PURCHASE','SALE','PRIVATE','TAX','TRANSFER','OTHER')),
  entry_id uuid references public.administration_entries(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete restrict,
  void_reason text check(length(btrim(void_reason)) between 3 and 1000),
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid default auth.uid(),
  check(num_nonnulls(entry_id,invoice_id)<=1),
  check(entry_id is null or kind='PURCHASE'), check(invoice_id is null or kind='SALE')
);
create unique index administration_bank_reference_unique on public.administration_bank(lower(btrim(account)),lower(btrim(reference))) where void_reason is null and btrim(reference)<>'';
create index administration_bank_date_idx on public.administration_bank(transaction_date);
create index administration_bank_entry_idx on public.administration_bank(entry_id);
create index administration_bank_invoice_idx on public.administration_bank(invoice_id);

create table public.administration_documents (
  id uuid primary key default gen_random_uuid(),
  document_date date not null,
  filename text not null check(length(filename) between 1 and 250),
  object_path text not null unique,
  mime_type text not null,
  byte_size integer not null check(byte_size between 1 and 20971520),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'PENDING' check(status in ('PENDING','READY')),
  kind text not null default 'RECEIPT' check(kind in ('RECEIPT','INVOICE','EMAIL','BANK','CONTRACT','OTHER')),
  note text not null default '' check(length(note)<=2000),
  entry_id uuid references public.administration_entries(id) on delete restrict,
  bank_id uuid references public.administration_bank(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete restrict,
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid default auth.uid(),
  check(num_nonnulls(entry_id,bank_id,invoice_id,contract_id)<=1),
  check(object_path = id::text || '/original.' || lower(substring(filename from '\.([a-zA-Z0-9]+)$'))),
  check(substring(filename from '\.([a-zA-Z0-9]+)$') is not null),
  check(lower(substring(filename from '\.([a-zA-Z0-9]+)$')) in ('pdf','jpg','jpeg','png','webp','eml','msg','xml','txt','csv'))
);
create index administration_documents_entry_idx on public.administration_documents(entry_id);
create index administration_documents_bank_idx on public.administration_documents(bank_id);
create index administration_documents_invoice_idx on public.administration_documents(invoice_id);
create index administration_documents_contract_idx on public.administration_documents(contract_id);
create index administration_documents_date_idx on public.administration_documents(document_date);

create table public.administration_history (
  id bigint generated always as identity primary key,
  entity text not null, entity_id uuid not null,
  action text not null, old_data jsonb, new_data jsonb not null,
  actor_id uuid not null, occurred_at timestamptz not null default now()
);
create index administration_history_entity_idx on public.administration_history(entity,entity_id,id);

-- Validate every amount on the server; a browser cannot bypass these checks.
create function administration_private.validate_entry() returns trigger language plpgsql security invoker set search_path='' as $$
declare l jsonb; base numeric; vat numeric; deductible numeric; code text;
begin
  for l in select value from jsonb_array_elements(new.lines) loop
    if jsonb_typeof(l)<>'object' or not (l ?& array['base','vat','deductible','code'])
      or jsonb_typeof(l->'base')<>'number' or jsonb_typeof(l->'vat')<>'number' or jsonb_typeof(l->'deductible')<>'number' then
      raise exception 'Elke btw-regel moet geldige bedragen bevatten.';
    end if;
    base:=(l->>'base')::numeric; vat:=(l->>'vat')::numeric; deductible:=(l->>'deductible')::numeric; code:=l->>'code';
    if code is null or code not in ('21','9','0','EXEMPT','REVERSE','FOREIGN','UNKNOWN')
      or base<0 or vat<0 or deductible<0 or base>99999999 or vat>99999999
      or round(base,2)<>base or round(vat,2)<>vat or round(deductible,2)<>deductible
      or deductible>round(vat*new.business_percent/100,2) then
      raise exception 'Controleer de btw-regel en het zakelijke aandeel.';
    end if;
    if (code in ('0','EXEMPT','REVERSE') and vat<>0) or (code in ('REVERSE','FOREIGN','UNKNOWN') and deductible<>0) then
      raise exception 'Bij buitenlandse, verlegde of onbekende btw is aparte beoordeling nodig.';
    end if;
    if not new.vat_reviewed and deductible<>0 then raise exception 'Controleer de btw-aftrek voordat je deze meeneemt.'; end if;
    if new.treatment in ('PRIVATE','TAX','TRANSFER') and deductible<>0 then raise exception 'Bij deze soort boeking hoort geen btw-aftrek.'; end if;
  end loop;
  return new;
end; $$;
revoke all on function administration_private.validate_entry() from public,anon,authenticated;
create trigger administration_validate_entry before insert or update on public.administration_entries for each row execute function administration_private.validate_entry();

-- Trusted append-only history. The function cannot be called as an RPC.
create function administration_private.record_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.is_staff(array['ADMIN']) then raise exception 'Alleen een beheerder kan de administratie wijzigen.'; end if;
  if tg_op='UPDATE' then
    if new.id<>old.id or new.created_at<>old.created_at or new.created_by is distinct from old.created_by then raise exception 'Herkomst kan niet worden gewijzigd.'; end if;
    if tg_table_name in ('administration_entries','administration_bank') and to_jsonb(old)->>'void_reason' is not null then raise exception 'Een vervallen boeking blijft bewaard en kan niet worden gewijzigd.'; end if;
    if tg_table_name='administration_documents' then
      if (to_jsonb(new)-array['document_date','kind','note','entry_id','bank_id','invoice_id','contract_id','revision','updated_at','updated_by','status'])
         is distinct from (to_jsonb(old)-array['document_date','kind','note','entry_id','bank_id','invoice_id','contract_id','revision','updated_at','updated_by','status']) then
        raise exception 'Het originele bewijsstuk kan niet worden vervangen.';
      end if;
      if old.status='READY' and new.status<>'READY' then raise exception 'Een opgeslagen bewijsstuk blijft bewaard.'; end if;
    end if;
    new.revision:=old.revision+1;
  else
    new.revision:=1; new.created_at:=now(); new.created_by:=auth.uid();
  end if;
  if tg_table_name='administration_documents' and to_jsonb(new)->>'status'='READY' then
    if not exists(select 1 from storage.objects where bucket_id='administration-evidence' and name=to_jsonb(new)->>'object_path'
      and (metadata->>'size')::bigint=(to_jsonb(new)->>'byte_size')::bigint) then raise exception 'Het bestand is nog niet volledig geüpload.'; end if;
  end if;
  new.updated_at:=now(); new.updated_by:=auth.uid();
  insert into public.administration_history(entity,entity_id,action,old_data,new_data,actor_id)
    values(tg_table_name,new.id,tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new),auth.uid());
  return new;
end; $$;
revoke all on function administration_private.record_change() from public,anon,authenticated;

alter table public.administration_entries enable row level security;
alter table public.administration_bank enable row level security;
alter table public.administration_documents enable row level security;
alter table public.administration_history enable row level security;
revoke all on public.administration_entries,public.administration_bank,public.administration_documents,public.administration_history from public,anon,authenticated;
grant select,insert,update on public.administration_entries,public.administration_bank,public.administration_documents to authenticated;
grant select on public.administration_history to authenticated;
do $$ declare t text; begin
  foreach t in array array['administration_entries','administration_bank','administration_documents'] loop
    execute format('create policy admin_read on public.%I for select to authenticated using ((select public.is_staff(array[''ADMIN''])))',t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_staff(array[''ADMIN''])))',t);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_staff(array[''ADMIN'']))) with check ((select public.is_staff(array[''ADMIN''])))',t);
    execute format('create trigger administration_record_change before insert or update on public.%I for each row execute function administration_private.record_change()',t);
  end loop;
end $$;
create policy admin_history_read on public.administration_history for select to authenticated using ((select public.is_staff(array['ADMIN'])));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('administration-evidence','administration-evidence',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp','message/rfc822','application/vnd.ms-outlook','application/xml','text/xml','text/plain','text/csv','application/octet-stream']);
create policy administration_evidence_read on storage.objects for select to authenticated
 using (bucket_id='administration-evidence' and (select public.is_staff(array['ADMIN'])));
create policy administration_evidence_upload on storage.objects for insert to authenticated
 with check (bucket_id='administration-evidence' and (select public.is_staff(array['ADMIN'])) and exists
 (select 1 from public.administration_documents d where d.object_path=name and d.status='PENDING'));
-- No UPDATE or DELETE policies: original evidence cannot be replaced or removed by the app.
