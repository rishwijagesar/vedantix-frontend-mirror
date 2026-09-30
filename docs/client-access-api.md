# Central customer access
Prepared locally for project zxnexwqvoznmirajhgxj. No migration, deployment, invitation, Auth user mutation, credential retrieval, or email send has been executed against the live project.

## Endpoints
The browser uses supabase.functions.invoke('client-access', { body }). Every non-preflight request must carry a verified user bearer token and an exact allowed Control Center Origin. The gateway also verifies JWTs. The handler calls Auth getUser, rejects anonymous/unconfirmed identities, and checks current active staff_users.role = ADMIN. Database commands repeat that active ADMIN check. Site membership or platform-admin status alone does not authorize this API.

| action | input fields | result |
| --- | --- | --- |
| list | optional site_slug | can_manage: true; sites, members, invitations, audit |
| invite | site_slug, email, request_id | ok, invitation_id, status |
| recovery | site_slug, user_id, request_id | ok, status |
| set_membership_active | site_slug, user_id, active:boolean, request_id | ok, status: active or revoked |
| revoke | site_slug, user_id, request_id | ok, status: revoked |
| cancel_invitation | invitation_id, request_id | ok, status: revoked |

All requests also have action. UUID request_id is generated once per intentional action and reused for retries. A repeated request never sends twice. Changing the payload for an existing request ID is rejected. New send attempts require a fresh, explicit UI action. No token/link/credential is returned by the API.

Invitation statuses: sending, sent, failed, revoked, superseded. A command replay can return pending; the UI must not report pending, failed or revoked as a sent email. Supabase Auth controls OTP expiration; expires_at is null rather than claiming a made-up expiration duration. list currently returns all sites/members and newest 200 invitations/audit entries.

list sites: slug,name,origin,active.
list members: site_slug,user_id,email,active.
list invitations: id,site_slug,email,user_id,status,created_at,sent_at,expires_at.
list audit: id,actor_id,action,site_slug,user_id,invitation_id,request_id,outcome,created_at.

## Customer reset
client-password-reset is public, POST JSON {site_slug,email}. Origin must exactly match an active registered site. The server proxy should forward that site's fixed origin; no caller-supplied origin or redirect. No ADMIN token is necessary.

Known, unknown, inactive, throttled, malformed and provider-error cases return the same HTTP 200 body:
{ok:true,message:"Als dit account toegang heeft, ontvang je een e-mail om je wachtwoord opnieuw in te stellen."}

Database throttling is atomic: minimum 60 seconds and maximum 3 requests per email/hour across sites, 60 per site/hour. SMTP work runs via EdgeRuntime.waitUntil outside the response path, with a common response floor. Missing/unregistered origins receive 403. Do not call either mail action from page mount or automated checks.

## Invite and callback behavior
The database reserves a customer email identity before Auth generateLink, preventing the existing staff invitation/bootstrap triggers from enrolling it as staff. Existing confirmed accounts use recovery; new/unconfirmed accounts use invite. The verified generated user ID/email is bound server-side before delivery. No password or role metadata is supplied.

Email callback: fixed registered site origin plus /admin/accept#token_hash=...&type=invite|recovery. The OTP hash remains exclusively in the email/link. The callback frontend removes the fragment immediately, posts the hash/type/password to its server, and never logs it. The server verifies the OTP, checks current can_manage_site(site_slug), updates the password, and creates its session. Existing Auth recovery/confirmation policy governs OTP expiry.

Only successful SMTP DATA acceptance finalizes an active site membership. Cancellation/revocation wins if it races with completion. An existing active membership survives a failed resend. Revocation deactivates one site membership without deleting the shared Auth account or other site memberships. Every site request still checks live can_manage_site; a token alone cannot restore revoked access. Recovery changes the shared Auth account password, so it applies across that customer's assigned sites.

There is no accepted invitation status: Auth confirmation is not fabricated. sent means SMTP accepted delivery, not proof of reading. Cancellation of a current sent invitation also revokes its grant. Superseded invitations cannot revoke a later grant.

## Database scope and safety
The additive, re-runnable migration creates isolated customer accounts/invitations/audit tables with RLS and no anon/authenticated access, plus private command/recovery records. It does not create sites, activate Nature Healing, edit origins, create Auth users, invite anyone, or grant staff roles. The public wrappers are SECURITY INVOKER and service-role-only; privileged implementations live in client_access_private with empty search_path and explicit grants.

The migration preserves staff behavior while adding a customer early-return to the existing bootstrap_first_admin/apply_staff_invite trigger functions. Guards on staff_users, staff_invites, and site_auth_platform_admins reject every registered customer identity. Existing staff users, active staff invitations, and platform-admin identities cannot be enrolled as customers. No user_metadata authorizes anything.

No authorization rules of existing site_auth_sites/site_auth_memberships/can_manage_site are weakened. The existing Nature proxy already validates the central identity and can_manage_site('naturehealing'), with a fixed upstream. Nature Healing was inactive during read-only inspection; activate only once its central callback/adapter is ready.

The SMTP provider remains Migadu over TLS at smtp.migadu.com:465; credentials are retrieved only at runtime from existing service-only get_migadu_delivery_credentials. No credential values were fetched for this work. The mailer validates header fields, writes all bytes, has a bounded connection lifetime, and does not retry after SMTP acceptance.

A rare network/process failure between accepted email and DB finalization can leave a pending command. No automatic resend is attempted; inspect its audit/invitation state before a fresh intentional send. The handler reports uncertainty rather than success. Failed requests do not remove an already active grant.

## Validation and rollout
npm test runs HTTP handler tests with only fake delivery and an isolated PGlite/PostgreSQL schema with synthetic users. It applies the migration twice, checks service-only privileges, staff-role separation including legacy bootstrap, site isolation, immediate revocation, cancellation versus finalization, idempotence, recovery throttles, origin guards, payload allowlists, provider failures, token privacy and generic responses.

The migration file was created with Supabase CLI migration new. The deployment JSON files contain only source code and no secrets. Root should apply the migration, run security advisors, deploy both Edge functions, and run unauthenticated/invalid-origin smoke checks without mail actions. Integrate site /admin/accept first. Do not send a test invitation without a new explicit UI action from the user.

Current docs checked:
- https://supabase.com/changelog.md
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/guides/functions/auth-headers
- https://supabase.com/docs/guides/functions/background-tasks
- https://supabase.com/docs/guides/auth/redirect-urls

The current auth-headers documentation says the gateway supports legacy HS256 and asymmetric user JWTs, so client-access uses verify_jwt=true plus the independent active-ADMIN guard. Public client-password-reset uses verify_jwt=false with exact registered origins, membership lookup, throttling and generic responses.

