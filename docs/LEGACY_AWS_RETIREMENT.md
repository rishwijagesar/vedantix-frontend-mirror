# Legacy AWS retirement

Statusdatum: 10 september 2026.

## Doel

De oude always-on/provisioningarchitectuur van Vedantix is vervangen door de huidige serverless stack:

- GitHub CI/CD;
- ECR `vedantix-frontend`;
- private staging Lambda (`AWS_IAM`);
- private production Lambda achter CloudFront OAC/SigV4;
- Supabase voor operationele data, auth, sales, billing, contracten en Edge Functions;
- Migadu voor e-mail;
- Mollie voor betalingen.

De huidige applicatiecode bevat geen runtime-afhankelijkheid meer op de oude DynamoDB- of App Runner-backend.

## Reeds verwijderd

- App Runner provisioning API;
- `api.vedantix.nl`;
- ECS/RDS/ELB/Elastic IP legacy compute;
- SQS `vedantix-jobs`;
- oude test-CloudFront-distributies en test-S3-buckets;
- ongebruikte ACM-certificaten en OAC's;
- oude publieke production Lambda;
- DynamoDB `vedantix-admin-users` inclusief het bijbehorende S3-backupobject, omdat dit record een legacy password hash/salt bevatte en Supabase Auth de enige geldige admin-authenticatie is.

## Actieve klanten die uit legacy data zijn overgenomen

- Nature Healing: klant-, domein- en websitekoppeling gemigreerd naar Supabase. Productie draait via AWS S3 + CloudFront.
- Jitan Sports: klant-, domein- en websitekoppeling gemigreerd naar Supabase. De live DNS-route gaf op 10 september 2026 HTTP 402 via Base44/Render en is teruggezet naar de reeds bestaande, gezonde AWS CloudFront-distributie. Root en www zijn na de wijziging op HTTP 200 gevalideerd.

Historische finance-snapshots voor deze twee klanten zijn alleen als interne legacy-notitie bewaard en zijn uitdrukkelijk niet geactiveerd als nieuwe factuur of abonnement.

Karmix en Agni zijn niet naar de actieve Supabase-klantadministratie gemigreerd.

## DynamoDB-retirementmatrix

Alle onderstaande tabellen hebben een private JSON-backup onder:

`S3://vedantix-private-backups-381492205513/legacy-dynamodb/2026-09-09/`

Alle resterende tabellen zijn getagd met:

- `vedantix:legacy=true`
- `vedantix:retire-after=2026-09-16`
- het bijbehorende backupobject

| Tabel | Items (10 sep) | Laatste inhoudelijke update | Classificatie |
| --- | ---: | --- | --- |
| `analytics_integrations` | 2 | 27 mei 2026 | Legacy statusdata; delete-candidate |
| `vedantix-audit` | 569 | 25 mei 2026 | Historische provisioning audit; backup-only na retirement |
| `vedantix-customers` | 4 | 25 mei 2026 | Actieve Nature/Jitan records gemigreerd; Karmix/Agni alleen archief |
| `vedantix-deployments` | 47 | 25 mei 2026 | Historische provisioning deployments; backup-only |
| `vedantix-finance` | 3 | 1 juni 2026 | Legacy package/finance snapshot; relevante actieve klantinfo bewaard in Supabase-notities |
| `vedantix-jobs` | 12 | 30 maart 2026 | Oude provisioning jobs; delete-candidate |
| `vedantix-online-growth-audits` | 22 | 8 september 2026 | Oude auditengine; vervangen door Supabase auditflow |
| `vedantix-operations` | 56 | 25 mei 2026 | Oude operations/provisioning history; backup-only |
| `vedantix-pricing` | 12 | 7 mei 2026 | Verouderd prijsmodel; huidige pricing staat niet in DynamoDB |

De CloudWatch-check vóór de retirementclassificatie vond geen recente writes in de overige tabellen. `vedantix-online-growth-audits` had als laatste echte legacy-writes op 8 september, vóór het verwijderen van de oude auditbackend.

## ECR

`provisioning-backend` is legacy en is getagd met:

- `vedantix:legacy=true`
- `vedantix:retire-after=2026-09-16`

De repository wordt niet gebruikt door de huidige staging- of production-Lambda. De lifecycle policy ruimt oude images verder op tot de definitieve deletion.

`vedantix-frontend` is actief en mag niet worden verwijderd.

## Vereiste checks vóór definitieve deletion

Vanaf 16 september 2026 mogen de hierboven gemarkeerde legacy-resources pas worden verwijderd wanneer alle onderstaande controles groen zijn:

1. `vedantix.nl`, `naturehealing.nl` en `jitan-sports.nl` zijn bereikbaar;
2. staging en production Lambda blijven `AWS_IAM` gebruiken;
3. ECS = 0, ELB = 0, RDS = 0, App Runner = 0, Elastic IPs = 0;
4. geen nieuwe DynamoDB write-activiteit sinds deze statusdatum;
5. voor iedere te verwijderen DynamoDB-tabel bestaat het private backupobject;
6. de huidige GitHub-code bevat geen referentie naar de legacy provisioning backend/DynamoDB;
7. commerce, contracten, billing en Mollie blijven via Supabase functioneren;
8. `provisioning-backend` wordt door geen actieve AWS-service gerefereerd.

Daarna kunnen de 9 resterende DynamoDB-tabellen en de `provisioning-backend` ECR-repository definitief worden verwijderd.

## Rollbacknotities

De oude Vedantix S3-origin blijft als expliciete website-rollbacklaag aanwezig totdat die afzonderlijk wordt uitgefaseerd.

Voor de Jitan Sports DNS-restore is de vorige root/www-config bewaard in de private backupbucket onder:

`route53/jitan-sports-before-aws-restore-20260910T1400+02.json`

Dit bestand is alleen voor noodrollback en is geen voorkeursconfiguratie: de opgeslagen Base44/Render-route gaf tijdens de cutover HTTP 402.
