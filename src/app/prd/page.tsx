import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Ship Night PRD for Mood Taster: craving quiz, dish match, Taste DNA, and demo success criteria.",
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
                Taste DNA dashboard with discovery percentage and reset for
                demos
              </li>
            </ul>
          </section>

          <section id="out-of-scope" aria-labelledby="oos-title">
            <h2 id="oos-title">Out of scope</h2>
            <ul>
              <li>User accounts and cloud-synced profiles</li>
              <li>
                Restaurant maps, Google Places, delivery, or reservations
              </li>
              <li>
                Recipes, lanes (Go Out / Make / Snack), or live menus
              </li>
              <li>Native iOS/Android apps</li>
              <li>Paid/sponsored restaurant placements</li>
              <li>Social feed, streaks, calorie tracking</li>
              <li>
                Voice input, couple/group matching, fridge/pantry scanning
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
              client-side function over a static catalog. No database.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
