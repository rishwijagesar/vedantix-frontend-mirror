export const cities = [
  { slug: "amsterdam", name: "Amsterdam" },
  { slug: "rotterdam", name: "Rotterdam" },
  { slug: "utrecht", name: "Utrecht" },
  { slug: "den-haag", name: "Den Haag" },
  { slug: "eindhoven", name: "Eindhoven" },
  { slug: "tilburg", name: "Tilburg" },
  { slug: "breda", name: "Breda" },
  { slug: "groningen", name: "Groningen" },
  { slug: "arnhem", name: "Arnhem" },
  { slug: "haarlem", name: "Haarlem" },
  { slug: "leiden", name: "Leiden" },
  { slug: "delft", name: "Delft" },
  { slug: "dordrecht", name: "Dordrecht" },
  { slug: "amersfoort", name: "Amersfoort" },
  { slug: "apeldoorn", name: "Apeldoorn" },
  { slug: "enschede", name: "Enschede" },
  { slug: "zwolle", name: "Zwolle" },
  { slug: "maastricht", name: "Maastricht" },
  { slug: "leeuwarden", name: "Leeuwarden" },
  { slug: "nijmegen", name: "Nijmegen" },
];

const createNichePage = ({
  key,
  singular,
  plural,
  businessType,
  heroKeyword,
  intro,
  section1,
  section2,
  section3,
  bullets1,
  bullets2,
  cta,
}) => ({
  key,
  singular,
  plural,
  label: plural,

  businessPlaceholder: (city) => `${businessType} in ${city}`,

  heroTitle: (city) => `Website laten maken voor ${plural} in ${city}`,

  intro: (city) => intro(city),

  section1Title: (city) => section1.title(city),
  section1Text: (city) => section1.text(city),
  bullets1: (city) => bullets1(city),

  section2Title: (city) => section2.title(city),
  section2Text: (city) => section2.text(city),
  bullets2: () => bullets2(),

  section3Title: (city) => section3.title(city),
  section3Text: (city) => section3.text(city),

  ctaTitle: (city) => cta.title(city),
  ctaText: (city) => cta.text(city),

  seo: {
    title: (city) => `${heroKeyword} in ${city} | Vedantix`,
    description: (city) =>
      `Professionele website laten maken voor ${plural} in ${city}. Meer aanvragen, betere zichtbaarheid in Google en sneller online met Vedantix.`,
  },
});

