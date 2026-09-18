# Mailbox management in E-mail & DNS

ADMIN staff can connect their Migadu account email and an API key, then manage mailboxes for domains already registered in Vedantix. The API key is independently stored in Supabase Vault; the existing SMTP credentials and notification delivery are unchanged.

Available: list/create mailboxes, edit display name and send/receive/IMAP/POP3 access, set a new password, delete with exact full-address confirmation, add a domain to Migadu with external DNS, display provider-specific DNS records, and explicitly validate/activate a domain. Email addresses are immutable at Migadu; editing never renames a mailbox. No invitation emails are sent automatically.

## Setup
1. Migadu: My Account > API Keys. Create a dedicated management key with access to the intended domains.
2. Vedantix: E-mail & DNS > Mailboxen beheren. Enter account email and key.
3. Select the domain. Existing mailboxes appear immediately.
4. If missing, explicitly add the domain, then load DNS records. Apply these once at the DNS provider before activating.
5. Create a mailbox with a password saved in the owner's password manager.

Automatic Route 53 writes are not included: the AWS connection could not be established during implementation. The UI explicitly shows manual DNS setup and never claims DNS has been configured. Never overwrite live provider MX or add a second SPF record. Existing mail migration is a separate operation.

## Security and verification
- Custom Supabase getUser JWT validation plus is_staff(ADMIN) before service-client creation.
- Hostnames resolved from the authorized domains registry; fixed Migadu HTTPS origin; redirects disabled.
- No passwords or provider responses stored in audit rows, returned in mutation results, or logged.
- Server-only management Vault RPC in a private schema, public invoker wrapper restricted to service_role.
- Request IDs prevent exact request replays. Audit written before any external mutation; uncertain outcomes require refreshing before retrying.
- Password generation happens in-browser with Web Crypto; inputs clear after submission and are never persisted locally.
- All mock API/auth tests run in CI without creating mailboxes, sending emails or changing DNS.
- Live provider end-to-end verification requires the user's management key. Do not use SMTP credentials as an API key.

API reference: https://migadu.com/api/
