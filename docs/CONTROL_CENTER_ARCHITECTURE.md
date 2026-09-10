# Vedantix Control Center

## Doel

Het Control Center is de interne operationele beheeromgeving van Vedantix voor klanten, websites, domeinen, monitoring, offertes, contracten, facturen, betalingen en klantcommunicatie. Het is onderdeel van dezelfde applicatie als de publieke Vedantix-site, maar adminroutes zijn met Supabase Auth en staff-autorisatie afgeschermd.

Huidige admin-URL: `https://vedantix.nl/admin`.

## Vaste Vedantix-stack

| Verantwoordelijkheid | Huidige standaard |
| --- | --- |
| Source control | GitHub |
| CI/CD | GitHub Actions + AWS OIDC |
| Publieke websitehosting | AWS CloudFront + private Lambda |
| Admin-app hosting | Dezelfde AWS serverless runtime |
| Staging | AWS Lambda Function URL met `AWS_IAM` |
| Database / auth | Supabase/PostgreSQL |
| Serverless businesslogic | Supabase Edge Functions + RPC's |
| DNS | AWS Route 53 waar Vedantix dit beheert |
| Zakelijke e-mail | Migadu |
| Online betalingen | Mollie |
| Statische klantwebsites | S3 + CloudFront waar passend |
| Monitoring/automatisering | Vedantix Control Center + Supabase/AWS jobs |

Websitehosting, DNS en e-mail blijven afzonderlijke lagen. Een website-migratie mag geen MX/SPF/DKIM/DMARC-records wijzigen tenzij dat expliciet onderdeel van de opdracht is.

## AWS request- en releasepad

Productie:

```text
Internet
  -> Route 53
  -> CloudFront
  -> SigV4 Origin Access Control
  -> vedantix-web-production-private
```

De productie-Lambda Function URL gebruikt `AWS_IAM` en weigert directe publieke requests. CloudFront is de publieke ingang.

Staging:

```text
GitHub Actions OIDC
  -> SigV4 request
  -> vedantix-web-staging (AWS_IAM)
```

Release:

```text
main CI
  -> immutable Docker image
  -> ECR
  -> staging
  -> signed smoke tests
  -> dezelfde image naar productie
  -> CloudFront/live-domain smoke tests
  -> production-latest tag
```

De oude S3-origin van Vedantix blijft voorlopig als rollbackorigin aanwezig. Voor structurele originwijzigingen wordt eerst een CloudFront-configsnapshot in de private backupbucket opgeslagen.

## Core operations

### Customers

De klant is de centrale eigenaar van operationele en commerciële resources. Onder andere worden bedrijfsnaam, contactpersoon, e-mail, telefoon, status, adres, KVK-nummer en BTW-ID vastgelegd.

### Domains

Per domein bewaren en controleren we onder andere:

- klant;
- domeinnaam;
- registrar;
- DNS-provider;
- e-mailprovider;
- status;
- DNS-/mailhealth;
- relevante operationele metadata.

Bij website-cutovers geldt:

1. bestaande DNS-config inventariseren;
2. MX/TXT/DKIM/DMARC expliciet beschermen;
3. uitsluitend noodzakelijke webrecords wijzigen;
4. na cutover website én mail opnieuw controleren;
5. rollbackgegevens beschikbaar houden totdat de nieuwe route bewezen stabiel is.

### Websites

Per website kunnen onder andere worden bewaard:

- klant;
- gekoppeld domein;
- GitHub repository + branch;
- hosting-/providerreferenties;
- preview-URL;
- productie-URL;
- status;
- laatste deployment.

Een historisch `lovable_project_id`-veld kan voor compatibiliteit blijven bestaan. Het is geen indicatie dat de huidige Vedantix-productie door Lovable wordt gehost.

## Website previews

Customer Preview v2 gebruikt een capability-token bovenop `websites.preview_url`:

```text
Control Center
  -> website.preview_url
  -> intrekbare/vervalbare token
  -> https://vedantix.nl/preview/<token>
  -> klantpreview
```

Previewlinks zijn willekeurig, tijdelijk, intrekbaar, `noindex` en `no-referrer`. Open-count en laatste openingsmoment worden bijgehouden. Als een externe previewhost iframe-embedding beperkt, heeft de klant een expliciete knop om de preview in een nieuw tabblad te openen.

## Domain & Email Operations

De omgeving controleert onder andere:

- DNS;
- MX;
- SPF;
- DKIM;
- DMARC;
- HTTPS/websitehealth;
- operationele alerts.