export const niches = {
  kapper: createNichePage({
    key: "kapper",
    singular: "kapper",
    plural: "kappers",
    businessType: "Kapsalon",
    heroKeyword: "Website voor kappers",
    intro: (city) =>
      `Ben jij kapper in ${city} en wil je meer afspraken via Google binnenhalen? Dan is een professionele website geen luxe, maar een basisvoorwaarde. Potentiële klanten zoeken dagelijks naar een kapper in ${city}. Zonder sterke online aanwezigheid laat je kansen liggen.`,
    section1: {
      title: (city) => `Meer klanten als kapper in ${city}`,
      text: (city) =>
        `Wanneer iemand zoekt op “kapper ${city}”, wil je dat jouw salon direct zichtbaar is. Een goede website zorgt voor vertrouwen, laat jouw stijl zien en maakt het eenvoudig om direct contact op te nemen of een afspraak te maken.`,
    },
    bullets1: (city) => [
      `Meer afspraken via Google in ${city}`,
      "Professionele en verzorgde uitstraling",
      "Direct contact via WhatsApp",
      "Altijd online zichtbaar voor nieuwe klanten",
    ],
    section2: {
      title: (city) => `Wat wij bouwen voor kappers in ${city}`,
      text: (city) =>
        `Wij maken websites voor kappers en barbershops in ${city} die niet alleen mooi ogen, maar ook gericht zijn op groei. Het doel is simpel: meer zichtbaarheid, meer vertrouwen en meer afspraken.`,
    },
    bullets2: () => [
      "Mobielvriendelijk design",
      "Online afspraakknop",
      "WhatsApp integratie",
      "Google Maps integratie",
      "Snelle laadtijd",
      "Snel live",
    ],
    section3: {
      title: (city) => `Waarom een goede website belangrijk is in ${city}`,
      text: (city) =>
        `Veel klanten vergelijken meerdere salons voordat ze kiezen. Zonder professionele website kiezen zij sneller voor een concurrent in ${city} die online sterker overkomt.`,
    },
    cta: {
      title: (city) => `Meer klanten krijgen als kapper in ${city}?`,
      text: () =>
        `Vraag een gratis analyse aan en ontdek hoe jouw website meer afspraken en nieuwe klanten kan opleveren.`,
    },
  }),

  salon: createNichePage({
    key: "salon",
    singular: "salon",
    plural: "salons",
    businessType: "Schoonheidssalon",
    heroKeyword: "Website voor salons",
    intro: (city) =>
      `Heb jij een salon in ${city}? Dan wil je online direct goed overkomen. Klanten zoeken via Google naar behandelingen, reviews en een plek waar ze eenvoudig kunnen boeken. Een sterke website helpt je om meer vertrouwen en meer boekingen te krijgen.`,
    section1: {
      title: (city) => `Meer boekingen voor je salon in ${city}`,
      text: (city) =>
        `Een professionele website verlaagt de drempel om contact op te nemen of direct te boeken. Zeker in een concurrerende stad als ${city} is online uitstraling vaak doorslaggevend.`,
    },
    bullets1: (city) => [
      `Meer afspraken via Google in ${city}`,
      "Luxe en professionele uitstraling",
      "Meer vertrouwen bij nieuwe klanten",
      "Snelle contactmogelijkheid via WhatsApp",
    ],
    section2: {
      title: () => "Wat wij bouwen voor salons",
      text: () =>
        "Wij bouwen websites voor salons die gericht zijn op uitstraling, vertrouwen en boekingen. Je website moet niet alleen mooi zijn, maar ook klanten overtuigen.",
    },
    bullets2: () => [
      "Boekingssysteem of afspraakknop",
      "Mobielvriendelijk design",
      "WhatsApp integratie",
      "Google Maps integratie",
      "Snelle website",
      "Snel live",
    ],
    section3: {
      title: (city) => `Waarom dit belangrijk is in ${city}`,
      text: (city) =>
        `Klanten vergelijken vaak meerdere salons in ${city}. Zonder sterke website mis je boekingen aan salons die online overtuigender overkomen.`,
    },
    cta: {
      title: (city) => `Meer salonboekingen in ${city}?`,
      text: () =>
        `Laat gratis analyseren hoe jouw salon online presteert en ontdek hoe je meer afspraken kunt krijgen.`,
    },
  }),

  klusbedrijf: createNichePage({
    key: "klusbedrijf",
    singular: "klusbedrijf",
    plural: "klusbedrijven",
    businessType: "Klusbedrijf",
    heroKeyword: "Website voor klusbedrijven",
    intro: (city) =>
      `Klanten zoeken dagelijks naar betrouwbare vakmannen in ${city}. Zonder duidelijke en professionele website loop je offerteaanvragen mis. Een sterke website helpt je om vertrouwen op te bouwen en meer aanvragen binnen te halen.`,
    section1: {
      title: (city) => `Meer offerteaanvragen in ${city}`,
      text: (city) =>
        `Wanneer mensen in ${city} een klusbedrijf zoeken, willen ze snel zien wat je doet, hoe ze contact opnemen en waarom ze jou moeten kiezen. Een goede website maakt dat direct duidelijk.`,
    },
    bullets1: () => [
      "Meer offerteaanvragen",
      "Professionele uitstraling",
      "Altijd bereikbaar voor nieuwe klanten",
      "Meer vertrouwen door duidelijke presentatie",
    ],
    section2: {
      title: () => "Wat wij bouwen voor klusbedrijven",
      text: () =>
        "Wij maken websites voor klusbedrijven die gericht zijn op aanvragen, vertrouwen en overzicht. Geen overbodige ruis, maar een duidelijke site die werk oplevert.",
    },
    bullets2: () => [
      "SEO-vriendelijke website",
      "Offerteformulier",
      "Project showcase",
      "WhatsApp integratie",
      "Google Maps integratie",
      "Snel live",
    ],
    section3: {
      title: (city) => `Waarom dit werkt in ${city}`,
      text: (city) =>
        `Mensen vergelijken meerdere aanbieders voordat ze iemand benaderen. Met een professionele website vergroot je in ${city} de kans dat ze juist voor jouw klusbedrijf kiezen.`,
    },
    cta: {
      title: (city) => `Meer klusaanvragen in ${city}?`,
      text: () =>
        `Vraag een gratis analyse aan en ontdek hoe jouw website structureel meer werk kan opleveren.`,
    },
  }),

  restaurant: createNichePage({
    key: "restaurant",
    singular: "restaurant",
    plural: "restaurants",
    businessType: "Restaurant",
    heroKeyword: "Website voor restaurants",
    intro: (city) =>
      `Meer reserveringen krijgen in ${city}? Dan heb je een restaurantwebsite nodig die sfeer uitstraalt en direct vertrouwen wekt. Gasten zoeken online naar menu’s, openingstijden, reviews en een snelle manier om te reserveren.`,
    section1: {
      title: (city) => `Meer gasten via Google in ${city}`,
      text: (city) =>
        `Wanneer iemand zoekt naar een restaurant in ${city}, wil je direct een goede eerste indruk maken. Een sterke website helpt bezoekers om snel te reserveren en jouw restaurant beter te leren kennen.`,
    },
    bullets1: () => [
      "Meer online reserveringen",
      "Menu en sfeer direct zichtbaar",
      "Locatie eenvoudig vindbaar",
      "Professionele uitstraling",
    ],
    section2: {
      title: () => "Wat wij bouwen voor restaurants",
      text: () =>
        "Wij bouwen restaurantwebsites die gericht zijn op zichtbaarheid, reserveringen en gebruiksgemak. Alles draait om snelheid, vertrouwen en een goede eerste indruk.",
    },
    bullets2: () => [
      "Mobielvriendelijk design",
      "Reserveringsknop",
      "Menu of kaart integratie",
      "Google Maps integratie",
      "WhatsApp integratie",
      "Snelle website",
    ],
    section3: {
      title: (city) => `Waarom dit belangrijk is in ${city}`,
      text: (city) =>
        `Gasten kiezen vaak het restaurant dat online het meest aantrekkelijk en betrouwbaar overkomt. Zonder sterke website loop je in ${city} reserveringen mis.`,
    },
    cta: {
      title: (city) => `Meer reserveringen in ${city}?`,
      text: () =>
        `Vraag een gratis analyse aan en ontdek hoe jouw restaurantwebsite meer gasten kan opleveren.`,
    },
  }),

  fotograaf: createNichePage({
    key: "fotograaf",
    singular: "fotograaf",
    plural: "fotografen",
    businessType: "Fotografiebedrijf",
    heroKeyword: "Website voor fotografen",
    intro: (city) =>
      `Als fotograaf verkoop je niet alleen foto's, maar vooral vertrouwen en stijl. In ${city} wil je online opvallen met een website die jouw portfolio sterk presenteert en bezoekers omzet in boekingen.`,
    section1: {
      title: (city) => `Meer boekingen als fotograaf in ${city}`,
      text: (city) =>
        `Een professionele fotografie-website laat direct zien wat je kunt. Bezoekers willen voorbeelden bekijken, jouw stijl voelen en snel contact kunnen opnemen.`,
    },
    bullets1: () => [
      "Sterke portfolio-presentatie",
      "Snelle laadtijd",
      "Duidelijk contactformulier",
      "Professionele uitstraling",
    ],
    section2: {
      title: () => "Wat wij bouwen voor fotografen",
      text: () =>
        "Wij maken websites voor fotografen die gericht zijn op zichtbaarheid, vertrouwen en meer aanvragen. Je werk moet centraal staan en direct overtuigen.",
    },
    bullets2: () => [
      "Portfolio pagina",
      "Mobielvriendelijk design",
      "WhatsApp integratie",
      "Leadformulier",
      "SEO basisoptimalisatie",
      "Snel live",
    ],
    section3: {
      title: (city) => `Waarom dit werkt in ${city}`,
      text: (city) =>
        `Mensen vergelijken meerdere fotografen voordat ze boeken. Met een overtuigende website maak je in ${city} sneller het verschil en vergroot je je kans op nieuwe opdrachten.`,
    },
    cta: {
      title: (city) => `Meer shoots boeken in ${city}?`,
      text: () =>
        `Vraag een gratis analyse aan en ontdek hoe jouw website meer aanvragen kan opleveren.`,
    },
  }),

  schoonmaakbedrijf: createNichePage({
    key: "schoonmaakbedrijf",
    singular: "schoonmaakbedrijf",
    plural: "schoonmaakbedrijven",
    businessType: "Schoonmaakbedrijf",
    heroKeyword: "Website voor schoonmaakbedrijven",
    intro: (city) =>
      `Wil je meer aanvragen voor je schoonmaakbedrijf in ${city}? Dan moet je online professioneel en betrouwbaar overkomen. Bedrijven en particulieren zoeken dagelijks naar schoonmaakdiensten en vergelijken meerdere aanbieders.`,
    section1: {
      title: (city) => `Meer aanvragen via Google in ${city}`,
      text: (city) =>
        `Een professionele website helpt je om jouw diensten helder te presenteren en direct vertrouwen op te bouwen. Zo vergroot je de kans dat bezoekers contact opnemen of een offerte aanvragen.`,
    },
    bullets1: () => [
      "Meer offerteaanvragen",
      "Betrouwbare uitstraling",
      "Altijd online zichtbaar",
      "Direct contact via WhatsApp",
    ],
    section2: {
      title: () => "Wat wij bouwen voor schoonmaakbedrijven",
      text: () =>
        "Wij bouwen websites voor schoonmaakbedrijven die gericht zijn op zichtbaarheid, betrouwbaarheid en conversie. De site moet helder zijn, snel laden en direct aanzetten tot contact.",
    },
    bullets2: () => [
      "SEO-vriendelijke website",
      "Contactformulieren",
      "Snelle performance",
      "Google Maps integratie",
      "Mobielvriendelijk design",
      "Snel live",
    ],
    section3: {
      title: (city) => `Waarom dit belangrijk is in ${city}`,
      text: (city) =>
        `Zonder sterke website kiezen potentiële klanten in ${city} sneller voor een concurrent die professioneler en betrouwbaarder overkomt.`,
    },
    cta: {
      title: (city) => `Meer klanten krijgen in ${city}?`,
      text: () =>
        `Vraag een gratis analyse aan en ontdek hoe jouw website meer aanvragen en nieuwe klanten kan opleveren.`,
    },
  }),
};

export const localSeoCities = [
  { slug: "den-bosch", name: "Den Bosch" },
  { slug: "eindhoven", name: "Eindhoven" },
  { slug: "tilburg", name: "Tilburg" },
  { slug: "breda", name: "Breda" },
  { slug: "nijmegen", name: "Nijmegen" },
];

const createIndustryFaqs = (singular, plural) => [
  {
    question: `Waarom heeft een ${singular} een professionele website nodig?`,
    answer: `Een professionele website helpt ${plural} om beter gevonden te worden, sneller vertrouwen op te bouwen en meer contactmomenten te creëren met mensen die actief zoeken naar hun dienst.`,
  },
  {
    question: `Helpt Vedantix ${plural} ook met lokale vindbaarheid?`,
    answer: `Ja. Vedantix kijkt niet alleen naar design, maar ook naar lokale zoekwoorden, duidelijke paginaopbouw, snelheid, reviews en contactmogelijkheden die bijdragen aan meer zichtbaarheid in Google.`,
  },
  {
    question: "Kan ik ook WhatsApp, offerteaanvragen of afspraken laten opnemen?",
    answer: "Ja. De website wordt ingericht op laagdrempelig contact, zoals WhatsApp, klikbare telefoonnummers, aanvraagformulieren en duidelijke call-to-actions.",
  },
  {
    question: "Is de website ook geschikt voor AI-zoekmachines?",
    answer: "Vedantix structureert content duidelijk, zodat zoekmachines en AI-systemen beter begrijpen wat je doet, voor wie je werkt en waarom klanten voor jouw bedrijf kiezen.",
  },
];

