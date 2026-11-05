import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQ";

const title = "FAQ | Websites, AI-oplossingen, apps en prijzen | Vedantix";
const description = "Antwoorden over websites, AI-oplossingen, apps, prijzen, hosting, SEO en AI-vindbaarheid bij Vedantix.";

export const Route = createFileRoute("/faq")({
  head: () => publicHead("FAQ over software op maat, websites en beheer | Vedantix", "Antwoorden over bedrijfsscans, software op offerte, gebruik, beveiligingsafspraken, websites, hosting en SEO bij Vedantix.", "/faq"),
  component: Page,
});

