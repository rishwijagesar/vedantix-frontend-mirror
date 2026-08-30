create or replace function public.refresh_notification_delivery_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_status integer;
  v_content text;
  v_payload jsonb;
  v_url text := 'https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/notification-delivery-status';
begin
  select d.decrypted_secret
  into v_token
  from vault.decrypted_secrets d
  where d.name = 'vedantix_notification_delivery_token'
  order by d.created_at desc
  limit 1;

  if v_token is null then
    raise exception 'Notification delivery token is not configured';
  end if;

  select (r).status, (r).content
  into v_status, v_content
  from (
    select extensions.http(
      (
        'POST'::extensions.http_method,
        v_url::varchar,
        array[
          ('x-control-token', v_token)::extensions.http_header,
          ('accept', 'application/json')::extensions.http_header
        ],
        'application/json'::varchar,
        '{}'::varchar
      )::extensions.http_request
    ) as r
  ) q;

  v_payload := case when v_content is null or btrim(v_content) = '' then '{}'::jsonb else v_content::jsonb end;

  update public.notification_delivery_config
  set transport_ok = coalesce((v_payload->>'transport_ok')::boolean, false),
      credentials_configured = coalesce((v_payload->>'credentials_configured')::boolean, false),
      last_probe_at = now()
  where id = true;

  return jsonb_build_object('http_status', v_status, 'response', v_payload);
exception when others then
  update public.notification_delivery_config
  set transport_ok = false,
      last_probe_at = now()
  where id = true;
  return jsonb_build_object('http_status', null, 'error', sqlerrm);
end;
$$;

revoke all on function public.refresh_notification_delivery_status() from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'vedantix-notification-delivery-status';

select cron.schedule(
  'vedantix-notification-delivery-status',
  '15 * * * *',
  $$select public.refresh_notification_delivery_status();$$
);
