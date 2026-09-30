# Gedeeld Vedantix-websitebeheer

## Eén basis, afzonderlijke websites

`packages/website-admin-core` is de canonieke bron van `@vedantix/website-admin-core`.
Versie 0.2.0 levert een uniforme React 18/19-beheerschil en `WebsiteAdminLogin`:
gegroepeerde navigatie, mobiel menu, website- en accountidentiteit, en ruimte voor
meldingen en bewaaracties.
Alle stijlen zijn gescopeerd; de blauwe Vedantix-presentatie wordt via CSS-variabelen
ingesteld. Het pakket bevat geen router, authenticatieclient of CMS-database.

Beide klantwebsites gebruiken dezelfde met `npm pack` gemaakte archive onder
`vendor/vedantix-website-admin-core-0.2.0.tgz`, als `file:`-dependency met lockfile.
Een nieuwe versie wordt bewust per website uitgerold. Hierdoor kan de gedeelde
schil verbeteren zonder klantdatabases of bestaande editors gelijk te trekken.

`SiteAdminManifest` beschrijft de website en beschikbare modules. `AdminModule`
voegt de UI-iconen toe. De website bepaalt welke editor bij een module hoort en
geeft die als `children` door aan `WebsiteAdminShell`. Nieuwe modules worden aan
het manifest en de site-adapter toegevoegd, zonder een eigen kopie van de schil.
`WebsiteAdminDataAdapter<Snapshot, Change>` is het generieke contract voor lezen
en bewaren; concrete adapters behouden hun bestaande validatie, media, versies
en datamodel. Zichtbaarheid in het menu is geen autorisatiecontrole.

## Klanttoegang en interne rechten

Het interne Control Center krijgt een aparte pagina **Klanttoegang** onder
**Websites & e-mail**, via `/admin?section=customer-access`.
Deze pagina gebruikt de centrale `client-access`-functie voor het overzicht,
uitnodigen, toegangsintrekking, herstelmail en uitnodigingsintrekking.
Een e-mail wordt uitsluitend na een expliciete bevestiging met website en
ontvanger aangevraagd; laden van de pagina verstuurt niets. Elke bewuste actie
krijgt een request-ID. Een retry na een onzekere verbinding gebruikt dezelfde ID.
De UI onderscheidt verstuurd, nog in behandeling en mislukt.

Klanten horen uitsluitend bij `site_auth_memberships`. De bestaande
`staff_users` en `staff_invites` blijven bedoeld voor interne medewerkers; de
klantmodule schrijft daar niet naartoe. De backend controleert de identiteit en
bevoegdheid opnieuw. Iedere klantbackend controleert het vaste website-ID en de
actuele centrale toegang, ook wanneer de browser nog een geldig token heeft.
Rechten intrekken mag dus niet afhankelijk zijn van alleen een verborgen menu.
De centrale API en beveiligingsdetails staan in [client-access-api.md](client-access-api.md).

Bestaande klantaccounts en wachtwoorden blijven bij hun bestaande authenticatieprovider.
De gewone klantlogin gebruikt expliciet die provider. Nature Healing behoudt zo de
bestaande lokale klantlogin; een aparte zichtbare keuze **Vedantix-beheerder** gebruikt
het centrale account. Dezelfde gedeelde component verzorgt beide schermen. Er is geen
automatische poging met hetzelfde wachtwoord bij meerdere providers, accountmigratie,
nieuwe login-wachtwoordlengte-eis of onzichtbare omschakeling. De adapter levert ook de
bijbehorende bestaande herstel- en activatieroutes.

Sessies blijven per domein en provider gescheiden; dit is geen automatische SSO.
Herstel wijzigt het wachtwoord bij de expliciet gekozen provider. Intrekken van een
centrale websitekoppeling wijzigt uitsluitend de centrale toegang tot die website.

## Centrale loginpresentatie

