-- Mollie provider activation must go through a server-side guard.
-- Saving or rotating credentials always disables checkout until the new key is explicitly activated.

drop policy if exists payment_provider_config_admin_update on public.payment_provider_config;
revoke insert, update, delete on table public.payment_provider_config from anon, authenticated;
grant select on table public.payment_provider_config to authenticated;

create or replace function public.store_mollie_api_key(p_api_key text, p_mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := btrim(coalesce(p_api_key,''));
  v_mode text := upper(btrim(coalesce(p_mode,'TEST')));
begin
  if v_mode not in ('TEST','LIVE') then raise exception 'Unsupported Mollie mode'; end if;
  if v_key = '' then raise exception 'Mollie API key is required'; end if;
  if v_mode='TEST' and left(v_key,5) <> 'test_' then raise exception 'Expected a Mollie test API key'; end if;
  if v_mode='LIVE' and left(v_key,5) <> 'live_' then raise exception 'Expected a Mollie live API key'; end if;

  perform public.upsert_vault_secret('mollie_api_key', v_key, 'Mollie API key used by Vedantix billing.');
  update public.payment_provider_config
  set mode=v_mode,
      credentials_configured=true,
      enabled=false,
      updated_at=now()
  where id=true;
end;
$$;

revoke all on function public.store_mollie_api_key(text,text) from public, anon, authenticated;
grant execute on function public.store_mollie_api_key(text,text) to service_role;
