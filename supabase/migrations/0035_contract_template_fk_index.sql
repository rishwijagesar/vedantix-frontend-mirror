-- Cover the contracts.template_id foreign key for delete/update checks and template-scoped reads.
create index if not exists contracts_template_idx
  on public.contracts(template_id)
  where template_id is not null;
