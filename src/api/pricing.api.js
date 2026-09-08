const PACKAGES = [
  {
    code: "STARTER",
    label: "Starter",
    description: "Professionele onepage",
    fit: "Voor starters en zzp'ers",
    featured: false,
    isActive: true,
    sortOrder: 10,
    monthlyPriceInclVat: 0,
    setupPriceInclVat: 399,
    cancelNote: "€399 eenmalig. Geen verplicht maandabonnement.",
    included: [
      "Professionele responsive onepage",
      "Contactformulier en WhatsApp-knop",
      "Technische SEO-basis voor Google",
    ],
  },
  {
    code: "GROWTH",
    label: "Growth",
    description: "Complete bedrijfswebsite",
    fit: "Voor lokale bedrijven met meerdere diensten",
    featured: true,
    isActive: true,
    sortOrder: 20,
    monthlyPriceInclVat: 0,
    setupPriceInclVat: 599,
    cancelNote: "€599 eenmalig. Geen verplicht maandabonnement.",
    included: [
      "Tot 5 pagina's met sterke dienstenstructuur",
      "SEO en lokale vindbaarheidsbasis",
      "AEO-basis met FAQ en structured data",
    ],
  },
  {
    code: "PRO",
    label: "Pro",
    description: "Website voor online groei",
    fit: "Voor bedrijven die meer uit hun website willen halen",
    featured: false,
    isActive: true,
    sortOrder: 30,
    monthlyPriceInclVat: 0,
    setupPriceInclVat: 999,
    cancelNote: "€999 eenmalig. Geen verplicht maandabonnement.",
    included: [
      "Tot 10 pagina's en meer maatwerkruimte",
      "Uitgebreidere SEO en lokale structuur",
      "AEO + GEO/AIO-basis voor AI-platformen",
    ],
  },
];

export async function fetchPricingSummary() {
  return { packages: PACKAGES };
}

export async function fetchPackages() {
  return PACKAGES;
}
