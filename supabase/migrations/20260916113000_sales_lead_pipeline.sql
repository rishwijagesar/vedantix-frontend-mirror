create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  source text not null default 'MANUAL' check (source in ('AUDIT','CONTACT','WHATSAPP','MANUAL','OTHER')),
  stage text not null default 'NEW' check (stage in ('NEW','CONTACT','CONVERSATION','QUOTE','WON','LOST')),
  score smallint not null default 0 check (score between 0 and 100),
  website_url text,
  latest_audit_id uuid references public.online_growth_audits(id) on delete set null,
  latest_quote_id uuid references public.quotes(id) on delete set null,
  next_follow_up_at timestamptz,
  last_contacted_at timestamptz,
  stage_updated_at timestamptz not null default now(),
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sales_leads_one_active_per_customer_idx
  on public.sales_leads(customer_id)
  where stage not in ('WON','LOST');

create index if not exists sales_leads_stage_follow_up_idx
  on public.sales_leads(stage, next_follow_up_at nulls last, updated_at desc);
create index if not exists sales_leads_latest_audit_idx on public.sales_leads(latest_audit_id);
create index if not exists sales_leads_latest_quote_idx on public.sales_leads(latest_quote_id);

create table if not exists public.sales_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads(id) on delete cascade,
  activity_type text not null check (activity_type in ('AUDIT_ATTACHED','NOTE','STAGE_CHANGED','FOLLOW_UP','CONTACTED','QUOTE_CREATED','WON','LOST')),
  body text,
  audit_id uuid references public.online_growth_audits(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sales_lead_activities_lead_created_idx
  on public.sales_lead_activities(lead_id, created_at desc);
create unique index if not exists sales_lead_activities_audit_once_idx
  on public.sales_lead_activities(audit_id)
  where activity_type = 'AUDIT_ATTACHED' and audit_id is not null;

alter table public.sales_leads enable row level security;
alter table public.sales_lead_activities enable row level security;

create policy sales_leads_staff_read on public.sales_leads
for select to authenticated using (public.is_staff());
create policy sales_leads_staff_insert on public.sales_leads
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy sales_leads_staff_update on public.sales_leads
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy sales_leads_staff_delete on public.sales_leads
for delete to authenticated using (public.is_staff(array['ADMIN']));

create policy sales_lead_activities_staff_read on public.sales_lead_activities
for select to authenticated using (public.is_staff());
create policy sales_lead_activities_staff_insert on public.sales_lead_activities
for insert to authenticated with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy sales_lead_activities_staff_update on public.sales_lead_activities
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));
create policy sales_lead_activities_staff_delete on public.sales_lead_activities
for delete to authenticated using (public.is_staff(array['ADMIN']));

create or replace function public.compute_audit_lead_score(p_results jsonb)
returns smallint
language plpgsql
immutable
set search_path = ''
as $$
declare
  score_value integer := 35;
  overall_value integer;
  critical_count integer := 0;
  important_count integer := 0;
  overall_text text;
begin
  if p_results is null then
    return 40;
  end if;

  overall_text := p_results->>'overallScore';
  if overall_text ~ '^[0-9]+$' then
    overall_value := overall_text::integer;
    if overall_value < 50 then score_value := score_value + 35;
    elsif overall_value < 70 then score_value := score_value + 25;
    elsif overall_value < 85 then score_value := score_value + 15;
    else score_value := score_value + 5;
    end if;
  else
    score_value := score_value + 5;
  end if;

  if jsonb_typeof(p_results->'priorityMatrix'->'CRITICAL') = 'array' then
    critical_count := jsonb_array_length(p_results->'priorityMatrix'->'CRITICAL');
  end if;
  if jsonb_typeof(p_results->'priorityMatrix'->'IMPORTANT') = 'array' then
    important_count := jsonb_array_length(p_results->'priorityMatrix'->'IMPORTANT');
  end if;

  score_value := score_value + least(18, critical_count * 6) + least(8, important_count * 2);
  return least(100, greatest(0, score_value))::smallint;
end;
$$;

revoke all on function public.compute_audit_lead_score(jsonb) from public, anon, authenticated;

grant execute on function public.compute_audit_lead_score(jsonb) to service_role;

