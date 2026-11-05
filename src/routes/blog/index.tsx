import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Blog";

export const Route = createFileRoute("/blog/")({
  head: () => publicHead("Blog over websites en vindbaarheid | Vedantix", "Praktische artikelen over website laten maken, SEO en online vindbaarheid voor ondernemers. Lees onze bestaande kennisartikelen en diensten.", "/blog"),
  component: Page,
});
