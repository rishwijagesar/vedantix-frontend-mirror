# Vedantix Frontend Mirror

Gebruik de gekoppelde GitHub-repository rishwijagesar/vedantix, branch main, als de enige source of truth voor dit project. Dit is een migratie van de bestaande Vedantix-code van Base44 naar Lovable, GEEN redesign en GEEN nieuwe versie. Neem de bestaande frontendcode, componenten, pagina's, CSS, assets, content, routes, responsive gedrag en layout zo letterlijk mogelijk over uit de repository. De gerenderde publieke website moet visueel gelijk blijven aan de huidige versie. Verwijder of isoleer alleen Base44-specifieke backend/admin-afhankelijkheden die niet nodig zijn voor de publieke frontend, zoals @base44/sdk, @base44/vite-plugin, oude admin/CRM/backendfuncties en Base44-auth. Neem /admin en het oude klantenportaal/backoffice niet mee. Voeg nog geen Supabase/database toe. Behoud alle publieke routes en redirects uit src/App.jsx. Gebruik NIET https://vedantix.nl om een nieuw ontwerp te genereren; gebruik de daadwerkelijke GitHub-code. Begin met het importeren/overnemen van de repo-code en maak die bouwbaar in Lovable zonder zichtbare frontendwijzigingen. Publiceer niets naar productie en wijzig de GitHub main branch niet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1a802d37-67b8-4407-98f6-913af6f7a354).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
