-- Client access is isolated from staff enrollment. No invitations or emails are sent by this migration.
-- Re-runnable: additive tables/indexes, replaceable functions and triggers; no existing rows are changed.
create schema if not exists client_access_private;
revoke all on schema client_access_private from public, anon, authenticated;
grant usage on schema client_access_private to service_role;

create table if not exists public.site_auth_client_accounts (
  email text primary key check (email = lower(btrim(email)) and length(email) <= 254 and position('@' in email) > 1),
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.site_auth_client_invitations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  site_slug text not null references public.site_auth_sites(slug),
  email text not null references public.site_auth_client_accounts(email),
  user_id uuid references auth.users(id) on delete set null,
  invited_by uuid not null references auth.users(id),
  status text not null default 'sending' check (status in ('sending','sent','failed','revoked','superseded')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  -- Auth controls OTP expiry; null avoids claiming a duration different from project Auth settings.
  expires_at timestamptz
);
create table if not exists client_access_private.commands (
  id uuid primary key,
  actor uuid not null references auth.users(id),
  action text not null,
  site_slug text,
  email text,
  user_id uuid,
  invitation_id uuid,
  status text not null default 'pending',
  request_data jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.site_auth_client_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  site_slug text,
  user_id uuid,
  invitation_id uuid,
  request_id uuid,
  outcome text not null,
  created_at timestamptz not null default now()
);
create table if not exists client_access_private.recovery_requests (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  email_digest text not null,
  user_id uuid,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);
create index if not exists site_client_invites_site_created on public.site_auth_client_invitations(site_slug,created_at desc);
create index if not exists site_client_audit_site_created on public.site_auth_client_audit(site_slug,created_at desc);
create index if not exists client_recovery_throttle on client_access_private.recovery_requests(site_slug,email_digest,created_at desc);
create index if not exists client_commands_throttle on client_access_private.commands(email,created_at desc);

alter table public.site_auth_client_accounts enable row level security;
alter table public.site_auth_client_invitations enable row level security;
alter table public.site_auth_client_audit enable row level security;
alter table client_access_private.commands enable row level security;
alter table client_access_private.recovery_requests enable row level security;
revoke all on public.site_auth_client_accounts, public.site_auth_client_invitations, public.site_auth_client_audit from public, anon, authenticated;
revoke all on all tables in schema client_access_private from public, anon, authenticated;
grant all on public.site_auth_client_accounts, public.site_auth_client_invitations, public.site_auth_client_audit to service_role;
grant all on all tables in schema client_access_private to service_role;
grant usage,select on sequence public.site_auth_client_audit_id_seq to service_role;

create or replace function client_access_private.is_customer(p_user uuid, p_email text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.site_auth_client_accounts c where c.user_id=p_user or c.email=lower(btrim(p_email)))
      or exists(select 1 from public.site_auth_memberships m where m.user_id=p_user);
$$;
create or replace function client_access_private.is_admin(p_actor uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_actor is not null and exists(select 1 from public.staff_users where user_id=p_actor and active and role='ADMIN');
$$;
create or replace function client_access_private.assert_customer_email(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('client-identity:' || p_email,0));
  if exists(select 1 from auth.users u join public.staff_users s on s.user_id=u.id where lower(u.email)=p_email)
     or exists(select 1 from auth.users u join public.site_auth_platform_admins a on a.user_id=u.id where lower(u.email)=p_email)
     or exists(select 1 from public.staff_invites i where lower(i.email)=p_email and i.active)
  then raise exception 'STAFF_ACCOUNT'; end if;
end;
$$;

-- Guard both enrollment directions: a client cannot become staff or a platform administrator,
-- including through existing staff invitations or the legacy first-admin bootstrap trigger.
create or replace function client_access_private.guard_staff_enrollment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_email text; v_user uuid;
begin
  if tg_table_name='staff_invites' then v_email:=lower(new.email);
  else
    v_user:=new.user_id;
    select lower(email) into v_email from auth.users where id=v_user;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('client-identity:' || v_email,0));
  if client_access_private.is_customer(v_user,v_email) then raise exception 'STAFF_ACCOUNT: client identity cannot receive staff access'; end if;
  return new;
end;
$$;
drop trigger if exists prevent_client_staff_user on public.staff_users;
create trigger prevent_client_staff_user before insert or update on public.staff_users for each row execute function client_access_private.guard_staff_enrollment();
drop trigger if exists prevent_client_staff_invite on public.staff_invites;
create trigger prevent_client_staff_invite before insert or update on public.staff_invites for each row execute function client_access_private.guard_staff_enrollment();
drop trigger if exists prevent_client_platform_admin on public.site_auth_platform_admins;
create trigger prevent_client_platform_admin before insert or update on public.site_auth_platform_admins for each row execute function client_access_private.guard_staff_enrollment();

-- Preserve existing behavior for staff; skip all customer reservations, even before Auth confirmation.
create or replace function public.bootstrap_first_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null or new.email is null then return new; end if;
  if client_access_private.is_customer(new.id,new.email) then return new; end if;
  if lower(split_part(new.email,'@',2)) <> 'vedantix.nl' then return new; end if;
  if exists(select 1 from public.staff_users where active) then return new; end if;
  insert into public.staff_users(user_id,role,active) values(new.id,'ADMIN',true)
    on conflict(user_id) do update set role='ADMIN',active=true;
  return new;
end;
$$;
create or replace function public.apply_staff_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare invite_id uuid; invite_role text;
begin
  if new.email_confirmed_at is null or new.email is null then return new; end if;
  if client_access_private.is_customer(new.id,new.email) then return new; end if;
  select i.id,i.role into invite_id,invite_role from public.staff_invites i
    where i.active and lower(i.email)=lower(new.email) order by i.created_at desc limit 1;
  if invite_id is null then return new; end if;
  insert into public.staff_users(user_id,role,active) values(new.id,invite_role,true)
    on conflict(user_id) do update set role=excluded.role,active=true;
  update public.staff_invites set active=false,accepted_by=new.id,accepted_at=now() where id=invite_id;
  return new;
end;
$$;
revoke all on function public.bootstrap_first_admin(), public.apply_staff_invite() from public, anon, authenticated;
grant execute on function public.bootstrap_first_admin(), public.apply_staff_invite() to service_role;

create or replace function client_access_private.admin_command(p_actor uuid,p_action text,p_args jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_email text; v_site public.site_auth_sites; v_user auth.users;
  v_inv public.site_auth_client_invitations; v_cmd client_access_private.commands;
  v_active boolean; v_result jsonb; v_status text;
begin
  if not client_access_private.is_admin(p_actor) then raise exception 'FORBIDDEN'; end if;
  if p_action='list' then
    return jsonb_build_object('can_manage',true,
      'sites',coalesce((select jsonb_agg(to_jsonb(s) order by s.name) from public.site_auth_sites s),'[]'::jsonb),
      'members',coalesce((select jsonb_agg(jsonb_build_object('site_slug',m.site_slug,'user_id',m.user_id,'active',m.active,'email',u.email) order by m.site_slug,u.email)
        from public.site_auth_memberships m join auth.users u on u.id=m.user_id where (p_args->>'site_slug' is null or m.site_slug=p_args->>'site_slug')),'[]'::jsonb),
      'invitations',coalesce((select jsonb_agg(to_jsonb(x)) from (select id,site_slug,email,user_id,status,created_at,sent_at,expires_at from public.site_auth_client_invitations
        where (p_args->>'site_slug' is null or site_slug=p_args->>'site_slug') order by created_at desc limit 200)x),'[]'::jsonb),
      'audit',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.site_auth_client_audit
        where (p_args->>'site_slug' is null or site_slug=p_args->>'site_slug') order by created_at desc limit 200)x),'[]'::jsonb));
  end if;
  v_id:=(p_args->>'request_id')::uuid;
  if v_id is null then raise exception 'INVALID_REQUEST'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  select * into v_cmd from client_access_private.commands where id=v_id for update;
  if p_action in ('bind_invite','bind_recovery','finish_invite','finish_recovery') then
    if v_cmd.id is null or v_cmd.actor<>p_actor then raise exception 'NOT_FOUND'; end if;
    if v_cmd.action<>replace(replace(p_action,'bind_',''),'finish_','') then raise exception 'CONFLICT'; end if;
    if v_cmd.status<>'pending' then return v_cmd.result || '{"replayed":true}'::jsonb; end if;
    perform pg_advisory_xact_lock(hashtextextended(v_cmd.site_slug || ':' || v_cmd.email,0));
    if p_action like 'bind_%' then
      select * into v_user from auth.users where id=(p_args->>'user_id')::uuid and lower(email)=v_cmd.email;
      if v_user.id is null then raise exception 'CONFLICT'; end if;
      perform client_access_private.assert_customer_email(v_cmd.email);
      if v_cmd.user_id is not null and v_cmd.user_id<>v_user.id then raise exception 'CONFLICT'; end if;
      update public.site_auth_client_accounts set user_id=v_user.id where email=v_cmd.email and (user_id is null or user_id=v_user.id);
      if not found then raise exception 'CONFLICT'; end if;
      update client_access_private.commands set user_id=v_user.id where id=v_id;
      update public.site_auth_client_invitations set user_id=v_user.id where id=v_cmd.invitation_id and status='sending';
      return jsonb_build_object('ok',true);
    end if;
    v_status:=case when (p_args->>'sent')::boolean then 'sent' else 'failed' end;
    if v_cmd.action='invite' then
      select * into v_inv from public.site_auth_client_invitations where id=v_cmd.invitation_id for update;
      if v_inv.status='revoked' then v_status:='revoked';
      elsif v_status='sent' then
        if v_cmd.user_id is null then raise exception 'CONFLICT'; end if;
        if not exists(select 1 from public.site_auth_sites where slug=v_cmd.site_slug and active) then v_status:='revoked';
        else
          perform client_access_private.assert_customer_email(v_cmd.email);
          insert into public.site_auth_memberships(site_slug,user_id,active) values(v_cmd.site_slug,v_cmd.user_id,true)
            on conflict(site_slug,user_id) do update set active=true;
          update public.site_auth_client_invitations set status='superseded' where site_slug=v_cmd.site_slug and email=v_cmd.email and status='sent' and id<>v_inv.id;
        end if;
      end if;
      update public.site_auth_client_invitations set status=v_status,sent_at=case when v_status='sent' then now() else sent_at end where id=v_inv.id;
    end if;
    v_result:=jsonb_build_object('ok',true,'status',v_status,'invitation_id',v_cmd.invitation_id);
    update client_access_private.commands set status=v_status,result=v_result where id=v_id;
    insert into public.site_auth_client_audit(actor_id,action,site_slug,user_id,invitation_id,request_id,outcome)
      values(p_actor,v_cmd.action,v_cmd.site_slug,v_cmd.user_id,v_cmd.invitation_id,v_id,v_status);
    return v_result;
  end if;
  if p_action not in ('prepare_invite','prepare_recovery','set_membership_active','revoke','cancel_invitation') then raise exception 'INVALID_ACTION'; end if;
  if v_cmd.id is not null then
    if v_cmd.actor<>p_actor or v_cmd.request_data<>p_args or v_cmd.action<>replace(p_action,'prepare_','') then raise exception 'CONFLICT'; end if;
    return v_cmd.result || jsonb_build_object('replayed',true,'status',case when v_cmd.status='pending' then 'pending' else coalesce(v_cmd.result->>'status',v_cmd.status) end,'invitation_id',v_cmd.invitation_id);
  end if;
  if p_action='cancel_invitation' then
    -- Read the immutable identity first; all paths take site/email lock before invitation row lock.
    select * into v_inv from public.site_auth_client_invitations where id=(p_args->>'invitation_id')::uuid;
    if v_inv.id is null then raise exception 'NOT_FOUND'; end if;
    select * into v_site from public.site_auth_sites where slug=v_inv.site_slug;
    v_email:=v_inv.email; select * into v_user from auth.users where id=v_inv.user_id;
  else
    select * into v_site from public.site_auth_sites where slug=p_args->>'site_slug';
    if v_site.slug is null then raise exception 'NOT_FOUND'; end if;
    if p_action='prepare_invite' then
      v_email:=lower(btrim(p_args->>'email'));
      if v_email is null or length(v_email)>254 or position('@' in v_email)<2 or v_email~E'[\\r\\n<> ]' then raise exception 'INVALID_EMAIL'; end if;
      select * into v_user from auth.users where lower(email)=v_email;
    else
      select u.* into v_user from auth.users u join public.site_auth_memberships m on m.user_id=u.id
        where m.site_slug=v_site.slug and u.id=(p_args->>'user_id')::uuid;
      if v_user.id is null then raise exception 'NOT_FOUND'; end if;
      v_email:=lower(v_user.email);
    end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_site.slug || ':' || v_email,0));
  if p_action='cancel_invitation' then
    select * into v_inv from public.site_auth_client_invitations where id=(p_args->>'invitation_id')::uuid for update;
    if v_inv.id is null then raise exception 'NOT_FOUND'; end if;
    select * into v_user from auth.users where id=v_inv.user_id;
  end if;
  perform client_access_private.assert_customer_email(v_email);
  if p_action in ('prepare_invite','prepare_recovery') then
    if not v_site.active then raise exception 'INVALID_SITE'; end if;
    perform pg_advisory_xact_lock(hashtextextended('client-admin-email-throttle',0));
    if (select count(*) from client_access_private.commands where email=v_email and action in ('invite','recovery') and created_at>now()-interval '1 hour')>=3
       or exists(select 1 from client_access_private.commands where email=v_email and action in ('invite','recovery') and created_at>now()-interval '60 seconds')
       or (select count(*) from client_access_private.commands where actor=p_actor and action in ('invite','recovery') and created_at>now()-interval '1 hour')>=60
    then raise exception 'RATE_LIMITED'; end if;
    if p_action='prepare_recovery' and not exists(select 1 from public.site_auth_memberships where site_slug=v_site.slug and user_id=v_user.id and active) then raise exception 'NOT_FOUND'; end if;
    insert into public.site_auth_client_accounts(email,user_id) values(v_email,v_user.id) on conflict(email) do nothing;
    if p_action='prepare_invite' then
      insert into public.site_auth_client_invitations(request_id,site_slug,email,user_id,invited_by)
        values(v_id,v_site.slug,v_email,v_user.id,p_actor) returning * into v_inv;
    end if;
    v_result:=jsonb_build_object('email',v_email,'site_name',v_site.name,'origin',v_site.origin,
      'link_type',case when p_action='prepare_invite' and v_user.email_confirmed_at is null then 'invite' else 'recovery' end,
      'invitation_id',v_inv.id);
    insert into client_access_private.commands(id,actor,action,site_slug,email,user_id,invitation_id,request_data,result)
      values(v_id,p_actor,replace(p_action,'prepare_',''),v_site.slug,v_email,v_user.id,v_inv.id,p_args,v_result);
    insert into public.site_auth_client_audit(actor_id,action,site_slug,user_id,invitation_id,request_id,outcome)
      values(p_actor,replace(p_action,'prepare_',''),v_site.slug,v_user.id,v_inv.id,v_id,'requested');
    return v_result;
  end if;
  if p_action='cancel_invitation' then
    if v_inv.status not in ('sending','sent') then raise exception 'CONFLICT'; end if;
    update public.site_auth_client_invitations set status='revoked' where id=v_inv.id;
    -- A sent invitation is the current grant; superseded invitations cannot revoke a newer grant.
    if v_inv.status='sent' then update public.site_auth_memberships set active=false where site_slug=v_site.slug and user_id=v_inv.user_id; end if;
    v_status:='revoked';
  else
    v_active:=case when p_action='revoke' then false else (p_args->>'active')::boolean end;
    if v_active is null then raise exception 'INVALID_ACTIVE'; end if;
    if v_active and not v_site.active then raise exception 'INVALID_SITE'; end if;
    update public.site_auth_memberships set active=v_active where site_slug=v_site.slug and user_id=v_user.id;
    if not v_active then update public.site_auth_client_invitations set status='revoked' where site_slug=v_site.slug and email=v_email and status in ('sending','sent'); end if;
    v_status:=case when v_active then 'active' else 'revoked' end;
  end if;
  v_result:=jsonb_build_object('ok',true,'status',v_status);
  insert into client_access_private.commands(id,actor,action,site_slug,email,user_id,invitation_id,status,request_data,result)
    values(v_id,p_actor,p_action,v_site.slug,v_email,v_user.id,v_inv.id,'completed',p_args,v_result);
  insert into public.site_auth_client_audit(actor_id,action,site_slug,user_id,invitation_id,request_id,outcome)
    values(p_actor,p_action,v_site.slug,v_user.id,v_inv.id,v_id,v_status);
  return v_result;
