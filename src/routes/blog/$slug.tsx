import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/pages/blog/BlogPost";
import { createBlogHead } from "@/lib/blog-seo";
import { blogPosts } from "@/data/seoData";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    if (!blogPosts.some((post) => post.slug === params.slug)) throw notFound();
  },
  head: ({ params }) => createBlogHead(params.slug),
  component: Page,
});
