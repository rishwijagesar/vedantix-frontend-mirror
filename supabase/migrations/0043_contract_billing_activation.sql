alter table public.contract_events
  drop constraint if exists contract_events_event_type_check;

alter table public.contract_events
  add constraint contract_events_event_type_check check (event_type in (
    'CONTRACT_CREATED','CONTRACT_UPDATED','CONTRACT_FINALIZED','VEDANTIX_SIGNED',
    'SIGNATURE_REQUESTED','EMAIL_SENT','DOCUMENT_OPENED','OTP_REQUESTED',
    'OTP_VERIFIED','CONSENT_GIVEN','CLIENT_SIGNED','CONTRACT_COMPLETED',
    'PDF_GENERATED','CERTIFICATE_GENERATED','VOIDED','BILLING_ACTIVATED'
  ));

create or replace function public.activate_contract_billing(p_contract_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
  c public.contracts%rowtype;
  q public.quotes%rowtype;
  v_result jsonb;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  select * into c
  from public.contracts
  where id=p_contract_id
  for update;

  if not found then raise exception 'Contract not found'; end if;
  if c.status<>'COMPLETED' then raise exception 'Completed contract required'; end if;
  if c.source_quote_id is null then raise exception 'Contract has no linked quote'; end if;

  select * into q
  from public.quotes
  where id=c.source_quote_id
  for update;

  if not found then raise exception 'Linked quote not found'; end if;
  if q.customer_id is distinct from c.customer_id then raise exception 'Contract and quote customer mismatch'; end if;
  if q.status<>'ACCEPTED' then raise exception 'Accepted quote required'; end if;
  if q.billing_activated_at is not null then raise exception 'Billing already activated for this quote'; end if;

  -- Keep future subscription invoices as drafts until staff explicitly finalizes them.
  v_result := public.activate_quote_billing(q.id,null,null,false);

  insert into public.contract_events(contract_id,event_type,actor_role,metadata)
  values (
    c.id,
    'BILLING_ACTIVATED',
    'VEDANTIX',
    jsonb_build_object(
      'source_quote_id',q.id,
      'source_quote_number',q.quote_number,
      'auto_finalize',false,
      'result',v_result
    )
  );

  return v_result;
end;
$$;

revoke all on function public.activate_contract_billing(uuid) from public,anon,authenticated;
grant execute on function public.activate_contract_billing(uuid) to authenticated;
