import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Mood Taster handles information: what we collect, what we do not, and how to reach us.",
};

export default function PrivacyPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="legal" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Trust · Privacy</p>
          <h1>Privacy</h1>
          <p className="lede">
            Mood Taster starts from how you feel and ends with a taste pick. We
            keep that path simple, and we keep what we learn about you minimal.
          </p>
          <p className="doc-meta">Last updated: August 6, 2026</p>
        </header>

        <article className="doc-body">
          <section id="overview" aria-labelledby="overview-title">
            <h2 id="overview-title">Overview</h2>
            <p>
              This page explains what information Mood Taster may collect when
              you use the site, how we use it, and what we do not do with it. It
              applies to{" "}
              <a href="https://mood-taster.vercel.app/">mood-taster.vercel.app</a>{" "}
              and related Mood Taster experiences we operate.
            </p>
          </section>

          <section id="collect" aria-labelledby="collect-title">
            <h2 id="collect-title">What we collect</h2>
            <p>Depending on how you use the product, we may process:</p>
            <ul>
              <li>
                Mood and craving answers you submit to get a recommendation
              </li>
              <li>
                Optional feedback on a pick (for example Nailed it / Kinda /
                Nope)
              </li>
              <li>
                Basic technical data such as browser type, device class, pages
                viewed, and approximate location derived from IP (for reliability
                and abuse prevention)
              </li>
              <li>
                Messages you send us through the{" "}
                <Link href="/contact">contact</Link> path
              </li>
            </ul>
            <p>
              V1 does not require an account. We do not ask for a name, email, or
              payment details to use the core mood → match → act flow.
            </p>
          </section>

          <section id="use" aria-labelledby="use-title">
            <h2 id="use-title">How we use it</h2>
            <ul>
              <li>To generate and improve taste recommendations</li>
              <li>To understand whether picks feel right and fix weak ones</li>
              <li>To keep the service working, secure, and measurable</li>
              <li>To respond when you contact us</li>
            </ul>
          </section>

          <section id="not-do" aria-labelledby="not-do-title">
            <h2 id="not-do-title">What we do not do</h2>
            <ul>
              <li>
                We do not sell personal information or individual taste profiles
              </li>
              <li>
                We do not use your mood answers as a wellness, medical, or
                dietary diagnosis
              </li>
              <li>
                We do not bury sponsored placements. When paid matches appear,
                they are labeled
              </li>
            </ul>
          </section>

          <section id="cookies" aria-labelledby="cookies-title">
            <h2 id="cookies-title">Cookies and analytics</h2>
            <p>
              We may use first-party storage and privacy-conscious analytics to
              understand traffic and product quality. You can control cookies
              through your browser settings. Blocking some storage may limit
              features that remember a session preference.
            </p>
          </section>

          <section id="retention" aria-labelledby="retention-title">
            <h2 id="retention-title">Retention</h2>
            <p>
              We keep operational and analytics data only as long as it is useful
              for the purposes above, then delete or aggregate it. Contact
              messages are kept long enough to resolve your request.
            </p>
          </section>

          <section id="children" aria-labelledby="children-title">
            <h2 id="children-title">Children</h2>
            <p>
              Mood Taster is not directed at children under 13. If you believe a
              child has provided personal information, contact us and we will
              delete it.
            </p>
          </section>

          <section id="changes" aria-labelledby="changes-title">
            <h2 id="changes-title">Changes</h2>
            <p>
              If this policy changes in a material way, we will update the date
              above. Continued use after an update means you accept the revised
              policy.
            </p>
          </section>

          <section id="contact" aria-labelledby="contact-title">
            <h2 id="contact-title">Contact</h2>
            <p>
              Questions about privacy: see{" "}
              <Link href="/contact">Contact</Link>, or open an issue on{" "}
              <a href="https://github.com/mml555/Mood_Taster">GitHub</a>.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