const createIndustryPage = ({
  key,
  singular,
  plural,
  badge,
  customerNeed,
  proof,
  services,
}) => ({
  key,
  singular,
  plural,
  label: plural,
  path: `/website/${key}`,
  metaTitle: `Website laten maken voor ${plural} | Vedantix`,
  metaDescription: `Professionele website voor ${plural} die vertrouwen opbouwt, beter gevonden wordt in Google en meer aanvragen oplevert. Ontdek Vedantix.`,
  badge,
  heroTitle: `Website laten maken voor ${plural}`,
  heroText: `Vedantix helpt ${plural} professioneel zichtbaar te worden met een website die vertrouwen wekt, lokaal beter gevonden wordt en bezoekers aanzet tot contact.`,
  cityHeroTitle: (city) => `Website laten maken voor ${plural} in ${city}`,
  cityMetaTitle: (city) => `Website laten maken voor ${plural} in ${city} | Vedantix`,
  cityMetaDescription: (city) =>
    `Professionele website voor ${plural} in ${city}. Meer vertrouwen, meer lokale zichtbaarheid en meer aanvragen met Vedantix.`,
  cityHeroText: (city) =>
    `Ben je actief als ${singular} in ${city}? Dan helpt Vedantix je online professioneler zichtbaar te worden, beter gevonden te worden en meer contactmomenten uit je website te halen.`,
  customerNeed,
  proof,
  services,
  outcomes: [
    "Meer vertrouwen bij nieuwe bezoekers",
    "Betere lokale vindbaarheid in Google",
    "Meer telefoontjes, WhatsApp-berichten en aanvragen",
    "Minder technische zorgen door beheer onder één dak",
  ],
  faqs: createIndustryFaqs(singular, plural),
});

export const industries = {
  "personal-trainer": createIndustryPage({
    key: "personal-trainer",
    singular: "personal trainer",
    plural: "personal trainers",
    badge: "Training, intake en proefles gericht op meer aanvragen",
    customerNeed:
      "Mensen kiezen een trainer op vertrouwen, resultaat en klik. Je website moet direct laten zien wie je helpt, welke doelen je begeleidt en hoe makkelijk iemand een eerste stap zet.",
    proof:
      "Met heldere pakketten, duidelijke resultaten en laagdrempelig contact wordt je website een plek waar twijfelende bezoekers sneller een intake of proefles aanvragen.",
    services: ["Intake CTA", "WhatsApp contact", "Resultaatgerichte content", "Lokale SEO"],
  }),
  fysiotherapeut: createIndustryPage({
    key: "fysiotherapeut",
    singular: "fysiotherapeut",
    plural: "fysiotherapeuten",
    badge: "Vindbaar voor klachten, behandelingen en praktijklocatie",
    customerNeed:
      "Patiënten zoeken vaak met een concrete klacht. Je website moet vertrouwen geven, behandelingen helder uitleggen en snel laten zien hoe iemand een afspraak maakt.",
    proof:
      "Een goede structuur per behandeling helpt bezoekers sneller herkennen dat ze bij jou goed zitten en helpt Google je praktijk beter te begrijpen.",
    services: ["Behandelpagina's", "Afspraak CTA", "Google Maps", "FAQ content"],
  }),
  coach: createIndustryPage({
    key: "coach",
    singular: "coach",
    plural: "coaches",
    badge: "Persoonlijke begeleiding zichtbaar en betrouwbaar maken",
    customerNeed:
      "Coaching vraagt om vertrouwen. Bezoekers willen voelen of jouw aanpak bij hen past voordat ze contact opnemen.",
    proof:
      "Met duidelijke positionering, rustige copy en sterke contactmomenten wordt je website een uitnodiging voor een eerste gesprek.",
    services: ["Positionering", "Kennismakingsgesprek CTA", "Vertrouwenscopy", "Lokale vindbaarheid"],
  }),
  masseur: createIndustryPage({
    key: "masseur",
    singular: "masseur",
    plural: "masseurs",
    badge: "Behandelingen, ontspanning en herstel duidelijk presenteren",
    customerNeed:
      "Klanten zoeken vaak op klacht, behandeling of locatie. Je website moet snel duidelijk maken welke massages je aanbiedt en waarom iemand bij jou moet boeken.",
    proof:
      "Door behandelingen, prijzen, reviews en afspraakmogelijkheden overzichtelijk te presenteren, verlaag je de drempel om direct contact op te nemen.",
    services: ["Behandeloverzicht", "BoekingsCTA", "Reviews", "Mobiele snelheid"],
  }),
  schoonheidssalon: createIndustryPage({
    key: "schoonheidssalon",
    singular: "schoonheidssalon",
    plural: "schoonheidssalons",
    badge: "Luxe uitstraling combineren met meer boekingen",
    customerNeed:
      "Nieuwe klanten vergelijken uitstraling, behandelingen en betrouwbaarheid. Je website moet direct verzorgd, professioneel en makkelijk te gebruiken aanvoelen.",
    proof:
      "Een sterke salonwebsite laat sfeer, behandelingen en contactmogelijkheden samenkomen, zodat bezoekers sneller boeken.",
    services: ["Behandelpagina's", "Online boeken", "Sfeerbeelden", "Lokale SEO"],
  }),
  kapper: createIndustryPage({
    key: "kapper",
    singular: "kapper",
    plural: "kappers",
    badge: "Meer afspraken via lokale zichtbaarheid",
    customerNeed:
      "Mensen zoeken kappers vaak lokaal en mobiel. Je website moet direct stijl, prijzen, locatie en afspraakmogelijkheden tonen.",
    proof:
      "Door een verzorgde uitstraling en snelle contactopties wordt je salon betrouwbaarder en makkelijker te kiezen.",
    services: ["Afspraakknop", "WhatsApp", "Google Maps", "Salon SEO"],
  }),
  restaurant: createIndustryPage({
    key: "restaurant",
    singular: "restaurant",
    plural: "restaurants",
    badge: "Sfeer, menu en reserveren zonder frictie",
    customerNeed:
      "Gasten willen snel menu, sfeer, openingstijden en reserveringsmogelijkheden zien. Zeker mobiel moet alles direct duidelijk zijn.",
    proof:
      "Een restaurantwebsite die sfeer en praktische informatie combineert, helpt bezoekers sneller reserveren.",
    services: ["Menu structuur", "ReserveringsCTA", "Openingstijden", "Lokale vindbaarheid"],
  }),
  installateur: createIndustryPage({
    key: "installateur",
    singular: "installateur",
    plural: "installateurs",
    badge: "Meer offerteaanvragen voor betrouwbaar vakwerk",
    customerNeed:
      "Klanten zoeken zekerheid voordat ze een installateur benaderen. Je website moet vakmanschap, bereikbaarheid en betrouwbaarheid direct uitstralen.",
    proof:
      "Heldere diensten, projectvoorbeelden en offerteaanvragen maken het makkelijker om gekozen te worden boven lokale concurrenten.",
    services: ["Offerteformulier", "Dienstenpagina's", "Projectbewijs", "Regio SEO"],
  }),
  schilder: createIndustryPage({
    key: "schilder",
    singular: "schilder",
    plural: "schilders",
    badge: "Projecten zichtbaar maken en aanvragen verhogen",
    customerNeed:
      "Bij schilderwerk willen klanten voorbeelden, duidelijkheid en vertrouwen. Je website moet laten zien dat je netjes werkt en makkelijk bereikbaar bent.",
    proof:
      "Met foto’s, duidelijke diensten en een laagdrempelig offerteformulier vergroot je de kans op nieuwe opdrachten.",
    services: ["Projectfoto's", "Offerte CTA", "Reviews", "Lokale zoekwoorden"],
  }),
  hovenier: createIndustryPage({
    key: "hovenier",
    singular: "hovenier",
    plural: "hoveniers",
    badge: "Tuinprojecten vertalen naar meer aanvragen",
    customerNeed:
      "Mensen willen inspiratie, vertrouwen en een duidelijk beeld van jouw werk. Je website moet projecten tonen en contact eenvoudig maken.",
    proof:
      "Een sterke hovenierwebsite laat vakmanschap en resultaat zien, waardoor bezoekers sneller een tuinadvies of offerte aanvragen.",
    services: ["Projectshowcase", "Offerteformulier", "Seizoenscontent", "Regio SEO"],
  }),
  boekhouder: createIndustryPage({
    key: "boekhouder",
    singular: "boekhouder",
    plural: "boekhouders",
    badge: "Vertrouwen, duidelijkheid en lokale vindbaarheid",
    customerNeed:
      "Ondernemers zoeken een boekhouder die betrouwbaar, duidelijk en bereikbaar is. Je website moet rust geven en direct laten zien voor wie je werkt.",
    proof:
      "Met duidelijke diensten, tarieven of pakketten en sterke contactmomenten wordt je website een bron van kwalitatieve aanvragen.",
    services: ["Dienstpagina's", "KennismakingsCTA", "FAQ", "Lokale SEO"],
  }),
  consultant: createIndustryPage({
    key: "consultant",
    singular: "consultant",
    plural: "consultants",
    badge: "Expertise overtuigend positioneren",
    customerNeed:
      "Consultants verkopen vertrouwen, expertise en resultaat. Je website moet snel duidelijk maken welk probleem je oplost en waarom jij de juiste keuze bent.",
    proof:
      "Door je propositie, bewijs en contactroute helder te maken, wordt je website een sterk kanaal voor kennismakingsgesprekken.",
    services: ["Positionering", "Case structuur", "Lead CTA", "AI-vriendelijke content"],
  }),
  salon: createIndustryPage({
    key: "salon",
    singular: "salon",
    plural: "salons",
    badge: "Verzorgde uitstraling en meer boekingen",
    customerNeed:
      "Salons worden gekozen op uitstraling, vertrouwen en gemak. Je website moet direct laten zien welke behandelingen je aanbiedt en hoe iemand eenvoudig boekt.",
    proof:
      "Met duidelijke behandelingen, sfeer, reviews en boekingsmomenten wordt je website een plek waar bezoekers sneller klant worden.",
    services: ["Behandelpagina's", "BoekingsCTA", "Reviews", "Lokale SEO"],
  }),
  klusbedrijf: createIndustryPage({
    key: "klusbedrijf",
    singular: "klusbedrijf",
    plural: "klusbedrijven",
    badge: "Meer offerteaanvragen voor lokale vakbedrijven",
    customerNeed:
      "Klanten zoeken betrouwbare vakmensen en vergelijken snel. Je website moet diensten, bereikbaarheid en bewijs van goed werk direct duidelijk maken.",
    proof:
      "Met projectvoorbeelden, heldere diensten en een offerteformulier wordt je website een praktisch kanaal voor nieuwe aanvragen.",
    services: ["Offerteformulier", "Projectbewijs", "Regio SEO", "WhatsApp contact"],
  }),
  fotograaf: createIndustryPage({
    key: "fotograaf",
    singular: "fotograaf",
    plural: "fotografen",
    badge: "Portfolio, stijl en boekingen overtuigend presenteren",
    customerNeed:
      "Fotografen worden gekozen op stijl en vertrouwen. Je website moet je beste werk direct tonen en bezoekers makkelijk naar een aanvraag leiden.",
    proof:
      "Een sterk portfolio, duidelijke pakketten en contactmomenten helpen bezoekers sneller beslissen of jouw stijl bij hun opdracht past.",
    services: ["Portfolio", "Lead CTA", "Mobiele snelheid", "Lokale vindbaarheid"],
  }),
  schoonmaakbedrijf: createIndustryPage({
    key: "schoonmaakbedrijf",
    singular: "schoonmaakbedrijf",
    plural: "schoonmaakbedrijven",
    badge: "Betrouwbaarheid en aanvragen voor schoonmaakdiensten",
    customerNeed:
      "Voor schoonmaakbedrijven is vertrouwen doorslaggevend. Je website moet duidelijk maken wat je doet, voor wie je werkt en hoe iemand een offerte aanvraagt.",
    proof:
      "Met heldere diensten, regio-informatie en bewijs van betrouwbaarheid wordt je website sterker voor bedrijven en particulieren die vergelijken.",
    services: ["Dienstenstructuur", "Offerte CTA", "Reviews", "Lokale SEO"],
  }),
};

