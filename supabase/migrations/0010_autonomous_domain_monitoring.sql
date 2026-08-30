create table if not exists public.monitoring_alerts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  check_type text not null check (check_type in ('DNS', 'MX', 'SPF', 'DKIM', 'DMARC', 'SSL', 'EXPIRY', 'WEBSITE')),
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  message text not null,
  details jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists monitoring_alerts_domain_status_idx
on public.monitoring_alerts(domain_id, status, last_seen_at desc);

create unique index if not exists monitoring_alerts_one_active_per_check_idx
on public.monitoring_alerts(domain_id, check_type)
where status in ('OPEN', 'ACKNOWLEDGED');

create trigger monitoring_alerts_set_updated_at
before update on public.monitoring_alerts
for each row execute function public.set_updated_at();

alter table public.monitoring_alerts enable row level security;

create policy monitoring_alerts_staff_read on public.monitoring_alerts
for select to authenticated using (public.is_staff());
create policy monitoring_alerts_staff_update on public.monitoring_alerts
for update to authenticated
using (public.is_staff(array['ADMIN','OPERATOR']))
with check (public.is_staff(array['ADMIN','OPERATOR']));

create or replace function public.safe_http_json(p_url text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status integer;
  v_content text;
begin
  select (r).status, (r).content
    into v_status, v_content
  from (select extensions.http_get(p_url) as r) q;
  if v_status between 200 and 299 then
    return v_content::jsonb;
  end if;
  return null;
exception when others then
  return null;
end;
$$;

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
  from (select extensions.http_get(p_url) as r) q;
  return v_status;
exception when others then
  return null;
end;
$$;

revoke all on function public.safe_http_json(text) from public, anon, authenticated;
revoke all on function public.safe_http_status(text) from public, anon, authenticated;

create or replace function public.monitor_domain_once(p_domain_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.domains%rowtype;
  v_run_id uuid;
  v_now timestamptz := now();
  v_a jsonb; v_aaaa jsonb; v_mx jsonb; v_txt jsonb; v_dmarc jsonb; v_dkim jsonb;
  v_addresses text[] := array[]::text[];
  v_mx_records text[] := array[]::text[];
  v_txt_records text[] := array[]::text[];
  v_spf_records text[] := array[]::text[];
  v_dmarc_records text[] := array[]::text[];
  v_dmarc_record text; v_dmarc_policy text; v_selector text; v_selector_records text[];
  v_selector_results jsonb := '[]'::jsonb;
  v_all_dkim boolean := true; v_any_dkim boolean := false;
  v_checks jsonb := '[]'::jsonb;
  v_previous jsonb := '{}'::jsonb;
  v_changes jsonb := '[]'::jsonb;
  v_check jsonb; v_type text; v_status text; v_overall text;
  v_url text; v_http_status integer; v_alert_id uuid; v_severity text;
begin
  select * into d from public.domains where id = p_domain_id;
  if not found then raise exception 'Domain not found'; end if;

  insert into public.automation_runs(domain_id, automation_type, status, input, started_at)
  values (d.id, 'DOMAIN_HEALTH_MONITOR', 'RUNNING', jsonb_build_object('domain', d.domain_name, 'trigger', 'scheduler'), v_now)
  returning id into v_run_id;

  select coalesce(jsonb_object_agg(check_type, jsonb_build_object('status', status, 'details', coalesce(details, '{}'::jsonb))), '{}'::jsonb)
  into v_previous
  from public.domain_latest_checks
  where domain_id = d.id;

  v_a := public.safe_http_json('https://dns.google/resolve?name=' || d.domain_name || '&type=A');
  v_aaaa := public.safe_http_json('https://dns.google/resolve?name=' || d.domain_name || '&type=AAAA');
  v_mx := public.safe_http_json('https://dns.google/resolve?name=' || d.domain_name || '&type=MX');
  v_txt := public.safe_http_json('https://dns.google/resolve?name=' || d.domain_name || '&type=TXT');
  v_dmarc := public.safe_http_json('https://dns.google/resolve?name=_dmarc.' || d.domain_name || '&type=TXT');

  select coalesce(array_agg(x->>'data'), array[]::text[])
  into v_addresses
  from jsonb_array_elements(coalesce(v_a->'Answer', '[]'::jsonb)) x;

  select v_addresses || coalesce(array_agg(x->>'data'), array[]::text[])
  into v_addresses
  from jsonb_array_elements(coalesce(v_aaaa->'Answer', '[]'::jsonb)) x;

  select coalesce(array_agg(x->>'data'), array[]::text[])
  into v_mx_records
  from jsonb_array_elements(coalesce(v_mx->'Answer', '[]'::jsonb)) x;

  select coalesce(array_agg(regexp_replace(regexp_replace(x->>'data', '^"|"$', '', 'g'), '"[[:space:]]+"', '', 'g')), array[]::text[])
  into v_txt_records
  from jsonb_array_elements(coalesce(v_txt->'Answer', '[]'::jsonb)) x;

  select coalesce(array_agg(value), array[]::text[])
  into v_spf_records
  from unnest(v_txt_records) value
  where lower(value) like 'v=spf1%';

  select coalesce(array_agg(regexp_replace(regexp_replace(x->>'data', '^"|"$', '', 'g'), '"[[:space:]]+"', '', 'g')), array[]::text[])
  into v_dmarc_records
  from jsonb_array_elements(coalesce(v_dmarc->'Answer', '[]'::jsonb)) x
  where lower(regexp_replace(regexp_replace(x->>'data', '^"|"$', '', 'g'), '"[[:space:]]+"', '', 'g')) like 'v=dmarc1%';

  v_dmarc_record := v_dmarc_records[1];
  if v_dmarc_record is not null then
    v_dmarc_policy := lower((regexp_match(v_dmarc_record, '(?:^|;)[[:space:]]*p=([^;[:space:]]+)', 'i'))[1]);
  end if;

  v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','DNS','status',case when coalesce(array_length(v_addresses,1),0)>0 then 'PASS' else 'WARNING' end,'summary',case when coalesce(array_length(v_addresses,1),0)>0 then 'Website-DNS resolveert' else 'Geen A- of AAAA-record gevonden' end,'details',jsonb_build_object('addresses',to_jsonb(v_addresses))));
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','MX','status',case when coalesce(array_length(v_mx_records,1),0)>0 then 'PASS' else 'FAIL' end,'summary',case when coalesce(array_length(v_mx_records,1),0)>0 then array_length(v_mx_records,1)||' MX-record(s) gepubliceerd' else 'Geen MX-record gevonden' end,'details',jsonb_build_object('records',to_jsonb(v_mx_records),'detected_provider',case when array_to_string(v_mx_records,' ') ilike '%migadu.com%' then 'Migadu' else null end)));
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','SPF','status',case when coalesce(array_length(v_spf_records,1),0)=1 then 'PASS' when coalesce(array_length(v_spf_records,1),0)>1 then 'WARNING' else 'FAIL' end,'summary',case when coalesce(array_length(v_spf_records,1),0)=1 then 'SPF-record gevonden' when coalesce(array_length(v_spf_records,1),0)>1 then 'Meerdere SPF-records gevonden' else 'Geen SPF-record gevonden' end,'details',jsonb_build_object('records',to_jsonb(v_spf_records))));
  v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','DMARC','status',case when v_dmarc_record is null then 'FAIL' when v_dmarc_policy in ('reject','quarantine') then 'PASS' else 'WARNING' end,'summary',case when v_dmarc_record is null then 'Geen DMARC-record gevonden' else 'DMARC policy: '||coalesce(v_dmarc_policy,'onbekend') end,'details',jsonb_build_object('record',v_dmarc_record,'policy',v_dmarc_policy)));

  if coalesce(array_length(d.dkim_selectors,1),0)=0 then
    v_all_dkim := false;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','DKIM','status','UNKNOWN','summary','Geen DKIM-selectors geconfigureerd','details',jsonb_build_object('email_provider',d.email_provider)));
  else
    foreach v_selector in array d.dkim_selectors loop
      v_dkim := public.safe_http_json('https://dns.google/resolve?name=' || v_selector || '._domainkey.' || d.domain_name || '&type=TXT');
      select coalesce(array_agg(regexp_replace(regexp_replace(x->>'data', '^"|"$', '', 'g'), '"[[:space:]]+"', '', 'g')), array[]::text[])
      into v_selector_records
      from jsonb_array_elements(coalesce(v_dkim->'Answer','[]'::jsonb)) x
      where lower(regexp_replace(regexp_replace(x->>'data', '^"|"$', '', 'g'), '"[[:space:]]+"', '', 'g')) like 'v=dkim1%';
      if coalesce(array_length(v_selector_records,1),0)>0 then v_any_dkim := true; else v_all_dkim := false; end if;
      v_selector_results := v_selector_results || jsonb_build_array(jsonb_build_object('selector',v_selector,'published',coalesce(array_length(v_selector_records,1),0)>0,'records',to_jsonb(v_selector_records)));
    end loop;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','DKIM','status',case when v_all_dkim then 'PASS' when v_any_dkim then 'WARNING' else 'FAIL' end,'summary',case when v_all_dkim then 'Alle '||array_length(d.dkim_selectors,1)||' DKIM-selector(s) zijn gepubliceerd' when v_any_dkim then 'Niet alle geconfigureerde DKIM-selectors zijn gepubliceerd' else 'Geen geconfigureerde DKIM-selector resolveert' end,'details',jsonb_build_object('selectors',v_selector_results,'email_provider',d.email_provider)));
  end if;

  select production_url into v_url
  from public.websites
  where domain_id=d.id and production_url is not null and status in ('READY','LIVE')
  order by created_at limit 1;

  if v_url is not null then
    v_http_status := public.safe_http_status(v_url);
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check_type','WEBSITE','status',case when v_http_status between 200 and 399 then 'PASS' else 'FAIL' end,'summary',case when v_http_status between 200 and 399 then 'Website bereikbaar (HTTP '||v_http_status||')' when v_http_status is null then 'Website niet bereikbaar' else 'Website geeft HTTP '||v_http_status end,'details',jsonb_build_object('url',v_url,'http_status',v_http_status)));
  end if;

  for v_check in select value from jsonb_array_elements(v_checks) loop
    v_type := v_check->>'check_type';
    v_status := v_check->>'status';
    if not (v_previous ? v_type)
       or (v_previous->v_type->>'status') is distinct from v_status
       or coalesce(v_previous->v_type->'details','{}'::jsonb) is distinct from coalesce(v_check->'details','{}'::jsonb) then
      v_changes := v_changes || jsonb_build_array(jsonb_build_object('check_type',v_type,'previous_status',v_previous->v_type->>'status','current_status',v_status,'summary',v_check->>'summary'));
    end if;

    insert into public.domain_checks(domain_id,check_type,status,summary,details,checked_at)
    values(d.id,v_type,v_status,v_check->>'summary',coalesce(v_check->'details','{}'::jsonb),v_now);

    v_alert_id := null;
    select id into v_alert_id from public.monitoring_alerts where domain_id=d.id and check_type=v_type and status in ('OPEN','ACKNOWLEDGED') limit 1;
    if v_status='PASS' then
      if v_alert_id is not null then
        update public.monitoring_alerts set status='RESOLVED',resolved_at=v_now,last_seen_at=v_now,message=v_check->>'summary',details=coalesce(v_check->'details','{}'::jsonb) where id=v_alert_id;
      end if;
    else
      v_severity := case when v_status='FAIL' then 'CRITICAL' else 'WARNING' end;
      if v_alert_id is null then
        insert into public.monitoring_alerts(domain_id,check_type,severity,status,message,details,first_seen_at,last_seen_at)
        values(d.id,v_type,v_severity,'OPEN',v_check->>'summary',coalesce(v_check->'details','{}'::jsonb),v_now,v_now);
      else
        update public.monitoring_alerts set severity=v_severity,status='OPEN',message=v_check->>'summary',details=coalesce(v_check->'details','{}'::jsonb),last_seen_at=v_now,resolved_at=null where id=v_alert_id;
      end if;
    end if;
  end loop;

  v_overall := case when exists(select 1 from jsonb_array_elements(v_checks)c where c->>'status'='FAIL') then 'ERROR' when exists(select 1 from jsonb_array_elements(v_checks)c where c->>'status' in ('WARNING','UNKNOWN')) then 'WARNING' else 'HEALTHY' end;
  update public.domains set status=v_overall,last_dns_snapshot=jsonb_build_object('checks',v_checks,'source','autonomous-domain-monitor'),last_dns_snapshot_at=v_now where id=d.id;
  update public.automation_runs set status='SUCCEEDED',output=jsonb_build_object('overall_status',v_overall,'checks',v_checks,'changes',v_changes,'change_count',jsonb_array_length(v_changes)),finished_at=now() where id=v_run_id;
  return jsonb_build_object('domain',d.domain_name,'status',v_overall,'checks',v_checks,'changes',v_changes);
exception when others then
  if v_run_id is not null then update public.automation_runs set status='FAILED',error_message=sqlerrm,finished_at=now() where id=v_run_id; end if;
  raise;
end;
$$;

create or replace function public.run_domain_health_monitor()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare d record; v_results jsonb := '[]'::jsonb;
begin
  for d in select dm.id from public.domains dm join public.customers c on c.id=dm.customer_id where c.status='ACTIVE' order by dm.domain_name loop
    begin
      v_results := v_results || jsonb_build_array(public.monitor_domain_once(d.id));
    exception when others then
      v_results := v_results || jsonb_build_array(jsonb_build_object('domain_id',d.id,'status','FAILED','error',sqlerrm));
    end;
  end loop;
  return v_results;
end;
$$;

revoke all on function public.monitor_domain_once(uuid) from public, anon, authenticated;
revoke all on function public.run_domain_health_monitor() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname='vedantix-domain-health-daily';
select cron.schedule('vedantix-domain-health-daily','0 6 * * *',$$select public.run_domain_health_monitor();$$);
