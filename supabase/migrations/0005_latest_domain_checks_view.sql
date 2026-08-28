create or replace view public.domain_latest_checks
with (security_invoker = true)
as
select distinct on (domain_id, check_type)
  id,
  domain_id,
  check_type,
  status,
  summary,
  details,
  checked_at
from public.domain_checks
order by domain_id, check_type, checked_at desc;

grant select on public.domain_latest_checks to authenticated;
