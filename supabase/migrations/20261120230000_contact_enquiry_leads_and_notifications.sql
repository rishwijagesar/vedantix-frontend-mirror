-- Control Center verbeteringen (20 november 2026)
-- 1. Leads & opvolging gaf "permission denied for table online_growth_audits": de staff-policy
--    bestond, maar ingelogde gebruikers hadden geen SELECT-recht op de tabel zelf.
-- 2. Elke contactaanvraag wordt automatisch een lead (bron CONTACT) in dezelfde pipeline als audits.
-- 3. Elke nieuwe contactaanvraag zet een e-mailmelding in de bestaande Migadu-wachtrij.

grant select on public.online_growth_audits to authenticated;

-- Lead vanuit een contactaanvraag ------------------------------------------------------------
create or replace function public.upsert_sales_lead_from_contact(p_enquiry_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  enquiry public.contact_enquiries%rowtype;
  customer_uuid uuid;
  lead_uuid uuid;
  company_value text;
  note_value text;
begin
  select * into enquiry from public.contact_enquiries where id = p_enquiry_id;
  if not found or enquiry.status = 'SPAM' then return null; end if;

  company_value := coalesce(nullif(trim(coalesce(enquiry.company_name, '')), ''), enquiry.name);

  select id into customer_uuid
  from public.customers
  where lower(coalesce(email, '')) = lower(enquiry.email)
  order by created_at asc
  limit 1;

  if customer_uuid is null then
    insert into public.customers(company_name, contact_name, email, phone, status, notes)
    values (company_value, enquiry.name, lower(enquiry.email), enquiry.phone, 'LEAD',
            'Automatisch aangemaakt vanuit het contactformulier.')
    returning id into customer_uuid;
  else
    update public.customers
       set contact_name = coalesce(contact_name, enquiry.name),
           phone = coalesce(phone, enquiry.phone),
           updated_at = now()
     where id = customer_uuid;
  end if;

  select id into lead_uuid
  from public.sales_leads
  where customer_id = customer_uuid
    and stage not in ('WON', 'LOST')
  order by created_at desc
  limit 1;

  if lead_uuid is null then
    insert into public.sales_leads(customer_id, source, stage, created_at, updated_at)
    values (customer_uuid, 'CONTACT', 'NEW', enquiry.created_at, now())
    returning id into lead_uuid;
  else
    update public.sales_leads set updated_at = now() where id = lead_uuid;
  end if;

  note_value := concat_ws(E'\n',
    'Contactaanvraag' || coalesce(' — ' || nullif(enquiry.help_type, ''), ''),
    enquiry.message,
    case when enquiry.phone is not null then 'Telefoon: ' || enquiry.phone end,
    case when enquiry.source_path is not null then 'Bron: ' || enquiry.source_path end);

  insert into public.sales_lead_activities(lead_id, activity_type, body, metadata)
  values (lead_uuid, 'NOTE', left(note_value, 4000),
          jsonb_build_object('contact_enquiry_id', enquiry.id, 'help_type', enquiry.help_type));

  return lead_uuid;
end;
$$;

revoke all on function public.upsert_sales_lead_from_contact(uuid) from public, anon, authenticated;
grant execute on function public.upsert_sales_lead_from_contact(uuid) to service_role;

-- E-mailmelding via de bestaande monitoring-wachtrij -----------------------------------------
alter table public.monitoring_notifications drop constraint if exists monitoring_notifications_event_type_check;
alter table public.monitoring_notifications add constraint monitoring_notifications_event_type_check
  check (event_type in ('ALERT_OPENED', 'ALERT_RESOLVED', 'CONTACT_ENQUIRY'));

create or replace function public.contact_enquiry_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_uuid uuid;
begin
  if new.status = 'SPAM' then return new; end if;

  -- Een fout bij het aanmaken van de lead mag de aanvraag zelf nooit laten mislukken.
  begin
    lead_uuid := public.upsert_sales_lead_from_contact(new.id);
  exception when others then
    lead_uuid := null;
  end;

  insert into public.monitoring_notifications(event_type, channel, status, payload)
  values ('CONTACT_ENQUIRY', 'MIGADU_SMTP', 'QUEUED', jsonb_build_object(
    'enquiry_id', new.id,
    'lead_id', lead_uuid,
    'name', new.name,
    'company_name', new.company_name,
    'email', new.email,
    'phone', new.phone,
    'help_type', new.help_type,
    'message', left(new.message, 2000),
    'source_path', new.source_path,
    'created_at', new.created_at));

  return new;
end;
$$;

revoke all on function public.contact_enquiry_after_insert() from public, anon, authenticated;

drop trigger if exists contact_enquiry_lead_and_notify on public.contact_enquiries;
create trigger contact_enquiry_lead_and_notify
after insert on public.contact_enquiries
for each row execute function public.contact_enquiry_after_insert();
