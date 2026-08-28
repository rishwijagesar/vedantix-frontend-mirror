-- Bootstrap the first confirmed Vedantix admin safely.
-- Only a confirmed @vedantix.nl Supabase Auth user can become the initial ADMIN.
-- Once an active staff user exists, this trigger no longer provisions additional admins.

create or replace function public.bootstrap_first_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  if new.email is null or lower(split_part(new.email, '@', 2)) <> 'vedantix.nl' then
    return new;
  end if;

  if exists (select 1 from public.staff_users where active = true) then
    return new;
  end if;

  insert into public.staff_users (user_id, role, active)
  values (new.id, 'ADMIN', true)
  on conflict (user_id) do update
    set role = 'ADMIN', active = true;

  return new;
end;
$$;

revoke all on function public.bootstrap_first_admin() from public;
revoke all on function public.bootstrap_first_admin() from anon;
revoke all on function public.bootstrap_first_admin() from authenticated;

drop trigger if exists bootstrap_first_admin_on_auth_user on auth.users;

create trigger bootstrap_first_admin_on_auth_user
after insert or update of email_confirmed_at on auth.users
for each row execute function public.bootstrap_first_admin();
