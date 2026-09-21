# Mailbox management in E-mail & DNS

ADMIN staff can connect their Migadu account email and an API key, then manage mailboxes for domains already registered in Vedantix. The API key is independently stored in Supabase Vault; the existing SMTP credentials and notification delivery are unchanged.

Available: list/create mailboxes, edit display name, reserve email and send/receive/IMAP/POP3 access, request a password invitation or manually set a password, delete with exact full-address confirmation, add a domain to Migadu with external DNS, display provider-specific DNS records, and explicitly validate/activate a domain. Invitations are sent only after the administrator explicitly confirms the recipient and submits the form.

## Setup
1. Migadu: My Account > API Keys. Create a dedicated management key with access to the intended domains.
2. Vedantix: E-mail & DNS > Mailboxen beheren. Enter account email and key.
3. Select the domain. Existing mailboxes appear immediately.
4. If missing, explicitly add the domain. Open DNS instellen, review the Route 53 preview, confirm and apply. Check AWS processing, then validate/activate with Migadu. Other DNS providers still have manual instructions.
5. Create a mailbox with the default “Klant kiest zelf via e-mail” option. Enter a reserve address outside the managed domain, confirm the recipient and submit. Migadu owns the invitation link and password entry; the administrator never receives a password or token. Manual password entry remains available as an alternative.

## Reserve contacts and password recovery

Set or change the reserve address via Aanpassen. It is written to Migadu's `password_recovery_email` and independently kept in `migadu_mailbox_contacts`. The stored contact is readable by ADMIN staff even after the provider is disconnected or the mailbox is deleted; deleting the domain itself removes its contact records. Clearing the reserve field deliberately clears the stored address. It is not a forwarding address.

Wachtwoord > Klant kiest zelf via e-mail requests a native Migadu invitation using `password_method: invitation` on the existing mailbox. Before this update the server fetches the current provider address again and rejects stale recipient confirmation. Changing the recipient and requesting an invitation are separate operations. A successful response means Migadu accepted the request, not that the recipient received it. Actual delivery and password entry still need verification when an administrator deliberately invites a real recipient; automated tests send no mail.

## Use info@ with the existing inbox

The Migadu API does not rename mailbox local parts. E-mailadres instead creates or reuses a verified identity with `password_use: mailbox`, so info@ can log in, send and receive using the existing inbox and password. Vedantix displays it as the preferred address. The admin@ mailbox remains underneath, preserving messages; no second mailbox is created, no mailbox is deleted and no messages are migrated. Occupied addresses and existing identities with different access/password settings are not overwritten. The preferred address is reverified against Migadu on reads.

Automatic Route 53 setup is supported for the three explicitly configured Vedantix, NatureHealing and Jitan Sports zones. See `aws/mail-dns/README.md` for the AWS API, authorization, conservative merge rules, audit, tests and deployment. Existing mail migration is a separate operation; conflicting MX/SPF/DKIM records block automatic setup. AWS acceptance is not presented as successful Migadu activation.

## Security and verification
- Custom Supabase getUser JWT validation plus is_staff(ADMIN) before service-client creation.
- Hostnames resolved from the authorized domains registry; fixed Migadu HTTPS origin; redirects disabled.
- No passwords or provider responses stored in audit rows, returned in mutation results, or logged.
- Server-only management Vault RPC in a private schema, public invoker wrapper restricted to service_role.
- Request IDs prevent exact request replays. Audit written before any external mutation; uncertain outcomes require refreshing before retrying.
- Password generation happens in-browser with Web Crypto; inputs clear after submission and are never persisted locally.
- Reserve contacts have RLS and ADMIN-only reads; direct browser writes are denied. Only the authorized server persists validated contacts. A provider success followed by a contact-storage failure produces a warning and never retries an invitation automatically.
- All mock API/auth tests run in CI without creating mailboxes, sending emails or changing DNS.
- Live provider end-to-end verification requires a connected management key and an explicitly chosen test recipient. Do not use SMTP credentials as an API key.

API reference: https://migadu.com/api/

