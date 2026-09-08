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
