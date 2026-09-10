create table if not exists public.website_preview_links (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  public_token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  last_opened_at timestamptz,
  open_count bigint not null default 0 check (open_count >= 0)
);

create index if not exists website_preview_links_website_idx
on public.website_preview_links(website_id, created_at desc);

create index if not exists website_preview_links_active_idx
on public.website_preview_links(website_id, expires_at)
where revoked_at is null;

alter table public.website_preview_links enable row level security;

revoke all on table public.website_preview_links from anon;
grant select on table public.website_preview_links to authenticated;

create policy website_preview_links_staff_read on public.website_preview_links
for select to authenticated
using (public.is_staff());

create or replace function public.create_website_preview_link(
  p_website_id uuid,
  p_valid_days integer default 14
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_id uuid;
  v_token uuid;
  v_expires timestamptz;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;
  if p_valid_days is null or p_valid_days < 1 or p_valid_days > 90 then
    raise exception 'Preview validity must be between 1 and 90 days';
  end if;

  select nullif(btrim(preview_url), '') into v_url
  from public.websites
  where id = p_website_id;

  if v_url is null then
    raise exception 'Set a preview URL before creating a customer link';
  end if;
  if v_url !~* '^https://[^[:space:]]+$' then
    raise exception 'Preview URL must use HTTPS';
  end if;

  update public.website_preview_links
  set revoked_at = now()
  where website_id = p_website_id
    and revoked_at is null;

  v_expires := now() + make_interval(days => p_valid_days);
  insert into public.website_preview_links(website_id, expires_at, created_by)
  values (p_website_id, v_expires, auth.uid())
  returning id, public_token into v_id, v_token;

  return jsonb_build_object(
    'id', v_id,
    'website_id', p_website_id,
    'public_token', v_token,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.revoke_website_preview_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then
    raise exception 'Not authorized';
  end if;

  update public.website_preview_links
  set revoked_at = coalesce(revoked_at, now())
  where id = p_link_id;

  if not found then
    raise exception 'Preview link not found';
  end if;
end;
$$;

revoke all on function public.create_website_preview_link(uuid, integer) from public, anon;
revoke all on function public.revoke_website_preview_link(uuid) from public, anon;
grant execute on function public.create_website_preview_link(uuid, integer) to authenticated, service_role;
grant execute on function public.revoke_website_preview_link(uuid) to authenticated, service_role;
