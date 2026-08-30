create policy monitoring_notifications_admin_update on public.monitoring_notifications
for update to authenticated
using (public.is_staff(array['ADMIN']))
with check (public.is_staff(array['ADMIN']));
