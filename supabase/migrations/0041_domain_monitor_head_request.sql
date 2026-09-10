-- Website health checks only need an HTTP status code. Using GET can make the
-- PostgreSQL http extension decode binary/compressed response bodies and fail
-- before exposing the status (for example CloudFront/Lambda responses).
-- HEAD avoids downloading/decoding the response body and is sufficient here.
create or replace function public.safe_http_status(p_url text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status integer;
begin
  select (r).status into v_status
  from (select extensions.http_head(p_url) as r) q;
  return v_status;
exception when others then
  return null;
end;
$$;

revoke all on function public.safe_http_status(text) from public, anon, authenticated;
