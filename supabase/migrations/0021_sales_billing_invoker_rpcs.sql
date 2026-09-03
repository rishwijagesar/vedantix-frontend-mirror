-- Keep financial RPC entrypoints callable by staff without exposing SECURITY DEFINER functions through PostgREST.

grant select, insert, update on public.document_sequences to authenticated;
drop policy if exists document_sequences_ops on public.document_sequences;
create policy document_sequences_ops on public.document_sequences
for all to authenticated
using (public.is_staff(array['ADMIN','OPERATOR']))
with check (public.is_staff(array['ADMIN','OPERATOR']));

create or replace function public.allocate_document_number(p_type text)
returns text language plpgsql security invoker set search_path='' as $$
declare v_year integer:=extract(year from current_date)::integer; v_number integer; v_prefix text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  if p_type not in ('QUOTE','INVOICE','CREDIT') then raise exception 'Unsupported document type'; end if;
  insert into public.document_sequences(document_type,sequence_year,next_number) values(p_type,v_year,2)
    on conflict(document_type,sequence_year) do update set next_number=public.document_sequences.next_number+1
    returning next_number-1 into v_number;
  select case p_type when 'QUOTE' then quote_prefix when 'INVOICE' then invoice_prefix else credit_prefix end
    into v_prefix from public.company_profile where id=true;
  return format('%s-%s-%s',coalesce(v_prefix,p_type),v_year,lpad(v_number::text,4,'0'));
end; $$;
revoke all on function public.allocate_document_number(text) from public,anon,authenticated;
grant execute on function public.allocate_document_number(text) to authenticated;

create or replace function public.quote_to_invoice(p_quote_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare q public.quotes%rowtype; v_invoice uuid; v_company jsonb; v_customer jsonb;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into q from public.quotes where id=p_quote_id; if not found then raise exception 'Quote not found'; end if;
  v_company:=coalesce(q.company_snapshot,(select to_jsonb(cp)-'updated_by' from public.company_profile cp where id=true));
  v_customer:=coalesce(q.customer_snapshot,(select to_jsonb(c) from public.customers c where c.id=q.customer_id));
  insert into public.invoices(source_quote_id,customer_id,status,title,notes,discount_type,discount_value,company_snapshot,customer_snapshot,created_by)
    values(q.id,q.customer_id,'DRAFT','Factuur',q.notes,q.discount_type,q.discount_value,v_company,v_customer,auth.uid()) returning id into v_invoice;
  insert into public.invoice_items(invoice_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
    select v_invoice,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value from public.quote_items where quote_id=q.id order by position,id;
  return v_invoice;
end; $$;
revoke all on function public.quote_to_invoice(uuid) from public,anon,authenticated;
grant execute on function public.quote_to_invoice(uuid) to authenticated;

create or replace function public.finalize_invoice(p_invoice_id uuid)
returns text language plpgsql security invoker set search_path='' as $$
declare inv public.invoices%rowtype; v_term integer; v_number text; v_company jsonb; v_customer jsonb;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into inv from public.invoices where id=p_invoice_id for update; if not found then raise exception 'Invoice not found'; end if;
  if inv.status<>'DRAFT' then return inv.invoice_number; end if;
  if not exists(select 1 from public.invoice_items where invoice_id=p_invoice_id) then raise exception 'Invoice has no items'; end if;
  select default_payment_term_days into v_term from public.company_profile where id=true;
  v_number:=public.allocate_document_number('INVOICE');
  v_company:=coalesce(inv.company_snapshot,(select to_jsonb(cp)-'updated_by' from public.company_profile cp where id=true));
  v_customer:=coalesce(inv.customer_snapshot,(select to_jsonb(c) from public.customers c where c.id=inv.customer_id));
  update public.invoices set invoice_number=v_number,status='FINALIZED',invoice_date=coalesce(invoice_date,current_date),delivery_date=coalesce(delivery_date,current_date),due_date=coalesce(due_date,current_date+v_term),payment_reference=coalesce(nullif(payment_reference,''),v_number),company_snapshot=v_company,customer_snapshot=v_customer,finalized_at=now(),updated_at=now() where id=p_invoice_id;
  return v_number;
end; $$;
revoke all on function public.finalize_invoice(uuid) from public,anon,authenticated;
grant execute on function public.finalize_invoice(uuid) to authenticated;

create or replace function public.create_full_credit_note(p_invoice_id uuid,p_reason text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare inv public.invoices%rowtype; v_id uuid; v_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into inv from public.invoices where id=p_invoice_id for update;
  if not found or inv.invoice_number is null then raise exception 'Finalized invoice required'; end if;
  v_number:=public.allocate_document_number('CREDIT');
  insert into public.credit_notes(credit_number,invoice_id,customer_id,status,credit_date,reason,total_ex_vat,vat_total,total_incl_vat,company_snapshot,customer_snapshot,finalized_at,created_by)
    values(v_number,inv.id,inv.customer_id,'FINALIZED',current_date,p_reason,-inv.total_ex_vat,-inv.vat_total,-inv.total_incl_vat,inv.company_snapshot,inv.customer_snapshot,now(),auth.uid()) returning id into v_id;
  update public.invoices set status='CREDITED',updated_at=now() where id=p_invoice_id;
  return v_id;
end; $$;
revoke all on function public.create_full_credit_note(uuid,text) from public,anon,authenticated;
grant execute on function public.create_full_credit_note(uuid,text) to authenticated;
