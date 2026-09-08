-- Vedantix Contracts — versioned templates, immutable snapshots, signatures and audit trail

create table if not exists public.contract_sequences (
  sequence_year integer primary key,
  next_number integer not null default 1 check (next_number > 0)
);

create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.contract_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.contract_templates(id) on delete restrict,
  version_no integer not null check (version_no > 0),
  title text not null,
  intro_text text,
  clauses jsonb not null default '[]'::jsonb check (jsonb_typeof(clauses)='array'),
  variables_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(variables_schema)='object'),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique(template_id,version_no)
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  source_quote_id uuid references public.quotes(id) on delete set null,
  template_id uuid references public.contract_templates(id) on delete set null,
  template_version integer,
  status text not null default 'DRAFT' check (status in ('DRAFT','FINALIZED','VEDANTIX_SIGNED','SENT','COMPLETED','VOID')),
  title text not null default 'Overeenkomst van opdracht',
  project_name text,
  variables jsonb not null default '{}'::jsonb check (jsonb_typeof(variables)='object'),
  clauses jsonb not null default '[]'::jsonb check (jsonb_typeof(clauses)='array'),
  template_snapshot jsonb,
  company_snapshot jsonb not null,
  customer_snapshot jsonb not null,
  public_token uuid not null default gen_random_uuid() unique,
  document_hash text,
  final_pdf_hash text,
  certificate_pdf_hash text,
  finalized_at timestamptz,
  vedantix_signed_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  signer_role text not null check (signer_role in ('VEDANTIX','CLIENT')),
  signer_name text not null,
  signer_email text,
  signature_type text not null check (signature_type in ('TYPED','DRAWN')),
  signature_data text not null,
  email_verified_at timestamptz,
  document_hash text not null,
  ip_address text,
  user_agent text,
  signed_at timestamptz not null default now(),
  unique(contract_id,signer_role)
);

