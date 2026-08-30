# Vedantix monitoring notification delivery

The monitoring outbox is delivered through Migadu SMTP by the `notification-delivery` Edge Function.

## Security rules

- Never commit mailbox passwords or SMTP credentials to GitHub.
- Never paste SMTP credentials into ChatGPT or client-side configuration files.
- Migadu credentials are configured from `/admin/monitoring` by an authenticated Vedantix `ADMIN`.
- The `migadu-credentials` Edge Function validates the mailbox against Migadu SMTP before storing anything.
- Credentials are encrypted at rest in **Supabase Vault** (`migadu_smtp_user`, `migadu_smtp_password`, `vedantix_alert_email_to`, `vedantix_alert_email_from`).
- The delivery Edge Function endpoint is separately protected with an internal random 256-bit token stored in Supabase Vault.
- Postgres reads only that internal invocation token and calls the worker through `public.invoke_notification_delivery()`.
- Browser code cannot read Vault secrets and the SMTP worker never returns the configured password.

## Migadu SMTP transport

- host: `smtp.migadu.com`
- port: `465`
- security: implicit TLS
- authentication: SMTP AUTH PLAIN

The transport has been probed successfully from the Supabase Edge Runtime.

## Configuration flow

1. Open `/admin/monitoring` as an `ADMIN`.
2. Choose **Migadu instellen**.
3. Enter the Migadu mailbox and password plus optional alert recipient/sender addresses.
4. `migadu-credentials` performs a real SMTP AUTH test.
5. Only after successful authentication are the values stored in Supabase Vault.
6. The modal can send a real testmail using the stored Vault configuration without creating test alerts.
7. Close the modal; the Monitoring console refreshes and shows **Credentials: Geconfigureerd**.
8. An ADMIN explicitly enables notification delivery. Saving credentials never enables outbound alert delivery automatically.

## Runtime flow

- `notification-delivery-status` checks SMTP transport and Vault credential presence every hour.
- `vedantix-notification-delivery` runs every five minutes but returns immediately while delivery is disabled or the outbox is empty.
- Queued notifications are sent through Migadu SMTP and marked `SENT`.
- Failures are marked `FAILED` and can be re-queued by an ADMIN from `/admin/monitoring`.

The daily infrastructure monitor remains read-only. It never changes DNS, hosting or mail records automatically.
