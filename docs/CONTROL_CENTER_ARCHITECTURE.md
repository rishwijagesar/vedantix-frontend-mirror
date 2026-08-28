# Vedantix Control Center

## Doel

Het Control Center wordt de interne operationele beheeromgeving van Vedantix. Het vervangt niet de publieke website en is bewust losgekoppeld van de oude Base44-admin/backend.

Beoogde productie-URL: `https://admin.vedantix.nl`.

## Vaste Vedantix-stack

| Verantwoordelijkheid | Standaard |
| --- | --- |
| Source control | GitHub |
| Publieke websitehosting | Lovable |
| Admin-app hosting | Lovable |
| Database / auth | Supabase/PostgreSQL |
| DNS | Los van hosting; Cloudflare-ready |
| Zakelijke e-mail | Migadu |
| Monitoring/automatisering | Vedantix Control Center |

Belangrijk principe: websitehosting, DNS en e-mail blijven afzonderlijke lagen. Een website-migratie mag geen MX/SPF/DKIM/DMARC-records wijzigen tenzij dat expliciet onderdeel van de opdracht is.

## Fase 1 - Core operations

Eerste modules:

1. Customers
2. Domains
3. Websites

### Customers

De klant is de centrale eigenaar van alle andere resources.

Minimumvelden:

- bedrijfsnaam;
- contactpersoon;
- e-mail;
- telefoon;
- status;
- interne notities.

### Domains

Per domein bewaren we:

- klant;
- domeinnaam;
- registrar;
- DNS-provider;
- e-mailprovider;
- verloopdatum / auto-renew indien beschikbaar;
- status;
- laatste DNS-snapshot.

Bij iedere toekomstige website-cutover geldt:

1. DNS snapshot maken;
2. bestaande MX/TXT/DKIM/DMARC records identificeren;
3. mailrecords beschermen;
4. uitsluitend website-records wijzigen;
5. na cutover website + mail opnieuw controleren.

### Websites

Per website bewaren we:

- klant;
- gekoppeld domein;
- GitHub repository + branch;
- Lovable project ID;
- preview-URL;
- productie-URL;
- hostingprovider;
- status;
- laatste deployment.

## Fase 2 - Domain & Email Operations

Modules:

- DNS Inspector;
- Migadu diagnostics;
- MX/SPF/DKIM/DMARC checks;
- SSL checks;
- domein-expiry monitoring;
- launch checklist;
- rollbackstatus.

Een domein krijgt een operationele status op basis van afzonderlijke health checks in `domain_checks`.

## Fase 3 - Visibility & Monitoring

Automatische controles:

- HTTP health;
- SSL;
- robots.txt;
- sitemap.xml;
- llms.txt;
- `.well-known/llms.txt`;
- structured data;
- belangrijke SEO/AEO/GEO-signalen;
- performance-baseline.

## Fase 4 - Commercial operations

Later toevoegen:

- abonnementen;
- facturen;
- betalingen;
- supporttickets;
- wijzigingsverzoeken;
- documenten;
- klantportaal.

Deze modules worden pas gebouwd wanneer het bedrijfsproces er daadwerkelijk behoefte aan heeft.

## Security

De admin-app mag niet publiek bruikbaar worden voordat authenticatie en autorisatie zijn ingericht.

Doelmodel:

- Supabase Auth;
- RLS op alle operationele tabellen;
- standaard geen publieke policies;
- admin-/staffrollen;
- audit trail voor geautomatiseerde en handmatige wijzigingen;
- provider-secrets uitsluitend server-side opslaan;
- geen DNS- of e-mailwijziging zonder expliciete bevestiging en auditrecord.

## Integraties

Geplande providers:

- GitHub;
- Lovable;
- Migadu;
- DNS-provider, bij voorkeur Cloudflare waar passend;
- later Search Console / analytics;
- later facturatieprovider.

`integrations` bevat alleen providerreferenties en metadata. API tokens/secrets worden niet als plaintext records in deze tabel opgeslagen.

## Automatiseringsprincipe

Automatiseringen zijn controleerbare runs, geen verborgen achtergrondmagie.

Elke run krijgt:

- type;
- gekoppelde klant/domein/website;
- input;
- status;
- output;
- foutmelding;
- start/eindtijd.

Daarmee kan het Control Center later rapporteren wat het zelfstandig heeft gecontroleerd of uitgevoerd.

## Eerste releasecriteria

Control Center v0.1 is klaar wanneer:

- authenticatie actief is;
- Customers CRUD werkt;
- Domains CRUD werkt;
- Websites CRUD werkt;
- relaties correct worden opgeslagen;
- RLS actief en getest is;
- nul demo-data aanwezig is;
- een domein een read-only DNS-healthscan kan krijgen;
- een website aan een Lovable-project en GitHub-repo gekoppeld kan worden.

## Bootstrapstatus augustus 2026

Voor de eerste admin-activatie mag `/admin` tijdelijk op de bestaande Lovable mirror-testhost draaien. Dit verandert niet de live AWS-hosting van `vedantix.nl`.

Huidige technische status:

- Supabase Auth + staff allowlist actief;
- rollen `ADMIN`, `OPERATOR`, `READ_ONLY`;
- RLS op alle operationele tabellen;
- security advisors zonder findings;
- Customers, Domains en Websites CRUD-laag aanwezig;
- `domain-health-scan` Edge Function actief met JWT-verificatie;
- A/AAAA, MX, SPF, DMARC en per-domein DKIM-selectors worden gecontroleerd;
- `domain_latest_checks` gebruikt alleen de nieuwste healthstatus per checktype;
- Vedantix staat als eerste echte klant in de database;
- `vedantix.nl` staat geregistreerd met Route 53, Migadu, Lovable en pre-cutover AWS/CloudFront rollbackgegevens;
- Migadu DKIM-selectors voor `vedantix.nl`: `key1`, `key2`, `key3`.

Na bootstrap hoort het Control Center alsnog als aparte app/repository op `admin.vedantix.nl` te draaien.
