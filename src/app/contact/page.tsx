import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Mood Taster: product questions, privacy, and feedback.",
};

export default function ContactPage() {
  return (
    <div className="doc-page">
      <main className="doc">
        <header className="doc-hero">
          <p className="doc-back">
            <Link href="/">Mood Taster</Link>
          </p>
          <p className="eyebrow">Trust · Contact</p>
          <h1>Contact us</h1>
          <p className="lede">
            Product questions, privacy requests, or feedback on a pick. We read
            every note we can.
          </p>
        </header>

        <article className="doc-body">
          <section id="how" aria-labelledby="how-title">
            <h2 id="how-title">How to reach us</h2>
            <p>
              The fastest public path right now is GitHub. Open an issue for
              bugs, feature ideas, or general questions:
            </p>
            <ul>
              <li>
                <a href="https://github.com/mml555/Mood_Taster/issues">
                  GitHub issues
                </a>
              </li>
              <li>
                Repository:{" "}
                <a href="https://github.com/mml555/Mood_Taster">
                  mml555/Mood_Taster
                </a>
              </li>
            </ul>
          </section>

          <section id="about" aria-labelledby="about-title">
            <h2 id="about-title">What to include</h2>
            <ul>
              <li>What you were trying to do (lane, mood cues, result)</li>
              <li>Device and browser, if something broke</li>
              <li>
                For privacy requests, say what you want deleted or clarified
              </li>
            </ul>
            <p>
              Do not send passwords, payment details, or sensitive personal data
              in a public issue. If your note must stay private, say so in the
              issue title and we will follow up off-thread when we can.
            </p>
          </section>

          <section id="docs" aria-labelledby="docs-title">
            <h2 id="docs-title">Related</h2>
            <ul>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of use</Link>
              </li>
              <li>
                <Link href="/prd">Product requirements</Link>
              </li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}
