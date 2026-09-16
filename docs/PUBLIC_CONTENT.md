# Website content

The product catalog is the source for public prices. Save a price in Admin > Facturatie > Catalogus; active products with **Op website** appear automatically. Main prices are excluding VAT and the inclusive amount is shown alongside. Existing public rates have been preserved; formerly fixed advertised services now have catalog records.

Categories: WEBSITE (website packages), GROWTH (growth services), HOSTING (hosting), others (extensions). The public RPC exposes only an allowlist of fields, never operational metadata. Public product reads have no response cache; active pages refresh on focus, admin save in another tab, and every 30 seconds. SSR loads the same data for /prijzen; unavailable data never falls back to old prices.

Admin > **Klantcases** provides add/edit/delete, logo upload, ordering, draft/publish, and homepage/results placement. Only published cases are available to visitors; write access is restricted to ADMIN/OPERATOR by RLS. Logos use the public client-cases bucket (PNG/JPG/WebP/AVIF, max 5 MB). Uploads are public images; the case becomes visible only after publishing.

Horeca Topper and the existing Jitan Sports result were migrated from the website. No new customer has been invented.

Validation: public-content.test.tsx tests current price rendering, VAT precision, fresh fetching, failed requests, case placements/removal and escaping. db/proposals/public_content.assertions.sql tests updates, publishing, RLS and anonymous/nonstaff write rejection in a transaction that rolls back.
