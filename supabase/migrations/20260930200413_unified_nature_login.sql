-- Nature only: route existing identities; do not create/migrate accounts or alter any password/membership.
create schema if not exists site_login_private;
revoke all on schema site_login_private from public,anon,authenticated;
grant usage on schema site_login_private to service_role;
create table if not exists site_login_private.limits (
  key text primary key,
  window_started timestamptz not null,
  attempts integer not null check(attempts>0)
);
create index if not exists site_login_limits_window_started on site_login_private.limits(window_started);
alter table site_login_private.limits enable row level security;
revoke all on site_login_private.limits from public,anon,authenticated;
grant all on site_login_private.limits to service_role;

create or replace function site_login_private.consume(p_key text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_attempts integer;
begin
  insert into site_login_private.limits(key,window_started,attempts) values(p_key,now(),1)
  on conflict(key) do update set
    attempts=case when site_login_private.limits.window_started<=now()-make_interval(secs=>p_window_seconds) then 1 else least(site_login_private.limits.attempts+1,1000000) end,
    window_started=case when site_login_private.limits.window_started<=now()-make_interval(secs=>p_window_seconds) then now() else site_login_private.limits.window_started end
  returning attempts into v_attempts;
  return v_attempts<=p_limit;
end;
$$;

create or replace function site_login_private.prepare(p_site_slug text,p_email text,p_origin text,p_purpose text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_site public.site_auth_sites; v_user auth.users; v_digest text; v_email_ok boolean; v_site_ok boolean; v_gap_ok boolean:=true;
begin
  if p_site_slug is distinct from 'naturehealing' or p_origin is distinct from 'https://naturehealing.nl'
     or p_purpose not in ('login','recovery') or p_purpose is null then return '{"denied":true}'::jsonb; end if;
  select * into v_site from public.site_auth_sites where slug=p_site_slug and origin=p_origin;
  if v_site.slug is null then return '{"denied":true}'::jsonb; end if;
  p_email:=lower(btrim(p_email));
  if p_email is null or length(p_email)>254 or position('@' in p_email)<2 then return '{"denied":true}'::jsonb; end if;
  v_digest:=encode(sha256(convert_to(p_email,'UTF8')),'hex');
  -- Same lock order for every call. No client-supplied IP is trusted; budgets apply even when headers are spoofed.
  perform pg_advisory_xact_lock(hashtextextended('site-login:'||p_site_slug||':'||p_purpose,0));
  delete from site_login_private.limits where window_started<now()-interval '1 day';
  if p_purpose='login' then
    v_site_ok:=site_login_private.consume('login:site:'||p_site_slug,300,900);
    if not v_site_ok then return '{"limited":true}'::jsonb; end if;
    v_email_ok:=site_login_private.consume('login:email:'||p_site_slug||':'||v_digest,12,900);
  else
    v_site_ok:=site_login_private.consume('recovery:site:'||p_site_slug,60,3600);
    if not v_site_ok then return '{"limited":true}'::jsonb; end if;
    v_email_ok:=site_login_private.consume('recovery:email:'||p_site_slug||':'||v_digest,3,3600);
    v_gap_ok:=site_login_private.consume('recovery:gap:'||p_site_slug||':'||v_digest,1,60);
  end if;
  if not(v_site_ok and v_email_ok and v_gap_ok) then return '{"limited":true}'::jsonb; end if;
  select u.* into v_user from auth.users u where lower(btrim(u.email))=p_email and (
    exists(select 1 from public.site_auth_platform_admins p where p.user_id=u.id and p.active)
    or exists(select 1 from public.site_auth_memberships m where m.user_id=u.id and m.site_slug=p_site_slug and m.active)
  ) order by u.id limit 1;
  if v_user.id is not null then
    if not v_site.active or v_user.is_anonymous or v_user.email_confirmed_at is null then return '{"denied":true}'::jsonb; end if;
    return jsonb_build_object('provider','central','expected_user_id',v_user.id);
  end if;
  -- Existing Nature credentials remain on the original provider. Unknown emails follow this same single route.
  return '{"provider":"local","expected_user_id":null}'::jsonb;
end;
$$;

create or replace function site_login_private.recovery_allowed(p_site_slug text,p_email text,p_user_id uuid,p_origin text)
returns boolean language sql stable security definer set search_path='' as $$
  select p_site_slug='naturehealing' and p_origin='https://naturehealing.nl' and exists(
    select 1 from public.site_auth_sites s join auth.users u on u.id=p_user_id
    where s.slug=p_site_slug and s.origin=p_origin and s.active and lower(btrim(u.email))=lower(btrim(p_email))
      and u.email_confirmed_at is not null and not u.is_anonymous and (
        exists(select 1 from public.site_auth_platform_admins p where p.user_id=u.id and p.active)
        or exists(select 1 from public.site_auth_memberships m where m.user_id=u.id and m.site_slug=s.slug and m.active)
      )
  );
$$;

create or replace function public.site_login_prepare(p_site_slug text,p_email text,p_origin text,p_purpose text)
returns jsonb language sql set search_path='' as $$select site_login_private.prepare(p_site_slug,p_email,p_origin,p_purpose);$$;
create or replace function public.site_login_recovery_allowed(p_site_slug text,p_email text,p_user_id uuid,p_origin text)
returns boolean language sql set search_path='' as $$select site_login_private.recovery_allowed(p_site_slug,p_email,p_user_id,p_origin);$$;
revoke all on all functions in schema site_login_private from public,anon,authenticated;
grant execute on all functions in schema site_login_private to service_role;
revoke all on function public.site_login_prepare(text,text,text,text),public.site_login_recovery_allowed(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.site_login_prepare(text,text,text,text),public.site_login_recovery_allowed(text,text,uuid,text) to service_role;
