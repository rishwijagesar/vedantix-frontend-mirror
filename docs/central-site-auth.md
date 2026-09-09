# Centrale Vedantix-accounts — serverkoppeling gepubliceerd, login nog niet geactiveerd

Nature Healing gebruikt Lovable Cloud, met onderliggend project
`arzfwbyomqvvtpswbyzl`. Dit is op 9 september 2026 bevestigd via de gekoppelde
Lovable-databasestatus en bestaande media-URL's. De database is via
`lovable_query_database` bereikbaar; gebruikersrollen en RLS zijn uitgelezen.
Dit project verschijnt niet in de eigen Supabase-projectlijst. Er is dus geen
nieuwe Supabase-projectkoppeling nodig om de bestaande database te inspecteren.

Vedantix heeft een eigen, beheerbaar project `zxnexwqvoznmirajhgxj`. Op 9 september
zijn de native TanStack Start-serveradapter in Lovable Cloud en de centrale Edge
Function `site-admin-naturehealing` gepubliceerd. De Cloud-adapterbron is gespiegeld
onder `cloud-adapter/` in de Nature Healing-PR; de centrale proxy staat daar onder
`supabase/functions/site-admin-naturehealing/`. Het vaste productieadres is
`https://project--b1d4590e-b32a-4d79-be6e-4b6542b07bc3.lovable.app/api/public/vedantix/site-admin`.
Gebruik dit serveradres uitsluitend vanuit de centrale proxy, niet een preview-URL.
De live AWS-frontends zijn nog niet omgeschakeld; beide frontend-PRs blijven concept.

De centrale migration `20260909105333_central_site_auth` is via Supabase toegepast.
Het bestand in `supabase/migrations/` is een export van die bestaande, gecontroleerde
migrationrecord, geen verzonnen nieuwe versie. Nature Healing staat inactief;
`info@vedantix.nl` is actief platformbeheerder. Er zijn nog geen klantlidmaatschappen.

De Supabase-dashboardlogin is gelukt. Custom Auth SMTP stond uit. Afzendernaam,
afzendadres en Migadu-host zijn voorbereid, maar niet opgeslagen: automatische
browserveiligheidscontrole blokkeerde het beveiligde SMTP-inlogformulier als mogelijk
onveilig. De onvolledige instellingen zijn geannuleerd. SMTP moet rechtstreeks door
de eigenaar worden ingesteld. Templates en de nieuwe frontend zijn nog niet
geactiveerd. De Site URL is wel opgeslagen als `https://vedantix.nl/admin`, met
exacte toegestane redirects voor Vedantix-herstel en Nature Healing-herstel.
De twee bestaande staff-testredirects zijn voorlopig behouden. Er zijn geen
herstel- of uitnodigingsmails verstuurd.

De interne staff-controle had een bestaande recursieve RLS-afhankelijkheid.
Migration `20260909114349_staff_role_lookup_without_rls_recursion` is toegepast en
als werkelijk migrationrecord geëxporteerd. Een interne `SECURITY DEFINER`-helper
in het niet via Data API aangeboden schema `authz_private` leest uitsluitend de
actieve rollen van `auth.uid()`. Hij accepteert geen vrij gekozen gebruiker en
wijzigt niets. De publieke `is_staff`-functie blijft een invoker met dezelfde
interface. Dit verhelpt de recursie zonder klantaccounts staff-rechten te geven.

## Ontwerp

Een persoon heeft één account in Vedantix Auth, met e-mailadres als gebruikersnaam
en een eigen wachtwoord. `info@vedantix.nl` bestaat daar al als bevestigde actieve
interne admin. De toegepaste migration maakt deze bestaande gebruiker platformbeheerder
van klantwebsites. Er worden geen wachtwoorden ingesteld of gekopieerd.

`site_auth_memberships` kent een gebruiker beheerrechten op een bepaalde website
toe. Klanten krijgen geen `staff_users`-rol en dus geen interne CRM-/factuurrechten.
Alle klantrechten worden in de database gecontroleerd. Een ingetrokken lidmaatschap
wordt bij de volgende beheeraanvraag geweigerd. Sitebeheerders kunnen geen rollen
of lidmaatschappen wijzigen; platformbeheer wordt uitsluitend servermatig toegekend.

Elke klantbackend behoudt de eigen inhoud, media, formulieren en database. De
centrale proxy en de klantadapter controleren elk de bevestigde centrale identiteit
en actuele rechten. Daarna voert de adapter uitsluitend de toegestane CMS-acties
in de eigen database uit.
De website staat vast in de servercode. Een client kan geen andere tenant kiezen.
Een storing in de centrale toegangscontrole geeft geen toegang tot de lokale data.

Dit is één account met dezelfde inloggegevens op de aangesloten websites. Automatisch
doorschakelen tussen al ingelogde sessies op verschillende domeinen is geen onderdeel
van deze eerste koppeling. Wachtwoordherstel wijzigt het gedeelde accountwachtwoord.

## Activatievolgorde

