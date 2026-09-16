-- Account connection and reviewed setup only. This release cannot post mutations.
create schema if not exists ebookhouden_private;
revoke all on schema ebookhouden_private from public, anon, authenticated;
grant usage on schema ebookhouden_private to service_role;

create table public.ebookhouden_config (
  id boolean primary key default true check(id=true),
  connected boolean not null default false,
  secret_id uuid,
  connection_revision uuid not null default gen_random_uuid(),
  last_verified_at timestamptz,
  mapping jsonb not null default '{}'::jsonb check(jsonb_typeof(mapping)='object'),
  sync_enabled boolean not null default false check(sync_enabled=false),
  updated_at timestamptz not null default now(),
  check(connected=(secret_id is not null))
);
alter table public.ebookhouden_config enable row level security;
revoke all on table public.ebookhouden_config from public, anon, authenticated;
grant select,insert,update on table public.ebookhouden_config to service_role;
insert into public.ebookhouden_config(id) values(true);

-- Keep privileged Vault access outside the exposed schema. It is service-only,
-- with an explicit verified service JWT check in addition to EXECUTE grants.
create function ebookhouden_private.secret(p_action text, p_token text default null)
returns text language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_result text;
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  select secret_id into v_id from public.ebookhouden_config where id=true for update;
  if p_action='read' then
    if v_id is null then return null; end if;
    select decrypted_secret into v_result from vault.decrypted_secrets where id=v_id;
    return v_result;
  elsif p_action='save' then
    if p_token is null or length(btrim(p_token))=0 or length(p_token)>4096 then raise exception 'Invalid token'; end if;
    if v_id is null then
      select vault.create_secret(btrim(p_token),'vedantix_ebookhouden_api_token','e-Boekhouden API token; server-only') into v_id;
    else
      perform vault.update_secret(v_id,btrim(p_token));
    end if;
    update public.ebookhouden_config set secret_id=v_id,connected=true,
      connection_revision=gen_random_uuid(),mapping='{}'::jsonb,sync_enabled=false,
      last_verified_at=now(),updated_at=now() where id=true;
    return null;
  elsif p_action='delete' then
    update public.ebookhouden_config set secret_id=null,connected=false,
      connection_revision=gen_random_uuid(),mapping='{}'::jsonb,sync_enabled=false,
      last_verified_at=null,updated_at=now() where id=true;
    if v_id is not null then delete from vault.secrets where id=v_id; end if;
    return null;
  end if;
  raise exception 'Invalid action';
end;
$$;
revoke all on function ebookhouden_private.secret(text,text) from public, anon, authenticated;
grant execute on function ebookhouden_private.secret(text,text) to service_role;

create function public.ebookhouden_secret(p_action text,p_token text default null)
returns text language sql security invoker set search_path='' as $$
  select ebookhouden_private.secret(p_action,p_token);
$$;
revoke all on function public.ebookhouden_secret(text,text) from public, anon, authenticated;
grant execute on function public.ebookhouden_secret(text,text) to service_role;
