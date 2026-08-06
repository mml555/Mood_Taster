import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Ship Night PRD for Mood Taster: one-pager scope, V1 features, and demo success criteria.",
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
            Figure out what you’re craving in under 30 seconds: one specific
            dish, not another endless menu.
          </p>
          <p className="doc-meta">
            Scope locked for Ship Night ·{" "}
            <a href="https://raw.githubusercontent.com/mml555/Mood_Taster/main/PRD.md">
              Markdown
            </a>{" "}
            ·{" "}
            <a href="/strategy">Strategy</a> · <a href="/brand">Brand</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
          </p>
        </header>

        <article className="doc-body prd-onepager">
          <section id="problem" aria-labelledby="problem-title">
            <h2 id="problem-title">Problem</h2>
            <p>
              When people are hungry but don’t know what they want, they scroll
              delivery apps, maps, and group chats until the decision feels worse
              than the hunger. Existing tools dump catalogs and filters onto
              indecision instead of ending it.
            </p>
          </section>

          <section id="solution" aria-labelledby="solution-title">
            <h2 id="solution-title">Solution</h2>
            <p>
              Mood Taster is a mobile-first web app. You pick a lane (Go Out,
              Make Something, or Grab a snack), answer a few short craving
              questions, and get one dish-level recommendation with a
              plain-English “why this fits.” You can act on it immediately:
              directions, cook steps, or a snack path, and mark whether it
              nailed it.
            </p>
          </section>

          <section id="features" aria-labelledby="features-title">
            <h2 id="features-title">Core features (V1)</h2>
            <ul>
              <li>Lane pick: Go Out / Make Something / Grab a snack</li>
              <li>
                Craving quiz (≤5 questions) → one primary food recommendation
                with “why this fits”
              </li>
              <li>One alternate pick without restarting the quiz</li>
              <li>
                Action path for the result (directions / recipe steps / obtain
                snack)
              </li>
              <li>Nailed it / Kinda / Nope feedback on the result</li>
            </ul>
          </section>

          <section id="out-of-scope" aria-labelledby="oos-title">
            <h2 id="oos-title">Out of scope</h2>
            <ul>
              <li>User accounts, Taste DNA history, and saved profiles</li>
              <li>Native iOS/Android apps</li>
              <li>In-app checkout, delivery, or reservations fulfillment</li>
              <li>Paid/sponsored restaurant placements</li>
              <li>
                Multi-city expansion, social feed, streaks, calorie tracking
              </li>
              <li>
                Voice input, couple/group matching, fridge/pantry scanning
              </li>
            </ul>
          </section>

          <section id="success" aria-labelledby="success-title">
            <h2 id="success-title">Success criteria</h2>
            <p>
              A judge on their phone completes Go Out → craving quiz → receives
              one specific dish recommendation with a why line and a place path,
              then rates it Nailed it / Kinda / Nope. All live, under 45
              seconds, no account.
            </p>
          </section>

          <section id="stack" aria-labelledby="stack-title">
            <h2 id="stack-title">Tech stack</h2>
            <p>Next.js + TypeScript on Vercel, built in Cursor.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
