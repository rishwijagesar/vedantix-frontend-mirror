create table if not exists public.admin_password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_at timestamptz not null default now()
);

create index if not exists admin_password_reset_requests_email_time_idx
  on public.admin_password_reset_requests (lower(email), requested_at desc);

alter table public.admin_password_reset_requests enable row level security;

create or replace function public.can_request_admin_password_reset(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_authorized boolean := false;
  v_recent_count integer := 0;
  v_last_request timestamptz;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return false;
  end if;

  select exists (
    select 1
    from auth.users u
    join public.staff_users s on s.user_id = u.id
    where lower(u.email) = v_email
      and s.active = true
  ) into v_authorized;

  if not v_authorized then
    return false;
  end if;

  select count(*), max(r.requested_at)
    into v_recent_count, v_last_request
  from public.admin_password_reset_requests r
  where lower(r.email) = v_email
    and r.requested_at > now() - interval '1 hour';

  if v_recent_count >= 3 then
    return false;
  end if;

  if v_last_request is not null and v_last_request > now() - interval '60 seconds' then
    return false;
  end if;

  insert into public.admin_password_reset_requests(email)
  values (v_email);

  delete from public.admin_password_reset_requests
  where requested_at < now() - interval '7 days';

  return true;
end;
$$;

revoke all on function public.can_request_admin_password_reset(text) from public, anon, authenticated;
grant execute on function public.can_request_admin_password_reset(text) to service_role;
