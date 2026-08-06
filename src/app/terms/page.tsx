import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for Mood Taster: what the product is, what it is not, and the rules for using it.",
};

export default function TermsPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="legal" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Trust · Terms</p>
          <h1>Terms of use</h1>
          <p className="lede">
            Plain rules for using Mood Taster. Read them with the{" "}
            <Link href="/privacy">Privacy</Link> page.
          </p>
          <p className="doc-meta">Last updated: August 6, 2026</p>
        </header>

        <article className="doc-body">
          <section id="agreement" aria-labelledby="agreement-title">
            <h2 id="agreement-title">Agreement</h2>
            <p>
              By using Mood Taster, you agree to these terms. If you do not
              agree, do not use the service.
            </p>
          </section>

          <section id="service" aria-labelledby="service-title">
            <h2 id="service-title">What Mood Taster is</h2>
            <p>
              Mood Taster is a tasting companion. You describe how you feel (or
              pick short craving cues), and we suggest a dish, place path, or
              snack direction with a brief reason it fits. It is not a therapist,
              doctor, dietitian, delivery service, or calorie counter.
            </p>
          </section>

          <section id="not-advice" aria-labelledby="not-advice-title">
            <h2 id="not-advice-title">Not professional advice</h2>
            <p>
              Recommendations are for inspiration and convenience. They are not
              medical, nutritional, allergen, or legal advice. Always use your
              own judgment for allergies, dietary needs, and safety. Verify
              restaurant hours, menus, and ingredients yourself before you act.
            </p>
          </section>

          <section id="use" aria-labelledby="use-title">
            <h2 id="use-title">Acceptable use</h2>
            <ul>
              <li>Use the service for lawful, personal purposes</li>
              <li>
                Do not attempt to disrupt, scrape at abusive scale, or reverse
                engineer the service in ways that harm others
              </li>
              <li>
                Do not submit content that is illegal, harassing, or intended to
                compromise the service
              </li>
            </ul>
          </section>

          <section id="availability" aria-labelledby="availability-title">
            <h2 id="availability-title">Availability</h2>
            <p>
              We may change, pause, or discontinue features at any time. Early
              versions may be incomplete, experimental, or limited to certain
              cities or lanes.
            </p>
          </section>

          <section id="ip" aria-labelledby="ip-title">
            <h2 id="ip-title">Intellectual property</h2>
            <p>
              Mood Taster branding, copy, and product design belong to us or our
              licensors. You may not copy or reuse them for a competing product
              without permission. Third-party names (restaurants, recipes,
              places) remain with their owners.
            </p>
          </section>

          <section id="disclaimer" aria-labelledby="disclaimer-title">
            <h2 id="disclaimer-title">Disclaimer</h2>
            <p>
              The service is provided “as is.” To the fullest extent allowed by
              law, we disclaim warranties of merchantability, fitness for a
              particular purpose, and non-infringement. We do not guarantee that
              every pick will match your taste, be available nearby, or be free
              of errors.
            </p>
          </section>

          <section id="liability" aria-labelledby="liability-title">
            <h2 id="liability-title">Limitation of liability</h2>
            <p>
              To the fullest extent allowed by law, Mood Taster and its
              operators are not liable for indirect, incidental, special, or
              consequential damages arising from your use of the service,
              including decisions about food, travel, or purchases you make
              after a recommendation.
            </p>
          </section>

          <section id="changes" aria-labelledby="changes-title">
            <h2 id="changes-title">Changes</h2>
            <p>
              We may update these terms. The “Last updated” date will change when
              we do. Continued use after an update means you accept the revised
              terms.
            </p>
          </section>

          <section id="contact" aria-labelledby="contact-title">
            <h2 id="contact-title">Contact</h2>
            <p>
              Questions about these terms: see{" "}
              <Link href="/contact">Contact</Link>.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
