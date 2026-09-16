# Mollie payment flow

Vedantix gebruikt Mollie alleen als payment service provider. De interne boekhouding blijft in `invoice_payments`.

## Flow

1. Publieke factuur vraagt `mollie-payment` of online betalen beschikbaar is.
2. Bij betaling maakt de Edge Function een `payment_requests` record.
3. De function maakt server-side een Mollie Payment aan via `POST /v2/payments`.
4. De klant wordt doorgestuurd naar Mollie's hosted checkout URL.
5. Mollie roept `mollie-webhook` aan bij statuswijzigingen.
6. De webhook haalt de payment opnieuw op bij Mollie en controleert ID, metadata, bedrag en valuta.
7. Alleen bij Mollie-status `paid` wordt via `register_mollie_payment_system` een immutable `invoice_payments` ledgerregel aangemaakt.
8. `sync_invoice_payment_status` zet de factuur vervolgens op `PARTIALLY_PAID` of `PAID`.

## Security

- API-key staat uitsluitend in Supabase Vault (`mollie_api_key`).
- Frontend krijgt nooit provider credentials.
- `mollie-credentials` vereist een geauthenticeerde ADMIN.
- Publieke checkout-aanmaak gebruikt het onraadbare `invoices.public_token` als capability.
- Webhooks worden niet vertrouwd als statusbron: de actuele payment wordt opnieuw bij Mollie opgehaald.
- `external_payment_id` is uniek in `invoice_payments`, waardoor webhookretries geen dubbele betaling boeken.

## Rollout

Start met een Mollie `test_...` API-key en `payment_provider_config.enabled=false`. Schakel checkout pas in nadat de testbetaling end-to-end is gevalideerd. Zet pas daarna bewust een `live_...` key in Vault.

## Factuurknop, QR en boekhouding

- PDF-preview, afdruk en PDF-bijlage bevatten een betaalknop en QR-code voor actieve, definitieve/openstaande facturen.
- Beide verwijzen naar de bestaande onraadbare factuurlink met `#betalen`. Er wordt geen tijdelijk Mollie-checkoutadres in een PDF vastgezet.
- De openbare factuur bepaalt het actuele openstaande bedrag. Concepten, inactieve, gecrediteerde en betaalde facturen kunnen geen checkout starten.
- QR-afbeeldingen worden door de eigen `invoice-payment-qr` Edge Function gegenereerd; de factuurtoken wordt niet naar een externe QR-service gestuurd. De PDF bevat de QR als vectoren.
- Mollie-omschrijving: `Factuur <factuurnummer> - Vedantix - <factuurtitel>`, maximaal 255 tekens met het factuurnummer vooraan.
- Nieuwe Mollie-boekingen bewaren het factuurnummer en een eventueel aanvullend betalingskenmerk in `invoice_payments.reference`, de omschrijving in `notes` en beide in `metadata`. Het unieke Mollie-transactienummer blijft in `external_payment_id`.
- De bank of betaalmethode kan de zichtbare omschrijving inkorten. De volledige verzonden omschrijving blijft in de betaalmetadata; uitbetalingen van Mollie naar de bank kunnen meerdere betalingen bundelen.
- Bestaande onveranderlijke boekingen en eerder opgeslagen PDF-bestanden worden niet aangepast. Download een factuur opnieuw voor de nieuwe knop en QR.

### Verificatie

CI controleert de QR met een onafhankelijke decoder, PDF-linkannotaties, gesloten facturen, deelbetalingsbedragen, lange omschrijvingen en multipage PDF's. De gerenderde PDF wordt opnieuw met ZBar gescand. Database-regressie wordt in één transactie uitgevoerd en teruggedraaid; er wordt geen klantmail verzonden of echte betaling uitgevoerd.
