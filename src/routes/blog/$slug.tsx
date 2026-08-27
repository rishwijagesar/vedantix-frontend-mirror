import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/blog/BlogPost";

export const Route = createFileRoute("/blog/$slug")({
  component: Page,
});
