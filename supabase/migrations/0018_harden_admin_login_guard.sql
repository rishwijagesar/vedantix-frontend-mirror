revoke all on function public.can_request_admin_login(text) from public, anon, authenticated;
grant execute on function public.can_request_admin_login(text) to service_role;
