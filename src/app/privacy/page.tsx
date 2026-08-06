import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Mood Taster handles information: Taste DNA, aggregate-only commercial use, consent, and what we never sell.",
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
            keep that path simple, and we never sell your personal Taste DNA.
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
                <strong>Taste DNA</strong>: a preference profile built from your
                sessions and feedback. As a guest, it stays on your device. If
                you create an optional account, it may sync to your profile so
                you can use it across devices
              </li>
              <li>
                Account details you choose to provide (for example username,
                email, and password) when you sign up
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
              An account is optional. You can use the core mood → match → act
              flow as a guest with local Taste DNA and no name, email, or payment
              details.
            </p>
          </section>

          <section id="use" aria-labelledby="use-title">
            <h2 id="use-title">How we use it</h2>
            <ul>
              <li>To generate and improve taste recommendations</li>
              <li>To understand whether picks feel right and fix weak ones</li>
              <li>To keep the service working, secure, and measurable</li>
              <li>To sync Taste DNA when you choose an account</li>
              <li>To respond when you contact us</li>
            </ul>
          </section>

          <section id="commercial-data" aria-labelledby="commercial-data-title">
            <h2 id="commercial-data-title">Commercial aggregate data</h2>
            <p>
              Later commercial products may use{" "}
              <strong>anonymized, aggregated craving trends</strong> (for
              example flavor and texture demand by region). Those products are
              aggregate only. They never include individual Taste DNA, named
              users, or a user-level export for buyers.
            </p>
            <p>
              Any commercial analytics of this kind requires{" "}
              <strong>explicit, unbundled consent</strong>. Using the core
              product does not by itself enroll you in commercial aggregate
              products. We apply a hard floor on how few users can sit behind any
              reported statistic so small groups cannot be re-identified.
            </p>
            <p>
              Restaurant dashboards, when offered, show restaurant-scoped or
              aggregated match stats (what people wanted when they found that
              place). They do not sell named diner profiles.
            </p>
            <p>
              See the public <Link href="/strategy">Strategy</Link> for how
              aggregate taste intelligence fits the business. The promise here
              is the binding one: never sell personal Taste DNA.
            </p>
          </section>

          <section id="not-do" aria-labelledby="not-do-title">
            <h2 id="not-do-title">What we do not do</h2>
            <ul>
              <li>
                We do not sell personal information, individual taste profiles,
                or personal Taste DNA
              </li>
              <li>
                We do not provide a user-level commercial export of your Taste
                DNA to third parties
              </li>
              <li>
                We do not use your mood answers as a wellness, medical, or
                dietary diagnosis
              </li>
              <li>
                We do not bury paid placements. When a paid match or promotion
                appears, it is labeled
              </li>
            </ul>
          </section>

          <section id="consent" aria-labelledby="consent-title">
            <h2 id="consent-title">Consent</h2>
            <p>
              Product analytics that help us improve recommendations and
              reliability may run as part of operating the service. Commercial
              aggregate taste intelligence is separate. When that product
              exists, we will ask for opt-in consent that is not buried in
              general terms alone.
            </p>
          </section>

          <section id="cookies" aria-labelledby="cookies-title">
            <h2 id="cookies-title">Cookies and analytics</h2>
            <p>
              We may use first-party storage and privacy-conscious analytics to
              understand traffic and product quality. You can control cookies
              through your browser settings. Blocking some storage may limit
              features that remember a session preference or local Taste DNA.
            </p>
          </section>

          <section id="retention" aria-labelledby="retention-title">
            <h2 id="retention-title">Retention and deletion</h2>
            <p>
              We keep operational and analytics data only as long as it is useful
              for the purposes above, then delete it or convert it into
              aggregate form that cannot identify you. Contact messages are kept
              long enough to resolve your request.
            </p>
            <p>
              If you ask us to delete your account or personal Taste DNA we
              hold, we delete it. Aggregation after retention is not a
              substitute for that deletion request.
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
