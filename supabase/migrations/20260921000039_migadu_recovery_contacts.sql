-- Keep reserve contacts independently of the provider mailbox lifecycle.
create table public.migadu_mailbox_contacts (
  domain_id uuid not null references public.domains(id) on delete cascade,
  local_part text not null check(length(local_part) between 1 and 64 and local_part ~ '^[a-z0-9][a-z0-9._+-]*$'),
  recovery_email text check(recovery_email is null or (length(recovery_email) between 3 and 254 and recovery_email !~ '[[:space:]]' and recovery_email ~ '^[^@]+@[^@]+[.][^@]+$')),
  preferred_local_part text check(preferred_local_part is null or (length(preferred_local_part) between 1 and 64 and preferred_local_part ~ '^[a-z0-9][a-z0-9._+-]*$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(domain_id,local_part)
);
alter table public.migadu_mailbox_contacts enable row level security;
revoke all on public.migadu_mailbox_contacts from public,anon,authenticated;
grant select on public.migadu_mailbox_contacts to authenticated;
grant select,insert,update on public.migadu_mailbox_contacts to service_role;
create policy migadu_contacts_admin_read on public.migadu_mailbox_contacts
  for select to authenticated using (public.is_staff(array['ADMIN']::text[]));
create policy migadu_contacts_service on public.migadu_mailbox_contacts
  for all to service_role using (true) with check (true);

alter table public.migadu_management_audit drop constraint migadu_management_audit_action_check;
alter table public.migadu_management_audit add constraint migadu_management_audit_action_check
  check(action in ('connect','disconnect','add_domain','activate_domain','create_mailbox','update_mailbox','reset_password','delete_mailbox','send_invitation','set_primary_address'));
