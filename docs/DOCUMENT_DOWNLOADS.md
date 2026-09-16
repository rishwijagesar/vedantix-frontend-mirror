# Document downloads

Admin > Sales & Billing > Facturen > open an invoice now includes individual invoice, customer contract and published terms PDFs, plus **Alles downloaden (ZIP)**. In Klanten > open a customer the same panel exports all invoices and contracts of that customer. Contract detail also offers a PDF download before completion, marked with the actual status; downloading never finalizes, signs or sends a contract. Save draft edits before downloading.

The invoice bundle contains the selected invoice and all of that customer's contracts. It is explicitly a customer dossier, not an inferred legal link between the invoice and a contract. The full customer bundle includes all customer invoices. Completed contracts include both signatures and the signing certificate; drafts and void contracts are labeled in filename and PDF. The archive contains an index of document statuses.

General terms are the exact existing published text, version 2026-06-01. The webpage and PDF share one content source. The download identifies the published version and does not pretend that it proves historical customer acceptance. Existing signed contracts and snapshots are unchanged. Terms PDF is public; other downloads require a verified JWT and staff role.

The billing-documents Edge function uses the caller's Supabase client for every private read, retaining RLS. No service-role client, guessed contract relation or outbound email is involved. ZIP generation fails completely if a document cannot be generated, so a partial dossier cannot look complete. Filenames are sanitized; bundles are limited to 100 records / 40 MB.

Validation includes access denial, customer-scoped queries, PDF loading, independent unzip verification, and extracting every terms paragraph from the final PDF to ensure nothing was lost.
