do $$
begin
  if not exists (select 1 from vault.secrets where name = 'vedantix_notification_delivery_token') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'vedantix_notification_delivery_token',
      'Internal token used by Postgres to invoke the monitoring notification delivery Edge Function.'
    );
  end if;
end;
$$;

create or replace function public.verify_notification_delivery_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select d.decrypted_secret = p_token
    from vault.decrypted_secrets d
    where d.name = 'vedantix_notification_delivery_token'
    order by d.created_at desc
    limit 1
  ), false);
$$;

revoke all on function public.verify_notification_delivery_token(text) from public, anon, authenticated;
grant execute on function public.verify_notification_delivery_token(text) to service_role;

create or replace function public.invoke_notification_delivery(p_mode text default 'deliver')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_status integer;
  v_content text;
  v_url text := 'https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/notification-delivery';
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
        jsonb_build_object('mode', p_mode)::text::varchar
      )::extensions.http_request
    ) as r
  ) q;

  return jsonb_build_object(
    'http_status', v_status,
    'response', case
      when v_content is null or btrim(v_content) = '' then null
      else v_content::jsonb
    end
  );
exception when others then
  return jsonb_build_object('http_status', null, 'error', sqlerrm);
end;
$$;

revoke all on function public.invoke_notification_delivery(text) from public, anon, authenticated;
