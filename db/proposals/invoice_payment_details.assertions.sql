begin;
do $$
declare
  v_invoice uuid;
  v_token uuid;
  v_request uuid;
  v_first uuid;
  v_second uuid;
  v_reference text;
  v_count integer;
  v_rejected boolean := false;
begin
  insert into public.invoices(customer_id, invoice_number, status, invoice_date, due_date, title, payment_reference, total_ex_vat, vat_total, total_incl_vat, amount_paid)
  values ((select customer_id from public.invoices limit 1), 'QR-REGRESSION-' || gen_random_uuid()::text, 'FINALIZED', current_date, current_date+14, 'Website & hosting test', 'PROJECT-TEST', 100, 21, 121, 0)
  returning id, public_token, invoice_number into v_invoice, v_token, v_reference;
  if public.get_public_invoice(v_token) is null then raise exception 'Finalized invoice unavailable'; end if;
  update public.invoices set is_active=false where id=v_invoice;
  if public.get_public_invoice(v_token) is not null then raise exception 'Archived invoice is public'; end if;
  update public.invoices set is_active=true where id=v_invoice;

  insert into public.payment_requests(invoice_id,amount,currency,status,provider_payment_id,metadata)
  values(v_invoice,121,'EUR','OPEN','tr_QRRegression' || replace(gen_random_uuid()::text,'-',''),jsonb_build_object(
    'invoice_number',v_reference,'payment_reference',v_reference || ' - PROJECT-TEST',
    'description','Factuur ' || v_reference || ' - Vedantix - Website & hosting test'
  )) returning id into v_request;

  begin
    perform public.register_mollie_payment_system(v_request,(select provider_payment_id from public.payment_requests where id=v_request),120,now());
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Incorrect payment amount accepted'; end if;

  v_first := public.register_mollie_payment_system(v_request,(select provider_payment_id from public.payment_requests where id=v_request),121,now());
  v_second := public.register_mollie_payment_system(v_request,(select provider_payment_id from public.payment_requests where id=v_request),121,now());
  if v_first is distinct from v_second then raise exception 'Webhook retry duplicated payment'; end if;
  select count(*) into v_count from public.invoice_payments where invoice_id=v_invoice;
  if v_count <> 1 then raise exception 'Expected exactly one ledger row'; end if;
  if not exists(select 1 from public.invoice_payments where id=v_first
    and reference=v_reference || ' - PROJECT-TEST'
    and notes='Factuur ' || v_reference || ' - Vedantix - Website & hosting test'
    and metadata->>'invoice_number'=v_reference
    and external_payment_id=(select provider_payment_id from public.payment_requests where id=v_request)
  ) then raise exception 'Accounting fields do not match'; end if;
  if not exists(select 1 from public.invoices where id=v_invoice and status='PAID' and amount_paid=121) then raise exception 'Invoice not marked paid'; end if;
end;
$$;
rollback;
select 'PASS: finalized and archived access, amount validation, idempotent webhook ledger and accounting references; all fixture changes rolled back' as result;
