import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Ship Night PRD for Mood Taster: craving quiz, dish match, Taste DNA, privacy promises, and demo success criteria.",
};

export default function PrdPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="prd" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Ship Night PRD · one page</p>
          <h1>Mood Taster</h1>
          <p className="lede">
            Figure out what you&apos;re craving in under 30 seconds: one specific
            dish, not another endless menu.
          </p>
          <p className="doc-meta">
            Scope locked for Ship Night ·{" "}
            <a href="https://raw.githubusercontent.com/mml555/Mood_Taster/main/PRD.md">
              Markdown
            </a>{" "}
            · <a href="/strategy">Strategy</a> · <a href="/brand">Brand</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
          </p>
        </header>

        <article className="doc-body prd-onepager">
          <section id="problem" aria-labelledby="problem-title">
            <h2 id="problem-title">Problem</h2>
            <p>
              When people are hungry but don&apos;t know what they want, they
              scroll delivery apps, maps, and group chats until the decision
              feels worse than the hunger. Existing tools dump catalogs and
              filters onto indecision instead of ending it.
            </p>
          </section>

          <section id="solution" aria-labelledby="solution-title">
            <h2 id="solution-title">Solution</h2>
            <p>
              Mood Taster is a mobile-first web app. You answer four short
              questions about flavor, texture, heaviness, and adventure, then
              get one dish-level recommendation with a plain-English &quot;why
              this fits.&quot; Not feeling it? Take another pick without
              restarting. Rating the result updates a local Taste DNA profile
              that shapes the next session.
            </p>
          </section>

          <section id="features" aria-labelledby="features-title">
            <h2 id="features-title">Core features (V1)</h2>
            <ul>
              <li>
                Craving quiz (exactly four questions) → one primary food
                recommendation with &quot;why this fits&quot;
              </li>
              <li>
                &quot;Not feeling it&quot; alternate pick without restarting the
                quiz
              </li>
              <li>Nailed it / Kinda / Nope feedback on the result</li>
              <li>
                Local Taste DNA that persists on device and affects later
                rankings
              </li>
              <li>
                Optional accounts (Supabase): username + email + password, with
                Taste DNA synced to your profile
              </li>
              <li>
                Guest mode still works with local Taste DNA and no account
              </li>
            </ul>
          </section>

          <section id="out-of-scope" aria-labelledby="oos-title">
            <h2 id="oos-title">Out of scope</h2>
            <ul>
              <li>
                Restaurant maps, Google Places UX, delivery, or reservations
              </li>
              <li>
                Recipes, lanes (Go Out / Make / Snack), or live menus
              </li>
              <li>Native iOS/Android apps</li>
              <li>
                Commercial products for Ship Night: affiliate handoffs, verified
                visit codes, restaurant SaaS, and aggregate taste intelligence
                products (future model on{" "}
                <a href="/strategy">Strategy</a>; never sell personal Taste DNA)
              </li>
              <li>Social feed, streaks, calorie tracking</li>
              <li>
                Voice input, couple/group matching, fridge/pantry scanning
              </li>
            </ul>
          </section>

          <section id="privacy" aria-labelledby="privacy-title">
            <h2 id="privacy-title">Privacy and data</h2>
            <ul>
              <li>
                Taste DNA exists to improve matching for the user. It is not a
                sellable personal profile.
              </li>
              <li>
                We never sell personal Taste DNA or individual taste profiles to
                third parties.
              </li>
              <li>
                Future commercial intelligence, if any, is aggregate only, with
                cohort floors and no user-level export path for buyers.
              </li>
              <li>
                Commercial analytics for aggregate products require explicit,
                unbundled consent, separate from using the core mood → match →
                act flow.
              </li>
              <li>
                Guests keep Taste DNA locally. Optional accounts may sync Taste
                DNA to the profile. Deletion must actually delete account-held
                Taste DNA when requested.
              </li>
              <li>
                Binding public detail: <a href="/privacy">Privacy</a>. Business
                framing: <a href="/strategy">Strategy</a>.
              </li>
            </ul>
          </section>

          <section id="success" aria-labelledby="success-title">
            <h2 id="success-title">Success criteria</h2>
            <p>
              A judge on their phone completes Start → four craving questions →
              receives one specific dish with a why line, taps &quot;Not feeling
              it&quot; for an alternate, rates feedback, sees Taste DNA update,
              then starts another session where the recommendation shifted. All
              live, under three minutes, no account.
            </p>
          </section>

          <section id="stack" aria-labelledby="stack-title">
            <h2 id="stack-title">Tech stack</h2>
            <p>
              Next.js + TypeScript on Vercel, built in Cursor. Ranking is a pure
              client-side function over a static catalog. Optional accounts and
              cloud Taste DNA sync use Supabase when configured.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
