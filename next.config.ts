import type { NextConfig } from "next";

/**
 * Supabase is the only origin the browser talks to besides our own. Resolved at
 * build time so the CSP names the actual project rather than the whole vendor.
 * The wildcard is the fallback for a build with the env unset, which would
 * otherwise ship a connect-src that blocks sign-up and account loading.
 */
function supabaseOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Fall through to the wildcard.
    }
  }
  return "https://*.supabase.co";
}

/**
 * PostHog ingest origin, when analytics is configured. track() posts straight
 * to this host from the browser, so leaving it out of connect-src means the CSP
 * silently drops every event in production while the product looks fine.
 * Returns an empty string when unset, which keeps the directive unchanged.
 */
function analyticsOrigin(): string {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return "";

  const raw = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  try {
    return new URL(raw || "https://us.i.posthog.com").origin;
  } catch {
    return "https://us.i.posthog.com";
  }
}

/**
 * script-src carries 'unsafe-inline' because the App Router streams the RSC
 * payload through inline script tags. Locking that down means nonce plumbing
 * through middleware, which is a larger change than this one. The directives
 * that do real work here are frame-ancestors (clickjacking on /login and
 * /account), connect-src, object-src, and base-uri.
 */
function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${["'self'", supabaseOrigin(), analyticsOrigin()].filter(Boolean).join(" ")}`,
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The result screen asks for geolocation. Nothing else is needed.
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  // Vercel already sends this. Stated here so it survives a change of host.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/food/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
