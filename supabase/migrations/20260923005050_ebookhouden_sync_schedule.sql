create extension if not exists pg_net with schema extensions;
-- The scheduler only wakes an explicitly enabled integration. The outbox above,
-- not pg_net's transient queue, is the source of truth for accounting writes.
create function ebookhouden_private.wake_worker() returns void language plpgsql security definer set search_path='' as $$
declare v_secret text;
begin
 if not exists(select 1 from public.ebookhouden_config where id and connected and sync_enabled and coalesce(lock_until,'-infinity'::timestamptz)<now()) then return; end if;
 select decrypted_secret into v_secret from vault.decrypted_secrets where name='vedantix_ebookhouden_worker';
 perform net.http_post(url:='https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/ebookhouden-admin',headers:=jsonb_build_object('Content-Type','application/json','x-vedantix-worker',v_secret),body:='{"action":"worker"}'::jsonb,timeout_milliseconds:=180000);
end; $$;
revoke all on function ebookhouden_private.wake_worker() from public,anon,authenticated,service_role;
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='vedantix_ebookhouden_worker') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'vedantix_ebookhouden_worker','Accounting scheduler authentication');
 end if;
end; $$;
select cron.schedule('vedantix-ebookhouden-sync','*/5 * * * *','select ebookhouden_private.wake_worker()');