1. Gebruik de bestaande Lovable-koppeling voor Nature Healing project
   `b1d4590e-b32a-4d79-be6e-4b6542b07bc3`. De SQL-toegang is bevestigd.
   De relevante CMS-/storage-policies staan als momentopname in de Nature Healing-PR,
   `docs/nature-healing-cloud-policies.json`. Maak vlak voor omschakeling opnieuw
   een volledige opname van policies, rollen, uitnodigingen en herstelinstellingen.
   Controleer ook conceptcontent en privégegevens. Het bestaande klantaccount is
   nog niet e-mailbevestigd; bevestig het niet administratief om onboarding over te slaan.
2. Reeds uitgevoerd: centrale migrations `20260909105333_central_site_auth` en
   `20260909114349_staff_role_lookup_without_rls_recursion`.
   Niet opnieuw toepassen. Nature Healing staat **inactief**. De testfixture en
   assertions zijn na installatie in een transactie uitgevoerd en teruggedraaid;
   daarna is gecontroleerd dat alle tijdelijke gebruikers weg zijn.
3. Publiceer de Vedantix `AdminAuthGate` op het eigen domein en configureer Auth:
   - Email/password ingeschakeld; publieke registratie uit. Bestaande staff-uitnodigingen
     controleren voor deze wijziging; nieuwe accounts via de beheerde uitnodigingsroute.
   - Minimale wachtwoordlengte 12; e-mailbevestiging en beveiligde e-mailwijziging aan.
   - Reeds opgeslagen Site URL: `https://vedantix.nl/admin`.
   - Reeds toegevoegde exacte recovery-redirects: `https://vedantix.nl/admin?recover=1`
     en `https://naturehealing.nl/admin/reset-password`. Geen wildcard voor klantdomeinen.
   - SMTP via bestaande Migadu-voorziening: `smtp.migadu.com`, TLS-poort 465,
     gebruiker/afzender `info@vedantix.nl`, afzendernaam `Vedantix`.
     Voer het SMTP-wachtwoord uitsluitend in de beveiligde backendinstellingen in.
     Het bestaande monitoring-SMTP bewijst niet dat Auth SMTP al is ingesteld.
   - Hersteltemplate: `supabase/templates/recovery.html`; onderwerp
     `Stel een nieuw wachtwoord in voor je Vedantix-account`.
   - Uitnodigingstemplate: `supabase/templates/invite.html`; onderwerp
     `Activeer je Vedantix-beheeraccount`.
   - Controleer overige ingeschakelde systeemmails op Vedantix-branding, eigen
     links en juiste afzender. Verwijder pas ongebruikte oude redirects nadat alle
     actieve staff-loginroutes zijn gecontroleerd.
4. Reeds gepubliceerd: native Cloud-adapter en centrale proxy. Beide verifiëren
   identiteit en vaste siterechten. De proxy begrenst verzoeken, verwerpt redirects
   en geeft geen providercookies of HTML door. De lokale serviceclient blijft in
   de Cloud-servermodule. De AWS-browser gebruikt alleen het centrale API-adres.
   Zie `cloud-adapter/README.md` in de Nature Healing-PR voor de exacte bronversie.
5. Test eerst met afzonderlijke testaccounts: platformbeheerder, klant A, klant B,
   gebruiker zonder lidmaatschap, ingetrokken lidmaatschap en anonieme bezoeker.
   Test opslaan van secties, conceptbehandelingen, verwijderen en media-upload.
   Controleer dat andere klantdata en interne Vedantix-data onbereikbaar zijn.
   De eigenaar heeft de tijdelijke account-/rechtenmutaties expliciet goedgekeurd.
   Daarna zijn 28 productie-API-controles geslaagd met één tijdelijk account,
   inclusief wachtwoordherstel zonder mail en volledige opruiming. Zie het rapport
   onder `docs/verification/2026-09-09-central-auth.json`. Echte mailbezorging en
   browseronboarding moeten nog worden gecontroleerd.
6. Test echte herstel- en uitnodigingsmails: afzender, SPF/DKIM, onderwerp, linkdomein,
   eerste gebruik, tweede gebruik en verlopen token. Test info@vedantix.nl zonder
   diens wachtwoord buiten het inlogformulier te delen.
7. Activeer Nature Healing in `site_auth_sites` en bouw de Nature Healing-frontend
   met `VITE_CENTRAL_ADMIN_AUTH=true`. Controleer de API-koppeling vóór productie.
   Trek bij de gecontroleerde omschakeling de oude CMS-rollen, uitnodigingen en
   oude directe lees-/schrijfrechten in. Intrekken van een sessie alleen is niet
   voldoende: oude JWTs mogen ook geen lokale adminrechten meer opleveren.
8. Herhaal de koppeling per geïnventariseerde klantwebsite. Alleen Nature Healing
   is in deze wijziging voorbereid; overige projecten zijn nog niet aangesloten.

## Klantaccounts

