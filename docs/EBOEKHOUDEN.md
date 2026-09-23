# e-Boekhouden: reviewed accounting exports

The admin module can post finalized sales invoices, full credit notes and explicitly enabled customer payments through the official REST API. Posting uses `/mutation`, never `/invoice`: it does not issue or email a second customer invoice.

## First use

1. Connect an API token; select debtor and revenue ledger accounts.
2. Under **Facturen en betalingen overzetten**, review the first real finalized invoice and click **Bevestigen en overzetten**. The invoice number, item descriptions, finalized customer snapshot and exact amounts are used.
3. Confirm the resulting booking in e-Boekhouden. Its remote booking number appears in Vedantix.
4. Choose who records customer payments. Default **EXTERNAL** leaves payment matching to e-Boekhouden/the bank integration. **VEDANTIX** requires explicit user acknowledgement and a FIN bank/clearing ledger. Mollie gross receipts go to clearing; fees and payouts remain separate.
5. Optionally enable automatic processing. A cron job runs every five minutes and exports at most one eligible new document per invocation. `sync_from` is the activation timestamp, compared with finalization/creation time, not invoice date. Older records require individual review. Pausing/re-enabling creates a new cutoff: review documents accumulated while paused manually.

The integration remains disabled after deployment. Activation requires a successfully reviewed invoice and no unresolved journal entries. Mapping/token/payment-mode changes pause automatic processing.

## Supported accounting

- Finalized active invoices, ordinary Dutch 9% / 21% VAT, Dutch customer snapshots.
- Invoice-level discounts allocated in cents across finalized lines. If the reconstructed VAT does not exactly match the stored document, the export is blocked.
- Full credits reverse the original revenue and VAT, using their own credit number. Partial credits lack their own VAT lines in the billing model and are blocked.
- Positive BANK_TRANSFER/BANK or MOLLIE customer payments, when opted in. Each payment requires an intact previously exported invoice and sufficient remote outstanding balance.
- Test fixtures, test Mollie requests, drafts, inactive invoices and voided payments are excluded. Previously exported sources that become ineligible appear as **Wijziging controleren**.

Foreign/reverse-charge/exempt/0% VAT, cash and other unmapped payment methods, refunds, purchase entries, purchase attachments, bank imports, Mollie payouts and fees are not automatically posted. Do not describe this as a complete automatic bookkeeping or tax-filing integration. Evidence remains in the Administration workspace. The REST OpenAPI exposes no document attachment upload route. eHerkenning is not an accounting synchronization API.

## Consistency and recovery

- Service-only `ebookhouden_exports` journal, lifetime primary key `(source_kind, source_id)`, unique remote mutation ID. Disconnect/rotation never erase this journal or its administration anchor.
- Global 5-minute database lease serializes exports. Source state is revalidated atomically before the journal intent; in-flight sources cannot be modified/deleted while the lease is valid. Expired leases are recoverable, stale owners cannot finish/release a new owner's lease.
- Persist **SENDING** before an external POST. A dropped response becomes **REVIEW**, pauses automation and is never replayed automatically.
- Stable `entryNumber` and `paymentReference` (`VDX-<kind initial>-<UUID>`) plus the API's `checkPaymentReference: true` protect retry attempts. The original reviewed payload is retained across retries/token rotation.
- Search remote records before every POST. Existing unexpected invoice numbers/references block posting. Recover a lost successful response only after exact amount, row, relation, ledger, date and VAT matching. **Boeking controleren** only reads accounting mutations; **Opnieuw proberen** is an explicit user action, rechecks remote presence and uses the same uniqueness reference.
- GET the created mutation and compare VAT totals and line amounts before marking **SYNCED**. Unexpected totals retain the returned booking ID and request manual correction. No remote mutations are deleted or rewritten by this integration.
- Credit/payment exports first validate the original remote invoice. No payment is posted against a paid invoice automatically.
- Deterministic customer code `VDX` + first 12 UUID hex characters. The full UUID is stored in `freeText1` and checked on reuse. A conflicting code blocks export. This does not silently merge pre-existing manually-created customer relations by email.
- A persisted debtor ledger ID binds the connection to its original administration. Token replacements must expose that same anchor. Do not reset anchors/journals to switch an existing integration to another administration.

## Security and deployment

`ebookhouden-admin` has gateway JWT checking disabled because normal actions verify `auth.getUser()` and `is_staff(['ADMIN'])` before constructing privileged database access. Browser request bodies are bounded to 12 KB. Tokens stay in Vault; API responses/errors never expose raw upstream bodies or credentials.

Worker requests use a separately generated 256-bit Vault secret, delivered by `pg_cron` / `pg_net` to a fixed function URL. The worker secret is checked through a service-only RPC, never returned to the browser. Automation only wakes while connected and explicitly enabled. `pg_net` is transport; durable accounting state lives in the journal.

Apply the core migration, deploy all `ebookhouden-admin` modules, then apply the scheduling migration. Both migrations leave current configuration and existing billing data intact and automatic export disabled. Cron does not contact e-Boekhouden until activated.

Validation: Bun provider/auth/financial/recovery regression tests; isolated PostgreSQL grant, lease, durable-intent, stale-owner, source-guard and activation tests; frontend production build. The first actual financial POST remains an explicit user-reviewed production action.

Official API: https://api.e-boekhouden.nl/scalar/ ; schema https://api.e-boekhouden.nl/openapi/v1.json (checked 2026-09-23).
