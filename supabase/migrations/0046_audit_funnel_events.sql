create table if not exists public.audit_funnel_events (
  id bigint generated always as identity primary key,
  event text not null check (
    event in (
      'PAGE_VIEW',
      'FORM_STARTED',
      'AUDIT_STARTED',
      'AUDIT_FAILED',
      'RESULT_VIEWED',
      'PDF_DOWNLOADED',
      'PLANNING_CLICK',
      'WHATSAPP_CLICK'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists audit_funnel_events_event_created_at_idx
  on public.audit_funnel_events (event, created_at desc);

alter table public.audit_funnel_events enable row level security;

revoke all on table public.audit_funnel_events from anon, authenticated;
revoke all on sequence public.audit_funnel_events_id_seq from anon, authenticated;

comment on table public.audit_funnel_events is
  'Privacy-minimal aggregate funnel telemetry for the public Online Groei Audit. Stores only a validated event name and server-generated timestamp.';
