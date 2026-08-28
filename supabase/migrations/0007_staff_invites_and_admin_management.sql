drop policy if exists staff_users_self_read on public.staff_users;

create policy staff_users_read on public.staff_users
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_staff(array['ADMIN'])
);

create policy staff_users_admin_update on public.staff_users
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));

create policy staff_users_admin_delete on public.staff_users
for delete to authenticated
using (public.is_staff(array['ADMIN']));

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'READ_ONLY' check (role in ('ADMIN','OPERATOR','READ_ONLY')),
  active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists staff_invites_active_email_unique
on public.staff_invites (lower(email))
where active = true;

alter table public.staff_invites enable row level security;

create policy staff_invites_admin_read on public.staff_invites
for select to authenticated using (public.is_staff(array['ADMIN']));
create policy staff_invites_admin_insert on public.staff_invites
for insert to authenticated with check (public.is_staff(array['ADMIN']));
create policy staff_invites_admin_update on public.staff_invites
for update to authenticated using (public.is_staff(array['ADMIN'])) with check (public.is_staff(array['ADMIN']));
create policy staff_invites_admin_delete on public.staff_invites
for delete to authenticated using (public.is_staff(array['ADMIN']));

create or replace function public.apply_staff_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_id uuid;
  invite_role text;
begin
  if new.email_confirmed_at is null or new.email is null then
    return new;
  end if;

  select i.id, i.role
    into invite_id, invite_role
  from public.staff_invites i
  where i.active = true
    and lower(i.email) = lower(new.email)
  order by i.created_at desc
  limit 1;

  if invite_id is null then
    return new;
  end if;

  insert into public.staff_users (user_id, role, active)
  values (new.id, invite_role, true)
  on conflict (user_id) do update
    set role = excluded.role,
        active = true;

  update public.staff_invites
  set active = false,
      accepted_by = new.id,
      accepted_at = now()
  where id = invite_id;

  return new;
end;
$$;

revoke all on function public.apply_staff_invite() from public;
revoke all on function public.apply_staff_invite() from anon;
revoke all on function public.apply_staff_invite() from authenticated;

drop trigger if exists apply_staff_invite_on_auth_user on auth.users;
create trigger apply_staff_invite_on_auth_user
after insert or update of email_confirmed_at on auth.users
for each row execute function public.apply_staff_invite();

create or replace function public.ensure_active_admin_remains()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'ADMIN' and old.active = true
       and not exists (
         select 1 from public.staff_users s
         where s.user_id <> old.user_id
           and s.role = 'ADMIN'
           and s.active = true
       ) then
      raise exception 'The last active admin cannot be removed';
    end if;
    return old;
  end if;

  if old.role = 'ADMIN' and old.active = true
     and (new.role <> 'ADMIN' or new.active = false)
     and not exists (
       select 1 from public.staff_users s
       where s.user_id <> old.user_id
         and s.role = 'ADMIN'
         and s.active = true
     ) then
    raise exception 'The last active admin cannot be disabled or demoted';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_active_admin_remains() from public;
revoke all on function public.ensure_active_admin_remains() from anon;
revoke all on function public.ensure_active_admin_remains() from authenticated;

drop trigger if exists ensure_active_admin_remains on public.staff_users;
create trigger ensure_active_admin_remains
before update or delete on public.staff_users
for each row execute function public.ensure_active_admin_remains();
