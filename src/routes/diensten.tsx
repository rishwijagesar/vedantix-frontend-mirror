import { createFileRoute } from "@tanstack/react-router";
import Page, { servicesTitle, servicesDescription } from "@/pages/Diensten";
import { publicHead } from "@/lib/public-head";
export const Route = createFileRoute("/diensten")({ head: () => publicHead(servicesTitle, servicesDescription, "/diensten"), component: Page });
