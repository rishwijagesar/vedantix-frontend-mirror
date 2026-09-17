-- Runs ONLY in CI's disposable PostgreSQL database, never against production.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
create function public.is_staff(required_roles text[] default array['ADMIN','OPERATOR','READ_ONLY']) returns boolean language sql stable as $$ select coalesce(current_setting('test.staff_role',true)=any(required_roles),false) $$;
grant usage on schema auth to authenticated;
create table public.invoices(id uuid primary key);
create table public.contracts(id uuid primary key);
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select,insert,update,delete on storage.objects to authenticated;
\ir ../supabase/migrations/20260917103604_administration_workspace.sql
begin;
set local role authenticated;
select set_config('test.user_id','00000000-0000-4000-8000-000000000001',true);
select set_config('test.staff_role','ADMIN',true);
insert into public.administration_entries(id,entry_date,supplier,document_number,description,category,vat_reviewed,lines)
values('00000000-0000-4000-8000-000000000002','2026-03-31','Test supplier','INV-1','Software','software',true,'[{"base":100,"vat":21,"deductible":21,"code":"21"}]');
do $$ begin
  if (select count(*) from public.administration_history)<>1 then raise exception 'Missing immutable history'; end if;
  begin
    insert into public.administration_entries(entry_date,supplier,document_number,description,category,vat_reviewed,lines) values('2026-03-31','Test supplier','INV-1','Duplicate','software',true,'[{"base":100,"vat":21,"deductible":21,"code":"21"}]');
    raise exception 'Duplicate was accepted';
  exception when unique_violation then null; end;
  begin
    update public.administration_entries set business_percent=50 where id='00000000-0000-4000-8000-000000000002';
    raise exception 'Invalid deduction accepted';
  exception when raise_exception then if sqlerrm not like 'Controleer de btw-regel%' then raise; end if; end;
  begin
    update public.administration_entries set vat_reviewed=false where id='00000000-0000-4000-8000-000000000002';
    raise exception 'Unreviewed deduction accepted';
  exception when raise_exception then if sqlerrm not like 'Controleer de btw-aftrek%' then raise; end if; end;
  begin
    delete from public.administration_entries;
    raise exception 'Deletion accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.administration_history(entity,entity_id,action,new_data,actor_id) values('fake',gen_random_uuid(),'INSERT','{}',auth.uid());
    raise exception 'Forged history accepted';
  exception when insufficient_privilege then null; end;
end $$;
update public.administration_entries set description='Updated' where id='00000000-0000-4000-8000-000000000002' and revision=1;
do $$ begin if (select revision from public.administration_entries limit 1)<>2 then raise exception 'Revision not incremented'; end if;end $$;
update public.administration_entries set description='Stale overwrite' where id='00000000-0000-4000-8000-000000000002' and revision=1;
do $$ begin if (select description from public.administration_entries limit 1)<>'Updated' then raise exception 'Lost update'; end if; end $$;
insert into public.administration_documents(id,document_date,filename,object_path,mime_type,byte_size,sha256,entry_id)
values('00000000-0000-4000-8000-000000000003','2026-04-01','receipt.pdf','00000000-0000-4000-8000-000000000003/original.pdf','application/pdf',3,repeat('a',64),'00000000-0000-4000-8000-000000000002');
do $$ begin
  begin
    update public.administration_documents set status='READY'; raise exception 'Missing file accepted';
  exception when raise_exception then if sqlerrm not like 'Het bestand is nog niet%' then raise; end if; end;
  begin
    insert into storage.objects(bucket_id,name,metadata) values('administration-evidence','other/path','{"size":3}');raise exception 'Unregistered upload accepted';
  exception when insufficient_privilege then null; end;
end $$;
insert into storage.objects(bucket_id,name,metadata) values('administration-evidence','00000000-0000-4000-8000-000000000003/original.pdf','{"size":3}');
update public.administration_documents set status='READY';
do $$ begin
  begin
    update public.administration_documents set filename='replaced.pdf'; raise exception 'Original changed';
  exception when raise_exception then if sqlerrm not like 'Het originele bewijsstuk%' then raise; end if; end;
end $$;
update storage.objects set metadata='{"size":9}' where bucket_id='administration-evidence';
delete from storage.objects where bucket_id='administration-evidence';
do $$ begin if (select count(*) from storage.objects)<>1 or (select metadata->>'size' from storage.objects limit 1)<>'3' then raise exception 'Original overwritten or deleted'; end if; end $$;
select set_config('test.staff_role','OPERATOR',true);
do $$ begin
 if (select count(*) from public.administration_entries)<>0 or (select count(*) from public.administration_documents)<>0 or (select count(*) from storage.objects)<>0 then raise exception 'Non-admin could read';end if;
 begin insert into public.administration_bank(transaction_date,account,description,amount)values(current_date,'Bank','Unauthorized',1);raise exception 'Non-admin could write';exception when insufficient_privilege then null;when raise_exception then if sqlerrm not like 'Alleen een beheerder%' then raise;end if;end;
end $$;
reset role;
set local role anon;
do $$ begin begin perform * from public.administration_entries;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'Administration security and database validation passed' as result;
