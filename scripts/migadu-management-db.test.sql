\set ON_ERROR_STOP on
-- Isolated CI database only: fake Vault verifies privilege boundaries, never production secrets.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end; $$;
create schema auth;
create schema vault;
grant usage on schema auth to anon,authenticated,service_role;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;
$$;
create function public.is_staff(required_roles text[] default array['ADMIN','OPERATOR','READ_ONLY'])
returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'staff_role','')=any(required_roles);
$$;
create table public.domains(id uuid primary key);
create table vault.secrets(id uuid primary key default gen_random_uuid(),secret text,name text,description text);
create view vault.decrypted_secrets as select id,secret as decrypted_secret from vault.secrets;
create function vault.create_secret(p_secret text,p_name text,p_description text) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into vault.secrets(secret,name,description) values(p_secret,p_name,p_description) returning id into v_id;
  return v_id;
end;
$$;
create function vault.update_secret(p_id uuid,p_secret text) returns void language sql as $$
  update vault.secrets set secret=p_secret where id=p_id;
$$;
\ir ../supabase/migrations/20260918060847_migadu_mailbox_management.sql
\ir ../supabase/migrations/20260921000039_migadu_recovery_contacts.sql

do $$
begin
  if has_table_privilege('anon','public.migadu_management_config','SELECT')
    or has_table_privilege('authenticated','public.migadu_management_config','SELECT')
    or has_function_privilege('anon','public.migadu_management_secret(text,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.migadu_management_secret(text,jsonb)','EXECUTE')
    or has_schema_privilege('authenticated','migadu_management_private','USAGE')
  then raise exception 'Management secrets are exposed'; end if;
  if has_table_privilege('authenticated','public.migadu_management_audit','INSERT')
    or has_table_privilege('authenticated','public.migadu_management_audit','UPDATE')
    or has_table_privilege('authenticated','public.migadu_management_audit','DELETE')
  then raise exception 'Browser can forge audit records'; end if;
  if exists(select 1 from pg_class where oid in ('public.migadu_management_config'::regclass,'public.migadu_management_audit'::regclass) and not relrowsecurity)
  then raise exception 'RLS is missing'; end if;
end;
$$;
-- Even the privileged function rejects a non-service JWT.
do $$
begin
  begin
    perform public.migadu_management_secret('read',null);
    raise exception 'Missing JWT unexpectedly accepted';
  exception when raise_exception then
    if SQLERRM <> 'Not authorized' then raise; end if;
  end;
end;
$$;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
do $$
begin
  perform public.migadu_management_secret('save','{"email":"admin@example.org","api_key":"ci-token"}'::jsonb);
  if (public.migadu_management_secret('read',null)->>'api_key') <> 'ci-token' then raise exception 'Secret round trip failed'; end if;
  perform public.migadu_management_secret('save','{"email":"admin@example.org","api_key":"rotated-ci-token"}'::jsonb);
  if (select count(*) from vault.secrets)<>1 then raise exception 'Secret rotation duplicated credentials'; end if;
  perform public.migadu_management_secret('delete',null);
  if public.migadu_management_secret('read',null) is not null then raise exception 'Secret remains readable'; end if;
  if exists(select 1 from vault.secrets) then raise exception 'Vault secret remains'; end if;
  if exists(select 1 from public.migadu_management_config where connected or account_email is not null) then raise exception 'Configuration not cleared'; end if;
end;
$$;
insert into public.migadu_management_audit(request_id,actor_id,action,target,status)
values(gen_random_uuid(),gen_random_uuid(),'connect','Migadu-koppeling','succeeded');
set role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"READ_ONLY"}',false);
do $$ begin
  if exists(select 1 from public.migadu_management_audit) then raise exception 'Audit exposed to read-only staff'; end if;
end; $$;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"ADMIN"}',false);
do $$ begin
  if (select count(*) from public.migadu_management_audit)<>1 then raise exception 'Admin cannot read audit'; end if;
end; $$;
reset role;


-- Recovery contacts are independent of provider deletion and administrator-only.
insert into public.domains(id) values('00000000-0000-4000-8000-000000000001');
set role service_role;
insert into public.migadu_mailbox_contacts(domain_id,local_part,recovery_email,preferred_local_part)
values('00000000-0000-4000-8000-000000000001','admin','client@example.net','info');
reset role;
do $$ begin
  if has_table_privilege('anon','public.migadu_mailbox_contacts','SELECT')
    or has_table_privilege('authenticated','public.migadu_mailbox_contacts','INSERT')
    or has_table_privilege('authenticated','public.migadu_mailbox_contacts','UPDATE')
    or has_table_privilege('authenticated','public.migadu_mailbox_contacts','DELETE')
  then raise exception 'Reserve contact grants are unsafe'; end if;
  if not (select relrowsecurity from pg_class where oid='public.migadu_mailbox_contacts'::regclass)
  then raise exception 'Reserve contacts need RLS'; end if;
end; $$;
set role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"OPERATOR"}',false);
do $$ begin
  if exists(select 1 from public.migadu_mailbox_contacts) then raise exception 'Operator can read reserve contacts'; end if;
end; $$;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"ADMIN"}',false);
do $$ begin
  if (select count(*) from public.migadu_mailbox_contacts)<>1 then raise exception 'Admin cannot read reserve contacts'; end if;
  begin
    update public.migadu_mailbox_contacts set recovery_email='attacker@example.net';
    raise exception 'Direct browser update bypassed API confirmation';
  exception when insufficient_privilege then null;
  end;
end; $$;
reset role;
insert into public.migadu_management_audit(request_id,actor_id,domain_id,action,target,status)
values(gen_random_uuid(),gen_random_uuid(),'00000000-0000-4000-8000-000000000001','send_invitation','admin@example.org','succeeded'),
(gen_random_uuid(),gen_random_uuid(),'00000000-0000-4000-8000-000000000001','set_primary_address','admin@example.org','succeeded'),
(gen_random_uuid(),gen_random_uuid(),'00000000-0000-4000-8000-000000000001','delete_mailbox','admin@example.org','succeeded');
do $$ begin
  if (select recovery_email from public.migadu_mailbox_contacts where local_part='admin')<>'client@example.net'
  then raise exception 'Contact must remain after mailbox deletion'; end if;
end; $$;
