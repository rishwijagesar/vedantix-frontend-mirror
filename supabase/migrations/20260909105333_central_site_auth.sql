-- Reviewed proposal. Generate the migration with `supabase migration new`
-- after the deployment prerequisites in docs/central-site-auth.md are met.
-- Separate customer website access from internal billing/staff permissions.
create table public.site_auth_platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true
);
alter table public.site_auth_platform_admins enable row level security;
revoke all on public.site_auth_platform_admins from public, anon, authenticated;
grant select on public.site_auth_platform_admins to authenticated;
grant all on public.site_auth_platform_admins to service_role;
create policy platform_admin_self_read on public.site_auth_platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

create function public.is_site_platform_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.site_auth_platform_admins
    where user_id = (select auth.uid()) and active);
$$;
revoke all on function public.is_site_platform_admin() from public, anon;
grant execute on function public.is_site_platform_admin() to authenticated, service_role;

create table public.site_auth_sites (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  name text not null,
  origin text not null unique check (origin ~ '^https://[a-z0-9.-]+(:[0-9]+)?$'),
  active boolean not null default false
);
create table public.site_auth_memberships (
  site_slug text not null references public.site_auth_sites(slug) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  primary key (site_slug, user_id)
);
create index site_auth_memberships_user_idx on public.site_auth_memberships(user_id);
alter table public.site_auth_sites enable row level security;
alter table public.site_auth_memberships enable row level security;
revoke all on public.site_auth_sites, public.site_auth_memberships from public, anon, authenticated;
grant select, insert, update, delete on public.site_auth_sites, public.site_auth_memberships to authenticated;
grant all on public.site_auth_sites, public.site_auth_memberships to service_role;

create policy site_memberships_read on public.site_auth_memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_site_platform_admin()));
create policy site_memberships_insert on public.site_auth_memberships for insert to authenticated
  with check ((select public.is_site_platform_admin()));
create policy site_memberships_update on public.site_auth_memberships for update to authenticated
  using ((select public.is_site_platform_admin())) with check ((select public.is_site_platform_admin()));
create policy site_memberships_delete on public.site_auth_memberships for delete to authenticated
  using ((select public.is_site_platform_admin()));

create policy sites_read on public.site_auth_sites for select to authenticated
  using ((select public.is_site_platform_admin()) or exists (
    select 1 from public.site_auth_memberships m
    where m.site_slug = slug and m.user_id = (select auth.uid()) and m.active
  ));
create policy sites_insert on public.site_auth_sites for insert to authenticated
  with check ((select public.is_site_platform_admin()));
create policy sites_update on public.site_auth_sites for update to authenticated
  using ((select public.is_site_platform_admin())) with check ((select public.is_site_platform_admin()));
create policy sites_delete on public.site_auth_sites for delete to authenticated
  using ((select public.is_site_platform_admin()));

create function public.can_manage_site(p_site_slug text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.site_auth_sites s
    where s.slug = p_site_slug and s.active
      and ((select public.is_site_platform_admin()) or exists (
        select 1 from public.site_auth_memberships m
        where m.site_slug = s.slug and m.user_id = (select auth.uid()) and m.active
      )));
$$;
revoke all on function public.can_manage_site(text) from public, anon;
grant execute on function public.can_manage_site(text) to authenticated, service_role;

-- Provision only the already verified, active Vedantix owner. No password changes.
insert into public.site_auth_platform_admins(user_id)
select u.id from auth.users u join public.staff_users s on s.user_id = u.id
where lower(u.email) = 'info@vedantix.nl' and u.email_confirmed_at is not null
  and s.role = 'ADMIN' and s.active;
do $$ begin
  if not exists (select 1 from public.site_auth_platform_admins) then
    raise exception 'Verified Vedantix owner must exist before provisioning';
  end if;
end $$;
insert into public.site_auth_sites(slug, name, origin, active)
values ('naturehealing', 'Nature Healing', 'https://naturehealing.nl', false);

