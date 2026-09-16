import { test } from "node:test";
import assert from "node:assert/strict";
import { applyContractSuggestion, buildContractSuggestion, catalogContractAmounts, currentContractValue, type ContractSource } from "../src/admin/contract-prefill.ts";

const invoice: ContractSource = {
  id: "invoice-1", kind: "invoice", customer_id: "customer-a", number: "FAC-2026-0042", title: "Website Voorbeeld",
  status: "FINALIZED", is_active: true, total_ex_vat: 540, vat_total: 113.4, total_incl_vat: 653.4, document_discount_ex_vat: 60,
  due_date: "2026-10-15", payment_reference: "PROJECT-42", notes: "Planning nog bespreken",
  items: [
    { description: "Website met contactformulier", quantity: 1, billing_type: "ONE_TIME", line_total_ex_vat: 500, line_total_incl_vat: 605 },
    { description: "Hosting en onderhoud", quantity: 2, billing_type: "MONTHLY", line_total_ex_vat: 100, line_total_incl_vat: 121 },
  ],
};
const draft = { customer_id: "customer-a", status: "DRAFT", project_name: null, variables: { revisions_included: "3", price_terms: "", project_scope: "", delivery_target: "", maintenance_terms: "" }, clauses: ["Bestaande kernclausule"], source_quote_id: null };
const normalized = (value: string) => value.replaceAll("\u00a0", " ");

test("catalog suggestions use the current VAT-inclusive price and explicitly remain a proposal", () => {
  assert.deepEqual(catalogContractAmounts(603.79, 21), { total_ex_vat: 499, vat_total: 104.79, total_incl_vat: 603.79 });
  assert.deepEqual(catalogContractAmounts(619.93, 21), { total_ex_vat: 512.34, vat_total: 107.59, total_incl_vat: 619.93 });
  const source: ContractSource = { ...invoice, kind: "catalog", status: "ACTIVE", number: "STARTER", title: "Starter — Voorbeeld", ...catalogContractAmounts(603.79, 21), document_discount_ex_vat: 0, intro_text: "Website met vijf pagina’s.", items: [] };
  const suggestion = buildContractSuggestion(source, draft.customer_id);
  assert.match(suggestion.fields.price_terms!, /Prijsvoorstel op basis van catalogusproduct STARTER/);
  assert.match(normalized(suggestion.fields.price_terms!), /Pakketprijs: € 499,00/);
  assert.doesNotMatch(suggestion.fields.price_terms!, /Betaaldatum|Betalingskenmerk/);
  assert.match(suggestion.fields.project_scope!, /vijf pagina’s/);
  assert.ok(suggestion.notes.some(note => note.includes("met de klant zijn afgesproken")));
  assert.throws(() => buildContractSuggestion({ ...source, is_active: false }, draft.customer_id));
  assert.throws(() => catalogContractAmounts(-1, 21));
});

test("uses the original document totals, line quantities, discount, VAT and payment reference", () => {
  const suggestion = buildContractSuggestion(invoice, draft.customer_id);
  const price = normalized(suggestion.fields.price_terms!);
  assert.match(price, /factuur FAC-2026-0042/);
  assert.match(price, /€ 540,00 excl\. btw \+ € 113,40 btw = € 653,40 incl\. btw/);
  assert.match(price, /2 × Hosting en onderhoud: € 100,00 excl\. btw \(€ 121,00 incl\. btw\), per maand/);
  assert.match(price, /Korting op het gehele document: € 60,00 excl\. btw/);
  assert.match(price, /Betalingskenmerk: PROJECT-42/);
  assert.match(price, /uiterlijk 15 oktober 2026/);
  assert.match(suggestion.fields.project_scope!, /Website met contactformulier/);
  assert.match(suggestion.fields.maintenance_terms!, /Hosting en onderhoud \(per maand\)/);
  assert.doesNotMatch(suggestion.fields.maintenance_terms!, /€|onbeperkt|24\/7/);
});

test("a payment date or service delivery date never becomes a promised project deadline", () => {
  const source = { ...invoice, delivery_date: "2026-10-01" };
  const suggestion = buildContractSuggestion(source, draft.customer_id);
  assert.equal(suggestion.fields.delivery_target, undefined);
  assert.equal(suggestion.fields.revisions_included, undefined);
  assert.ok(suggestion.notes.some(note => note.includes("termijn, periode of onderdeel")));
});