create or replace function public.upsert_sales_lead_from_audit(p_audit_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_row record;
  customer_uuid uuid;
  lead_uuid uuid;
  contact_name_value text;
  company_name_value text;
  email_value text;
  website_value text;
  score_value smallint;
begin
  select id, status, request, results, created_at
    into audit_row
  from public.online_growth_audits
  where id = p_audit_id;

  if not found then return; end if;

  contact_name_value := nullif(trim(coalesce(audit_row.request->>'name','')), '');
  company_name_value := nullif(trim(coalesce(audit_row.request->>'companyName','')), '');
  email_value := nullif(lower(trim(coalesce(audit_row.request->>'email',''))), '');
  website_value := nullif(trim(coalesce(audit_row.request->>'websiteUrl','')), '');

  if email_value is null or company_name_value is null then return; end if;

  select id into customer_uuid
  from public.customers
  where lower(coalesce(email,'')) = email_value
  order by created_at asc
  limit 1;

  if customer_uuid is null then
    insert into public.customers(company_name, contact_name, email, status, notes)
    values (company_name_value, contact_name_value, email_value, 'LEAD', 'Automatisch aangemaakt vanuit Online Groei Audit.')
    returning id into customer_uuid;
  else
    update public.customers
       set contact_name = coalesce(contact_name, contact_name_value),
           company_name = case when nullif(trim(company_name),'') is null then company_name_value else company_name end,
           updated_at = now()
     where id = customer_uuid;
  end if;

  score_value := public.compute_audit_lead_score(audit_row.results);

  select id into lead_uuid
  from public.sales_leads
  where customer_id = customer_uuid
    and stage not in ('WON','LOST')
  order by created_at desc
  limit 1;

  if lead_uuid is null then
    insert into public.sales_leads(
      customer_id, source, stage, score, website_url, latest_audit_id, created_at, updated_at
    ) values (
      customer_uuid, 'AUDIT', 'NEW', score_value, website_value, audit_row.id, audit_row.created_at, now()
    ) returning id into lead_uuid;
  else
    update public.sales_leads
       set source = case when source = 'MANUAL' then 'AUDIT' else source end,
           score = score_value,
           website_url = coalesce(website_value, website_url),
           latest_audit_id = audit_row.id,
           updated_at = now()
     where id = lead_uuid;
  end if;

  insert into public.sales_lead_activities(lead_id, activity_type, audit_id, body, metadata)
  values (
    lead_uuid,
    'AUDIT_ATTACHED',
    audit_row.id,
    'Online Groei Audit gekoppeld',
    jsonb_build_object('audit_status', audit_row.status, 'score', score_value)
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.upsert_sales_lead_from_audit(uuid) from public, anon, authenticated;
grant execute on function public.upsert_sales_lead_from_audit(uuid) to service_role;

create or replace function public.sync_sales_lead_from_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.upsert_sales_lead_from_audit(new.id);
  return new;
end;
$$;

revoke all on function public.sync_sales_lead_from_audit_trigger() from public, anon, authenticated;

drop trigger if exists online_growth_audit_sales_lead_sync on public.online_growth_audits;
create trigger online_growth_audit_sales_lead_sync
after insert or update of status, results, request on public.online_growth_audits
for each row execute function public.sync_sales_lead_from_audit_trigger();

create or replace function public.sales_lead_before_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.stage is distinct from old.stage then
    new.stage_updated_at := now();
    if new.stage = 'WON' then
      new.won_at := coalesce(new.won_at, now());
      new.lost_at := null;
      new.lost_reason := null;
    elsif new.stage = 'LOST' then
      new.lost_at := coalesce(new.lost_at, now());
      new.won_at := null;
    else
      new.won_at := null;
      new.lost_at := null;
      if old.stage = 'LOST' then new.lost_reason := null; end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.sales_lead_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.sales_lead_activities(lead_id, activity_type, body, created_by, metadata)
    values (
      new.id,
      case when new.stage = 'WON' then 'WON' when new.stage = 'LOST' then 'LOST' else 'STAGE_CHANGED' end,
      case when new.stage = 'WON' then 'Lead gewonnen'
           when new.stage = 'LOST' then coalesce('Lead verloren: ' || nullif(new.lost_reason,''), 'Lead verloren')
           else 'Fase gewijzigd naar ' || new.stage end,
      auth.uid(),
      jsonb_build_object('from', old.stage, 'to', new.stage)
    );

    if new.stage = 'WON' then
      update public.customers set status = 'ACTIVE', updated_at = now() where id = new.customer_id;
    end if;
  end if;

  if new.latest_quote_id is distinct from old.latest_quote_id and new.latest_quote_id is not null then
    insert into public.sales_lead_activities(lead_id, activity_type, quote_id, body, created_by)
    values (new.id, 'QUOTE_CREATED', new.latest_quote_id, 'Offerte aangemaakt', auth.uid());
  end if;

  return new;
end;
$$;

revoke all on function public.sales_lead_after_update() from public, anon, authenticated;

drop trigger if exists sales_lead_before_update_trigger on public.sales_leads;
create trigger sales_lead_before_update_trigger
before update on public.sales_leads
for each row execute function public.sales_lead_before_update();

drop trigger if exists sales_lead_after_update_trigger on public.sales_leads;
create trigger sales_lead_after_update_trigger
after update on public.sales_leads
for each row execute function public.sales_lead_after_update();

do $$
declare audit_item record;
begin
  for audit_item in select id from public.online_growth_audits order by created_at loop
    perform public.upsert_sales_lead_from_audit(audit_item.id);
  end loop;
end;
$$;
