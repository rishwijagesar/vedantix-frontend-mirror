create index if not exists staff_invites_invited_by_idx on public.staff_invites(invited_by);
create index if not exists staff_invites_accepted_by_idx on public.staff_invites(accepted_by);
