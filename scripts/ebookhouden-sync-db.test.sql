\set ON_ERROR_STOP on
-- Isolated Postgres fixture; never uses live credentials or contacts providers.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end; $$;
create schema auth;
create schema vault;
grant usage on schema auth to anon,authenticated,service_role;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb; $$;
create table vault.secrets(id uuid primary key default gen_random_uuid(),secret text,name text,description text);
create view vault.decrypted_secrets as select id,name,secret as decrypted_secret from vault.secrets;
create function vault.create_secret(p_secret text,p_name text,p_description text) returns uuid language plpgsql as $$ declare v_id uuid; begin insert into vault.secrets(secret,name,description) values(p_secret,p_name,p_description) returning id into v_id;return v_id;end; $$;
create function vault.update_secret(p_id uuid,p_secret text) returns void language sql as $$ update vault.secrets set secret=p_secret where id=p_id; $$;
create table public.invoices(id uuid primary key, is_active boolean default true, finalized_at timestamptz, status text, updated_at timestamptz, total_incl_vat numeric);
create table public.invoice_payments(id uuid primary key,invoice_id uuid,voided_at timestamptz,amount numeric,payment_date date,method text,reference text);
create table public.credit_notes(id uuid primary key,invoice_id uuid,status text,finalized_at timestamptz,total_incl_vat numeric,total_ex_vat numeric,vat_total numeric,credit_date date,credit_number text);
insert into public.invoices values('33333333-3333-4333-8333-333333333333',true,'2026-09-23T00:00:00Z','FINALIZED','2026-09-23T00:00:00Z',121);
grant select,update on public.invoices to service_role;
\ir ../supabase/migrations/20260916202844_ebookhouden_secure_setup.sql
\ir ../supabase/migrations/20260923004212_ebookhouden_sync.sql

do $$ begin
 if has_table_privilege('authenticated','ebookhouden_exports','SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('anon','ebookhouden_config','SELECT') or has_function_privilege('authenticated','ebookhouden_sync(text,uuid,jsonb)','EXECUTE') or has_schema_privilege('authenticated','ebookhouden_private','USAGE') then raise exception 'Accounting data exposed'; end if;
 if not (select relrowsecurity from pg_class where oid='ebookhouden_exports'::regclass) then raise exception 'Missing RLS'; end if;
 begin perform ebookhouden_sync('claim',gen_random_uuid()); raise exception 'Missing service JWT accepted'; exception when raise_exception then if SQLERRM<>'Not authorized' then raise; end if; end;
end; $$;
set role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
select ebookhouden_secret('save','fixture-token');
update ebookhouden_config set mapping='{"debtor":1,"revenue":2}';
do $$ begin
 begin perform ebookhouden_sync('settings',null,'{"enabled":true,"payment_mode":"EXTERNAL"}'); raise exception 'Auto export allowed before first invoice'; exception when raise_exception then if SQLERRM<>'First reviewed invoice required' then raise; end if; end;
 if ebookhouden_sync('claim','11111111-1111-4111-8111-111111111111')<>'true'::jsonb then raise exception 'First lease refused'; end if;
 if ebookhouden_sync('claim','22222222-2222-4222-8222-222222222222')<>'false'::jsonb then raise exception 'Concurrent lease allowed'; end if;
 begin update ebookhouden_config set mapping='{}'; raise exception 'Mapping changed during export'; exception when raise_exception then if SQLERRM<>'Accounting export in progress' then raise; end if; end;
 begin perform ebookhouden_secret('save','another-token'); raise exception 'Token changed during export'; exception when raise_exception then if SQLERRM<>'Accounting export in progress' then raise; end if; end;
 if ebookhouden_secret('read')<>'fixture-token' then raise exception 'Rejected rotation leaked through'; end if;
 perform ebookhouden_sync('anchor','11111111-1111-4111-8111-111111111111','{"ledger":1}');
 perform ebookhouden_sync('sending','11111111-1111-4111-8111-111111111111','{"kind":"INVOICE","id":"33333333-3333-4333-8333-333333333333","invoice_id":"33333333-3333-4333-8333-333333333333","source_hash":"source","review_hash":"review","mutation":{"ledgerId":1},"source_updated_at":"2026-09-23T00:00:00Z","amount":121}');
 if (select status from ebookhouden_exports)<>'SENDING' then raise exception 'Posting intent not persisted'; end if;
 begin update invoices set is_active=false; raise exception 'Source voided while POST in flight'; exception when raise_exception then if SQLERRM<>'Accounting export in progress; retry shortly' then raise; end if; end;
 -- Crash: lease expires but the durable intent must remain recoverable.
 update ebookhouden_config set lock_until=now()-interval '1 minute';
 perform ebookhouden_sync('claim','22222222-2222-4222-8222-222222222222');
 if (select status from ebookhouden_exports)<>'REVIEW' then raise exception 'Orphan posting not flagged'; end if;
 begin perform ebookhouden_sync('finish','11111111-1111-4111-8111-111111111111','{"kind":"INVOICE","id":"33333333-3333-4333-8333-333333333333","status":"SYNCED","remote_id":101}'); raise exception 'Stale owner accepted'; exception when raise_exception then if SQLERRM<>'Export lease expired' then raise; end if; end;
 perform ebookhouden_sync('release','11111111-1111-4111-8111-111111111111');
 if (select lock_id from ebookhouden_config)<>'22222222-2222-4222-8222-222222222222'::uuid then raise exception 'Stale release dropped new lock'; end if;
 perform ebookhouden_sync('finish','22222222-2222-4222-8222-222222222222','{"kind":"INVOICE","id":"33333333-3333-4333-8333-333333333333","status":"SYNCED","remote_id":101}');
 begin perform ebookhouden_sync('sending','22222222-2222-4222-8222-222222222222','{"kind":"INVOICE","id":"33333333-3333-4333-8333-333333333333","source_hash":"source","review_hash":"review","invoice_id":"33333333-3333-4333-8333-333333333333","source_updated_at":"2026-09-23T00:00:00Z","amount":121}'); raise exception 'Synced invoice reposted'; exception when raise_exception then if SQLERRM<>'Export already posted or changed' then raise; end if; end;
 perform ebookhouden_sync('release','22222222-2222-4222-8222-222222222222');
 perform ebookhouden_sync('settings',null,'{"enabled":true,"payment_mode":"EXTERNAL"}');
 if not (select sync_enabled and sync_from is not null from ebookhouden_config) then raise exception 'Activation missing cutoff'; end if;
 update ebookhouden_config set mapping='{"debtor":1,"revenue":3}';
 if (select sync_enabled from ebookhouden_config) then raise exception 'Mapping change did not pause automatic writes'; end if;
 perform ebookhouden_secret('delete');
 if not exists(select 1 from ebookhouden_exports where remote_id=101) then raise exception 'Disconnect lost idempotency journal'; end if;
 if (select anchor_ledger_id from ebookhouden_config)<>1 then raise exception 'Disconnect lost administration binding'; end if;
 if ebookhouden_sync('worker_auth',null,'{"secret":"wrong"}')<>'false'::jsonb then raise exception 'Unauthenticated worker accepted'; end if;
end; $$;
reset role;
\echo 'Accounting leases, durable intents, activation, token guards and grants passed.'
