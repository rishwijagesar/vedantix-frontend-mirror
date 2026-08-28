alter table public.domains
add column if not exists dkim_selectors text[] not null default '{}'::text[];

update public.domains
set dkim_selectors = array['key1','key2','key3']
where domain_name = 'vedantix.nl'
  and email_provider = 'Migadu';
