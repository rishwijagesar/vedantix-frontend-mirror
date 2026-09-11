import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/blog/BlogPost";
import { createBlogHead } from "@/lib/blog-seo";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => createBlogHead(params.slug),
  component: Page,
});
