"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

/**
 * Route-level error boundary. Without this, an uncaught render error in
 * production shows the stock Next.js screen with no way back into the flow.
 *
 * `digest` is the only detail worth surfacing: it is the server-side hash of
 * the real error, so a user can quote it in a report while the message and
 * stack stay off the page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] render error:", error);
    track(ANALYTICS_EVENTS.error, {
      digest: error.digest ?? null,
      boundary: "route",
    });
  }, [error]);

  return (
    <div className="doc-page">
      <SiteHeader current="home" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Something broke</p>
          <h1>That did not go through</h1>
          <p className="lede">
            A problem on our side stopped this screen from loading. Your taste
            profile and saved picks are safe.
          </p>
        </header>

        <article className="doc-body">
          <div className="cta-row">
            <button className="cta" type="button" onClick={reset}>
              Try again
            </button>
            <Link className="cta-secondary" href="/">
              Back home
            </Link>
          </div>
          {error.digest ? (
            <p className="doc-meta">Reference: {error.digest}</p>
          ) : null}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
