create or replace function public.get_audit_funnel_stats(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_from timestamptz := date_trunc('day', now()) - ((greatest(1, least(coalesce(p_days, 30), 365)) - 1) * interval '1 day');
  v_counts jsonb;
  v_daily jsonb;
begin
  select coalesce(jsonb_object_agg(event, count), '{}'::jsonb)
  into v_counts
  from (
    select event, count(*)::bigint as count
    from public.audit_funnel_events
    where created_at >= v_from
    group by event
  ) grouped;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('date', day, 'event', event, 'count', count)
      order by day, event
    ),
    '[]'::jsonb
  )
  into v_daily
  from (
    select created_at::date as day, event, count(*)::bigint as count
    from public.audit_funnel_events
    where created_at >= v_from
    group by created_at::date, event
  ) grouped;

  return jsonb_build_object(
    'days', v_days,
    'from', v_from,
    'to', now(),
    'counts', v_counts,
    'daily', v_daily
  );
end;
$$;

revoke all on function public.get_audit_funnel_stats(integer) from public, anon, authenticated;
grant execute on function public.get_audit_funnel_stats(integer) to service_role;

comment on function public.get_audit_funnel_stats(integer) is
  'Returns aggregate Online Groei Audit funnel counts and daily totals. Callable only by the service role via the staff-protected Edge Function.';
