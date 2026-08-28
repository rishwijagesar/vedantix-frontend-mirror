-- Vedantix Control Center - core schema
-- Phase 1: Customers + Domains + Websites
-- No permissive RLS policies are created here on purpose.
-- Authentication/role policies are added only after the Supabase project is provisioned.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  status text not null default 'LEAD' check (status in ('LEAD', 'ACTIVE', 'PAUSED', 'ARCHIVED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  domain_name text not null unique,
  registrar text,
  dns_provider text,
  email_provider text,
  status text not null default 'UNKNOWN' check (status in ('UNKNOWN', 'HEALTHY', 'WARNING', 'ERROR')),
  expires_at timestamptz,
  auto_renew boolean,
  last_dns_snapshot jsonb,
  last_dns_snapshot_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  name text not null,
  hosting_provider text not null default 'LOVABLE',
  github_repo text,
  github_branch text default 'main',
  lovable_project_id text,
  production_url text,
  preview_url text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'READY', 'LIVE', 'PAUSED', 'ERROR', 'ARCHIVED')),
  last_deployed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domain_checks (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  check_type text not null check (check_type in ('DNS', 'MX', 'SPF', 'DKIM', 'DMARC', 'SSL', 'EXPIRY', 'WEBSITE')),
  status text not null check (status in ('PASS', 'WARNING', 'FAIL', 'UNKNOWN')),
  summary text,
  details jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  provider text not null,
  external_ref text,
  status text not null default 'DISCONNECTED' check (status in ('DISCONNECTED', 'CONNECTED', 'ERROR')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, provider, external_ref)
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  automation_type text not null,
  status text not null check (status in ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customers_status_idx on public.customers(status);
create index if not exists domains_customer_id_idx on public.domains(customer_id);
create index if not exists domains_status_idx on public.domains(status);
create index if not exists websites_customer_id_idx on public.websites(customer_id);
create index if not exists websites_domain_id_idx on public.websites(domain_id);
create index if not exists websites_status_idx on public.websites(status);
create index if not exists domain_checks_domain_id_checked_at_idx on public.domain_checks(domain_id, checked_at desc);
create index if not exists automation_runs_customer_id_created_at_idx on public.automation_runs(customer_id, created_at desc);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger domains_set_updated_at
before update on public.domains
for each row execute function public.set_updated_at();

create trigger websites_set_updated_at
before update on public.websites
for each row execute function public.set_updated_at();

create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.domains enable row level security;
alter table public.websites enable row level security;
alter table public.domain_checks enable row level security;
alter table public.integrations enable row level security;
alter table public.automation_runs enable row level security;

comment on table public.customers is 'Central customer record for all Vedantix-managed services.';
comment on table public.domains is 'Customer domains with DNS/email-provider metadata and last known DNS snapshot.';
comment on table public.websites is 'Website projects and hosting/source-control linkage.';
comment on table public.domain_checks is 'Historical domain, mail, SSL and website health-check outcomes.';
comment on table public.integrations is 'References to external providers such as Lovable, Migadu, Cloudflare and GitHub.';
comment on table public.automation_runs is 'Audit trail for automated operational workflows.';
