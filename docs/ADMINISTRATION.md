# Administratie

Route: `/admin/billing?section=administration`. Available to ADMIN staff only, enforced by RLS independently of the UI.

## Workflow

- Select a calendar quarter (Q1 January–March, Q2 April–June, Q3 July–September, Q4 October–December) or full year. Defaults to the current quarter in Europe/Amsterdam. The standard quarterly deadline is the last day of the next month; the customer's actual assigned filing period/deadline remains authoritative.
- Register purchases and supplier credits with date, supplier, invoice number, description, category, business share, VAT breakdown and evidence. Enter supplier credits as positive amounts and choose CREDIT.
- VAT is not presumed deductible. Until reviewed the deduction is zero. Foreign, reverse-charge and unknown VAT remain review items and cannot have direct input-VAT deductions in this register.
- EXPENSE contributes its business share plus non-deductible VAT to provisional result. ASSET is shown separately; depreciation is a separate expense with supporting calculation. PRIVATE/TAX/TRANSFER do not contribute to result or deductible VAT.
- Record bank/cash movements with signed amounts and optionally link purchases or sales. These records do not duplicate revenue/costs or change the existing invoice payment ledger. Sale payment status is managed under Betalingen. No bank API/import is enabled.
- Preserve original PDF/JPG/PNG/WEBP/EML/MSG/XML/TXT/CSV evidence (20 MB/file). Emails must be saved and uploaded; no mailbox access/forwarding address is configured. Evidence can link to purchase, bank movement, sale invoice or contract, or remain unlinked.
- A private Storage bucket has ADMIN SELECT/INSERT only, no overwrite/delete. A registered pending document is required before upload. READY requires a stored object with matching size. The original filename/path/hash/content metadata are immutable. Downloads verify SHA-256. Failed upload rows remain visible as PENDING; an upload whose bytes succeeded can be finalized from the UI.
- Corrections are audited; entry/bank cancellation requires a reason and retains originals. No hard-delete grants. Revision matching prevents silent stale writes. Supplier+invoice+kind and bank-account+reference unique indexes block obvious duplicate registrations.

## Reports and exports

Sales and negative sales credits are selected by their own document dates. CREDITED invoices remain included with the corresponding credit in its own quarter. Draft/inactive/test invoices and voided/test payments are excluded. Receivables and purchase balances are calculated through the period end including older documents. Supplier credits remain separate from payable balances until refunded/settled.

Downloads contain generic CSV files, all source records needed to reconcile balances, audit history and the selected period's uploaded original evidence, including later-dated evidence linked to that period's entries. Original generated sale/contract PDFs remain available through existing document downloads. The archive aborts on a missing/corrupted READY file; PENDING records are explicitly identified. Browser ZIP export is capped at 200 MB of evidence; CSV text fields are escaped against spreadsheet formula injection.

This is an administration workspace and provisional report, not a full double-entry ledger, closing balance sheet, formal tax calculation or submitted return. No guarantees of completeness can be inferred from zero warnings. The e-Boekhouden connector can export finalized sales invoices and credit notes, and individually reviewed purchases; customer payments require explicit opt-in. It does not import bookings entered directly in e-Boekhouden back into this workspace, transfer attachments or file tax returns. Reconcile both systems by supplier and invoice number before entering a purchase to avoid duplicates. No eHerkenning integration is needed to keep records; eHerkenning is authentication for government services.

Check foreign/reverse-charge VAT, KOR, private use, depreciation, year-end adjustments, accruals and personal deductions separately with the accountant/e-Boekhouden. The full-year view is not a complete income-tax return. Store basic records generally for seven years, real-estate/OSS records for ten; continuing contracts remain current before that retention clock starts. No automatic purge is scheduled. Download backups regularly; database backups alone do not back up Storage object bytes.

## Verification

`bun test scripts/administration.test.ts` covers quarter boundaries, year rollover, invoice/payment timing, credit signs, mixed VAT allocations, business share, exclusions, linked evidence and CSV injection.

CI uses a **disposable PostgreSQL 16** service to execute `scripts/administration-db.test.sql`, including migration, authorization, duplicate/amount checks, immutable history, revision checks, and original-file storage policies. Its stub auth and fixtures are only in that isolated test database. Never execute that test bootstrap against production.

## Sources checked 2026-09-17

- https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemen/administratie/
- https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/wat_administreert_u_voor_de_btw/
- https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw-aangifte-waar-moet-u-aan-denken/
- https://www.eherkenning.nl/nl
- https://supabase.com/docs/guides/storage/buckets/fundamentals