Websitehealth gebruikt een HEAD-gebaseerde probe zodat de monitor alleen bereikbaarheid/status controleert en niet afhankelijk is van responsebody-decodering.

## Visibility & Audit

De Online Groei Audit draait serverless en is niet meer afhankelijk van de oude `api.vedantix.nl`/App Runner-backend. De audit rapporteert alleen gegevens die daadwerkelijk gemeten of afgeleid kunnen worden en verzint geen externe PageSpeed-, review-, backlink- of Analytics-data.

## Commercial operations

Het Control Center ondersteunt momenteel:

- productcatalogus;
- offertes;
- beveiligde offertelinks en acceptatie/afwijzing;
- versioned contracttemplates;
- elektronische ondertekening en audit trail;
- contract-PDF en signing certificate;
- facturen en creditnota's;
- deelbetalingen en immutable payment ledger;
- terugkerende facturatie;
- e-maildelivery en betaalherinneringen via Migadu;
- Mollie hosted checkout en webhooks;
- betaalresultaatpagina met server-side statuscontrole.

Een volledig getekend contract met een gekoppelde geaccepteerde offerte kan de facturatie gecontroleerd klaarzetten. Eenmalige posten worden een DRAFT-factuur; terugkerende posten worden abonnementen met automatische finalisatie uit. Er wordt door deze overdracht niets automatisch naar de klant gemaild.

## Security

Huidige uitgangspunten:

- Supabase Auth voor adminlogin;
- e-mail + wachtwoord als standaard login;
- staffrollen `ADMIN`, `OPERATOR`, `READ_ONLY` waar van toepassing;
- RLS op operationele tabellen;
- muterende RPC's voeren aanvullende staffchecks uit;
- provider-secrets uitsluitend server-side/Vault;
- productie- en staging-Lambda Function URLs gebruiken `AWS_IAM`;
- CloudFront ondertekent productie-originrequests via OAC;
- GitHub deployt met tijdelijke OIDC-credentials, niet met een vaste AWS access key;
- contract-/payment-auditdata wordt append-only opgeslagen waar bewijs/integriteit dat vereist;
- geen DNS-, e-mail-, contract-, factuur- of betaalactie zonder de daarvoor bedoelde geautoriseerde flow.

Bekend open securitypunt: Supabase Leaked Password Protection moet in de Supabase Auth-instellingen nog handmatig worden ingeschakeld; de gekoppelde beheerconnector exposeert hiervoor momenteel geen mutation.

## Integraties

Actief/relevant:

- GitHub;
- AWS;
- Supabase;
- Migadu;
- Mollie;
- DNS-provider(s) per domein;
- externe preview-/klantwebsiteproviders waar nodig.

Lovable kan nog als historische migratie-/buildcompatibiliteit en bij specifieke preview-/klantprojecten voorkomen. Het is niet de productiehosting van `vedantix.nl`.

## Automatiseringsprincipe

Automatisering blijft controleerbaar en auditbaar. Financiële/juridische workflows maken waar mogelijk eerst een concept of expliciete tussenstatus voordat een extern effect optreedt.

Voorbeelden:

- contract COMPLETED + gekoppelde geaccepteerde offerte → facturatie klaarzetten;
- factuur versturen → Migadu delivery;
- open factuur → Mollie hosted checkout;
- Mollie webhook → payment ledger + factuurstatus;
- vervallen factuur → reminderflow;
- monitoringrun → checks + alerts.

## Productiestatus september 2026

De kernomgeving is operationeel:

- `vedantix.nl` draait via CloudFront + private AWS Lambda;
- staging en productie Function URLs zijn `AWS_IAM`-afgeschermd;
- staging wordt met SigV4 gesmoketest;
- GitHub CI/CD promoveert exact dezelfde immutable image;
- Supabase Auth + staffautorisatie actief;
- Customers, Domains en Websites operationeel;
- Customer Preview v2 actief;
- Online Groei Audit serverless;
- contract/e-sign/PDF-flow actief;
- Sales & Billing actief;
- Migadu delivery/reminders actief;
- Mollie LIVE + iDEAL/webhookflow actief;
- domein-, DNS- en mailmonitoring actief;
- dure legacy AWS-runtime (ECS/RDS/ELB/App Runner) verwijderd.

De resterende werkzaamheden zijn vooral eerste echte klantvalidatie, juridisch review van de B2B-mastertemplate, handmatig inschakelen van Supabase leaked-password protection en het gefaseerd verwijderen van legacy archiefdata na de recoveryperiode.
