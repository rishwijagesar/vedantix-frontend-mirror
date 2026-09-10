# Vedantix

Vedantix is de publieke website en het interne Control Center voor klanten, websites, domeinen, monitoring, offertes, contracten, facturen, betalingen en klantcommunicatie.

## Source of truth

Deze repository (`rishwijagesar/vedantix-frontend-mirror`) is de huidige source of truth. Wijzigingen gaan via branch → pull request → CI → merge naar `main`.

Lovable is historisch gebruikt voor de migratie van de frontend en enkele build-/toolingcomponenten zijn nog compatibel met Lovable. Dat betekent niet dat Lovable de productiehosting is.

## Productiearchitectuur

```text
GitHub main
  -> CI
  -> immutable Docker image
  -> Amazon ECR
  -> staging Lambda
  -> signed staging smoke tests
  -> private production Lambda
  -> CloudFront
  -> https://vedantix.nl
```

De productie-Lambda Function URL gebruikt `AWS_IAM` en is niet rechtstreeks publiek bereikbaar. CloudFront ondertekent origin requests met SigV4 via Origin Access Control. Staging gebruikt eveneens `AWS_IAM`; GitHub Actions test staging met tijdelijke OIDC-credentials en SigV4.

De oude S3-origin blijft voorlopig beschikbaar als rollbackroute. Zie `docs/aws-serverless-runtime.md`.

## Backend en operationele diensten

- **Database & Auth:** Supabase/PostgreSQL
- **Serverless backend:** Supabase Edge Functions en database-RPC's
- **Zakelijke e-mail:** Migadu
- **Online betalingen:** Mollie
- **DNS / CDN / webhosting:** AWS Route 53, CloudFront en Lambda; S3 voor statische klantwebsites en rollback/assets waar passend
- **Source control / release:** GitHub + GitHub Actions + AWS OIDC

API-keys en andere gevoelige credentials horen uitsluitend server-side/Vault opgeslagen te worden en nooit in browsercode of GitHub.

## Belangrijke productflows

Het Control Center ondersteunt onder andere:

- klantenbeheer;
- domein-, DNS-, e-mail- en websitehealth;
- beveiligde websitepreviewlinks;
- Online Groei Audit;
- offertes en beveiligde offertelinks;
- versioned B2B-contracten en elektronische ondertekening;
- contract-PDF en signing certificate;
- facturen, creditnota's en deelbetalingen;
- terugkerende facturatie;
- Migadu factuur-/offertemail en herinneringen;
- Mollie hosted checkout, webhooks en payment ledger;
- geverifieerde betaalresultaatpagina's.

Financiële en juridische stappen blijven controleerbaar. Een contract of offerte kan een factuurconcept klaarzetten, maar documenten of betalingen worden niet stilzwijgend naar klanten verstuurd zonder de daarvoor bedoelde actie.

## Development

De CI gebruikt Bun. Lokaal kan de applicatie met de bestaande package scripts worden gebouwd en gestart.

```sh
git clone <this-repository-url>
cd vedantix-frontend-mirror
bun install
bun run dev
```

Voor een productiecontrole:

```sh
bun run lint
bun run build
```

## Deployment

Een geslaagde CI-run op `main` triggert de AWS deploymentworkflow. Die bouwt één immutable image, test die eerst op staging en promoveert daarna exact dezelfde image naar productie. Productie wordt na promotie via `https://vedantix.nl` gesmoketest en de bijbehorende assets worden gecontroleerd.

Wijzig productie-infrastructuur niet buiten deze flow om zonder rollbacksnapshot en expliciete verificatie van de live site.
