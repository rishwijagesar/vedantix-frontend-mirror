-- Vedantix Sales & Billing — staff controls for the billing email outbox

create or replace function public.trigger_billing_email_delivery()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;
  return public.invoke_billing_email_delivery('deliver');
end;
$$;
revoke all on function public.trigger_billing_email_delivery() from public, anon, authenticated;
grant execute on function public.trigger_billing_email_delivery() to authenticated;

create or replace function public.retry_billing_email(p_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  update public.billing_email_outbox
  set status='QUEUED', processed_at=null, error_message=null
  where id=p_message_id and status='FAILED'
  returning id into v_id;

  if v_id is null then raise exception 'Failed message not found'; end if;
  return v_id;
end;
$$;
revoke all on function public.retry_billing_email(uuid) from public, anon, authenticated;
grant execute on function public.retry_billing_email(uuid) to authenticated;
