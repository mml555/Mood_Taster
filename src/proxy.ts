import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

/**
 * Skip static assets and public enhancement APIs that never need a session
 * refresh. Keeping explain/places/adjust off this path cuts TTFB on the
 * result screen's hottest calls.
 *
 * The metadata routes are excluded for the same reason: they are anonymous by
 * definition, and crawlers hit them often enough that a Supabase session
 * refresh per request is pure waste.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|api/explain|api/places|api/adjust|api/match|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
