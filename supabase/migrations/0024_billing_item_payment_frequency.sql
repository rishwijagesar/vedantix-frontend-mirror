-- Add a billing cadence snapshot to sales document lines.
-- Existing product-backed lines inherit the cadence from the catalog; manual lines remain one-time.

alter table public.quote_items
  add column if not exists billing_type text not null default 'ONE_TIME'
  check (billing_type in ('ONE_TIME','MONTHLY','YEARLY'));

alter table public.invoice_items
  add column if not exists billing_type text not null default 'ONE_TIME'
  check (billing_type in ('ONE_TIME','MONTHLY','YEARLY'));

update public.quote_items qi
set billing_type = pc.billing_type
from public.product_catalog pc
where qi.catalog_product_id = pc.id
  and qi.billing_type is distinct from pc.billing_type;

update public.invoice_items ii
set billing_type = pc.billing_type
from public.product_catalog pc
where ii.catalog_product_id = pc.id
  and ii.billing_type is distinct from pc.billing_type;

create or replace function public.quote_to_invoice(p_quote_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  q public.quotes%rowtype;
  v_invoice uuid;
  v_company jsonb;
  v_customer jsonb;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  select * into q
  from public.quotes
  where id = p_quote_id;

  if not found then
    raise exception 'Quote not found';
  end if;

  v_company := coalesce(
    q.company_snapshot,
    (select to_jsonb(cp) - 'updated_by' from public.company_profile cp where id = true)
  );
  v_customer := coalesce(
    q.customer_snapshot,
    (select to_jsonb(c) from public.customers c where c.id = q.customer_id)
  );

  insert into public.invoices(
    source_quote_id,
    customer_id,
    status,
    title,
    notes,
    discount_type,
    discount_value,
    company_snapshot,
    customer_snapshot,
    created_by
  )
  values(
    q.id,
    q.customer_id,
    'DRAFT',
    'Factuur',
    q.notes,
    q.discount_type,
    q.discount_value,
    v_company,
    v_customer,
    auth.uid()
  )
  returning id into v_invoice;

  insert into public.invoice_items(
    invoice_id,
    position,
    catalog_product_id,
    code,
    description,
    billing_type,
    quantity,
    unit_price_ex_vat,
    vat_rate,
    discount_type,
    discount_value
  )
  select
    v_invoice,
    position,
    catalog_product_id,
    code,
    description,
    billing_type,
    quantity,
    unit_price_ex_vat,
    vat_rate,
    discount_type,
    discount_value
  from public.quote_items
  where quote_id = q.id
  order by position, id;

  return v_invoice;
end;
$$;

revoke all on function public.quote_to_invoice(uuid) from public, anon, authenticated;
grant execute on function public.quote_to_invoice(uuid) to authenticated;
