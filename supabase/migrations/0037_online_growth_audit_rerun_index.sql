create index if not exists online_growth_audits_rerun_idx
  on public.online_growth_audits(rerun_of)
  where rerun_of is not null;
