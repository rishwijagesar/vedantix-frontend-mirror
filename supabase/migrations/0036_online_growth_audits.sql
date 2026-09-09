create table if not exists public.online_growth_audits (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','COMPLETED','FAILED')),
  request jsonb not null default '{}'::jsonb,
  results jsonb,
  error_message text,
  requester_ip inet,
  user_agent text,
  rerun_of uuid references public.online_growth_audits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index if not exists online_growth_audits_created_idx on public.online_growth_audits(created_at desc);
create index if not exists online_growth_audits_expires_idx on public.online_growth_audits(expires_at);
create index if not exists online_growth_audits_ip_created_idx on public.online_growth_audits(requester_ip, created_at desc) where requester_ip is not null;

alter table public.online_growth_audits enable row level security;
revoke all on public.online_growth_audits from anon, authenticated;

do $$ begin
  if exists (select 1 from pg_roles where rolname='authenticated') then
    create policy online_growth_audits_staff_select on public.online_growth_audits
      for select to authenticated
      using (public.is_staff(auth.uid()));
  end if;
exception when duplicate_object then null;
end $$;

create or replace function public.touch_online_growth_audit_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists online_growth_audits_touch on public.online_growth_audits;
create trigger online_growth_audits_touch before update on public.online_growth_audits
for each row execute function public.touch_online_growth_audit_updated_at();
