import LegalPageLayout from "../components/LegalPageLayout";
import { createBreadcrumbSchema } from "../utils/schema";

const canonical = "https://vedantix.nl/terms";

const sections = [
  {
    title: "1. Definities",
    shortTitle: "Definities",
    content: (
      <p>
        In deze algemene voorwaarden betekent <strong>Vedantix</strong>: de aanbieder van
        websites, hosting, AI-oplossingen, marketingdiensten, SEO en advies. De{" "}
        <strong>klant</strong> is iedere persoon of organisatie die diensten afneemt of
        een offerte accepteert.
      </p>
    ),
  },
  {
    title: "2. Diensten",
    shortTitle: "Diensten",
    content: (
      <>
        <p>Vedantix kan onder meer de volgende diensten leveren:</p>
        <ul>
          <li>Website development</li>
          <li>Hosting</li>
          <li>AI solutions</li>
          <li>Marketing services</li>
          <li>SEO services</li>
          <li>Consulting</li>
        </ul>
        <p>
          De exacte inhoud, planning, prijs en oplevering worden vastgelegd in de offerte,
          opdrachtbevestiging, overeenkomst of schriftelijke communicatie.
        </p>
      </>
    ),
  },
  {
    title: "3. Verantwoordelijkheden van de klant",
    shortTitle: "Klant",
    content: (
      <>
        <p>Klanten moeten:</p>
        <ul>
          <li>Accurate en volledige informatie aanleveren</li>
          <li>Zorgen voor rechtmatig gebruik van de diensten</li>
          <li>Geen misbruik maken van websites, hosting, e-mail of automatiseringen</li>
          <li>Geen content aanleveren die inbreuk maakt op rechten van derden</li>
          <li>Tijdig reageren wanneer informatie, feedback of akkoord nodig is</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Betalingen",
    shortTitle: "Betaling",
    content: (
      <>
        <p>
          Facturen moeten worden betaald volgens de overeengekomen betaaltermijn. Bij te
          late betaling mag Vedantix herinneringen sturen, wettelijke rente en redelijke
          incassokosten in rekening brengen en diensten tijdelijk opschorten.
        </p>
        <p>
          Late payments may result in suspension of services. Opschorting ontslaat de klant
          niet van betalingsverplichtingen voor reeds geleverde of lopende diensten.
        </p>
      </>
    ),
  },
  {
    title: "5. Aansprakelijkheid",
    shortTitle: "Aansprakelijkheid",
    content: (
      <>
        <p>
          Vedantix is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde
          winst, gemiste omzet, reputatieschade of schade veroorzaakt door externe diensten
          van derden.
        </p>
        <p>
          Voor zover aansprakelijkheid niet kan worden uitgesloten, is deze beperkt tot het
          bedrag dat de klant voor de betreffende dienst heeft betaald in de drie maanden
          voorafgaand aan de gebeurtenis.
        </p>
      </>
    ),
  },
  {
    title: "6. Beschikbaarheid",
    shortTitle: "Beschikbaarheid",
    content: (
      <p>
        Diensten worden geleverd op basis van best effort. Vedantix spant zich in om
        websites, hosting en automatiseringen beschikbaar en veilig te houden, maar kan
        geen ononderbroken werking of 100% uptime garanderen. Onderhoud, storingen,
        internetproblemen en externe platformen kunnen invloed hebben op beschikbaarheid.
      </p>
    ),
  },
  {
    title: "7. Intellectueel eigendom",
    shortTitle: "Eigendom",
    content: (
      <>
        <p>
          Vedantix behoudt eigendom van intern ontwikkelde frameworks, software,
          templates, automatiseringssystemen, processen en generieke technische oplossingen.
        </p>
        <p>
          Klanten behouden eigendom van hun eigen content, merknaam, huisstijl, logo's,
          afbeeldingen en aangeleverde materialen, voor zover zij daarop rechthebbende zijn.
        </p>
      </>
    ),
  },
  {
    title: "8. Beëindiging",
    shortTitle: "Beëindiging",
    content: (
      <p>
        Beide partijen kunnen de samenwerking beëindigen volgens de overeengekomen
        contractvoorwaarden. Na beëindiging kunnen toegang, hosting, support en gekoppelde
        diensten worden stopgezet. Openstaande facturen blijven verschuldigd.
      </p>
    ),
  },
  {
    title: "9. Toepasselijk recht",
    shortTitle: "Recht",
    content: (
      <p>
        Op deze voorwaarden en op alle overeenkomsten met Vedantix is Nederlands recht van
        toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland,
        tenzij dwingend recht anders bepaalt.
      </p>
    ),
  },
  {
    title: "10. Wijzigingen",
    shortTitle: "Wijzigingen",
    content: (
      <p>
        Vedantix kan deze voorwaarden aanpassen wanneer diensten, wetgeving of bedrijfsvoering
        wijzigen. De meest recente versie is altijd beschikbaar op deze pagina.
      </p>
    ),
  },
];

export default function Voorwaarden() {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Algemene voorwaarden", url: canonical },
  ]);

  return (
    <LegalPageLayout
      title="Algemene Voorwaarden - Vedantix"
      eyebrow="Voorwaarden"
      intro="De zakelijke voorwaarden voor websites, hosting, AI-oplossingen, marketing, SEO en advies door Vedantix."
      description="Lees de algemene voorwaarden van Vedantix over diensten, klantverantwoordelijkheden, betalingen, aansprakelijkheid, beschikbaarheid, intellectueel eigendom en Nederlands recht."
      canonical={canonical}
      updatedAt="1 juni 2026"
      schemas={[breadcrumbSchema]}
      sections={sections}
    >
      <p>
        Vragen over deze voorwaarden? Neem contact op via{" "}
        <a href="mailto:admin@vedantix.nl">admin@vedantix.nl</a>.
      </p>
    </LegalPageLayout>
  );
}
