create or replace function public.can_request_admin_login(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from auth.users u
      join public.staff_users s on s.user_id = u.id
      where lower(u.email) = lower(trim(p_email))
        and s.active = true
    )
    or exists (
      select 1
      from public.staff_invites i
      where lower(i.email) = lower(trim(p_email))
        and i.active = true
    );
$$;

revoke all on function public.can_request_admin_login(text) from public;
grant execute on function public.can_request_admin_login(text) to anon, authenticated;

create table if not exists public.monitoring_notifications (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.monitoring_alerts(id) on delete cascade,
  event_type text not null check (event_type in ('ALERT_OPENED','ALERT_RESOLVED')),
  channel text not null default 'UNASSIGNED',
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED','SKIPPED')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create index if not exists monitoring_notifications_status_created_idx
on public.monitoring_notifications(status, created_at);

alter table public.monitoring_notifications enable row level security;

create policy monitoring_notifications_staff_read on public.monitoring_notifications
for select to authenticated using (public.is_staff());

create or replace function public.queue_monitoring_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'OPEN' then
    insert into public.monitoring_notifications(alert_id,event_type,payload)
    values(new.id,'ALERT_OPENED',jsonb_build_object(
      'domain_id',new.domain_id,
      'check_type',new.check_type,
      'severity',new.severity,
      'message',new.message,
      'details',new.details,
      'first_seen_at',new.first_seen_at
    ));
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'RESOLVED' then
    insert into public.monitoring_notifications(alert_id,event_type,payload)
    values(new.id,'ALERT_RESOLVED',jsonb_build_object(
      'domain_id',new.domain_id,
      'check_type',new.check_type,
      'severity',new.severity,
      'message',new.message,
      'resolved_at',new.resolved_at
    ));
  end if;
  return new;
end;
$$;

revoke all on function public.queue_monitoring_notification() from public, anon, authenticated;

drop trigger if exists monitoring_alert_notification_queue on public.monitoring_alerts;
create trigger monitoring_alert_notification_queue
after insert or update on public.monitoring_alerts
for each row execute function public.queue_monitoring_notification();

create or replace function public.normalize_monitoring_run_output()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  filtered jsonb;
begin
  if new.automation_type = 'DOMAIN_HEALTH_MONITOR' and new.output ? 'changes' then
    select coalesce(jsonb_agg(c), '[]'::jsonb)
    into filtered
    from jsonb_array_elements(coalesce(new.output->'changes','[]'::jsonb)) c
    where (c->>'previous_status') is distinct from (c->>'current_status')
       or c->>'check_type' in ('MX','SPF','DMARC','DKIM');

    new.output := jsonb_set(new.output,'{changes}',filtered,true);
    new.output := jsonb_set(new.output,'{change_count}',to_jsonb(jsonb_array_length(filtered)),true);
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_monitoring_run_output on public.automation_runs;
create trigger normalize_monitoring_run_output
before update on public.automation_runs
for each row execute function public.normalize_monitoring_run_output();
