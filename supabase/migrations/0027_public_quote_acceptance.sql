-- Vedantix Sales & Billing — secure public quote review and acceptance
-- Public clients never receive direct SELECT/UPDATE rights on quotes or quote_items.
-- Access is capability-based through an unguessable UUID token and SECURITY DEFINER RPCs.

alter table public.quotes
  add column if not exists public_token uuid not null default gen_random_uuid(),
  add column if not exists responded_by_name text,
  add column if not exists response_note text,
  add column if not exists responded_at timestamptz;

create unique index if not exists quotes_public_token_uidx on public.quotes(public_token);

create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'quote_number', q.quote_number,
    'status', case
      when q.status = 'SENT' and q.valid_until is not null and q.valid_until < current_date then 'EXPIRED'
      else q.status
    end,
    'quote_date', q.quote_date,
    'valid_until', q.valid_until,
    'title', q.title,
    'intro_text', q.intro_text,
    'notes', q.notes,
    'terms', q.terms,
    'subtotal_ex_vat', q.subtotal_ex_vat,
    'document_discount_ex_vat', q.document_discount_ex_vat,
    'total_ex_vat', q.total_ex_vat,
    'vat_total', q.vat_total,
    'total_incl_vat', q.total_incl_vat,
    'responded_by_name', q.responded_by_name,
    'response_note', q.response_note,
    'responded_at', q.responded_at,
    'company', jsonb_strip_nulls(jsonb_build_object(
      'trade_name', q.company_snapshot->>'trade_name',
      'legal_name', q.company_snapshot->>'legal_name',
      'address_line1', q.company_snapshot->>'address_line1',
      'address_line2', q.company_snapshot->>'address_line2',
      'postal_code', q.company_snapshot->>'postal_code',
      'city', q.company_snapshot->>'city',
      'country', q.company_snapshot->>'country',
      'kvk_number', q.company_snapshot->>'kvk_number',
      'vat_number', q.company_snapshot->>'vat_number',
      'iban', q.company_snapshot->>'iban',
      'bic', q.company_snapshot->>'bic',
      'email', q.company_snapshot->>'email',
      'phone', q.company_snapshot->>'phone',
      'website', q.company_snapshot->>'website'
    )),
    'customer', jsonb_strip_nulls(jsonb_build_object(
      'company_name', q.customer_snapshot->>'company_name',
      'contact_name', q.customer_snapshot->>'contact_name',
      'address_line1', q.customer_snapshot->>'address_line1',
      'address_line2', q.customer_snapshot->>'address_line2',
      'postal_code', q.customer_snapshot->>'postal_code',
      'city', q.customer_snapshot->>'city',
      'country', q.customer_snapshot->>'country',
      'kvk_number', q.customer_snapshot->>'kvk_number',
      'vat_number', q.customer_snapshot->>'vat_number'
    )),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'position', qi.position,
          'code', qi.code,
          'description', qi.description,
          'billing_type', qi.billing_type,
          'quantity', qi.quantity,
          'unit_price_ex_vat', qi.unit_price_ex_vat,
          'vat_rate', qi.vat_rate,
          'line_discount_ex_vat', qi.line_discount_ex_vat,
          'line_total_ex_vat', qi.line_total_ex_vat,
          'line_vat', qi.line_vat,
          'line_total_incl_vat', qi.line_total_incl_vat
        ) order by qi.position, qi.id
      )
      from public.quote_items qi
      where qi.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  where q.public_token = p_token
    and q.status in ('SENT', 'ACCEPTED', 'REJECTED')
  limit 1;
$$;

revoke all on function public.get_public_quote(uuid) from public, anon, authenticated;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;

create or replace function public.respond_to_public_quote(
  p_token uuid,
  p_action text,
  p_name text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes%rowtype;
  v_status text;
begin
  v_status := case upper(trim(coalesce(p_action, '')))
    when 'ACCEPT' then 'ACCEPTED'
    when 'REJECT' then 'REJECTED'
    else null
  end;

  if v_status is null then
    raise exception 'Unsupported quote response';
  end if;

  select * into q
  from public.quotes
  where public_token = p_token
  for update;

  if not found then
    raise exception 'Quote not found';
  end if;

  if q.status = v_status then
    return jsonb_build_object('status', q.status, 'responded_at', q.responded_at);
  end if;

  if q.status <> 'SENT' then
    raise exception 'Quote can no longer be changed';
  end if;

  if q.valid_until is not null and q.valid_until < current_date then
    raise exception 'Quote has expired';
  end if;

  update public.quotes
  set status = v_status,
      accepted_at = case when v_status = 'ACCEPTED' then now() else accepted_at end,
      rejected_at = case when v_status = 'REJECTED' then now() else rejected_at end,
      responded_by_name = nullif(left(trim(coalesce(p_name, '')), 160), ''),
      response_note = nullif(left(trim(coalesce(p_note, '')), 2000), ''),
      responded_at = now(),
      updated_at = now()
  where id = q.id;

  return jsonb_build_object('status', v_status, 'responded_at', now());
end;
$$;

revoke all on function public.respond_to_public_quote(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.respond_to_public_quote(uuid, text, text, text) to anon, authenticated;
