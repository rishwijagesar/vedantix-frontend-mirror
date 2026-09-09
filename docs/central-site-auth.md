# Centrale Vedantix-accounts — voorbereid, nog niet geactiveerd

Nature Healing gebruikt Lovable Cloud, met onderliggend project
`arzfwbyomqvvtpswbyzl`. Dit is op 9 september 2026 bevestigd via de gekoppelde
Lovable-databasestatus en bestaande media-URL's. De database is via
`lovable_query_database` bereikbaar; gebruikersrollen en RLS zijn uitgelezen.
Dit project verschijnt niet in de eigen Supabase-projectlijst. Er is dus geen
nieuwe Supabase-projectkoppeling nodig om de bestaande database te inspecteren.

Vedantix heeft een eigen, beheerbaar project `zxnexwqvoznmirajhgxj`. De bestaande
Nature Healing Edge Function moet via een ondersteunde Lovable Cloud-deploymentroute
worden toegevoegd. Die deployment en de Auth/SMTP-configuratie zijn nog niet
uitgevoerd of end-to-end getest. SQL-toegang alleen bewijst die mogelijkheden niet.

## Ontwerp

Een persoon heeft één account in Vedantix Auth, met e-mailadres als gebruikersnaam
en een eigen wachtwoord. `info@vedantix.nl` bestaat daar al als bevestigde actieve
interne admin. De SQL-proposal maakt deze bestaande gebruiker platformbeheerder
van klantwebsites. Er worden geen wachtwoorden ingesteld of gekopieerd.

`site_auth_memberships` kent een gebruiker beheerrechten op een bepaalde website
toe. Klanten krijgen geen `staff_users`-rol en dus geen interne CRM-/factuurrechten.
Alle klantrechten worden in de database gecontroleerd. Een ingetrokken lidmaatschap
wordt bij de volgende beheeraanvraag geweigerd. Sitebeheerders kunnen geen rollen
of lidmaatschappen wijzigen; platformbeheer wordt uitsluitend servermatig toegekend.

Elke klantbackend behoudt de eigen inhoud, media, formulieren en database. Zijn
`site-admin`-functie controleert eerst de centrale identiteit en actuele rechten,
en voert vervolgens uitsluitend de toegestane CMS-acties in de eigen database uit.
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
2. Genereer een migration met de beschikbare Supabase CLI (`supabase migration new`,
   eerst de help raadplegen) uit `db/proposals/central-site-auth.sql`. Pas deze toe op
   Vedantix. Nature Healing staat standaard **inactief**. De testfixture en assertions
   horen uitsluitend in een transactie die wordt teruggedraaid.
3. Publiceer de Vedantix `AdminAuthGate` op het eigen domein en configureer Auth:
   - Email/password ingeschakeld; publieke registratie uit. Bestaande staff-uitnodigingen
     controleren voor deze wijziging; nieuwe accounts via de beheerde uitnodigingsroute.
   - Minimale wachtwoordlengte 12; e-mailbevestiging en beveiligde e-mailwijziging aan.
   - Site URL: `https://vedantix.nl/admin?recover=1`.
   - Exacte toegestane recovery-redirects: `https://vedantix.nl/admin?recover=1` en
     `https://naturehealing.nl/admin/reset-password`. Geen wildcard voor klantdomeinen.
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
4. Deploy `site-admin` uit de Nature Healing-PR op de **Nature Healing-backend**.
   De lokale JWT-gateway staat uit omdat de functie centrale JWTs zelf controleert.
   De service-role key blijft uitsluitend in de lokale Edge Function-omgeving.
5. Test eerst met afzonderlijke testaccounts: platformbeheerder, klant A, klant B,
   gebruiker zonder lidmaatschap, ingetrokken lidmaatschap en anonieme bezoeker.
   Test opslaan van secties, conceptbehandelingen, verwijderen en media-upload.
   Controleer dat andere klantdata en interne Vedantix-data onbereikbaar zijn.
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

De SQL is uitgevoerd met tijdelijke fixtures en volledig teruggedraaid. Controles
voor eigen/andere/inactieve/onbekende website, zichtbaarheid, zelfpromotie, ingetrokken
klantrechten, ingetrokken platformrechten en anonieme toegang slaagden.
De gewijzigde frontend en gateway krijgen afzonderlijke tests in de gekoppelde PR.
Echte mailbezorging en de koppeling met de oude database zijn nog niet getest.

Bij terugval eerst CMS-wijzigingen pauzeren, de vorige frontend-build herstellen,
en de eerder vastgelegde lokale policies/rollen terugzetten. Laat centrale accounts
bestaan, zet de website centraal inactief, en controleer toegang opnieuw. Omdat
inhoud en uploads in dezelfde klantdatabase blijven, hoeft CMS-data niet teruggekopieerd.

Referenties: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[e-mailtemplates](https://supabase.com/docs/guides/auth/auth-email-templates),
[uitnodigingen](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail),
[Lovable Cloud versus eigen Supabase](https://docs.lovable.dev/integrations/supabase).
