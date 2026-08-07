import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist. Start a taste session instead.",
  robots: { index: false, follow: true },
};

/**
 * 404. Every exit here is a way back into the mood to match flow rather than a
 * dead end, since the most likely arrival is a stale or mistyped result link.
 */
export default function NotFound() {
  return (
    <div className="doc-page">
      <main className="doc">
        <header className="doc-hero">
          <p className="doc-back">
            <Link href="/">Mood Taster</Link>
          </p>
          <p className="eyebrow">404</p>
          <h1>We could not find that page</h1>
          <p className="lede">
            The link may be old, or the pick it pointed at has moved on. Your
            taste profile is untouched.
          </p>
        </header>

        <article className="doc-body">
          <div className="cta-row">
            <Link className="cta" href="/taste">
              Find something to eat
            </Link>
            <Link className="cta-secondary" href="/">
              Back home
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
