import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260916120000_billing_first_customer_fixes.sql", "utf8");
const customerModule = fs.readFileSync("src/admin/BillingCustomersModule.tsx", "utf8");
const billingModule = fs.readFileSync("src/admin/CatalogInvoiceModulesV2.tsx", "utf8");
const invoiceLines = fs.readFileSync("src/admin/InvoiceLines.tsx", "utf8");
const app = fs.readFileSync("src/admin/SalesBillingApp.tsx", "utf8");

assert.match(migration, /add column if not exists iban text/i);
assert.match(migration, /add column if not exists price_ex_vat/i);
assert.match(migration, /sync_product_catalog_prices/);
assert.match(migration, /add column if not exists is_active boolean not null default true/i);

assert.match(customerModule, /IBAN-rekeningnummer/);
assert.match(customerModule, /normalizeIban/);

assert.match(billingModule, /Prijs excl\. btw/);
assert.match(billingModule, /price_ex_vat/);
assert.match(billingModule, /Concept verwijderen/);
assert.match(billingModule, /Inactief zetten/);
assert.match(invoiceLines, /Catalogusprijs overnemen/);
assert.match(invoiceLines, /Alle catalogusprijzen overnemen/);
assert.match(billingModule, /Toon inactieve facturen/);
assert.match(billingModule, /deleteInvoice\(/);
assert.match(billingModule, /setInvoiceActive/);

assert.match(app, /CatalogModuleV3/);
assert.match(app, /InvoicesModuleV2/);

console.log("Billing first-customer checks passed.");

