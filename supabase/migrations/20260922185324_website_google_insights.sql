create table public.google_insights_connections (
  id uuid primary key default gen_random_uuid(),
  label text not null check(length(label) between 1 and 100),
  client_email text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_google_insights (
  website_id uuid primary key references public.websites(id) on delete cascade,
  pagespeed_enabled boolean not null default false,
  pagespeed_path text not null default '/' check(pagespeed_path ~ '^/' and length(pagespeed_path)<=1000),
  pagespeed_devices text[] not null default array['mobile','desktop']::text[]
    check(cardinality(pagespeed_devices) between 1 and 2 and pagespeed_devices <@ array['mobile','desktop']::text[]),
  ga_connection_id uuid references public.google_insights_connections(id) on delete restrict,
  ga_enabled boolean not null default false,
  ga_property text check(ga_property ~ '^properties/[0-9]+$'),
  ga_stream text check(ga_stream ~ '^properties/[0-9]+/dataStreams/[0-9]+$'),
  ga_measurement_id text check(ga_measurement_id ~ '^G-[A-Z0-9]+$'),
  ga_property_info jsonb,
  ga_pending boolean not null default false,
  lock_id uuid,
  lock_until timestamptz,
  updated_at timestamptz not null default now(),
  check(not ga_enabled or (ga_connection_id is not null and ga_property is not null and ga_stream is not null and ga_measurement_id is not null)),
  check(ga_stream is null or (ga_property is not null and starts_with(ga_stream,ga_property || '/dataStreams/')))
);
create index website_google_insights_connection_idx on public.website_google_insights(ga_connection_id);

create table public.website_insight_runs (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  kind text not null check(kind in ('pagespeed','analytics')),
  status text not null check(status in ('RUNNING','COMPLETED','PARTIAL','FAILED')),
  target_url text not null,
  note text not null default '' check(length(note)<=500),
  result jsonb,
  error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index website_insight_runs_website_idx on public.website_insight_runs(website_id,kind,created_at desc);
create index website_insight_runs_actor_idx on public.website_insight_runs(created_by);
create index google_insights_connections_actor_idx on public.google_insights_connections(created_by);

create table public.google_insights_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  actor_id uuid not null references auth.users(id),
  website_id uuid references public.websites(id) on delete set null,
  action text not null,
  status text not null default 'pending' check(status in ('pending','succeeded','unconfirmed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index google_insights_audit_website_idx on public.google_insights_audit(website_id,created_at desc);
create index google_insights_audit_actor_idx on public.google_insights_audit(actor_id);

alter table public.google_insights_connections enable row level security;
alter table public.website_google_insights enable row level security;
alter table public.website_insight_runs enable row level security;
alter table public.google_insights_audit enable row level security;
revoke all on public.google_insights_connections, public.website_google_insights, public.website_insight_runs, public.google_insights_audit from public, anon, authenticated;
grant select on public.google_insights_connections, public.website_google_insights, public.website_insight_runs, public.google_insights_audit to authenticated;
grant all on public.google_insights_connections, public.website_google_insights, public.website_insight_runs, public.google_insights_audit to service_role;
create policy google_connections_admin_read on public.google_insights_connections for select to authenticated using(public.is_staff(array['ADMIN']::text[]));
create policy google_settings_admin_read on public.website_google_insights for select to authenticated using(public.is_staff(array['ADMIN']::text[]));
create policy google_runs_admin_read on public.website_insight_runs for select to authenticated using(public.is_staff(array['ADMIN']::text[]));
create policy google_audit_admin_read on public.google_insights_audit for select to authenticated using(public.is_staff(array['ADMIN']::text[]));

create schema google_insights_private;
revoke all on schema google_insights_private from public, anon, authenticated;
grant usage on schema google_insights_private to service_role;
create function google_insights_private.secret(p_key text,p_action text,p_value text default null)
returns text language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_value text;
begin
  if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  if p_key <> 'pagespeed' and p_key !~ '^connection-[0-9a-f-]{36}$' then raise exception 'Invalid key'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('google-insights-' || p_key,0));
  select id into v_id from vault.secrets where name='vedantix-google-' || p_key;
  if p_action='read' then
    select decrypted_secret into v_value from vault.decrypted_secrets where id=v_id;
    return v_value;
  elsif p_action='save' then
    if p_value is null or length(p_value) not between 1 and 16000 then raise exception 'Invalid secret'; end if;
    if v_id is null then perform vault.create_secret(p_value,'vedantix-google-' || p_key,'Google website insights; server only');
    else perform vault.update_secret(v_id,p_value); end if;
  elsif p_action='delete' then
    delete from vault.secrets where id=v_id;
  else raise exception 'Invalid action'; end if;
  return null;
end;
$$;
revoke all on function google_insights_private.secret(text,text,text) from public, anon, authenticated;
grant execute on function google_insights_private.secret(text,text,text) to service_role;
create function public.google_insights_secret(p_key text,p_action text,p_value text default null)
returns text language sql security invoker set search_path='' as $$select google_insights_private.secret(p_key,p_action,p_value);$$;
revoke all on function public.google_insights_secret(text,text,text) from public, anon, authenticated;
grant execute on function public.google_insights_secret(text,text,text) to service_role;

create function public.google_insights_claim(p_website_id uuid,p_lock_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  insert into public.website_google_insights(website_id) values(p_website_id) on conflict do nothing;
  update public.website_google_insights set lock_id=p_lock_id,lock_until=now()+interval '5 minutes'
    where website_id=p_website_id and (lock_until is null or lock_until<now());
  return found;
end;
$$;
revoke all on function public.google_insights_claim(uuid,uuid) from public, anon, authenticated;
grant execute on function public.google_insights_claim(uuid,uuid) to service_role;

-- Measurement IDs are public identifiers. No credentials or admin configuration leave this RPC.
create function public.website_analytics_config(p_origin text)
returns text language sql stable security definer set search_path='' as $$
  select i.ga_measurement_id from public.website_google_insights i
  join public.websites w on w.id=i.website_id
  where i.ga_enabled and not i.ga_pending and w.status='LIVE'
    and p_origin ~ '^https://[a-z0-9.-]+$'
    and lower(substring(w.production_url from '^https://[^/]+'))=p_origin
  order by i.updated_at desc limit 1;
$$;
revoke all on function public.website_analytics_config(text) from public;
grant execute on function public.website_analytics_config(text) to anon, authenticated, service_role;
