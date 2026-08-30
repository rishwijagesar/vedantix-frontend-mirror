create or replace function public.upsert_vault_secret(p_name text, p_value text, p_description text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_name is null or btrim(p_name) = '' or p_value is null then
    raise exception 'Secret name and value are required';
  end if;

  select s.id into v_id
  from vault.secrets s
  where s.name = p_name
  order by s.created_at desc
  limit 1;

  if v_id is null then
    perform vault.create_secret(p_value, p_name, coalesce(p_description, ''), null);
  else
    perform vault.update_secret(v_id, p_value, p_name, coalesce(p_description, ''), null);
  end if;
end;
$$;

revoke all on function public.upsert_vault_secret(text,text,text) from public, anon, authenticated;
grant execute on function public.upsert_vault_secret(text,text,text) to service_role;

create or replace function public.store_migadu_delivery_credentials(
  p_user text,
  p_password text,
  p_alert_to text default null,
  p_alert_from text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user text := lower(btrim(p_user));
  v_to text := nullif(btrim(coalesce(p_alert_to, '')), '');
  v_from text := nullif(btrim(coalesce(p_alert_from, '')), '');
begin
  if v_user = '' or position('@' in v_user) = 0 then
    raise exception 'Valid SMTP user e-mail is required';
  end if;
  if p_password is null or p_password = '' then
    raise exception 'SMTP password is required';
  end if;

  perform public.upsert_vault_secret('migadu_smtp_user', v_user, 'Migadu SMTP mailbox used by Vedantix monitoring.');
  perform public.upsert_vault_secret('migadu_smtp_password', p_password, 'Migadu SMTP mailbox password used by Vedantix monitoring.');
  perform public.upsert_vault_secret('vedantix_alert_email_to', coalesce(v_to, v_user), 'Monitoring alert recipient(s), comma separated.');
  perform public.upsert_vault_secret('vedantix_alert_email_from', coalesce(v_from, v_user), 'Monitoring alert sender mailbox.');

  update public.notification_delivery_config
  set credentials_configured = true,
      updated_at = now()
  where id = true;
end;
$$;

revoke all on function public.store_migadu_delivery_credentials(text,text,text,text) from public, anon, authenticated;
grant execute on function public.store_migadu_delivery_credentials(text,text,text,text) to service_role;

create or replace function public.get_migadu_delivery_credentials()
returns table(
  smtp_user text,
  smtp_password text,
  alert_to text,
  alert_from text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select d.decrypted_secret from vault.decrypted_secrets d where d.name='migadu_smtp_user' order by d.created_at desc limit 1),
    (select d.decrypted_secret from vault.decrypted_secrets d where d.name='migadu_smtp_password' order by d.created_at desc limit 1),
    (select d.decrypted_secret from vault.decrypted_secrets d where d.name='vedantix_alert_email_to' order by d.created_at desc limit 1),
    (select d.decrypted_secret from vault.decrypted_secrets d where d.name='vedantix_alert_email_from' order by d.created_at desc limit 1);
$$;

revoke all on function public.get_migadu_delivery_credentials() from public, anon, authenticated;
grant execute on function public.get_migadu_delivery_credentials() to service_role;

create or replace function public.has_migadu_delivery_credentials()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists(select 1 from vault.secrets s where s.name='migadu_smtp_user')
    and exists(select 1 from vault.secrets s where s.name='migadu_smtp_password');
$$;

revoke all on function public.has_migadu_delivery_credentials() from public, anon, authenticated;
grant execute on function public.has_migadu_delivery_credentials() to service_role;
