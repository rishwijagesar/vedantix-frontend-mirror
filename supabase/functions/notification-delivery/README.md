# Vedantix monitoring notification delivery

The monitoring outbox is delivered through Migadu SMTP by the `notification-delivery` Edge Function.

## Security rules

- Never commit mailbox passwords or SMTP credentials to GitHub.
- Configure credentials only as Supabase project secrets.
- The Edge Function endpoint itself is protected with an internal 256-bit token stored in Supabase Vault.
- Postgres reads the Vault token and invokes the Edge Function through `public.invoke_notification_delivery()`.
- The SMTP worker never exposes the configured username or password in responses.

## Required Supabase secrets

Set these in the **Vedantix Control Center** Supabase project (`zxnexwqvoznmirajhgxj`):

- `MIGADU_SMTP_USER` — full Migadu mailbox address used for SMTP authentication, e.g. `info@vedantix.nl`.
- `MIGADU_SMTP_PASSWORD` — password for that Migadu mailbox.

Optional:

- `VEDANTIX_ALERT_EMAIL_TO` — comma-separated recipients. Defaults to `MIGADU_SMTP_USER`.
- `VEDANTIX_ALERT_EMAIL_FROM` — sender mailbox. Defaults to `MIGADU_SMTP_USER`.

Migadu SMTP transport used by the worker:

- host: `smtp.migadu.com`
- port: `465`
- security: implicit TLS
- authentication: SMTP AUTH PLAIN

## Activation flow

1. Set the required Supabase secrets.
2. `notification-delivery-status` checks SMTP transport and credential presence every hour.
3. The Control Center Monitoring page will show **Credentials: Geconfigureerd**.
4. An ADMIN can enable notification delivery from `/admin/monitoring`.
5. `vedantix-notification-delivery` runs every five minutes but returns immediately while delivery is disabled or the outbox is empty.
6. Queued notifications are sent via Migadu SMTP and marked `SENT`; failures are marked `FAILED` and can be re-queued by an ADMIN.

The daily infrastructure monitor remains read-only. It never changes DNS, hosting or mail records automatically.
