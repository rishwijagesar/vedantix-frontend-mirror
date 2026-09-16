-- Finalized invoices may be paid through their existing unguessable token.
-- Archived invoices and drafts remain unavailable; provider credentials stay server-side.
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
    and i.is_active = true
    and i.status in ('FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED')
  limit 1;
$$;

revoke all on function public.get_public_invoice(uuid) from public, anon, authenticated;
grant execute on function public.get_public_invoice(uuid) to anon, authenticated;

-- Keep the provider transaction ID separately from the invoice reference.
-- Existing ledger entries are immutable and are deliberately left untouched.
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
  v_invoice_number text;
  v_description text;
  v_reference text;
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
    select i.invoice_number,
      left(coalesce(nullif(r.metadata->>'description',''), 'Factuur ' || i.invoice_number || ' - Vedantix' || case when nullif(btrim(i.title),'') is not null then ' - ' || i.title else '' end),255),
      left(coalesce(nullif(r.metadata->>'payment_reference',''), i.invoice_number || case when nullif(btrim(i.payment_reference),'') is not null and i.payment_reference <> i.invoice_number then ' - ' || i.payment_reference else '' end),140)
    into v_invoice_number, v_description, v_reference
    from public.invoices i where i.id=r.invoice_id;

    insert into public.invoice_payments(
      invoice_id, amount, payment_date, method, reference, notes,
      external_payment_id, metadata
    ) values (
      r.invoice_id, round(p_amount,2), coalesce(p_paid_at::date,current_date), 'MOLLIE',
      v_reference, v_description,
      p_provider_payment_id, jsonb_build_object(
        'payment_request_id',r.id,'provider','MOLLIE',
        'invoice_number',v_invoice_number,'payment_reference',v_reference,'description',v_description
      )
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
