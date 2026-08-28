create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists automation_runs_domain_id_idx on public.automation_runs(domain_id);
create index if not exists automation_runs_website_id_idx on public.automation_runs(website_id);
