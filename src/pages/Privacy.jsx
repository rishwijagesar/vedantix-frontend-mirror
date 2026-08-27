import LegalPageLayout from "../components/LegalPageLayout";
import { createBreadcrumbSchema } from "../utils/schema";

const canonical = "https://vedantix.nl/privacy";

const sections = [
  {
    title: "Welke gegevens wij kunnen verzamelen",
    shortTitle: "Gegevens",
    content: (
      <>
        <p>
          Vedantix respecteert de privacy van gebruikers, prospects en klanten. Wij
          verzamelen alleen persoonsgegevens wanneer dit nodig is voor onze diensten,
          communicatie, administratie of wettelijke verplichtingen.
        </p>
        <ul>
          <li>Naam</li>
          <li>Bedrijfsnaam</li>
          <li>E-mailadres</li>
          <li>Telefoonnummer</li>
          <li>Facturatiegegevens</li>
          <li>Website usage analytics</li>
          <li>Marketing data</li>
          <li>Lead form submissions</li>
          <li>Meta Ads conversion data</li>
          <li>Cookies and tracking data</li>
        </ul>
      </>
    ),
  },
  {
    title: "Doeleinden van verwerking",
    shortTitle: "Doeleinden",
    content: (
      <>
        <p>
          Wij verwerken persoonsgegevens op basis van overeenkomst, gerechtvaardigd
          belang, toestemming of wettelijke verplichting. De belangrijkste doeleinden zijn:
        </p>
        <ul>
          <li>Websites leveren en beheren</li>
          <li>Hostingdiensten verzorgen</li>
          <li>AI-diensten leveren</li>
          <li>Klantrelaties beheren</li>
          <li>Marketing optimaliseren</li>
          <li>Analytics uitvoeren</li>
          <li>Facturatie en administratie voeren</li>
          <li>Klantenservice en support bieden</li>
        </ul>
      </>
    ),
  },
  {
    title: "Cookies, analytics en marketingtracking",
    shortTitle: "Tracking",
    content: (
      <>
        <p>
          Vedantix kan cookies en vergelijkbare technologie gebruiken om websites goed te
          laten werken, prestaties te meten en marketingcampagnes te optimaliseren.
          Wanneer toestemming wettelijk vereist is, vragen wij die toestemming voordat
          niet-noodzakelijke tracking wordt geplaatst.
        </p>
        <p>
          Marketing- en conversiedata kan worden gebruikt om campagnes te meten, dubbele
          conversies te voorkomen en relevantere advertenties te tonen. Waar mogelijk
          beperken wij de gegevens en gebruiken wij beveiligde overdracht.
        </p>
      </>
    ),
  },
  {
    title: "Derde partijen en verwerkers",
    shortTitle: "Derden",
    content: (
      <>
        <p>
          Voor de uitvoering van onze diensten kunnen wij samenwerken met zorgvuldig
          geselecteerde externe leveranciers. Deze partijen verwerken gegevens alleen voor
          afgesproken doeleinden en waar nodig onder passende verwerkersafspraken.
        </p>
        <ul>
          <li>Meta Platforms</li>
          <li>OpenAI</li>
          <li>AWS</li>
          <li>Stripe</li>
          <li>Migadu</li>
          <li>Google Analytics</li>
        </ul>
      </>
    ),
  },
  {
    title: "Bewaartermijnen",
    shortTitle: "Bewaren",
    content: (
      <p>
        Persoonsgegevens worden alleen bewaard zolang dat nodig is om onze diensten te
        leveren, klantrelaties te beheren of te voldoen aan wettelijke verplichtingen.
        Financiële en fiscale administratie kan langer worden bewaard wanneer de wet dat
        vereist. Gegevens die niet langer nodig zijn, worden verwijderd of geanonimiseerd.
      </p>
    ),
  },
  {
    title: "Beveiliging",
    shortTitle: "Beveiliging",
    content: (
      <>
        <p>
          Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens
          te beschermen tegen verlies, misbruik, onbevoegde toegang en ongeoorloofde
          wijziging. Voorbeelden hiervan zijn toegangsbeperking, versleutelde verbindingen,
          logging en zorgvuldig beheer van accounts en sleutels.
        </p>
        <p>
          Geen enkel systeem is volledig risicovrij. Wanneer een datalek gevolgen kan
          hebben voor betrokkenen, handelen wij volgens de AVG en melden wij dit waar
          nodig aan de Autoriteit Persoonsgegevens en betrokkenen.
        </p>
      </>
    ),
  },
  {
    title: "Jouw rechten onder de AVG",
    shortTitle: "Rechten",
    content: (
      <>
        <p>Onder de AVG heb je onder meer de volgende rechten:</p>
        <ul>
          <li>Inzage in persoonsgegevens die wij van jou verwerken</li>
          <li>Rectificatie van onjuiste of onvolledige gegevens</li>
          <li>Verwijdering van gegevens wanneer daar een grond voor is</li>
          <li>Beperking van verwerking</li>
          <li>Gegevensoverdraagbaarheid</li>
          <li>Bezwaar tegen bepaalde verwerkingen</li>
        </ul>
        <p>
          Je kunt deze rechten uitoefenen door contact op te nemen via{" "}
          <a href="mailto:admin@vedantix.nl">admin@vedantix.nl</a>. Wij kunnen vragen om
          aanvullende informatie om je identiteit te verifiëren.
        </p>
      </>
    ),
  },
  {
    title: "Klachten",
    shortTitle: "Klachten",
    content: (
      <p>
        Als je vindt dat wij niet zorgvuldig omgaan met je persoonsgegevens, neem dan eerst
        contact met ons op. Je hebt daarnaast het recht om een klacht in te dienen bij de
        Autoriteit Persoonsgegevens via{" "}
        <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer">
          autoriteitpersoonsgegevens.nl
        </a>.
      </p>
    ),
  },
];

export default function Privacy() {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Privacybeleid", url: canonical },
  ]);

  return (
    <LegalPageLayout
      title="Privacybeleid - Vedantix"
      eyebrow="Privacy"
      intro="Hoe Vedantix persoonsgegevens verwerkt bij websites, hosting, AI-diensten, marketing, analytics en klantrelaties."
      description="Lees het privacybeleid van Vedantix over persoonsgegevens, cookies, tracking, Meta Ads conversiedata, analytics, bewaartermijnen en AVG-rechten."
      canonical={canonical}
      updatedAt="1 juni 2026"
      schemas={[breadcrumbSchema]}
      sections={sections}
    >
      <p>
        Vragen over privacy of gegevensverwerking? Mail naar{" "}
        <a href="mailto:admin@vedantix.nl">admin@vedantix.nl</a>.
      </p>
    </LegalPageLayout>
  );
}
