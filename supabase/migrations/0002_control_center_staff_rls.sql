create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN','OPERATOR','READ_ONLY')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff_users enable row level security;

create or replace function public.is_staff(required_roles text[] default array['ADMIN','OPERATOR','READ_ONLY'])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_users s
    where s.user_id = auth.uid()
      and s.active = true
      and s.role = any(required_roles)
  );
$$;

revoke all on function public.is_staff(text[]) from anon;
grant execute on function public.is_staff(text[]) to authenticated;

create policy staff_users_self_read on public.staff_users
for select to authenticated
using (user_id = (select auth.uid()));

create policy customers_staff_read on public.customers
for select to authenticated using (public.is_staff());
create policy customers_staff_insert on public.customers
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy customers_staff_update on public.customers
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy customers_staff_delete on public.customers
for delete to authenticated using (public.is_staff(array['ADMIN']));

create policy domains_staff_read on public.domains
for select to authenticated using (public.is_staff());
create policy domains_staff_insert on public.domains
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy domains_staff_update on public.domains
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy domains_staff_delete on public.domains
for delete to authenticated using (public.is_staff(array['ADMIN']));

create policy websites_staff_read on public.websites
for select to authenticated using (public.is_staff());
create policy websites_staff_insert on public.websites
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy websites_staff_update on public.websites
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy websites_staff_delete on public.websites
for delete to authenticated using (public.is_staff(array['ADMIN']));

create policy domain_checks_staff_read on public.domain_checks
for select to authenticated using (public.is_staff());
create policy domain_checks_staff_insert on public.domain_checks
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));

create policy integrations_staff_read on public.integrations
for select to authenticated using (public.is_staff());
create policy integrations_staff_insert on public.integrations
for insert to authenticated with check (public.is_staff(array['ADMIN']));
create policy integrations_staff_update on public.integrations
for update to authenticated using (public.is_staff(array['ADMIN'])) with check (public.is_staff(array['ADMIN']));
create policy integrations_staff_delete on public.integrations
for delete to authenticated using (public.is_staff(array['ADMIN']));

create policy automation_runs_staff_read on public.automation_runs
for select to authenticated using (public.is_staff());
create policy automation_runs_staff_insert on public.automation_runs
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy automation_runs_staff_update on public.automation_runs
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
