# Gedeeld Vedantix-websitebeheer

## Eén basis, afzonderlijke websites

`packages/website-admin-core` is de canonieke bron van `@vedantix/website-admin-core`.
Versie 0.1.0 levert een uniforme React 18/19-beheerschil: gegroepeerde navigatie,
mobiel menu, website- en accountidentiteit, en ruimte voor meldingen en bewaaracties.
Alle stijlen zijn gescopeerd; de blauwe Vedantix-presentatie wordt via CSS-variabelen
ingesteld. Het pakket bevat geen router, authenticatieclient of CMS-database.

Beide klantwebsites gebruiken dezelfde met `npm pack` gemaakte archive onder
`vendor/vedantix-website-admin-core-0.1.0.tgz`, als `file:`-dependency met lockfile.
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

Een klant gebruikt hetzelfde centrale e-mailadres en wachtwoord op aangesloten
websites. Sessies blijven per domein gescheiden. Dit is geen automatische SSO
tussen verschillende domeinen. Wachtwoordherstel wijzigt het accountwachtwoord;
een websitekoppeling intrekken wijzigt alleen de toegang tot die website.

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