const createBlogPost = ({
  slug,
  title,
  niche,
  intro,
  sections,
  ctaLink,
  ctaLabel,
  excerpt = undefined,
  faqs = [],
  internalLinks = [],
  seoTitle = undefined,
  seoDescription = undefined,
  priority = "0.7",
}) => ({
  slug,
  title,
  niche,
  intro,
  sections,
  ctaLink,
  ctaLabel,
  excerpt,
  faqs,
  internalLinks,
  priority,
  seo: {
    title: seoTitle || `${title} | Vedantix`,
    description: seoDescription || intro,
  },
});

export const blogPosts = [
  createBlogPost({
    slug: "waarom-je-website-geen-klanten-oplevert",
    title: "Waarom jouw website geen klanten oplevert",
    niche: "groei",
    intro:
      "Een website levert pas klanten op wanneer bezoekers snel begrijpen wat je doet, waarom ze je kunnen vertrouwen en welke volgende stap logisch is.",
    excerpt: "Ontdek waarom veel websites wel bestaan, maar geen aanvragen binnenhalen.",
    sections: [
      {
        title: "Een mooie website is niet automatisch een goede website",
        text:
          "Veel websites zien er netjes uit, maar missen duidelijke keuzes. Bezoekers zien niet direct voor wie de dienst is, welk probleem wordt opgelost of waarom ze contact moeten opnemen.",
      },
      {
        title: "Vertrouwen moet direct zichtbaar zijn",
        text:
          "Lokale ondernemers winnen vaker klanten wanneer reviews, voorbeelden, heldere diensten en contactopties direct zichtbaar zijn. Zonder vertrouwen blijven bezoekers vergelijken.",
      },
      {
        title: "Conversie vraagt om duidelijke contactmomenten",
        text:
          "Een telefoonnummer, WhatsApp-knop, offerteaanvraag of kennismakingsgesprek moet logisch en laagdrempelig zijn. Zo wordt de website een groeikanaal in plaats van alleen een visitekaartje.",
      },
    ],
    faqs: [
      {
        question: "Waarom krijg ik weinig aanvragen via mijn website?",
        answer:
          "Vaak ontbreekt een duidelijke propositie, lokale vindbaarheid, bewijs of een laagdrempelige call-to-action. Bezoekers haken dan af voordat ze contact opnemen.",
      },
      {
        question: "Hoe maakt Vedantix een website meer gericht op klanten?",
        answer:
          "Vedantix kijkt naar vindbaarheid, vertrouwen, snelheid, content, reviews en contactmomenten. Die onderdelen bepalen samen of bezoekers actie ondernemen.",
      },
    ],
    internalLinks: [
      { label: "Vraag een gratis Online Groei Audit aan", path: "/online-groei-audit" },
      { label: "Bekijk waarom ondernemers voor Vedantix kiezen", path: "/groeimodel" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Vraag een gratis Online Groei Audit aan →",
    seoTitle: "Waarom jouw website geen klanten oplevert | Vedantix",
    seoDescription:
      "Veel websites zien er goed uit maar leveren geen aanvragen op. Lees hoe vertrouwen, lokale vindbaarheid en duidelijke CTA's zorgen voor meer klanten.",
  }),

  createBlogPost({
    slug: "beter-gevonden-in-google-lokale-ondernemer",
    title: "Hoe word je beter gevonden in Google als lokale ondernemer?",
    niche: "seo",
    intro:
      "Lokale vindbaarheid begint met duidelijke diensten, sterke locatie-informatie en content die aansluit op wat klanten echt zoeken.",
    excerpt: "Praktische uitleg over lokale SEO voor ondernemers die meer aanvragen willen.",
    sections: [
      {
        title: "Begin met de zoekintentie van je klant",
        text:
          "Mensen zoeken vaak op dienst plus regio. Denk aan kapper in Den Bosch, personal trainer Eindhoven of schilder Breda. Je website moet deze vragen helder beantwoorden.",
      },
      {
        title: "Maak diensten en regio’s duidelijk vindbaar",
        text:
          "Een goede paginastructuur helpt Google begrijpen waar je bedrijf over gaat. Combineer dienstpagina’s, lokale signalen, reviews en duidelijke contactopties.",
      },
      {
        title: "Zorg dat bezoekers vertrouwen krijgen",
        text:
          "Vindbaarheid is pas waardevol als bezoekers contact opnemen. Daarom moeten reviews, voorbeelden, prijzen of werkwijze overzichtelijk aanwezig zijn.",
      },
    ],
    faqs: [
      {
        question: "Hoe snel word ik beter gevonden in Google?",
        answer:
          "Dat verschilt per markt en concurrentie. Een sterke technische basis, goede content en lokale signalen vergroten de kans op betere zichtbaarheid.",
      },
      {
        question: "Helpt Vedantix ook met lokale SEO?",
        answer:
          "Ja. Vedantix richt websites in op lokale vindbaarheid, duidelijke content, metadata, interne links en conversie.",
      },
    ],
    internalLinks: [
      { label: "Bekijk SEO en groei-aanpak", path: "/groeimodel" },
      { label: "Bekijk branches waarvoor Vedantix bouwt", path: "/voorwie" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Laat je lokale vindbaarheid analyseren →",
    seoTitle: "Beter gevonden worden in Google als lokale ondernemer | Vedantix",
    seoDescription:
      "Leer hoe lokale ondernemers beter gevonden worden in Google met duidelijke diensten, lokale SEO, reviews en een website die vertrouwen opbouwt.",
  }),

  createBlogPost({
    slug: "wat-is-een-ai-vriendelijke-website",
    title: "Wat is een AI-vriendelijke website?",
    niche: "ai",
    intro:
      "Een AI-vriendelijke website is duidelijk opgebouwd, inhoudelijk sterk en goed te begrijpen voor zoekmachines en moderne AI-assistenten.",
    excerpt: "Waarom duidelijke structuur en content belangrijker worden door AI-zoekmachines.",
    sections: [
      {
        title: "AI-systemen moeten je bedrijf kunnen begrijpen",
        text:
          "AI-assistenten kijken naar duidelijke informatie: wie je helpt, welke diensten je levert, waar je actief bent en waarom je betrouwbaar bent.",
      },
      {
        title: "Structuur maakt content sterker",
        text:
          "Heldere koppen, FAQ’s, interne links en structured data helpen zoekmachines en AI-platformen om je website beter te interpreteren.",
      },
      {
        title: "AI-vriendelijkheid begint bij de klantvraag",
        text:
          "Content moet vragen beantwoorden die potentiële klanten echt stellen. Daarmee word je beter vindbaar en overtuig je bezoekers sneller.",
      },
    ],
    faqs: [
      {
        question: "Is een AI-vriendelijke website hetzelfde als SEO?",
        answer:
          "Niet helemaal. SEO blijft belangrijk, maar AI-vriendelijke content legt extra nadruk op duidelijke context, vragen, antwoorden en gestructureerde informatie.",
      },
      {
        question: "Kan Vedantix mijn bestaande website AI-vriendelijker maken?",
        answer:
          "Ja. Vedantix kan structuur, content, FAQ’s, metadata en interne links verbeteren zodat je website beter te begrijpen is.",
      },
    ],
    internalLinks: [
      { label: "Lees hoe Vedantix online groei benadert", path: "/groeimodel" },
      { label: "Plan een kennismaking", path: "/contact" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Check je AI-zichtbaarheid met de audit →",
    seoTitle: "Wat is een AI-vriendelijke website? | Vedantix",
    seoDescription:
      "Een AI-vriendelijke website helpt zoekmachines en AI-assistenten je bedrijf beter begrijpen. Ontdek hoe structuur, FAQ's en content helpen.",
  }),

  createBlogPost({
    slug: "wat-is-geo",
    title: "Wat is GEO?",
    niche: "geo",
    intro:
      "GEO staat voor Generative Engine Optimization: je website zo duidelijk maken dat AI-platformen jouw bedrijf beter kunnen begrijpen, samenvatten en aanbevelen.",
    excerpt: "GEO uitgelegd voor lokale ondernemers die gevonden willen worden in AI-antwoorden.",
    sections: [
      {
        title: "GEO draait om begrijpelijke context",
        text:
          "AI-platformen zoeken naar duidelijke informatie over wie je bent, wat je doet, waar je actief bent en waarom je betrouwbaar bent. Hoe helderder die context, hoe beter je vindbaar wordt in nieuwe zoekervaringen.",
      },
      {
        title: "Het verschilt van klassieke SEO",
        text:
          "SEO richt zich vooral op zoekmachines en rankings. GEO kijkt ook naar hoe AI-systemen antwoorden samenstellen en welke bronnen ze betrouwbaar genoeg vinden om te gebruiken.",
      },
      {
        title: "Lokale ondernemers profiteren van duidelijke entiteiten",
        text:
          "Diensten, regio’s, reviews, cases, FAQ’s en contactinformatie maken je bedrijf concreter. Dat helpt bezoekers, Google én AI-systemen.",
      },
    ],
    faqs: [
      {
        question: "Is GEO belangrijk voor kleine ondernemers?",
        answer:
          "Ja. Steeds meer mensen gebruiken AI-platformen om bedrijven, diensten en oplossingen te vergelijken. Duidelijke content vergroot je kans om meegenomen te worden.",
      },
      {
        question: "Hoe helpt Vedantix met GEO?",
        answer:
          "Vedantix verbetert contentstructuur, FAQ’s, entiteiten, interne links en structured data zodat je website beter te begrijpen is.",
      },
    ],
    internalLinks: [
      { label: "Doe de Online Groei Audit", path: "/online-groei-audit" },
      { label: "Lees over AI-vriendelijke websites", path: "/blog/wat-is-een-ai-vriendelijke-website" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Check je GEO-kansen met de audit →",
    seoTitle: "Wat is GEO? | Vedantix",
    seoDescription:
      "GEO betekent Generative Engine Optimization. Lees hoe lokale ondernemers beter zichtbaar worden in AI-antwoorden met duidelijke content en structuur.",
  }),

  createBlogPost({
    slug: "wat-is-aeo",
    title: "Wat is AEO?",
    niche: "aeo",
    intro:
      "AEO staat voor Answer Engine Optimization: je website zo inrichten dat vragen van klanten direct en duidelijk worden beantwoord.",
    excerpt: "AEO uitgelegd: waarom vraag-antwoordcontent belangrijk is voor Google en AI.",
    sections: [
      {
        title: "AEO begint met klantvragen",
        text:
          "Veel klanten zoeken met vragen: wat kost het, hoe werkt het, wie kan mij helpen en waar moet ik op letten? AEO zorgt dat je website die vragen direct beantwoordt.",
      },
      {
        title: "FAQ’s versterken vertrouwen",
        text:
          "Goede FAQ’s nemen twijfel weg en helpen bezoekers sneller beslissen. Tegelijk geven ze zoekmachines duidelijke signalen over je expertise.",
      },
      {
        title: "Antwoorden moeten kort en concreet zijn",
        text:
          "AEO werkt het beste met heldere koppen, korte antwoorden, logische interne links en structured data zoals FAQPage schema.",
      },
    ],
    faqs: [
      {
        question: "Is AEO hetzelfde als FAQ toevoegen?",
        answer:
          "FAQ’s zijn een belangrijk onderdeel, maar AEO gaat breder: het gaat om duidelijke antwoorden, structuur, context en het wegnemen van twijfel.",
      },
      {
        question: "Waarom is AEO goed voor conversie?",
        answer:
          "Bezoekers die snel antwoord krijgen, bouwen sneller vertrouwen op en nemen eerder contact op.",
      },
    ],
    internalLinks: [
      { label: "Doe de Online Groei Audit", path: "/online-groei-audit" },
      { label: "Lees waarom websites geen klanten opleveren", path: "/blog/waarom-je-website-geen-klanten-oplevert" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Check je AEO met de audit →",
    seoTitle: "Wat is AEO? | Vedantix",
    seoDescription:
      "AEO staat voor Answer Engine Optimization. Ontdek hoe duidelijke antwoorden, FAQ's en schema je vindbaarheid en conversie verbeteren.",
  }),

  createBlogPost({
    slug: "waarom-social-media-alleen-niet-genoeg-is",
    title: "Waarom social media alleen niet genoeg is",
    niche: "groei",
    intro:
      "Social media kan aandacht opleveren, maar zonder sterke website mis je vertrouwen, vindbaarheid en een vaste plek waar bezoekers klant kunnen worden.",
    excerpt: "Waarom ondernemers naast social media ook een sterke website nodig hebben.",
    sections: [
      {
        title: "Social media is vluchtig",
        text:
          "Posts verdwijnen snel uit beeld. Een website blijft vindbaar, bundelt je diensten en geeft klanten altijd een plek om informatie en contactmogelijkheden te vinden.",
      },
      {
        title: "Je website bouwt vertrouwen op",
        text:
          "Een professionele website laat zien dat je bedrijf serieus is. Reviews, cases, diensten en contactgegevens versterken het vertrouwen dat social media vaak niet volledig kan bieden.",
      },
      {
        title: "De beste aanpak combineert beide",
        text:
          "Social media kan verkeer brengen, maar je website moet dat verkeer omzetten in afspraken, offerteaanvragen of WhatsApp-gesprekken.",
      },
    ],
    faqs: [
      {
        question: "Heb ik nog een website nodig als ik actief ben op Instagram?",
        answer:
          "Ja. Social media is waardevol, maar een website geeft controle, vindbaarheid in Google en een professionele basis voor aanvragen.",
      },
      {
        question: "Kan mijn website samenwerken met social media?",
        answer:
          "Ja. Vedantix kan social proof, WhatsApp, contactformulieren en campagnes slim laten aansluiten op je website.",
      },
    ],
    internalLinks: [
      { label: "Bekijk wat Vedantix oplevert", path: "/resultaten" },
      { label: "Bekijk pakketten", path: "/prijzen" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Ontdek waar je online kansen mist →",
    seoTitle: "Waarom social media alleen niet genoeg is | Vedantix",
    seoDescription:
      "Social media helpt met aandacht, maar een professionele website zorgt voor vertrouwen, Google-vindbaarheid en meer contactaanvragen.",
  }),

  createBlogPost({
    slug: "wat-kost-een-website-laten-maken",
    title: "Wat kost een website laten maken?",
    niche: "pricing",
    intro:
      "De kosten van een website hangen af van doelen, beheer, vindbaarheid, content en ondersteuning. Vergelijk daarom niet alleen prijs, maar vooral waarde.",
    excerpt: "Uitleg over prijs, waarde en abonnementskeuzes voor ondernemers.",
    sections: [
      {
        title: "Een website is meer dan een eenmalige oplevering",
        text:
          "Een website heeft hosting, onderhoud, updates en optimalisatie nodig. Daarom kijken veel ondernemers naar een abonnement dat zorgen wegneemt.",
      },
      {
        title: "Goedkoop kan duur worden als groei ontbreekt",
        text:
          "Een goedkope website zonder strategie kan weinig opleveren. Belangrijker is of de website vertrouwen opbouwt, vindbaar is en aanvragen stimuleert.",
      },
      {
        title: "Kies een pakket dat past bij je fase",
        text:
          "Starters hebben vaak een professionele basis nodig. Groeiende ondernemers hebben meer zichtbaarheid en optimalisatie nodig. Premium past bij doorlopende groei.",
      },
    ],
    faqs: [
      {
        question: "Waarom werkt Vedantix met pakketten?",
        answer:
          "Pakketten maken duidelijk wat inbegrepen is en zorgen dat hosting, onderhoud, zichtbaarheid en ondersteuning niet losse zorgen worden.",
      },
      {
        question: "Wijzigt dit artikel de prijzen van Vedantix?",
        answer:
          "Nee. De actuele pakketten en prijzen staan altijd op de prijzenpagina.",
      },
    ],
    internalLinks: [
      { label: "Bekijk alle pakketten en prijzen", path: "/prijzen" },
      { label: "Plan een kennismaking", path: "/contact" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Check je websitewaarde met de audit →",
    seoTitle: "Wat kost een website laten maken? | Vedantix",
    seoDescription:
      "Wat kost een website laten maken en waar betaal je eigenlijk voor? Lees hoe prijs, beheer, SEO en groei samenhangen.",
  }),

  createBlogPost({
    slug: "waarom-reviews-belangrijk-zijn-voor-lokale-vindbaarheid",
    title: "Waarom reviews belangrijk zijn voor lokale vindbaarheid",
    niche: "seo",
    intro:
      "Reviews helpen potentiële klanten vertrouwen krijgen en geven zoekmachines extra signalen over je betrouwbaarheid en lokale relevantie.",
    excerpt: "Zo versterken reviews je vertrouwen, Google-zichtbaarheid en conversie.",
    sections: [
      {
        title: "Reviews maken kiezen makkelijker",
        text:
          "Nieuwe klanten vergelijken vaak meerdere bedrijven. Positieve reviews helpen om twijfel te verminderen en sneller vertrouwen op te bouwen.",
      },
      {
        title: "Reviews ondersteunen lokale SEO",
        text:
          "Reviews, bedrijfsinformatie en lokale signalen kunnen bijdragen aan betere zichtbaarheid wanneer mensen zoeken naar diensten in hun regio.",
      },
      {
        title: "Plaats reviews op logische plekken",
        text:
          "Reviews werken het beste wanneer ze dicht bij contactmomenten, diensten en CTA’s staan. Zo versterken ze niet alleen vindbaarheid, maar ook conversie.",
      },
    ],
    faqs: [
      {
        question: "Moet ik reviews op mijn website tonen?",
        answer:
          "Ja, als dat kan. Reviews op je website helpen bezoekers sneller vertrouwen krijgen en versterken je professionele uitstraling.",
      },
      {
        question: "Helpt Vedantix met review-verwerking?",
        answer:
          "Vedantix kan reviews een duidelijke plek geven op je website en ze meenemen in de bredere online groeistrategie.",
      },
    ],
    internalLinks: [
      { label: "Bekijk resultaten en verbeterpunten", path: "/resultaten" },
      { label: "Vraag een Online Groei Audit aan", path: "/online-groei-audit" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Laat je reviews en zichtbaarheid bekijken →",
    seoTitle: "Waarom reviews belangrijk zijn voor lokale vindbaarheid | Vedantix",
    seoDescription:
      "Reviews helpen lokale ondernemers aan meer vertrouwen, betere zichtbaarheid en meer aanvragen. Lees waarom ze belangrijk zijn.",
  }),

  createBlogPost({
    slug: "waarom-google-reviews-belangrijk-zijn",
    title: "Waarom Google Reviews belangrijk zijn",
    niche: "reviews",
    intro:
      "Google Reviews helpen lokale ondernemers vertrouwen opbouwen, beter opvallen in zoekresultaten en meer contactmomenten creëren.",
    excerpt: "Waarom Google Reviews belangrijk zijn voor vertrouwen, lokale vindbaarheid en conversie.",
    sections: [
      {
        title: "Reviews beïnvloeden de eerste indruk",
        text:
          "Voordat iemand contact opneemt, kijkt die vaak naar ervaringen van anderen. Goede reviews verminderen twijfel en maken kiezen makkelijker.",
      },
      {
        title: "Google Reviews versterken lokale zichtbaarheid",
        text:
          "Een actief Google Bedrijfsprofiel met reviews, diensten, foto’s en recente informatie kan helpen om lokaal beter zichtbaar te zijn.",
      },
      {
        title: "Reviews moeten terugkomen op je website",
        text:
          "Zet reviews dicht bij belangrijke CTA’s. Zo versterken ze niet alleen je reputatie, maar ook je conversie.",
      },
    ],
    faqs: [
      {
        question: "Hoe vraag ik klanten om Google Reviews?",
        answer:
          "Vraag kort na een positieve ervaring om een review en maak het makkelijk met een directe reviewlink.",
      },
      {
        question: "Moet ik reageren op reviews?",
        answer:
          "Ja. Reageren laat zien dat je actief en betrokken bent. Dat versterkt vertrouwen bij nieuwe bezoekers.",
      },
    ],
    internalLinks: [
      { label: "Doe de Online Groei Audit", path: "/online-groei-audit" },
      { label: "Bekijk resultaten", path: "/resultaten" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Analyseer je reviews en vindbaarheid →",
    seoTitle: "Waarom Google Reviews belangrijk zijn | Vedantix",
    seoDescription:
      "Google Reviews helpen lokale ondernemers met vertrouwen, lokale vindbaarheid en meer aanvragen. Lees hoe je reviews beter benut.",
  }),

  createBlogPost({
    slug: "hoe-word-je-lokaal-beter-gevonden",
    title: "Hoe word je lokaal beter gevonden?",
    niche: "local",
    intro:
      "Lokaal beter gevonden worden vraagt om duidelijke diensten, sterke locatie-informatie, Google Business, reviews en content die aansluit op zoekvragen in jouw regio.",
    excerpt: "Een praktische uitleg over lokale vindbaarheid voor ondernemers.",
    sections: [
      {
        title: "Maak je dienstgebied duidelijk",
        text:
          "Laat zien in welke steden of regio’s je actief bent. Combineer dit met concrete diensten en klantvragen.",
      },
      {
        title: "Optimaliseer je Google Bedrijfsprofiel",
        text:
          "Controleer categorieën, diensten, foto’s, openingstijden, contactgegevens en reviews. Dit profiel is vaak de eerste indruk in Google.",
      },
      {
        title: "Gebruik lokale content zonder te overdrijven",
        text:
          "Unieke lokale pagina’s werken beter dan gekopieerde teksten. Vertel per regio wat relevant is voor klanten.",
      },
    ],
    faqs: [
      {
        question: "Wat is lokale vindbaarheid?",
        answer:
          "Lokale vindbaarheid betekent dat potentiële klanten je bedrijf vinden wanneer ze zoeken naar een dienst in hun regio.",
      },
      {
        question: "Kan Vedantix lokale pagina’s maken?",
        answer:
          "Ja. Vedantix maakt lokale SEO-content voor branches en steden met unieke teksten, FAQ’s en duidelijke CTA’s.",
      },
    ],
    internalLinks: [
      { label: "Doe de Online Groei Audit", path: "/online-groei-audit" },
      { label: "Bekijk branchepagina’s", path: "/voorwie" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Check je lokale vindbaarheid →",
    seoTitle: "Hoe word je lokaal beter gevonden? | Vedantix",
    seoDescription:
      "Leer hoe lokale ondernemers beter gevonden worden met Google Business, reviews, lokale SEO, duidelijke diensten en sterke content.",
  }),

  createBlogPost({
    slug: "hoe-werkt-een-gratis-online-groei-audit",
    title: "Hoe werkt een gratis Online Groei Audit?",
    niche: "audit",
    intro:
      "De Online Groei Audit laat zien waar je website, vindbaarheid en contactmomenten kansen laten liggen.",
    excerpt: "Wat Vedantix bekijkt tijdens een gratis Online Groei Audit.",
    sections: [
      {
        title: "We bekijken je online basis",
        text:
          "Denk aan snelheid, mobiele ervaring, duidelijke diensten, metadata, call-to-actions en de manier waarop vertrouwen wordt opgebouwd.",
      },
      {
        title: "We vergelijken met klantgedrag",
        text:
          "De audit kijkt niet alleen technisch, maar vooral commercieel: begrijpt een bezoeker snel wat je doet en waarom die contact moet opnemen?",
      },
      {
        title: "Je krijgt concrete verbeterpunten",
        text:
          "Het doel is duidelijkheid. Je ziet welke aanpassingen kunnen helpen voor meer zichtbaarheid, vertrouwen en aanvragen.",
      },
    ],
    faqs: [
      {
        question: "Is de Online Groei Audit echt vrijblijvend?",
        answer:
          "Ja. De audit is bedoeld om inzicht te geven in online kansen. Je zit nergens aan vast.",
      },
      {
        question: "Wat analyseert Vedantix tijdens de audit?",
        answer:
          "Vedantix bekijkt vindbaarheid, SEO, snelheid, mobiele ervaring, reviews, conversie en call-to-actions.",
      },
    ],
    internalLinks: [
      { label: "Start de gratis Online Groei Audit", path: "/online-groei-audit" },
      { label: "Bekijk de werkwijze", path: "/proces" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Vraag je gratis audit aan →",
    seoTitle: "Hoe werkt een gratis Online Groei Audit? | Vedantix",
    seoDescription:
      "Ontdek hoe Vedantix je website, SEO, snelheid, reviews en contactmomenten analyseert tijdens een gratis Online Groei Audit.",
  }),

  createBlogPost({
    slug: "website-laten-maken-waar-moet-je-op-letten",
    title: "Website laten maken: waar moet je op letten?",
    niche: "website",
    intro:
      "Laat je een website maken, kijk dan verder dan design. De beste website helpt je bedrijf betrouwbaarder overkomen, beter gevonden worden en meer aanvragen krijgen.",
    excerpt: "Waar ondernemers op moeten letten voordat ze een website laten maken.",
    sections: [
      {
        title: "Begin bij het doel van je website",
        text:
          "Wil je meer afspraken, offerteaanvragen, telefoontjes of WhatsApp-gesprekken? Dat doel bepaalt structuur, content en call-to-actions.",
      },
      {
        title: "Vraag naar beheer en onderhoud",
        text:
          "Een website is nooit echt af. Hosting, beveiliging, updates en verbeteringen bepalen of je online basis betrouwbaar blijft.",
      },
      {
        title: "Let op vindbaarheid vanaf dag één",
        text:
          "SEO moet vanaf het begin worden meegenomen. Zo voorkom je dat je later opnieuw moet investeren in structuur, content en techniek.",
      },
    ],
    faqs: [
      {
        question: "Wat is belangrijker: design of vindbaarheid?",
        answer:
          "Beide zijn belangrijk. Design bouwt vertrouwen op, maar vindbaarheid zorgt dat potentiële klanten je überhaupt vinden.",
      },
      {
        question: "Kan Vedantix alles onder één dak regelen?",
        answer:
          "Ja. Vedantix combineert website, hosting, onderhoud, SEO, content en support voor lokale ondernemers.",
      },
    ],
    internalLinks: [
      { label: "Bekijk pakketten", path: "/prijzen" },
      { label: "Bekijk waarom Vedantix anders is", path: "/groeimodel" },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
    seoTitle: "Website laten maken: waar moet je op letten? | Vedantix",
    seoDescription:
      "Een website laten maken? Let op vindbaarheid, vertrouwen, onderhoud en conversie. Lees waar lokale ondernemers op moeten letten.",
  }),

  createBlogPost({
    slug: "meer-klanten-kapper",
    title: "Meer klanten krijgen als kapper",
    niche: "kapper",
    intro:
      "Als kapper wil je een volle agenda. De snelste manier om dat te bereiken is door lokaal goed zichtbaar te zijn in Google en bezoekers via je website om te zetten in afspraken.",
    sections: [
      {
        title: "1. Zorg dat je lokaal vindbaar bent",
        text:
          "Maak landingspagina’s en content rondom zoekopdrachten zoals “kapper amsterdam” of “kapper rotterdam”. Daarmee trek je bezoekers aan die al actief op zoek zijn naar jouw dienst.",
      },
      {
        title: "2. Maak een afspraak boeken zo makkelijk mogelijk",
        text:
          "Voeg een duidelijke afspraakknop, WhatsApp-link en contactformulier toe. Hoe minder drempels, hoe groter de kans dat een bezoeker klant wordt.",
      },
      {
        title: "3. Gebruik interne links slim",
        text:
          "Verbind je blogartikelen met je SEO-pagina’s en dienstenpagina’s. Dat helpt Google om je website beter te begrijpen en verhoogt tegelijk de kans op conversie.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),

  createBlogPost({
    slug: "meer-klanten-salon",
    title: "Meer klanten krijgen als salon",
    niche: "salon",
    intro:
      "Als salon wil je meer boekingen en een volle agenda. Een goede website helpt je om lokaal beter gevonden te worden en bezoekers sneller om te zetten in klanten.",
    sections: [
      {
        title: "1. Laat klanten direct online boeken",
        text:
          "Hoe sneller iemand een afspraak kan inplannen, hoe groter de kans op conversie. Zorg dus voor een duidelijke boekingsknop op je website.",
      },
      {
        title: "2. Bouw vertrouwen op met sfeer en duidelijkheid",
        text:
          "Toon reviews, behandelingen, foto's en een nette uitstraling. Bezoekers beslissen vaak binnen enkele seconden of jouw salon professioneel aanvoelt.",
      },
      {
        title: "3. Werk aan lokale SEO",
        text:
          "Gebruik pagina’s per stad of regio om beter te ranken in Google en meer bezoekers uit jouw omgeving aan te trekken.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),

  createBlogPost({
    slug: "meer-offertes-klusbedrijf",
    title: "Meer offertes krijgen als klusbedrijf",
    niche: "klusbedrijf",
    intro:
      "Als klusbedrijf wil je continu nieuwe aanvragen ontvangen. Een sterke website helpt je om vertrouwen op te bouwen en meer offerteaanvragen binnen te halen.",
    sections: [
      {
        title: "1. Laat eerder werk zien",
        text:
          "Projectfoto’s, voorbeelden en korte cases laten direct zien wat je kunt. Dat vergroot de kans dat bezoekers contact opnemen.",
      },
      {
        title: "2. Maak contact laagdrempelig",
        text:
          "Gebruik formulieren, telefoonlinks en WhatsApp zodat potentiële klanten snel en eenvoudig een aanvraag kunnen doen.",
      },
      {
        title: "3. Gebruik lokale pagina’s",
        text:
          "Door per stad of regio pagina’s te maken, vergroot je jouw vindbaarheid in Google en trek je gerichter klanten aan.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),

  createBlogPost({
    slug: "meer-reserveringen-restaurant",
    title: "Meer reserveringen krijgen als restaurant",
    niche: "restaurant",
    intro:
      "Een restaurantwebsite moet vooral reserveringen opleveren. Door de juiste informatie direct zichtbaar te maken, vergroot je de kans dat bezoekers ook echt gasten worden.",
    sections: [
      {
        title: "1. Toon direct je menu en sfeer",
        text:
          "Bezoekers willen meteen zien wat je aanbiedt, hoe je zaak eruitziet en of jouw restaurant bij hen past.",
      },
      {
        title: "2. Optimaliseer voor mobiel",
        text:
          "Veel reserveringen gebeuren via mobiel. Zorg dus dat je website snel laadt en eenvoudig werkt op kleine schermen.",
      },
      {
        title: "3. Versterk je lokale vindbaarheid",
        text:
          "Gebruik stadspagina’s, lokale zoekwoorden en goede metadata om beter zichtbaar te zijn wanneer mensen restaurants in de buurt zoeken.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),

  createBlogPost({
    slug: "meer-boekingen-fotograaf",
    title: "Meer boekingen krijgen als fotograaf",
    niche: "fotograaf",
    intro:
      "Als fotograaf moet je website jouw stijl en kwaliteit uitstralen. Een sterke portfolio-site helpt je om vertrouwen op te bouwen en meer shoots te boeken.",
    sections: [
      {
        title: "1. Toon je beste werk direct",
        text:
          "Je portfolio is je sterkste verkoopmiddel. Zorg dat bezoekers meteen jouw beste beelden zien en begrijpen welk type fotografie je aanbiedt.",
      },
      {
        title: "2. Maak aanvragen eenvoudig",
        text:
          "Gebruik duidelijke call-to-actions, formulieren en WhatsApp-links zodat geïnteresseerden direct contact kunnen opnemen.",
      },
      {
        title: "3. Werk aan lokale SEO",
        text:
          "Door lokaal beter vindbaar te zijn, vergroot je de kans op nieuwe opdrachten in jouw regio.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),

  createBlogPost({
    slug: "meer-klanten-schoonmaakbedrijf",
    title: "Meer klanten krijgen als schoonmaakbedrijf",
    niche: "schoonmaakbedrijf",
    intro:
      "Voor schoonmaakbedrijven is vertrouwen een doorslaggevende factor. Een professionele website helpt je om betrouwbaarder over te komen en meer aanvragen te krijgen.",
    sections: [
      {
        title: "1. Laat duidelijk zien welke diensten je aanbiedt",
        text:
          "Bezoekers moeten direct begrijpen wat je doet, voor wie je werkt en in welke regio je actief bent.",
      },
      {
        title: "2. Bouw vertrouwen op",
        text:
          "Gebruik reviews, heldere informatie en een professionele presentatie om twijfel weg te nemen.",
      },
      {
        title: "3. Groei via lokale SEO",
        text:
          "Met pagina’s per stad of regio vergroot je jouw zichtbaarheid in Google en trek je meer relevante bezoekers aan.",
      },
    ],
    ctaLink: "/online-groei-audit",
    ctaLabel: "Doe de gratis Online Groei Audit →",
  }),
];

export const basePages = [
  { path: "/", priority: "1.0" },
  { path: "/prijzen", priority: "0.8" },
  { path: "/resultaten", priority: "0.8" },
  { path: "/online-groei-audit", priority: "0.9" },
  { path: "/ai-vindbaarheid", priority: "0.9" },
  { path: "/groeimodel", priority: "0.8" },
  { path: "/proces", priority: "0.8" },
  { path: "/faq", priority: "0.7" },
  { path: "/contact", priority: "0.7" },
  { path: "/privacy", priority: "0.4" },
  { path: "/terms", priority: "0.4" },
  { path: "/data-deletion", priority: "0.4" },
  { path: "/planning", priority: "0.6" },
  { path: "/starters", priority: "0.6" },
  { path: "/templates", priority: "0.6" },
  { path: "/vedantixhome", priority: "0.3" },
  { path: "/voorwie", priority: "0.6" },
];

export const nichePages = [
  { path: "/website-kapper", priority: "0.9", niche: "kapper" },
  { path: "/website-salon", priority: "0.9", niche: "salon" },
  { path: "/website-klusbedrijf", priority: "0.9", niche: "klusbedrijf" },
  { path: "/website-restaurant", priority: "0.9", niche: "restaurant" },
  { path: "/website-fotograaf", priority: "0.9", niche: "fotograaf" },
  { path: "/website-schoonmaakbedrijf", priority: "0.9", niche: "schoonmaakbedrijf" },
  { path: "/website-zzp", priority: "0.9", niche: "zzp" },
];

export const locationPages = Object.keys(niches).flatMap((nicheKey) =>
  cities.map((city) => ({
    path: `/website/${nicheKey}/${city.slug}`,
    priority: "0.8",
    niche: nicheKey,
    city: city.slug,
  }))
);

export const industryPages = Object.values(industries).map((industry) => ({
  path: industry.path,
  priority: "0.85",
  industry: industry.key,
}));

export const industryLocationPages = Object.values(industries).flatMap((industry) =>
  localSeoCities.map((city) => ({
    path: `/website/${industry.key}/${city.slug}`,
    priority: "0.78",
    industry: industry.key,
    city: city.slug,
  }))
);
