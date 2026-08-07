/**
 * The canonical public origin, for metadataBase, robots, and the sitemap.
 *
 * Order matters. NEXT_PUBLIC_SITE_URL wins so a custom domain can be named
 * without a code change. VERCEL_PROJECT_PRODUCTION_URL is the stable
 * production host, unlike VERCEL_URL which is per deployment and would put
 * preview hostnames into canonical tags and share cards.
 */

const FALLBACK_ORIGIN = "https://mood-taster.vercel.app";

function normalize(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export function siteOrigin(): string {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL ?? "") ??
    normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "") ??
    FALLBACK_ORIGIN
  );
}

export function siteUrl(path = "/"): string {
  return new URL(path, siteOrigin()).toString();
}