Gebruik servermatig `auth.admin.inviteUserByEmail` met de exacte recovery-URL van
de klantwebsite als `redirectTo`. Koppel de geretourneerde gebruiker-ID aan uitsluitend
de gewenste `site_auth_memberships`-rij. Gebruik hiervoor het geverifieerde klantadres;
leid het niet af uit domeinnaam of bedrijfsnaam. Geen gedeeld klantwachtwoord en geen
frontend-sleutel met beheerrechten. Voor bestaande centrale accounts is alleen het
lidmaatschap nodig. Wachtwoorden van oude klantaccounts worden niet uitgelezen.

## Validatie en terugval

De migration is geïnstalleerd. De assertions zijn daarna uitgevoerd met tijdelijke
fixtures en volledig teruggedraaid. Controles
voor eigen/andere/inactieve/onbekende website, zichtbaarheid, zelfpromotie, ingetrokken
klantrechten, ingetrokken platformrechten en anonieme toegang slaagden.
De security-advisor vond geen meldingen voor de nieuwe tabellen of functies.
Bestaande meldingen over andere onderdelen en uitgeschakelde wachtwoordlekcontrole
zijn niet door deze wijziging opgelost. De gewijzigde frontend en gateway hebben
afzonderlijke tests in de gekoppelde PR (27 tests geslaagd), inclusief de exact
gespiegelde Cloud-handler en centrale proxy. De Nature-build met de vlag aan slaagt.

Werkelijke HTTP-tests op beide gepubliceerde routes slagen voor ontbrekend token,
ongeldig token, verkeerde Origin en toegestane/geweigerde preflight. Vijftien
geïsoleerde Cloud-database-/uploadcontroles slagen met tijdelijke uitgeschakelde
secties, conceptbehandelingen en één PNG; alle fixtures en media zijn verwijderd.
Alleen het tijdelijke lokale testscript verving de autorisatieafhankelijkheid;
de productiecode bevat geen autorisatie-omweg. De aanvullende productietest hieronder
controleert een echt tijdelijk Auth-account. Echte mailbezorging is nog niet getest.

De staff-recursieregressietest controleert anonieme toegang, een niet-staffgebruiker,
onzichtbaarheid van staff/invites/CRM/facturen/contracten, de bestaande eigenaar,
een tijdelijke operator, verkeerde rollen en ingetrokken operatorrechten.
De assertions staan in `db/proposals/staff-role-lookup.assertions.sql` en draaien
uitsluitend binnen een teruggedraaide transactie. Alle controles slagen.

De eerste productietest werd vóór uitvoering door automatische goedkeuringscontrole
geblokkeerd. De eigenaar heeft daarna expliciet toestemming gegeven voor één
tijdelijk account, site-/platformrechten, korte Nature Healing-activatie en opruiming.
De uitgevoerde testfunctie had een geheime eenmalige toegangssleutel en vervaltijd.
De servicekey, wachtwoorden en herstelcode bleven uitsluitend servermatig.

Alle 28 API-controles slaagden: echte email/password-authenticatie, bevestigde
identiteit, weigering zonder rechten en bij inactieve site, CMS-lezen door proxy én
Cloud-adapter, afscherming van interne staff/CRM/facturen/contracten, andere-site-
weigering, directe intrekking van klant- en platformrechten met hetzelfde JWT en
wachtwoordherstel. Alleen voor het testaccount is een herstelcode gegenereerd,
zonder mail te versturen. Eerste gebruik slaagt, hergebruik faalt, het oude
wachtwoord wordt geweigerd en het nieuwe wachtwoord werkt.

Alle negen opruimcontroles slagen. Het account, de sessies en tijdelijke rechten
zijn verwijderd, de oorspronkelijke sitestatus is teruggezet en de testfunctie
is eerst uitgeschakeld en daarna verwijderd. Een aparte SQL-controle bevestigt:
Nature Healing inactief, nul fixtures, nul klantlidmaatschappen, één bestaande
platformbeheerder en de echte eigenaar nog actief. Het JSON-rapport bevat geen
tokens of wachtwoorden. Dit verifieert de API-keten; mailbezorging en browseronboarding
zijn nog geen afgeronde controles.

De Cloud-publicatie had een dubbel inlogscherm zonder herstelknop. Zijn `/admin`
verwijst nu naar `https://naturehealing.nl/admin`, met de bestaande zichtbare link
naar `/admin/forgot-password`. Doorverwijzing en herstelformulier zijn live in de
browser gecontroleerd. De centrale loginvlag op Nature Healing blijft voorlopig uit.

Bij terugval eerst CMS-wijzigingen pauzeren, de vorige frontend-build herstellen,
en de eerder vastgelegde lokale policies/rollen terugzetten. Laat centrale accounts
bestaan, zet de website centraal inactief, en controleer toegang opnieuw. Omdat
inhoud en uploads in dezelfde klantdatabase blijven, hoeft CMS-data niet teruggekopieerd.

Referenties: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[e-mailtemplates](https://supabase.com/docs/guides/auth/auth-email-templates),
[uitnodigingen](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail),
[Lovable Cloud versus eigen Supabase](https://docs.lovable.dev/integrations/supabase).