De logincomponent gebruikt één publieke presentatiebron:
`https://vedantix.nl/api/public/website-admin-login`. De centrale bronconfiguratie
staat in `src/lib/website-admin-login-presentation.ts`; de HTTP-handler staat in
`src/lib/website-admin-login.server.ts`. Dezelfde pure validator uit het corepakket
controleert serverconfiguratie en ontvangen clientgegevens.

De versie-1 JSON bevat uitsluitend gewone tekst, de lay-outkeuze `split` of
`centered`, twee hexkleuren en een begrensde hoekradius. Onbekende velden, HTML,
URLs, CSS-expressies en slecht leesbare kleurcombinaties worden geweigerd. Er is
geen centraal veld voor scripts, links, providers, invoervelden of zichtbaarheid
van authenticatieknoppen. Klantidentiteit en authenticatie komen uitsluitend uit
de lokale website-adapter.

De client toont meteen de ingebouwde blauwe presentatie. De achtergrondaanvraag
gebruikt geen cookies of referrer, volgt geen redirects, heeft een limiet van
4096 bytes en stopt na drie seconden. Bij fouten blijft inloggen beschikbaar met
de ingebouwde vormgeving. Als iemand al focus heeft, typt of klikt, wijzigt een
laat binnengekomen antwoord de actieve vormgeving niet.

Na publicatie van een centrale presentatiewijziging gebruiken aangesloten
0.2.0-websites deze bij een volgend bezoek, zodra hun publiek gecachte antwoord
verouderd is (maximaal 60 seconden cache). Open formulieren worden niet actief
ververst. De pakketarchieven veranderen niet automatisch. Nieuwe componenten,
interacties of technische functies vergen nog altijd een nieuwe pakketversie.

## Gecontroleerde uitrol van nieuwe pakketversies

Voor een structurele wijziging wordt één archive gebouwd en getest, met dezelfde
checksum in alle websites. Een klein uitroloverzicht houdt website, repository
of Sites-project, pakketversie, releasecommit en publicatiestatus bij.
Nature Healing krijgt een gerichte dependency-/lockfilewijziging in GitHub; de
login-, account- en functiebehoudtests lopen vóór de bestaande publicatieroute.
Sobrinas krijgt hetzelfde archive via het bestaande Sites-project, met preview-
en logincontrole vóór publicatie. Oude archives blijven beschikbaar voor terugval.

Een toekomstige releasejob kan deze updatebranches en controles voorbereiden via
een beperkt bevoegde GitHub App en kortlevende installatiecredentials. Publicatie
gebruikt de bestaande geautoriseerde integratie per platform, met korte, taakgerichte
credentials waar het platform dat ondersteunt; er komen geen permanente publicatietokens
in klantcode. Volledig automatische pakketuitrol over beide platformen is daarmee
een uitbreidbare workflow, geen reeds aanwezige eigenschap van `file:`-dependencies.

## Nature Healing behouden

De Nature Healing-integratie gebruikt de huidige hoofdbranch en behoudt de
bestaande sectie-editors, behandelingen, rich text, media en overige functies.
De nieuwe schil vervangt navigatie en presentatie; hij vervangt het CMS-datamodel
niet. Geavanceerde bestaande velden mogen bij de omzetting niet verdwijnen.
De gecontroleerde inventaris en aftekenlijst staan in de Nature Healing-repository
bij `docs/website-admin-feature-parity.md`, met toelichting in `docs/uniform-admin.md`.
Deze matrix en de bestaande tests zijn de maatstaf voor functionaliteitsbehoud.

## Reikwijdte

Deze versie is een gedeelde basis voor modulaire websiteadministratie. Alleen
velden waarvoor de concrete klantwebsite een editor en adapter heeft, zijn
bewerkbaar. Statische componenten, niet-aangesloten inhoud, volledige paginabouw
en toekomstige modules worden niet automatisch bewerkbaar door dit pakket.
De invoering is daarom geen claim dat iedere website al een volledige pagebuilder
heeft. Publicatie, centrale accountactivatie en het behouden van oude beheerfuncties
moeten per website gecontroleerd worden vóór omschakeling.
