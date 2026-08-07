import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Only the public, stable routes. Session-backed pages (/account, /dna,
 * /history, /result/[id]) are excluded here and disallowed in robots.ts.
 *
 * Priorities rank the entry points to the mood to match flow above the
 * source-of-truth documents, which are for humans auditing the product rather
 * than for people deciding what to eat.
 */
const ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/taste", priority: 0.9, changeFrequency: "weekly" },
  { path: "/signup", priority: 0.5, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" },
  { path: "/prd", priority: 0.3, changeFrequency: "monthly" },
  { path: "/strategy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/brand", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: siteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