end;
$$;

create or replace function client_access_private.prepare_recovery(p_site_slug text,p_email text,p_origin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_site public.site_auth_sites; v_user auth.users; v_id uuid; v_digest text;
begin
  select * into v_site from public.site_auth_sites where slug=p_site_slug and origin=p_origin and active;
  if v_site.slug is null then return '{"allowed":false}'; end if;
  p_email:=lower(btrim(p_email));
  if p_email is null or length(p_email)>254 or position('@' in p_email)<2 then return '{"allowed":false}'; end if;
  v_digest:=encode(sha256(convert_to(p_email,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended('client-public-recovery-throttle',0));
  -- Count attempts before account lookup: unknown accounts have the same outward behavior.
  if (select count(*) from client_access_private.recovery_requests where site_slug=p_site_slug and created_at>now()-interval '1 hour')>=60
     or (select count(*) from client_access_private.recovery_requests where email_digest=v_digest and created_at>now()-interval '1 hour')>=3
     or exists(select 1 from client_access_private.recovery_requests where email_digest=v_digest and created_at>now()-interval '60 seconds')
  then return '{"allowed":false}'; end if;
  delete from client_access_private.recovery_requests where created_at<now()-interval '7 days';
  insert into client_access_private.recovery_requests(site_slug,email_digest) values(p_site_slug,v_digest) returning id into v_id;
  select u.* into v_user from auth.users u join public.site_auth_memberships m on m.user_id=u.id
    where lower(u.email)=p_email and m.site_slug=p_site_slug and m.active and u.email_confirmed_at is not null;
  if v_user.id is null then return '{"allowed":false}'; end if;
  if exists(select 1 from public.staff_users where user_id=v_user.id)
     or exists(select 1 from public.site_auth_platform_admins where user_id=v_user.id)
     or exists(select 1 from public.staff_invites where lower(email)=p_email and active) then return '{"allowed":false}'; end if;
  update client_access_private.recovery_requests set user_id=v_user.id,status='sending' where id=v_id;
  return jsonb_build_object('allowed',true,'request_id',v_id,'email',p_email,'user_id',v_user.id,'origin',v_site.origin,'site_name',v_site.name);
end;
$$;
create or replace function client_access_private.finish_recovery(p_request_id uuid,p_sent boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_req client_access_private.recovery_requests;
begin
  select * into v_req from client_access_private.recovery_requests where id=p_request_id for update;
  if v_req.id is null or v_req.status<>'sending' then return; end if;
  update client_access_private.recovery_requests set status=case when p_sent then 'sent' else 'failed' end where id=p_request_id;
  insert into public.site_auth_client_audit(action,site_slug,user_id,request_id,outcome)
    values('public_recovery',v_req.site_slug,v_req.user_id,p_request_id,case when p_sent then 'sent' else 'failed' end);
end;
$$;

-- Thin service-only RPC wrappers keep all SECURITY DEFINER implementations in a private schema.
create or replace function public.client_access_admin(p_actor uuid,p_action text,p_args jsonb)
returns jsonb language sql set search_path='' as $$select client_access_private.admin_command(p_actor,p_action,p_args);$$;
create or replace function public.client_access_recovery_prepare(p_site_slug text,p_email text,p_origin text)
returns jsonb language sql set search_path='' as $$select client_access_private.prepare_recovery(p_site_slug,p_email,p_origin);$$;
create or replace function public.client_access_recovery_finish(p_request_id uuid,p_sent boolean)
returns void language sql set search_path='' as $$select client_access_private.finish_recovery(p_request_id,p_sent);$$;
revoke all on all functions in schema client_access_private from public,anon,authenticated;
grant execute on all functions in schema client_access_private to service_role;
revoke all on function public.client_access_admin(uuid,text,jsonb),public.client_access_recovery_prepare(text,text,text),public.client_access_recovery_finish(uuid,boolean) from public,anon,authenticated;
grant execute on function public.client_access_admin(uuid,text,jsonb),public.client_access_recovery_prepare(text,text,text),public.client_access_recovery_finish(uuid,boolean) to service_role;
