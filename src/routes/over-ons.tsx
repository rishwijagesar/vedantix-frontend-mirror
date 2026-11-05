import { createFileRoute } from "@tanstack/react-router";
import NavBar from "@/components/NavBar";
import SEO from "@/components/SEO";
import HomeFounderSection from "@/pages/HomeFounderSection";
import { publicHead } from "@/lib/public-head";
import { createAboutPageSchema, createBreadcrumbSchema } from "@/utils/schema";
import { SCAN_URL } from "@/data/positioning";
import "@/styles/services.css";

const title = "Over Vedantix | Software op maat vanuit Den Bosch";
const description = "Maak kennis met Vedantix en Rishwi. Bedrijfssoftware op maat, websites en hosting voor mkb en zelfstandigen in heel Nederland, met heldere afspraken.";
const canonical = "https://vedantix.nl/over-ons";
export const Route = createFileRoute("/over-ons")({ head: () => publicHead(title, description, "/over-ons"), component: AboutPage });
function AboutPage() {
  return <><SEO title={title} description={description} canonical={canonical} schemas={[createAboutPageSchema({ name: title, description, url: canonical }), createBreadcrumbSchema([{ name: "Home", url: "https://vedantix.nl/" }, { name: "Over ons", url: canonical }])]} /><NavBar /><main className="services-page">
    <section className="services-intro"><div className="services-wrap"><span className="services-kicker">Den Bosch · heel Nederland</span><h1>Over Vedantix</h1><p>Software die meegroeit met jouw bedrijf. We helpen het mkb en zelfstandigen om bedrijfsprocessen samen te brengen in een applicatie op maat. Websites, hosting en vindbaarheid blijven volwaardige diensten.</p><a className="services-button" href={SCAN_URL}>Plan een bedrijfsscan →</a></div></section>
    <HomeFounderSection />
    <section className="services-section"><div className="services-wrap"><h2>Eerst begrijpen. Dan bouwen.</h2><p>We starten bij het werk van jouw mensen, niet bij een lijst tools. Een bedrijfsscan maakt processen, abonnementen en handwerk zichtbaar. Daaruit volgt een concreet voorstel met fases, afspraken en kosten.</p><p>AI helpt ons bij de ontwikkeling. Professionele controle, testen en jouw acceptatie horen bij de aanpak. Beheer, gegevensverwerking en overdracht worden afgestemd op het project en vooraf vastgelegd.</p><p><a href="/software-op-maat">Software op maat</a> · <a href="/proces">Werkwijze</a> · <a href="/resultaten">Gerealiseerde websiteklantcases</a> · <a href="/prijzen">Websiteprijzen en hosting</a></p></div></section>
  </main></>;
}