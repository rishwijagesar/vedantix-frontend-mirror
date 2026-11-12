-- Public contact enquiries. Written only by the contact-enquiry Edge Function (service role);
-- readable by staff. No anonymous access to the table itself.
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  company_name text check (company_name is null or char_length(company_name) <= 160),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  help_type text check (help_type is null or char_length(help_type) <= 120),
  message text not null check (char_length(message) between 1 and 4000),
  source_path text,
  requester_ip text,
  user_agent text,
  status text not null default 'NEW' check (status in ('NEW','HANDLED','SPAM'))
);

create index if not exists contact_enquiries_created_idx on public.contact_enquiries(created_at desc);
create index if not exists contact_enquiries_ip_created_idx on public.contact_enquiries(requester_ip, created_at desc);

alter table public.contact_enquiries enable row level security;

create policy contact_enquiries_staff_read on public.contact_enquiries
for select to authenticated using (public.is_staff());
create policy contact_enquiries_staff_update on public.contact_enquiries
for update to authenticated using (public.is_staff(array['ADMIN','OPERATOR'])) with check (public.is_staff(array['ADMIN','OPERATOR']));

revoke all on public.contact_enquiries from anon, authenticated;
grant select, update on public.contact_enquiries to authenticated;
grant select, insert, update on public.contact_enquiries to service_role;
