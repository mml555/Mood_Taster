import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for Mood Taster: the product, Taste DNA, accounts, partners, and the rules for using it.",
};

export default function TermsPage() {
  return (
    <div className="doc-page">
      <main className="doc">
        <header className="doc-hero">
          <p className="doc-back">
            <Link href="/">Mood Taster</Link>
          </p>
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
              doctor, dietitian, delivery service, payments company, or calorie
              counter.
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

          <section id="taste-dna" aria-labelledby="taste-dna-title">
            <h2 id="taste-dna-title">Taste DNA</h2>
            <p>
              Taste DNA is a preference profile built from your sessions and
              feedback so later picks can fit you better. As a guest it stays on
              your device. If you create an optional account, it may sync to your
              profile.
            </p>
            <p>
              Taste DNA exists to improve matching for you. We do not sell
              personal Taste DNA or individual taste profiles. Details live in{" "}
              <Link href="/privacy">Privacy</Link>.
            </p>
          </section>

          <section id="accounts" aria-labelledby="accounts-title">
            <h2 id="accounts-title">Accounts</h2>
            <p>
              An account is optional. You can use the core mood → match → act
              flow as a guest. If you create an account, you are responsible for
              keeping your credentials safe and for activity under that account.
              You may ask us to delete an account you created. See{" "}
              <Link href="/privacy">Privacy</Link> for how deletion works.
            </p>
          </section>

          <section id="partners" aria-labelledby="partners-title">
            <h2 id="partners-title">Partners, handoffs, and paid surfaces</h2>
            <p>
              A recommendation may end in a next step such as finding a place,
              ordering, buying ingredients, or redeeming a visit perk. Those
              steps may use third-party partners (for example grocery or delivery
              programs). Their sites and apps have their own terms and privacy
              rules. We do not control them.
            </p>
            <p>
              When a paid match, promotion, or partner placement appears in our
              product, it is labeled. Payment does not rewrite your Taste DNA.
              The primary food pick is meant to stay independent of who paid.
            </p>
            <p>
              If we offer visit codes or similar perks, the restaurant provides
              any discount from its own register. We are not a money transmitter
              for your meal payment.
            </p>
          </section>

          <section id="commercial-data" aria-labelledby="commercial-data-title">
            <h2 id="commercial-data-title">Commercial aggregate data</h2>
            <p>
              We may later offer anonymized, aggregated craving trends to
              businesses. That is not a sale of your personal Taste DNA. Any
              commercial analytics of that kind requires explicit, unbundled
              consent as described in <Link href="/privacy">Privacy</Link>. Using
              the core product alone does not enroll you.
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
              <li>
                Do not abuse visit codes, referral flows, or partner offers
                (including sharing single-use codes as if they were public
                coupons)
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
              after a recommendation, or issues on third-party partner sites.
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
    </div>
  );
}
