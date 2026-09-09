-- Run inside a transaction, after central-site-auth.sql; always ROLLBACK.
-- No passwords, emails, or committed fixture users are created.
insert into auth.users(id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333');
insert into public.site_auth_sites(slug,name,origin,active) values
  ('fixture-a','Fixture A','https://a.example.test',true),
  ('fixture-b','Fixture B','https://b.example.test',true);
insert into public.site_auth_memberships(site_slug,user_id) values
  ('fixture-a','11111111-1111-4111-8111-111111111111'),
  ('fixture-b','22222222-2222-4222-8222-222222222222');
insert into public.site_auth_platform_admins(user_id) values ('33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ begin
  if not public.can_manage_site('fixture-a') then raise exception 'Own site denied'; end if;
  if public.can_manage_site('fixture-b') then raise exception 'Cross-customer access allowed'; end if;
  if public.can_manage_site('naturehealing') then raise exception 'Inactive site allowed'; end if;
  if public.can_manage_site('missing') then raise exception 'Unknown site allowed'; end if;
  if (select count(*) from public.site_auth_sites) <> 1 then raise exception 'Other sites visible'; end if;
  if (select count(*) from public.site_auth_memberships) <> 1 then raise exception 'Other memberships visible'; end if;
  begin
    insert into public.site_auth_memberships(site_slug,user_id)
    values ('fixture-b','11111111-1111-4111-8111-111111111111');
    raise exception 'Self-escalation allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.site_auth_platform_admins(user_id)
    values ('11111111-1111-4111-8111-111111111111');
    raise exception 'Platform-admin self-escalation allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin
  if not public.can_manage_site('fixture-a') or not public.can_manage_site('fixture-b') then raise exception 'Platform admin denied'; end if;
  if public.can_manage_site('naturehealing') then raise exception 'Platform admin bypassed disabled site'; end if;
end $$;
reset role;
update public.site_auth_memberships set active=false where user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ begin
  if public.can_manage_site('fixture-a') then raise exception 'Revoked membership still accepted'; end if;
end $$;
reset role;
update public.site_auth_platform_admins set active=false where user_id='33333333-3333-4333-8333-333333333333';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin
  if public.can_manage_site('fixture-a') then raise exception 'Revoked platform admin still accepted'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.can_manage_site('fixture-a');
    raise exception 'Anonymous role can call authorization RPC';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
