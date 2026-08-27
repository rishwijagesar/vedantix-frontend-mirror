import LegalPageLayout from "../components/LegalPageLayout";
import { createBreadcrumbSchema } from "../utils/schema";

const canonical = "https://vedantix.nl/data-deletion";

const sections = [
  {
    title: "Verzoek indienen",
    shortTitle: "Aanvragen",
    content: (
      <>
        <p>
          Gebruikers, klanten en leads kunnen een verzoek indienen voor verwijdering van
          persoonsgegevens die door Vedantix worden verwerkt.
        </p>
        <p>
          Stuur je verzoek per e-mail naar{" "}
          <a href="mailto:admin@vedantix.nl">admin@vedantix.nl</a> met als onderwerp:
        </p>
        <p>
          <strong>Verzoek Gegevensverwijdering</strong>
        </p>
      </>
    ),
  },
  {
    title: "Welke gegevens je moet meesturen",
    shortTitle: "Benodigd",
    content: (
      <>
        <p>Neem in je verzoek de volgende gegevens op, zodat wij je kunnen identificeren:</p>
        <ul>
          <li>Volledige naam</li>
          <li>E-mailadres</li>
          <li>Bedrijfsnaam, indien van toepassing</li>
        </ul>
        <p>
          Wij kunnen om aanvullende verificatie vragen wanneer dat nodig is om te voorkomen
          dat gegevens van iemand anders worden verwijderd.
        </p>
      </>
    ),
  },
  {
    title: "Verwerkingstermijn",
    shortTitle: "Termijn",
    content: (
      <p>
        Vedantix verwerkt verwijderingsverzoeken binnen 30 dagen, tenzij wettelijke
        verplichtingen, lopende overeenkomsten of noodzakelijke beveiligingscontroles meer
        tijd vereisen. Als wij meer tijd nodig hebben, informeren wij je daarover.
      </p>
    ),
  },
  {
    title: "Gegevens die wettelijk bewaard kunnen blijven",
    shortTitle: "Uitzonderingen",
    content: (
      <>
        <p>
          Sommige gegevens mogen of moeten wij bewaren vanwege wettelijke verplichtingen,
          fiscale regels of administratieve bewijsvoering. Dit kan onder meer gelden voor:
        </p>
        <ul>
          <li>Facturen</li>
          <li>Financiële administratie</li>
          <li>Belastingadministratie</li>
        </ul>
      </>
    ),
  },
  {
    title: "Wat wordt verwijderd",
    shortTitle: "Verwijdering",
    content: (
      <p>
        Alle overige persoonsgegevens die in aanmerking komen voor verwijdering worden
        verwijderd of geanonimiseerd. Dit kan betrekking hebben op contactgegevens,
        marketinggegevens, lead form submissions, notities en niet-verplichte klantdata.
      </p>
    ),
  },
];

export default function DataDeletion() {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Verzoek tot Gegevensverwijdering", url: canonical },
  ]);

  return (
    <LegalPageLayout
      title="Verzoek tot Gegevensverwijdering"
      eyebrow="Data deletion"
      intro="Informatie over hoe je verwijdering van persoonsgegevens bij Vedantix kunt aanvragen."
      description="Vraag verwijdering van persoonsgegevens aan bij Vedantix. Lees welke gegevens nodig zijn, wat binnen 30 dagen wordt verwerkt en welke administratie wettelijk bewaard kan blijven."
      canonical={canonical}
      updatedAt="1 juni 2026"
      schemas={[breadcrumbSchema]}
      sections={sections}
      contactLabel="Verzoek sturen"
    >
      <p>
        Stuur je verzoek naar{" "}
        <a href="mailto:admin@vedantix.nl?subject=Verzoek%20Gegevensverwijdering">
          admin@vedantix.nl
        </a>{" "}
        met als onderwerp <strong>Verzoek Gegevensverwijdering</strong>.
      </p>
    </LegalPageLayout>
  );
}
