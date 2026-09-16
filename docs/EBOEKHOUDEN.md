# e-Boekhouden aansluiten

Open `/admin/billing?section=accounting` als ADMIN. Maak een API-token in de instellingen van het e-Boekhouden-account en voer het in het wachtwoordveld in. **Verbinden en testen** maakt een tijdelijke API-sessie, leest alle grootboekrekeningen en sluit de sessie. Een token wordt alleen na een geslaagde verbinding opgeslagen, versleuteld in Supabase Vault. De browser ontvangt geen opgeslagen token. Geen klant-, factuur- of betaalgegevens worden bij deze test naar e-Boekhouden gestuurd.

Kies vervolgens debiteuren en omzet uit de opgehaalde rekeningen. Bank en Mollie-tussenrekening zijn optioneel in deze voorbereidingsstap. De backend controleert de IDs en categorieën opnieuw bij opslaan. Het vervangen van een token verwijdert de oude rekeningkeuze; een connection_revision voorkomt dat een gelijktijdig gewijzigd account oude mappings krijgt. Verbreken verwijdert het opgeslagen Vault-token; de gebruiker kan het daarnaast bij e-Boekhouden intrekken.

## Reikwijdte van deze release

De release biedt verbinden, testen, rekeningkeuze en een lokaal controleoverzicht. Er is **nog geen export, synchronisatiewerker of activatieknop**. Automatisch boeken is op databaseniveau geblokkeerd met `check(sync_enabled=false)`. Alle documenten in het overzicht zijn gemarkeerd als nog niet gesynchroniseerd. Het overzicht sluit concepten, inactieve facturen, herkenbare testfactuurnummers, facturen met Mollie-testrequests en vervallen/testbetalingen uit.

Na het invoeren van het echte token moeten de daadwerkelijke administratie, btw-inrichting, rekeningkeuze en eerste verkoopboeking gecontroleerd worden. De exportfase moet vervolgens relaties, verkoopmutaties, creditmutaties en betaalafstemming implementeren met unieke documentkoppelingen, herstel na time-outs zonder dubbele boekingen, een log en expliciete activering. Bank- en Molliebetalingen moeten één vastgestelde bron hebben om dubbeltelling te voorkomen. Offertes/contracten zijn geen financiële mutaties. Documentbijlagen zijn niet opgenomen in deze release.

## Toegang en verificatie

`ebookhouden-admin` controleert iedere JWT met `getUser()` en vraagt via de bestaande `is_staff`-functie expliciet om ADMIN. Alleen daarna wordt een serviceclient gemaakt. Preview-reads behouden de JWT van de gebruiker en de bestaande RLS. De nieuwe configuratietabel heeft RLS en geen grants voor anon/authenticated. Vault is alleen bereikbaar via een service-only invoker-wrapper naar een afgeschermde definer-functie in `ebookhouden_private`, met aanvullende service-JWT-controle. Er is geen endpoint om een token op te vragen. Providerfouten en databasefouten worden zonder ruwe body of geheimen teruggegeven.

Tests: `bun test scripts/ebookhouden.test.ts` of Node 24 `node --experimental-strip-types --test scripts/ebookhouden.test.ts`. De SQL-controle gebruikt een tijdelijk fictief token binnen een teruggerolde transactie; productiecredentials worden niet gelezen of overschreven.

API-contract gecontroleerd op 16 september 2026: https://api.e-boekhouden.nl/openapi/v1.json en https://api.e-boekhouden.nl/scalar/. Authenticatie gebruikt `POST /v1/session` met `source: Vedantix`, de sessietoken als kale Authorization-header, gepagineerd `GET /v1/ledger`, vervolgens `DELETE /v1/session`. Geen `/mutation` of `/relation`-writes.