test("accepted quote includes its recorded terms and separates yearly from monthly prices", () => {
  const quote: ContractSource = { ...invoice, kind: "quote", number: "OFF-2026-0009", status: "ACCEPTED", intro_text: "Bouw van de afgesproken website.", terms: "50% bij aanvang, 50% bij oplevering.", items: invoice.items.map(item => ({ ...item, billing_type: "YEARLY" })) };
  const suggestion = buildContractSuggestion(quote, draft.customer_id);
  assert.match(suggestion.fields.price_terms!, /Volgens offerte OFF-2026-0009/);
  assert.match(suggestion.fields.price_terms!, /50% bij aanvang, 50% bij oplevering/);
  assert.match(suggestion.fields.price_terms!, /per jaar/);
  assert.doesNotMatch(suggestion.fields.price_terms!, /Betaaldatum|Betalingskenmerk/);
  assert.match(suggestion.fields.project_scope!, /Bouw van de afgesproken website/);
});

test("only explicitly selected fields change; source linkage, signatures and legal clauses stay intact", () => {
  const source = buildContractSuggestion(invoice, draft.customer_id);
  const custom = { ...draft, project_name: "Mijn eigen project", variables: { ...draft.variables, price_terms: "Eigen betaalregeling", delivery_target: "1 november 2026" }, signatures: ["existing"] };
  const filled = applyContractSuggestion(custom, source, ["project_scope", "maintenance_terms"]);
  assert.equal(filled.project_name, custom.project_name);
  assert.equal(filled.variables.price_terms, custom.variables.price_terms);
  assert.equal(filled.variables.delivery_target, custom.variables.delivery_target);
  assert.equal(filled.variables.revisions_included, "3");
  assert.deepEqual(filled.clauses, custom.clauses);
  assert.deepEqual(filled.signatures, custom.signatures);
  assert.equal(filled.source_quote_id, null);
  assert.equal(custom.variables.project_scope, "");
  assert.equal(currentContractValue(filled, "project_name"), "Mijn eigen project");
  assert.match(filled.variables.project_scope, /FAC-2026-0042/);
  assert.equal(applyContractSuggestion(custom, source, ["project_name"]).project_name, invoice.title);
});

test("other customers, archived or draft invoices and unaccepted quotes cannot be applied", () => {
  assert.throws(() => buildContractSuggestion(invoice, "customer-b"), /andere klant/);
  for (const status of ["DRAFT", "CREDITED", "UNKNOWN"]) assert.throws(() => buildContractSuggestion({ ...invoice, status }, draft.customer_id));
  assert.throws(() => buildContractSuggestion({ ...invoice, is_active: false }, draft.customer_id));
  for (const status of ["DRAFT", "SENT", "REJECTED", "EXPIRED"]) assert.throws(() => buildContractSuggestion({ ...invoice, kind: "quote", status }, draft.customer_id));
  assert.throws(() => applyContractSuggestion({ ...draft, customer_id: "customer-b" }, buildContractSuggestion(invoice, draft.customer_id), ["price_terms"]), /andere klant/);
  for (const status of ["FINALIZED", "SENT", "COMPLETED", "VOID"]) assert.throws(() => applyContractSuggestion({ ...draft, status }, buildContractSuggestion(invoice, draft.customer_id), ["price_terms"]), /conceptcontract/);
});

test("missing scope or recurring items remain unset with a visible explanation", () => {
  const suggestion = buildContractSuggestion({ ...invoice, items: [] }, draft.customer_id);
  assert.equal(suggestion.fields.project_scope, undefined);
  assert.equal(suggestion.fields.maintenance_terms, undefined);
  assert.ok(suggestion.notes.some(note => note.includes("geen werkzaamheden")));
  assert.ok(suggestion.notes.some(note => note.includes("geen terugkerende diensten")));
});

test("invalid amounts fail instead of silently proposing an incorrect contract price", () => {
  assert.throws(() => buildContractSuggestion({ ...invoice, total_incl_vat: NaN }, draft.customer_id), /ongeldige bedragen/);
  assert.throws(() => buildContractSuggestion({ ...invoice, total_incl_vat: 650 }, draft.customer_id), /sluiten niet aan/);
  const source = { ...invoice, items: [{ ...invoice.items[0]!, quantity: Infinity }] };
  assert.throws(() => buildContractSuggestion(source, draft.customer_id), /ongeldige bedragen/);
});

test("zero-priced work is supported without invented payment terms or fees", () => {
  const suggestion = buildContractSuggestion({ ...invoice, total_ex_vat: 0, vat_total: 0, total_incl_vat: 0, document_discount_ex_vat: 0, due_date: null, payment_reference: null, items: [] }, draft.customer_id);
  assert.match(normalized(suggestion.fields.price_terms!), /Documenttotaal: € 0,00/);
  assert.match(suggestion.fields.price_terms!, /Betalingskenmerk: FAC-2026-0042/);
  assert.doesNotMatch(suggestion.fields.price_terms!, /Betaaldatum|14 dagen|30 dagen/);
});
