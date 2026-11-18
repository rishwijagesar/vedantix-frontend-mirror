import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page, { SCAN_TITLE, SCAN_DESCRIPTION } from "@/pages/Bedrijfsscan";

export const Route = createFileRoute("/bedrijfsscan")({
  head: () => publicHead(SCAN_TITLE, SCAN_DESCRIPTION, "/bedrijfsscan"),
  component: Page,
});
