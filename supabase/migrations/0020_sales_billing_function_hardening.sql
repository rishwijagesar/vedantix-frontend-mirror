-- Internal trigger/helper functions must never be callable from the browser API.
revoke all on function public.prepare_quote() from public, anon, authenticated;
revoke all on function public.quote_items_changed() from public, anon, authenticated;
revoke all on function public.invoice_items_changed() from public, anon, authenticated;
revoke all on function public.recalculate_quote_on_discount_change() from public, anon, authenticated;
revoke all on function public.recalculate_invoice_on_discount_change() from public, anon, authenticated;

-- These three operations are intentional authenticated RPC entrypoints.
-- Each function performs its own ADMIN/OPERATOR staff check before doing work.
revoke all on function public.quote_to_invoice(uuid) from public, anon, authenticated;
grant execute on function public.quote_to_invoice(uuid) to authenticated;

revoke all on function public.finalize_invoice(uuid) from public, anon, authenticated;
grant execute on function public.finalize_invoice(uuid) to authenticated;

revoke all on function public.create_full_credit_note(uuid,text) from public, anon, authenticated;
grant execute on function public.create_full_credit_note(uuid,text) to authenticated;
