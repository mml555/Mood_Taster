import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Skip static assets and public enhancement APIs that never need a session
 * refresh. Keeping explain/places/adjust off this path cuts TTFB on the
 * result screen's hottest calls.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/explain|api/places|api/adjust|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
