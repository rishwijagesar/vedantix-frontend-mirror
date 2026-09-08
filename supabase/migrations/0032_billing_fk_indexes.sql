-- Vedantix billing performance hardening
-- Add covering indexes for foreign keys reported by Supabase advisor.

create index if not exists billing_email_outbox_created_by_idx
  on public.billing_email_outbox(created_by)
  where created_by is not null;

create index if not exists invoice_payments_created_by_idx
  on public.invoice_payments(created_by)
  where created_by is not null;

create index if not exists invoice_payments_voided_by_idx
  on public.invoice_payments(voided_by)
  where voided_by is not null;

create index if not exists payment_requests_created_by_idx
  on public.payment_requests(created_by)
  where created_by is not null;

create index if not exists subscriptions_created_by_idx
  on public.subscriptions(created_by)
  where created_by is not null;
