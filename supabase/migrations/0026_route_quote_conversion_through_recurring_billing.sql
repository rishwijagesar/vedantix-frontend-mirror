create or replace function public.quote_to_invoice(p_quote_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_result jsonb;
  v_id text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  v_result:=public.activate_quote_billing(p_quote_id,null,null,true);
  v_id:=coalesce(
    v_result->>'immediate_invoice_id',
    v_result->>'monthly_subscription_id',
    v_result->>'yearly_subscription_id'
  );

  if v_id is null then raise exception 'No invoice or subscription created'; end if;
  return v_id::uuid;
end;
$$;
revoke all on function public.quote_to_invoice(uuid) from public,anon,authenticated;
grant execute on function public.quote_to_invoice(uuid) to authenticated;