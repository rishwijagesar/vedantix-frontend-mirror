-- Reviewed purchases use the existing durable journal and export lease.
-- They are exported explicitly per document, never picked up by the sales worker.
alter table public.ebookhouden_exports drop constraint ebookhouden_exports_source_kind_check;
alter table public.ebookhouden_exports add constraint ebookhouden_exports_source_kind_check check(source_kind in ('INVOICE','CREDIT','PAYMENT','PURCHASE'));

create or replace function ebookhouden_private.sync(p_action text,p_lease uuid default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.ebookhouden_config%rowtype; j public.ebookhouden_exports%rowtype; v_secret text;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Not authorized'; end if;
 select * into c from public.ebookhouden_config where id for update;
 if p_action='worker_auth' then
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='vedantix_ebookhouden_worker';
  return to_jsonb(v_secret is not null and length(v_secret)>=60 and v_secret=coalesce(p_data->>'secret',''));
 elsif p_action='claim' then
  if p_lease is null or c.lock_until>now() then return 'false'::jsonb; end if;
  update public.ebookhouden_exports set status='REVIEW',message='De vorige verwerking is onderbroken. Controleer de boeking.',updated_at=now() where status='SENDING';
  update public.ebookhouden_config set lock_id=p_lease,lock_until=now()+interval '5 minutes' where id;
  return 'true'::jsonb;
 elsif p_action='release' then
  update public.ebookhouden_config set lock_id=null,lock_until=null where id and lock_id=p_lease;
  return 'true'::jsonb;
 elsif p_action='settings' then
  if c.lock_until>now() then raise exception 'Accounting export in progress'; end if;
  if p_data->>'payment_mode' not in ('EXTERNAL','VEDANTIX') then raise exception 'Invalid payment mode'; end if;
  if coalesce((p_data->>'enabled')::boolean,false) then
   if not c.connected or c.mapping->>'debtor' is null or c.mapping->>'revenue' is null or not exists(select 1 from public.ebookhouden_exports where status='SYNCED' and source_kind='INVOICE') or exists(select 1 from public.ebookhouden_exports where status<>'SYNCED') then raise exception 'First reviewed invoice required'; end if;
   if p_data->>'payment_mode'<>c.payment_mode then raise exception 'Save payment mode before activating'; end if;
  end if;
  update public.ebookhouden_config set payment_mode=p_data->>'payment_mode',sync_enabled=coalesce((p_data->>'enabled')::boolean,false),sync_from=case when (p_data->>'enabled')::boolean then coalesce(c.sync_from,now()) else null end,last_sync_error=null,updated_at=now() where id;
  return 'true'::jsonb;
 end if;
 if c.lock_id is distinct from p_lease or c.lock_until<=now() or c.lock_until is null then raise exception 'Export lease expired'; end if;
 if p_action='anchor' then
  if c.anchor_ledger_id is not null and c.anchor_ledger_id<>(p_data->>'ledger')::bigint then raise exception 'Different administration'; end if;
  update public.ebookhouden_config set anchor_ledger_id=(p_data->>'ledger')::bigint where id;
 elsif p_action='sending' then
  if not c.connected then raise exception 'Disconnected'; end if;
  if p_data->>'kind'='PURCHASE' then
   perform 1 from public.administration_entries where id=(p_data->>'id')::uuid for update;
   if not exists(select 1 from public.administration_entries where id=(p_data->>'id')::uuid and updated_at=(p_data->>'source_updated_at')::timestamptz and vat_reviewed and void_reason is null and treatment='EXPENSE' and business_percent=100) then raise exception 'Purchase changed since review'; end if;
   perform 1 from public.administration_documents where entry_id=(p_data->>'id')::uuid for update;
   if not exists(select 1 from public.administration_documents where entry_id=(p_data->>'id')::uuid and status='READY') then raise exception 'Purchase evidence required'; end if;
  else
  -- Serialize source validation with changes in the billing application.
  perform 1 from public.invoices where id=(p_data->>'invoice_id')::uuid for update;
  if not exists(select 1 from public.invoices where id=(p_data->>'invoice_id')::uuid and is_active and finalized_at is not null and status in ('FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED')) then raise exception 'Invoice is no longer eligible'; end if;
  if p_data->>'kind'='INVOICE' then
   if not exists(select 1 from public.invoices where id=(p_data->>'id')::uuid and updated_at=(p_data->>'source_updated_at')::timestamptz and total_incl_vat=(p_data->>'amount')::numeric) then raise exception 'Invoice changed since review'; end if;
  elsif p_data->>'kind'='PAYMENT' then
   perform 1 from public.invoice_payments where id=(p_data->>'id')::uuid for update;
   if not exists(select 1 from public.invoice_payments where id=(p_data->>'id')::uuid and invoice_id=(p_data->>'invoice_id')::uuid and voided_at is null and method=p_data->>'source_method' and reference is not distinct from p_data->>'source_reference' and amount=(p_data->>'amount')::numeric and payment_date::date=(p_data->>'date')::date) then raise exception 'Payment changed since review'; end if;
  elsif p_data->>'kind'='CREDIT' then
   perform 1 from public.credit_notes where id=(p_data->>'id')::uuid for update;
   if not exists(select 1 from public.credit_notes where id=(p_data->>'id')::uuid and invoice_id=(p_data->>'invoice_id')::uuid and status in ('FINALIZED','SENT') and finalized_at is not null and total_incl_vat=(p_data->>'amount')::numeric and total_ex_vat=(p_data->>'base')::numeric and vat_total=(p_data->>'vat')::numeric and credit_date=(p_data->>'date')::date and credit_number=p_data->>'number') then raise exception 'Credit changed since review'; end if;
  end if;
  end if;
  select * into j from public.ebookhouden_exports where source_kind=p_data->>'kind' and source_id=(p_data->>'id')::uuid for update;
  if found then
   if j.status='SYNCED' or j.source_hash<>p_data->>'source_hash' or j.review_hash<>p_data->>'review_hash' then raise exception 'Export already posted or changed'; end if;
   update public.ebookhouden_exports set status='SENDING',message=null,updated_at=now() where source_kind=j.source_kind and source_id=j.source_id;
  else
   insert into public.ebookhouden_exports(source_kind,source_id,invoice_id,source_hash,review_hash,status,draft,created_by)
   values(p_data->>'kind',(p_data->>'id')::uuid,(p_data->>'invoice_id')::uuid,p_data->>'source_hash',p_data->>'review_hash','SENDING',p_data,nullif(p_data->>'actor','')::uuid);
  end if;
 elsif p_action='finish' then
  if p_data->>'status' not in ('REVIEW','SYNCED') then raise exception 'Invalid status'; end if;
  update public.ebookhouden_exports set status=p_data->>'status',remote_id=coalesce((p_data->>'remote_id')::bigint,remote_id),message=left(p_data->>'message',500),updated_at=now() where source_kind=p_data->>'kind' and source_id=(p_data->>'id')::uuid;
  if not found then raise exception 'Missing posting intent'; end if;
  update public.ebookhouden_config set last_sync_at=now(),last_sync_error=case when p_data->>'status'='REVIEW' then left(p_data->>'message',500) else null end,sync_enabled=case when p_data->>'status'='REVIEW' then false else sync_enabled end where id;
 elsif p_action='pause' then
  update public.ebookhouden_config set sync_enabled=false,last_sync_error=left(p_data->>'message',500),last_sync_at=now() where id;
 else raise exception 'Invalid action';
 end if;
 return 'true'::jsonb;
end; $$;

create function ebookhouden_private.guard_purchase() returns trigger language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_new uuid;
begin
 if tg_table_name='administration_entries' then v_id:=old.id;
 else v_id:=old.entry_id; if tg_op<>'DELETE' then v_new:=new.entry_id; end if;
 end if;
 if exists(select 1 from public.ebookhouden_exports j join public.ebookhouden_config c on c.id where j.source_kind='PURCHASE' and j.source_id in (v_id,v_new) and j.status='SENDING' and c.lock_until>now()) then raise exception 'Accounting export in progress; retry shortly'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
revoke all on function ebookhouden_private.guard_purchase() from public,anon,authenticated;
create trigger ebookhouden_purchase_guard before update or delete on public.administration_entries for each row execute function ebookhouden_private.guard_purchase();
create trigger ebookhouden_purchase_evidence_guard before update or delete on public.administration_documents for each row execute function ebookhouden_private.guard_purchase();
