\set ON_ERROR_STOP on
-- Isolated CI database only. Fake Vault tests grants; no live keys or production data.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; else alter role service_role bypassrls; end if;
end; $$;
create schema auth;
create schema vault;
grant usage on schema auth to anon,authenticated,service_role;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb; $$;
create function public.is_staff(required_roles text[]) returns boolean language sql stable as $$ select coalesce(auth.jwt()->>'staff_role','')=any(required_roles); $$;
create table auth.users(id uuid primary key);
create table public.websites(id uuid primary key,production_url text,status text);
create table vault.secrets(id uuid primary key default gen_random_uuid(),secret text,name text,description text);
create view vault.decrypted_secrets as select id,secret as decrypted_secret from vault.secrets;
create function vault.create_secret(p_secret text,p_name text,p_description text) returns uuid language plpgsql as $$ declare v_id uuid; begin insert into vault.secrets(secret,name,description) values(p_secret,p_name,p_description) returning id into v_id; return v_id; end; $$;
create function vault.update_secret(p_id uuid,p_secret text) returns void language sql as $$ update vault.secrets set secret=p_secret where id=p_id; $$;
\ir ../supabase/migrations/20260922185324_website_google_insights.sql
insert into auth.users values('33333333-3333-4333-8333-333333333333');
insert into websites values('11111111-1111-4111-8111-111111111111','https://example.org','LIVE');
insert into google_insights_connections(id,label,client_email,created_by) values('22222222-2222-4222-8222-222222222222','Test','test@example.org','33333333-3333-4333-8333-333333333333');
insert into website_google_insights(website_id,ga_connection_id,ga_enabled,ga_property,ga_stream,ga_measurement_id) values('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',true,'properties/1','properties/1/dataStreams/2','G-TEST123');
do $$ declare tab text; begin
 foreach tab in array array['google_insights_connections','website_google_insights','website_insight_runs','google_insights_audit'] loop
  if has_table_privilege('anon','public.'||tab,'SELECT') or has_table_privilege('authenticated','public.'||tab,'INSERT,UPDATE,DELETE') then raise exception 'Browser access too broad: %',tab; end if;
  if not (select relrowsecurity from pg_class where oid=('public.'||tab)::regclass) then raise exception 'Missing RLS: %',tab; end if;
 end loop;
 if has_function_privilege('anon','public.google_insights_secret(text,text,text)','EXECUTE') or has_function_privilege('authenticated','public.google_insights_secret(text,text,text)','EXECUTE') or has_function_privilege('authenticated','public.google_insights_claim(uuid,uuid)','EXECUTE') or has_schema_privilege('authenticated','google_insights_private','USAGE') then raise exception 'Secret/lease privileges exposed'; end if;
 begin perform public.google_insights_secret('pagespeed','read'); raise exception 'Missing JWT accepted'; exception when raise_exception then if SQLERRM<>'Not authorized' then raise; end if; end;
 begin update website_google_insights set ga_stream='properties/9/dataStreams/2'; raise exception 'Mismatched stream accepted'; exception when check_violation then null; end;
 begin update website_google_insights set ga_property=null; raise exception 'Incomplete enabled config accepted'; exception when check_violation then null; end;
 begin delete from google_insights_connections; raise exception 'In-use connection deleted'; exception when foreign_key_violation then null; end;
end; $$;
set role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
do $$ begin
 perform google_insights_secret('pagespeed','save','first-key');
 if google_insights_secret('pagespeed','read')<>'first-key' then raise exception 'Secret did not round trip'; end if;
 perform google_insights_secret('pagespeed','save','rotated-key');
 if google_insights_secret('pagespeed','read')<>'rotated-key' then raise exception 'Secret did not rotate'; end if;
 perform google_insights_secret('pagespeed','delete');
 if google_insights_secret('pagespeed','read') is not null then raise exception 'Deleted secret remains'; end if;
 if not google_insights_claim('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333') then raise exception 'First lease refused'; end if;
 if google_insights_claim('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222') then raise exception 'Concurrent lease accepted'; end if;
 update website_google_insights set lock_until=now()-interval '1 minute';
 if not google_insights_claim('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222') then raise exception 'Expired lease not recoverable'; end if;
end; $$;
reset role;
set role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"READ_ONLY"}',false);
do $$ begin if exists(select 1 from google_insights_connections) or exists(select 1 from website_google_insights) then raise exception 'Nonadmin can read configuration'; end if; end; $$;
select set_config('request.jwt.claims','{"role":"authenticated","staff_role":"ADMIN"}',false);
do $$ begin if (select count(*) from google_insights_connections)<>1 then raise exception 'Admin cannot see configured connection'; end if; end; $$;
reset role;
set role anon;
do $$ begin
 if website_analytics_config('https://example.org') is distinct from 'G-TEST123' then raise exception 'Public ID unavailable'; end if;
 if website_analytics_config('https://evil.org') is not null or website_analytics_config('https://example.org.evil.org') is not null then raise exception 'Origin confused'; end if;
end; $$;
reset role;
update website_google_insights set ga_enabled=false;
set role anon;
do $$ begin if website_analytics_config('https://example.org') is not null then raise exception 'Paused tag is still published'; end if; end; $$;
reset role;
\echo 'Google insights RLS, Vault, lease, consistency and public configuration tests passed.'