create table if not exists public.contract_signing_challenges (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  code_hash text not null,
  salt text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_signing_sessions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  event_type text not null check (event_type in (
    'CONTRACT_CREATED','CONTRACT_UPDATED','CONTRACT_FINALIZED','VEDANTIX_SIGNED',
    'SIGNATURE_REQUESTED','EMAIL_SENT','DOCUMENT_OPENED','OTP_REQUESTED','OTP_VERIFIED',
    'CONSENT_GIVEN','CLIENT_SIGNED','CONTRACT_COMPLETED','PDF_GENERATED','CERTIFICATE_GENERATED','VOIDED'
  )),
  actor_role text check (actor_role in ('SYSTEM','VEDANTIX','CLIENT')),
  actor_name text,
  actor_email text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contract_template_versions_template_idx on public.contract_template_versions(template_id,version_no desc);
create index if not exists contracts_customer_idx on public.contracts(customer_id,created_at desc);
create index if not exists contracts_source_quote_idx on public.contracts(source_quote_id) where source_quote_id is not null;
create index if not exists contracts_status_idx on public.contracts(status,created_at desc);
create index if not exists contract_signatures_contract_idx on public.contract_signatures(contract_id);
create index if not exists contract_challenges_contract_idx on public.contract_signing_challenges(contract_id,created_at desc);
create index if not exists contract_sessions_contract_idx on public.contract_signing_sessions(contract_id,created_at desc);
create index if not exists contract_events_contract_idx on public.contract_events(contract_id,created_at);
create index if not exists contracts_created_by_idx on public.contracts(created_by) where created_by is not null;
create index if not exists contract_templates_created_by_idx on public.contract_templates(created_by) where created_by is not null;
create index if not exists contract_template_versions_created_by_idx on public.contract_template_versions(created_by) where created_by is not null;

alter table public.contract_sequences enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contract_template_versions enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_signatures enable row level security;
alter table public.contract_signing_challenges enable row level security;
alter table public.contract_signing_sessions enable row level security;
alter table public.contract_events enable row level security;

revoke all on public.contract_sequences, public.contract_templates, public.contract_template_versions, public.contracts, public.contract_signatures, public.contract_signing_challenges, public.contract_signing_sessions, public.contract_events from anon;
revoke insert,update,delete on public.contract_sequences, public.contract_templates, public.contract_template_versions, public.contracts, public.contract_signatures, public.contract_signing_challenges, public.contract_signing_sessions, public.contract_events from authenticated;
grant select on public.contract_templates, public.contract_template_versions, public.contracts, public.contract_signatures, public.contract_events to authenticated;

create policy contract_templates_staff_read on public.contract_templates for select to authenticated using (public.is_staff());
create policy contract_template_versions_staff_read on public.contract_template_versions for select to authenticated using (public.is_staff());
create policy contracts_staff_read on public.contracts for select to authenticated using (public.is_staff());
create policy contract_signatures_staff_read on public.contract_signatures for select to authenticated using (public.is_staff());
create policy contract_events_staff_read on public.contract_events for select to authenticated using (public.is_staff());

create or replace function public.allocate_contract_number()
returns text language plpgsql security definer set search_path='' as $$
declare v_year integer:=extract(year from current_date)::integer; v_number integer;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  insert into public.contract_sequences(sequence_year,next_number) values(v_year,2)
  on conflict(sequence_year) do update set next_number=public.contract_sequences.next_number+1
  returning next_number-1 into v_number;
  return format('CON-%s-%s',v_year,lpad(v_number::text,4,'0'));
end; $$;
revoke all on function public.allocate_contract_number() from public,anon,authenticated;
grant execute on function public.allocate_contract_number() to authenticated;

create or replace function public.save_contract_template_version(
  p_template_id uuid,p_title text,p_intro_text text,p_clauses jsonb,p_variables_schema jsonb default '{}'::jsonb
)
returns integer language plpgsql security definer set search_path='' as $$
declare v_version integer;
begin
  if not public.is_staff(array['ADMIN']) then raise exception 'Admin role required'; end if;
  if jsonb_typeof(p_clauses)<>'array' then raise exception 'Clauses must be an array'; end if;
  select current_version+1 into v_version from public.contract_templates where id=p_template_id for update;
  if v_version is null then raise exception 'Template not found'; end if;
  insert into public.contract_template_versions(template_id,version_no,title,intro_text,clauses,variables_schema,created_by)
  values(p_template_id,v_version,p_title,nullif(btrim(p_intro_text),''),p_clauses,coalesce(p_variables_schema,'{}'::jsonb),auth.uid());
  update public.contract_templates set current_version=v_version,updated_at=now() where id=p_template_id;
  return v_version;
end; $$;
revoke all on function public.save_contract_template_version(uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_contract_template_version(uuid,text,text,jsonb,jsonb) to authenticated;

create or replace function public.create_contract_from_template(
  p_customer_id uuid,p_template_id uuid,p_source_quote_id uuid default null
)
returns uuid language plpgsql security definer set search_path='' as $$
declare t public.contract_templates%rowtype; v public.contract_template_versions%rowtype; q public.quotes%rowtype; v_id uuid; v_number text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into t from public.contract_templates where id=p_template_id and active=true;
  if not found then raise exception 'Active template not found'; end if;
  select * into v from public.contract_template_versions where template_id=t.id and version_no=t.current_version;
  if not found then raise exception 'Template version not found'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id) then raise exception 'Customer not found'; end if;
  if p_source_quote_id is not null then
    select * into q from public.quotes where id=p_source_quote_id;
    if not found then raise exception 'Quote not found'; end if;
    if q.customer_id<>p_customer_id then raise exception 'Quote customer mismatch'; end if;
    if q.status<>'ACCEPTED' then raise exception 'Only accepted quotes can be linked'; end if;
  end if;
  v_number:=public.allocate_contract_number();
  insert into public.contracts(contract_number,customer_id,source_quote_id,template_id,template_version,title,project_name,variables,clauses,template_snapshot,company_snapshot,customer_snapshot,created_by)
  values(
    v_number,p_customer_id,p_source_quote_id,t.id,v.version_no,v.title,
    case when p_source_quote_id is not null then q.title else null end,
    jsonb_build_object(
      'project_scope',case when p_source_quote_id is not null then coalesce(q.intro_text,q.title,'') else '' end,
      'price_terms',case when p_source_quote_id is not null then format('Volgens offerte %s, totaal EUR %s incl. btw.',q.quote_number,q.total_incl_vat) else '' end,
      'delivery_target','','revisions_included','3','maintenance_terms',''
    ),
    v.clauses,
    jsonb_build_object('template_id',t.id,'code',t.code,'name',t.name,'version',v.version_no,'title',v.title,'intro_text',v.intro_text,'variables_schema',v.variables_schema),
    public.snapshot_company_profile(),public.snapshot_customer(p_customer_id),auth.uid()
  ) returning id into v_id;
  insert into public.contract_events(contract_id,event_type,actor_role,actor_name,metadata)
  values(v_id,'CONTRACT_CREATED','VEDANTIX',auth.uid()::text,jsonb_build_object('template_version',v.version_no,'source_quote_id',p_source_quote_id));
  return v_id;
end; $$;
revoke all on function public.create_contract_from_template(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_contract_from_template(uuid,uuid,uuid) to authenticated;

create or replace function public.update_contract_draft(
  p_contract_id uuid,p_title text,p_project_name text,p_variables jsonb,p_clauses jsonb
)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  if jsonb_typeof(p_variables)<>'object' or jsonb_typeof(p_clauses)<>'array' then raise exception 'Invalid contract content'; end if;
  update public.contracts set
    title=coalesce(nullif(btrim(p_title),''),title),project_name=nullif(btrim(coalesce(p_project_name,'')),''),
    variables=p_variables,clauses=p_clauses,company_snapshot=public.snapshot_company_profile(),customer_snapshot=public.snapshot_customer(customer_id),updated_at=now()
  where id=p_contract_id and status='DRAFT';
  if not found then raise exception 'Draft contract not found'; end if;
  insert into public.contract_events(contract_id,event_type,actor_role,actor_name) values(p_contract_id,'CONTRACT_UPDATED','VEDANTIX',auth.uid()::text);
end; $$;
revoke all on function public.update_contract_draft(uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.update_contract_draft(uuid,text,text,jsonb,jsonb) to authenticated;

create or replace function public.finalize_contract(p_contract_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.contracts%rowtype; v_payload text; v_hash text;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  select * into c from public.contracts where id=p_contract_id for update;
  if not found or c.status<>'DRAFT' then raise exception 'Draft contract required'; end if;
  if jsonb_array_length(c.clauses)=0 then raise exception 'Contract has no clauses'; end if;
  v_payload:=jsonb_build_object(
    'contract_number',c.contract_number,'customer_id',c.customer_id,'source_quote_id',c.source_quote_id,
    'template_id',c.template_id,'template_version',c.template_version,'title',c.title,'project_name',c.project_name,
    'variables',c.variables,'clauses',c.clauses,'template_snapshot',c.template_snapshot,
    'company_snapshot',c.company_snapshot,'customer_snapshot',c.customer_snapshot
  )::text;
  v_hash:=encode(extensions.digest(convert_to(v_payload,'UTF8'),'sha256'),'hex');
  update public.contracts set status='FINALIZED',document_hash=v_hash,finalized_at=now(),updated_at=now() where id=c.id;
  insert into public.contract_events(contract_id,event_type,actor_role,actor_name,metadata)
  values(c.id,'CONTRACT_FINALIZED','VEDANTIX',auth.uid()::text,jsonb_build_object('document_hash',v_hash));
  return jsonb_build_object('contract_id',c.id,'document_hash',v_hash);
end; $$;
revoke all on function public.finalize_contract(uuid) from public,anon,authenticated;
grant execute on function public.finalize_contract(uuid) to authenticated;

create or replace function public.void_contract(p_contract_id uuid,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_staff(array['ADMIN']) then raise exception 'Admin role required'; end if;
  update public.contracts set status='VOID',voided_at=now(),updated_at=now() where id=p_contract_id and status<>'COMPLETED';
  if not found then raise exception 'Contract cannot be voided'; end if;
  insert into public.contract_events(contract_id,event_type,actor_role,actor_name,metadata)
  values(p_contract_id,'VOIDED','VEDANTIX',auth.uid()::text,jsonb_build_object('reason',nullif(btrim(coalesce(p_reason,'')),'')));
end; $$;
revoke all on function public.void_contract(uuid,text) from public,anon,authenticated;
grant execute on function public.void_contract(uuid,text) to authenticated;

create or replace function public.protect_contract_snapshot()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status<>'DRAFT' and (
    old.customer_id is distinct from new.customer_id or old.source_quote_id is distinct from new.source_quote_id or
    old.template_id is distinct from new.template_id or old.template_version is distinct from new.template_version or
    old.title is distinct from new.title or old.project_name is distinct from new.project_name or
    old.variables is distinct from new.variables or old.clauses is distinct from new.clauses or
    old.template_snapshot is distinct from new.template_snapshot or old.company_snapshot is distinct from new.company_snapshot or
    old.customer_snapshot is distinct from new.customer_snapshot or old.document_hash is distinct from new.document_hash
  ) then raise exception 'Finalized contract content is immutable'; end if;
  new.updated_at:=now(); return new;
end; $$;
drop trigger if exists protect_contract_snapshot_trigger on public.contracts;
create trigger protect_contract_snapshot_trigger before update on public.contracts for each row execute function public.protect_contract_snapshot();

create or replace function public.protect_contract_signature()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'Contract signatures are immutable'; end; $$;
drop trigger if exists protect_contract_signature_update on public.contract_signatures;
create trigger protect_contract_signature_update before update or delete on public.contract_signatures for each row execute function public.protect_contract_signature();

create or replace function public.protect_contract_event()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'Contract audit events are append-only'; end; $$;
drop trigger if exists protect_contract_event_update on public.contract_events;
create trigger protect_contract_event_update before update or delete on public.contract_events for each row execute function public.protect_contract_event();

-- Starter B2B template. This is a legal concept, not a promise of enforceability; review the master once with a Dutch ICT lawyer.
insert into public.contract_templates(code,name,description,current_version)
values('WEBSITE_B2B','Websiteontwikkeling B2B','Juridisch concept voor zakelijke website-opdrachten. Laat de masterversie éénmalig reviewen door een Nederlandse ICT-jurist of advocaat.',1)
on conflict(code) do nothing;

insert into public.contract_template_versions(template_id,version_no,title,intro_text,clauses,variables_schema)
select t.id,1,'Overeenkomst van opdracht — websiteontwikkeling',
'Deze overeenkomst legt de afspraken vast tussen Vedantix en de zakelijke opdrachtgever. De projectspecifieke gegevens en onderstaande bepalingen vormen samen één overeenkomst.',
jsonb_build_array(
 jsonb_build_object('key','parties','title','1. Partijen en toepasselijkheid','locked_core',true,'body','Vedantix en Opdrachtgever gaan deze overeenkomst aan voor de in dit document beschreven opdracht. Afwijkingen gelden alleen wanneer zij schriftelijk of elektronisch door beide partijen zijn bevestigd.'),
 jsonb_build_object('key','scope','title','2. Opdracht en scope','locked_core',false,'body','Vedantix voert de volgende opdracht uit: {{project_scope}}. Werkzaamheden die niet redelijkerwijs binnen deze omschrijving vallen, gelden als meerwerk.'),
 jsonb_build_object('key','client_input','title','3. Aanlevering en medewerking opdrachtgever','locked_core',true,'body','Opdrachtgever levert tijdig alle teksten, afbeeldingen, toegangen, persoonsgegevens, feedback en overige informatie aan die nodig zijn voor uitvoering. Vertraging door te late of onvolledige aanlevering verschuift overeengekomen termijnen evenredig.'),
 jsonb_build_object('key','delivery','title','4. Planning en oplevering','locked_core',false,'body','Beoogde planning/oplevering: {{delivery_target}}. Genoemde termijnen zijn streefdata tenzij uitdrukkelijk schriftelijk als fataal overeengekomen. Vedantix informeert Opdrachtgever tijdig over relevante vertraging.'),
 jsonb_build_object('key','revisions','title','5. Revisies en meerwerk','locked_core',false,'body','Inbegrepen zijn {{revisions_included}} revisierondes binnen de overeengekomen scope. Nieuwe functionaliteit, extra pagina’s, aanvullende rondes en wijzigingen na goedkeuring kunnen als meerwerk worden aangeboden of gefactureerd nadat Opdrachtgever daarmee heeft ingestemd.'),
 jsonb_build_object('key','price','title','6. Prijs, facturatie en betaling','locked_core',false,'body','Prijs- en betalingsafspraken: {{price_terms}}. Facturen dienen binnen de op de factuur vermelde betaaltermijn te worden voldaan. Bij betalingsachterstand mag Vedantix, na redelijke ingebrekestelling voor zover vereist, werkzaamheden opschorten en wettelijke handelsrente en redelijke buitengerechtelijke kosten in rekening brengen voor zover wettelijk toegestaan.'),
 jsonb_build_object('key','acceptance','title','7. Controle en acceptatie','locked_core',true,'body','Opdrachtgever controleert de oplevering binnen een redelijke termijn en meldt concrete gebreken zo volledig mogelijk. Een wens tot wijziging of uitbreiding van de overeengekomen functionaliteit is geen gebrek. Gebruikname van de website laat het recht om aantoonbare gebreken te melden onverlet.'),
 jsonb_build_object('key','third_parties','title','8. Hosting, domeinen en diensten van derden','locked_core',true,'body','Voor hosting, domeinregistratie, e-mail, betaalproviders, analyse-, AI- en andere diensten van derden kunnen aanvullende voorwaarden van die leveranciers gelden. Vedantix is niet aansprakelijk voor een storing of wijziging bij een derde die buiten de redelijke invloedssfeer van Vedantix ligt, maar zal zich redelijk inspannen om gevolgen te beperken.'),
 jsonb_build_object('key','ip','title','9. Intellectuele eigendom','locked_core',true,'body','Na volledige betaling verkrijgt Opdrachtgever de overeengekomen gebruiks- en/of overdrachtsrechten op specifiek voor Opdrachtgever vervaardigde eindresultaten voor zover die rechten bij Vedantix berusten. Reeds bestaande of generieke code, componenten, methoden, tooling, templates, knowhow en herbruikbare onderdelen van Vedantix blijven van Vedantix. Rechten van derden en open-sourcelicenties blijven onverkort gelden.'),
 jsonb_build_object('key','privacy','title','10. Privacy en beveiliging','locked_core',true,'body','Partijen verwerken persoonsgegevens overeenkomstig toepasselijke privacywetgeving. Indien Vedantix voor Opdrachtgever persoonsgegevens verwerkt in de zin van de AVG, sluiten partijen waar nodig een afzonderlijke verwerkersovereenkomst. Beide partijen nemen passende technische en organisatorische maatregelen binnen hun eigen verantwoordelijkheid.'),
 jsonb_build_object('key','liability','title','11. Aansprakelijkheid','locked_core',true,'body','Voor zover wettelijk toegestaan is Vedantix alleen aansprakelijk voor aantoonbare directe schade die het gevolg is van een toerekenbare tekortkoming. Aansprakelijkheid voor indirecte schade, gevolgschade, gederfde winst en gemiste besparingen is uitgesloten voor zover rechtsgeldig. Een eventuele aansprakelijkheidslimiet dient in de definitieve masterovereenkomst juridisch te worden gevalideerd. Uitsluitingen gelden niet waar beperking wettelijk niet is toegestaan.'),
 jsonb_build_object('key','termination','title','12. Overmacht, opschorting en beëindiging','locked_core',true,'body','Geen partij is gehouden tot nakoming voor zover deze redelijkerwijs wordt verhinderd door een omstandigheid buiten haar macht. Bij een wezenlijke tekortkoming krijgt de tekortschietende partij, voor zover redelijk en wettelijk vereist, gelegenheid om alsnog na te komen. Reeds uitgevoerde werkzaamheden en niet-restitueerbare kosten blijven verschuldigd.'),
 jsonb_build_object('key','confidentiality','title','13. Geheimhouding','locked_core',true,'body','Partijen behandelen vertrouwelijke bedrijfs-, technische en klantinformatie die zij in het kader van de opdracht ontvangen vertrouwelijk en gebruiken deze uitsluitend voor uitvoering van de overeenkomst, tenzij openbaarmaking wettelijk verplicht is.'),
 jsonb_build_object('key','esign','title','14. Elektronische communicatie en ondertekening','locked_core',true,'body','Partijen stemmen ermee in dat deze overeenkomst elektronisch kan worden aangeboden, aanvaard en ondertekend. Vedantix legt voor bewijsdoeleinden onder meer de definitieve documenthash, verificatiemomenten, ondertekeningstijdstippen en technische auditgegevens vast.'),
 jsonb_build_object('key','law','title','15. Toepasselijk recht en geschillen','locked_core',true,'body','Op deze overeenkomst is Nederlands recht van toepassing. Partijen proberen een geschil eerst in overleg op te lossen. Indien dat niet lukt, wordt het geschil voorgelegd aan de volgens de wet bevoegde Nederlandse rechter, tenzij partijen rechtsgeldig schriftelijk anders zijn overeengekomen.')
),
jsonb_build_object(
 'project_scope',jsonb_build_object('label','Projectscope','type','textarea','required',true),
 'price_terms',jsonb_build_object('label','Prijs- en betalingsafspraken','type','textarea','required',true),
 'delivery_target',jsonb_build_object('label','Beoogde oplevering','type','text','required',false),
 'revisions_included',jsonb_build_object('label','Inbegrepen revisierondes','type','number','required',true),
 'maintenance_terms',jsonb_build_object('label','Onderhoud/hosting aanvullende afspraken','type','textarea','required',false)
)
from public.contract_templates t
where t.code='WEBSITE_B2B'
and not exists(select 1 from public.contract_template_versions v where v.template_id=t.id and v.version_no=1);
