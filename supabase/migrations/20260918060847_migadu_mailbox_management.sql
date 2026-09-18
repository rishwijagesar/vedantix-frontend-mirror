create schema if not exists migadu_management_private;
revoke all on schema migadu_management_private from public, anon, authenticated;
grant usage on schema migadu_management_private to service_role;

create table public.migadu_management_config (
  id boolean primary key default true check(id=true),
  connected boolean not null default false,
  secret_id uuid,
  account_email text,
  last_verified_at timestamptz,
  updated_at timestamptz not null default now(),
  check(connected=(secret_id is not null))
);
alter table public.migadu_management_config enable row level security;
revoke all on public.migadu_management_config from public, anon, authenticated;
grant select,insert,update on public.migadu_management_config to service_role;
create policy migadu_config_service on public.migadu_management_config for all to service_role using (true) with check (true);
insert into public.migadu_management_config(id) values(true);

create table public.migadu_management_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  actor_id uuid not null,
  domain_id uuid references public.domains(id) on delete set null,
  action text not null check(action in ('connect','disconnect','add_domain','activate_domain','create_mailbox','update_mailbox','reset_password','delete_mailbox')),
  target text not null,
  status text not null check(status in ('pending','succeeded','unconfirmed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.migadu_management_audit enable row level security;
revoke all on public.migadu_management_audit from public, anon, authenticated;
grant select on public.migadu_management_audit to authenticated;
grant select,insert,update on public.migadu_management_audit to service_role;
create policy migadu_audit_admin_read on public.migadu_management_audit for select to authenticated using (public.is_staff(array['ADMIN']::text[]));
create index migadu_management_audit_domain on public.migadu_management_audit(domain_id,created_at desc);

create function migadu_management_private.secret(p_action text,p_credentials jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_result text;
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  select secret_id into v_id from public.migadu_management_config where id=true for update;
  if p_action='read' then
    if v_id is null then return null; end if;
    select decrypted_secret into v_result from vault.decrypted_secrets where id=v_id;
    return v_result::jsonb;
  elsif p_action='save' then
    if p_credentials is null or jsonb_typeof(p_credentials)<>'object'
      or coalesce(length(p_credentials->>'email'),0) not between 3 and 254
      or coalesce(length(p_credentials->>'api_key'),0) not between 1 and 4096 then raise exception 'Invalid credentials'; end if;
    if v_id is null then
      select vault.create_secret(p_credentials::text,'vedantix_migadu_management_api','Mailbox management credentials; server only') into v_id;
    else
      perform vault.update_secret(v_id,p_credentials::text);
    end if;
    update public.migadu_management_config set secret_id=v_id,connected=true,account_email=p_credentials->>'email',
      last_verified_at=now(),updated_at=now() where id=true;
    return null;
  elsif p_action='delete' then
    update public.migadu_management_config set secret_id=null,connected=false,account_email=null,last_verified_at=null,updated_at=now() where id=true;
    if v_id is not null then delete from vault.secrets where id=v_id; end if;
    return null;
  end if;
  raise exception 'Invalid action';
end;
$$;
revoke all on function migadu_management_private.secret(text,jsonb) from public, anon, authenticated;
grant execute on function migadu_management_private.secret(text,jsonb) to service_role;
create function public.migadu_management_secret(p_action text,p_credentials jsonb default null)
returns jsonb language sql security invoker set search_path='' as $$
  select migadu_management_private.secret(p_action,p_credentials);
$$;
revoke all on function public.migadu_management_secret(text,jsonb) from public, anon, authenticated;
grant execute on function public.migadu_management_secret(text,jsonb) to service_role;
