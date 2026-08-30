alter table public.notification_delivery_config
add column if not exists transport_ok boolean,
add column if not exists credentials_configured boolean not null default false,
add column if not exists last_probe_at timestamptz;

update public.notification_delivery_config
set transport_ok = true,
    credentials_configured = false,
    last_probe_at = now()
where id = true;
