import { GENERAL_TERMS, termsPdfUrl } from "../lib/general-terms";
import LegalPageLayout from "../components/LegalPageLayout";
import { createBreadcrumbSchema } from "../utils/schema";

const canonical = "https://vedantix.nl/terms";

function renderBlocks(blocks) {
  const elements = [];
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (block.kind === "p") { elements.push(<p key={index}>{block.text}</p>); continue; }
    const start = index, items = [block.text];
    while (blocks[index + 1]?.kind === "li") items.push(blocks[++index].text);
    elements.push(<ul key={start}>{items.map((text, itemIndex) => <li key={itemIndex}>{text}</li>)}</ul>);
  }
  return elements;
}

const sections = GENERAL_TERMS.sections.map(section => ({
  title: section.title, shortTitle: section.shortTitle,
  content: <>{renderBlocks(section.blocks)}</>,
}));

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
      updatedAt={GENERAL_TERMS.dateLabel}
      schemas={[breadcrumbSchema]}
      sections={sections}
    >
      <p><a href={termsPdfUrl} download>Download algemene voorwaarden als PDF</a> · Versie {GENERAL_TERMS.dateLabel}</p>
      <p>
        Vragen over deze voorwaarden? Neem contact op via{" "}
        <a href="mailto:admin@vedantix.nl">admin@vedantix.nl</a>.
      </p>
    </LegalPageLayout>
  );
}
