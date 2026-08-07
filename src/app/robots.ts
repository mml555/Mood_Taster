import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Crawlers get the marketing and doc surfaces. Everything behind a session, or
 * generated per session, is disallowed: those pages are either empty or
 * personal to one user, so indexing them wastes crawl budget and risks putting
 * someone's result screen in a search listing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account",
          "/dna",
          "/explore",
          "/favorites",
          "/history",
          "/passport",
          "/result/",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}
