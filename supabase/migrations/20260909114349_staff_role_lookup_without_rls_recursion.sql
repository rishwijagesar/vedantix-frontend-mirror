-- Break the recursive staff_users SELECT policy lookup. This private helper
-- returns only the caller's current staff membership; it accepts no user ID.
create schema authz_private;
revoke all on schema authz_private from public;
grant usage on schema authz_private to anon, authenticated, service_role;
create function authz_private.current_staff_has_role(required_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.staff_users s
    where s.user_id = (select auth.uid()) and s.active
      and s.role = any(required_roles)
  );
$$;
revoke all on function authz_private.current_staff_has_role(text[]) from public;
grant execute on function authz_private.current_staff_has_role(text[]) to anon, authenticated, service_role;
create or replace function public.is_staff(
  required_roles text[] default array['ADMIN','OPERATOR','READ_ONLY']::text[]
) returns boolean language sql stable security invoker set search_path = '' as $$
  select authz_private.current_staff_has_role(required_roles);
$$;
