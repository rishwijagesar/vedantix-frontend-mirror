alter table public.credit_notes add column if not exists invoice_number text;

create or replace function public.create_full_credit_note(p_invoice_id uuid,p_reason text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare inv public.invoices%rowtype; v_id uuid; v_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into inv from public.invoices where id=p_invoice_id for update;
  if not found or inv.invoice_number is null then raise exception 'Finalized invoice required'; end if;
  v_number:=public.allocate_document_number('CREDIT');
  insert into public.credit_notes(credit_number,invoice_id,invoice_number,customer_id,status,credit_date,reason,total_ex_vat,vat_total,total_incl_vat,company_snapshot,customer_snapshot,finalized_at,created_by)
    values(v_number,inv.id,inv.invoice_number,inv.customer_id,'FINALIZED',current_date,p_reason,-inv.total_ex_vat,-inv.vat_total,-inv.total_incl_vat,inv.company_snapshot,inv.customer_snapshot,now(),auth.uid()) returning id into v_id;
  update public.invoices set status='CREDITED',updated_at=now() where id=p_invoice_id;
  return v_id;
end; $$;
revoke all on function public.create_full_credit_note(uuid,text) from public,anon,authenticated;
grant execute on function public.create_full_credit_note(uuid,text) to authenticated;

create or replace function public.protect_non_draft_quote() returns trigger language plpgsql set search_path='' as $$
begin
  if old.status<>'DRAFT' and (
    old.customer_id is distinct from new.customer_id or old.quote_date is distinct from new.quote_date or old.valid_until is distinct from new.valid_until or old.title is distinct from new.title or old.intro_text is distinct from new.intro_text or old.notes is distinct from new.notes or old.terms is distinct from new.terms or old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value or old.subtotal_ex_vat is distinct from new.subtotal_ex_vat or old.line_discount_ex_vat is distinct from new.line_discount_ex_vat or old.document_discount_ex_vat is distinct from new.document_discount_ex_vat or old.total_ex_vat is distinct from new.total_ex_vat or old.vat_total is distinct from new.vat_total or old.total_incl_vat is distinct from new.total_incl_vat or old.company_snapshot is distinct from new.company_snapshot or old.customer_snapshot is distinct from new.customer_snapshot
  ) then raise exception 'Sent/accepted quote financial content is immutable; duplicate the quote for changes'; end if;
  new.updated_at:=now(); return new;
end; $$;
revoke all on function public.protect_non_draft_quote() from public,anon,authenticated;
drop trigger if exists protect_non_draft_quote_trigger on public.quotes;
create trigger protect_non_draft_quote_trigger before update on public.quotes for each row execute function public.protect_non_draft_quote();

create or replace function public.protect_non_draft_quote_items() returns trigger language plpgsql set search_path='' as $$
declare v_quote_id uuid; v_status text;
begin
  v_quote_id:=coalesce(new.quote_id,old.quote_id); select status into v_status from public.quotes where id=v_quote_id;
  if v_status<>'DRAFT' then raise exception 'Sent/accepted quote items are immutable; duplicate the quote for changes'; end if;
  return coalesce(new,old);
end; $$;
revoke all on function public.protect_non_draft_quote_items() from public,anon,authenticated;
drop trigger if exists protect_non_draft_quote_items_trigger on public.quote_items;
create trigger protect_non_draft_quote_items_trigger before insert or update or delete on public.quote_items for each row execute function public.protect_non_draft_quote_items();

create or replace function public.enforce_invoice_payment_amount() returns trigger language plpgsql set search_path='' as $$
begin
  if new.amount_paid<0 then raise exception 'Paid amount cannot be negative'; end if;
  if new.status<>'DRAFT' and new.amount_paid>new.total_incl_vat then raise exception 'Paid amount cannot exceed invoice total'; end if;
  return new;
end; $$;
revoke all on function public.enforce_invoice_payment_amount() from public,anon,authenticated;
drop trigger if exists enforce_invoice_payment_amount_trigger on public.invoices;
create trigger enforce_invoice_payment_amount_trigger before insert or update on public.invoices for each row execute function public.enforce_invoice_payment_amount();
