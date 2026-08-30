create table if not exists public.notification_delivery_config (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  provider text not null default 'MIGADU_SMTP' check (provider in ('MIGADU_SMTP')),
  schedule text not null default '*/5 * * * *',
  updated_at timestamptz not null default now()
);

insert into public.notification_delivery_config(id, enabled, provider, schedule)
values (true, false, 'MIGADU_SMTP', '*/5 * * * *')
on conflict (id) do nothing;

create trigger notification_delivery_config_set_updated_at
before update on public.notification_delivery_config
for each row execute function public.set_updated_at();

alter table public.notification_delivery_config enable row level security;

create policy notification_delivery_config_staff_read on public.notification_delivery_config
for select to authenticated using (public.is_staff());

create policy notification_delivery_config_admin_update on public.notification_delivery_config
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));

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
  v_enabled boolean := false;
  v_queued integer := 0;
  v_url text := 'https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/notification-delivery';
begin
  if p_mode = 'deliver' then
    select c.enabled into v_enabled
    from public.notification_delivery_config c
    where c.id = true;

    if coalesce(v_enabled, false) = false then
      return jsonb_build_object('skipped', true, 'reason', 'delivery_disabled');
    end if;

    select count(*)::integer into v_queued
    from public.monitoring_notifications n
    where n.status = 'QUEUED';

    if v_queued = 0 then
      return jsonb_build_object('skipped', true, 'reason', 'queue_empty');
    end if;
  end if;

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

select cron.unschedule(jobid)
from cron.job
where jobname = 'vedantix-notification-delivery';

select cron.schedule(
  'vedantix-notification-delivery',
  '*/5 * * * *',
  $$select public.invoke_notification_delivery('deliver');$$
);
