import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Judge-ready product requirements for Mood Taster: locked scope, flows, decisions, and success criteria.",
};

export default function PrdPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="prd" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Public product brief · v1.0</p>
          <h1>Mood Taster PRD</h1>
          <p className="lede">
            Locked requirements for the first shippable product — scope,
            experience, decisions, and how we know it works. Companion growth
            and monetization live in the{" "}
            <a href="/strategy">GTM Strategy</a>.
          </p>
          <p className="doc-meta">
            Status: Ready for review · Last updated: August 6, 2026 ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">Source repo</a>
          </p>
        </header>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#summary">1. Summary</a>
            </li>
            <li>
              <a href="#problem">2. Problem</a>
            </li>
            <li>
              <a href="#goals">3. Goals &amp; non-goals</a>
            </li>
            <li>
              <a href="#users">4. Users &amp; market</a>
            </li>
            <li>
              <a href="#experience">5. Core experience</a>
            </li>
            <li>
              <a href="#decisions">6. Product decisions</a>
            </li>
            <li>
              <a href="#requirements">7. Requirements</a>
            </li>
            <li>
              <a href="#success">8. Success metrics</a>
            </li>
            <li>
              <a href="#milestones">9. Milestones</a>
            </li>
            <li>
              <a href="#acceptance">10. Acceptance criteria</a>
            </li>
          </ol>
        </nav>

        <article className="doc-body">
          <section id="summary" aria-labelledby="summary-title">
            <h2 id="summary-title">1. Summary</h2>
            <p>
              <strong>Mood Taster</strong> is a mobile-first web product that
              turns craving into one specific food recommendation in under 30
              seconds. The user answers a few short questions about how they
              want food to feel, picks a lane (Go Out, Make Something, or Grab a
              snack), and gets one dish-level answer with a plain-language
              reason — then an action to get it.
            </p>
            <p>
              Launch story centers on <strong>Go Out</strong> in South Florida.
              Make Something and snack lanes ship in the same product so the
              answer always matches what the user can do right now.
            </p>
            <p>
              Mood Taster is not a delivery app, diet coach, social feed, review
              platform, or therapy product.
            </p>
          </section>

          <section id="problem" aria-labelledby="problem-title">
            <h2 id="problem-title">2. Problem</h2>
            <p>
              People know they are hungry but stall on what to eat. Search and
              delivery apps dump catalogs, filters, and sponsored lists onto that
              indecision — which adds cognitive load instead of removing it.
            </p>
            <ul>
              <li>
                Decision fatigue: “I don’t know what I want” becomes scrolling
                and second-guessing.
              </li>
              <li>
                Context mismatch: top-rated places ignore flavor, texture,
                occasion, and mood.
              </li>
              <li>
                Distrust: opaque rankings and unlabeled paid placement erode
                confidence in picks.
              </li>
            </ul>
          </section>

          <section id="goals" aria-labelledby="goals-title">
            <h2 id="goals-title">3. Goals &amp; non-goals</h2>

            <h3>Goals (v1)</h3>
            <ul>
              <li>
                Deliver a complete Taste Session in under 30 seconds of user
                input (five questions or fewer after lane choice).
              </li>
              <li>
                Return <strong>one primary food recommendation</strong> with a
                clear “why this fits,” plus a short path to act on it.
              </li>
              <li>
                Support three lanes: Go Out, Make Something, Grab a snack.
              </li>
              <li>
                Preserve <em>mood → match → act</em> with no long onboarding
                before the first result.
              </li>
              <li>
                Collect honest feedback (Nailed it / Kinda / Nope) to improve
                future matches without forcing an account first.
              </li>
            </ul>

            <h3>Non-goals (v1)</h3>
            <ul>
              <li>Calorie tracking, macros, or clinical nutrition advice.</li>
              <li>In-app checkout or food delivery fulfillment.</li>
              <li>Therapeutic mental-health diagnosis or coaching.</li>
              <li>
                Paid restaurant placement in the primary recommendation (see
                Strategy for later sponsored “Where to get it”).
              </li>
              <li>Social feed, streaks, or wellness scores.</li>
              <li>Multi-city expansion before South Florida density.</li>
            </ul>
          </section>

          <section id="users" aria-labelledby="users-title">
            <h2 id="users-title">4. Users &amp; market</h2>
            <dl className="user-list">
              <div>
                <dt>Primary — the indecisive social eater</dt>
                <dd>
                  Roughly 18–35, eats out or orders often, mobile-web first,
                  decides with friends or a partner, repeatedly says “I don’t
                  know what I want,” and wants a faster decision — not another
                  filter panel.
                </dd>
              </div>
              <div>
                <dt>Secondary — solo and curious cooks</dt>
                <dd>
                  Same craving problem at home: Make Something or Grab a snack
                  when leaving the house is not the move.
                </dd>
              </div>
              <div>
                <dt>Launch market</dt>
                <dd>
                  South Florida density first: Miami, Miami Beach, Aventura,
                  Hallandale Beach, Hollywood, Fort Lauderdale. The product may
                  function elsewhere; launch coverage and marketing concentrate
                  here.
                </dd>
              </div>
              <div>
                <dt>Out of scope</dt>
                <dd>
                  Enterprise cafeteria planners, clinical dietitians, and
                  delivery-courier workflows.
                </dd>
              </div>
            </dl>
          </section>

          <section id="experience" aria-labelledby="experience-title">
            <h2 id="experience-title">5. Core experience</h2>
            <ol className="req-flow">
              <li>
                <strong>Lane</strong> — User chooses Go Out, Make Something, or
                Grab a snack so the answer is actionable.
              </li>
              <li>
                <strong>Mood</strong> — Short craving questions (flavor,
                texture, energy, occasion, constraints). Five or fewer after
                lane. No account required to start.
              </li>
              <li>
                <strong>Match</strong> — One primary dish-level recommendation
                with “why this fits.” For Go Out, show where to get it
                (organic places first). Offer one alternate pick without
                restarting the whole quiz.
              </li>
              <li>
                <strong>Act</strong> — Directions, order/reserve link, cook
                steps, or save — one primary action per result.
              </li>
              <li>
                <strong>Feedback</strong> — Nailed it / Kinda / Nope. Optional
                account save to keep Taste DNA and history.
              </li>
            </ol>
            <p>
              Promise copy: <em>Find out what you’re craving in 30 seconds.</em>{" "}
              Supporting: Answer a few weirdly specific questions. Get one food
              that actually sounds right.
            </p>
          </section>

          <section id="decisions" aria-labelledby="decisions-title">
            <h2 id="decisions-title">6. Product decisions</h2>
            <dl className="user-list">
              <div>
                <dt>Primary vertical</dt>
                <dd>
                  <strong>Go Out</strong> is the launch narrative and coverage
                  priority. Make Something and Grab a snack ship in v1 so every
                  session ends in something the user can do tonight.
                </dd>
              </div>
              <div>
                <dt>Recommendation shape</dt>
                <dd>
                  One primary food conclusion, not a wall of restaurants. Places
                  and recipes serve that conclusion. Paid placement, when it
                  exists later, competes only under “Where to get it” and stays
                  labeled — never the organic food call.
                </dd>
              </div>
              <div>
                <dt>Matching approach</dt>
                <dd>
                  Hybrid: structured craving signals plus model-assisted ranking
                  against a tagged local/catalog set. Explanations must stay
                  honest and human — no opaque scores as the primary UI, no
                  fake precision.
                </dd>
              </div>
              <div>
                <dt>Auth</dt>
                <dd>
                  Anonymous-first. Full first session without an account.
                  Optional save after the result to keep Taste DNA, history, and
                  feedback. Never block the first recommendation behind signup.
                </dd>
              </div>
              <div>
                <dt>Geography</dt>
                <dd>
                  South Florida for launch data, restaurant coverage, and GTM.
                  Location permission improves Go Out; soft degradation when
                  denied (manual area or delayed place step).
                </dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>
                  Mobile-first web on Vercel. No native app required for v1.
                </dd>
              </div>
            </dl>
          </section>

          <section id="requirements" aria-labelledby="requirements-title">
            <h2 id="requirements-title">7. Requirements</h2>

            <h3>Must have (P0)</h3>
            <ul>
              <li>Lane selection: Go Out / Make Something / Grab a snack.</li>
              <li>
                Craving quiz: ≤5 questions after lane; mobile-usable; keyboard
                accessible.
              </li>
              <li>
                One primary recommendation with explainable “why this fits.”
              </li>
              <li>One-tap alternate recommendation without full restart.</li>
              <li>
                Go Out: at least one organic place path (map / directions or
                outbound link).
              </li>
              <li>
                Make Something: recipe or cook direction with ingredients and
                steps summary.
              </li>
              <li>Grab a snack: specific snack direction with obtain path.</li>
              <li>Feedback: Nailed it / Kinda / Nope on the result.</li>
              <li>
                Optional account save after first result (email or magic link /
                OAuth — implementation choice).
              </li>
              <li>
                Public marketing site, this PRD, and Strategy docs for shared
                context.
              </li>
              <li>Input validation; no silent error swallowing.</li>
            </ul>

            <h3>Should have (P1)</h3>
            <ul>
              <li>
                Location-aware Go Out when permission granted; clear fallback
                when denied.
              </li>
              <li>
                Soft dietary constraints (e.g. vegetarian, no nuts) that hard-block
                unsafe matches.
              </li>
              <li>Session history for signed-in users.</li>
              <li>Shareable recommendation card.</li>
              <li>Privacy page: data collected, retention, and what is never sold.</li>
            </ul>

            <h3>Could have (P2)</h3>
            <ul>
              <li>Voice mood capture.</li>
              <li>Fridge / pantry hints for Make Something.</li>
              <li>Taste DNA preview after first completed session.</li>
              <li>Couple / group matching (explicitly post-v1).</li>
            </ul>
          </section>

          <section id="success" aria-labelledby="success-title">
            <h2 id="success-title">8. Success metrics</h2>
            <p>
              North star: <strong>Successful Taste Sessions</strong> — user
              accepts the rec, acts on it, saves it, or marks Nailed it.
            </p>
            <ul>
              <li>
                <strong>Quiz completion:</strong> ≥70% of starts reach a result.
              </li>
              <li>
                <strong>Time to result:</strong> median under 45 seconds from
                lane start to recommendation render.
              </li>
              <li>
                <strong>Positive reaction:</strong> ≥50% Nailed it or Kinda on
                rated sessions.
              </li>
              <li>
                <strong>Act rate:</strong> share of sessions with directions,
                outbound link, cook open, or save.
              </li>
              <li>
                <strong>Account save:</strong> 10–20% after first result
                (directional).
              </li>
            </ul>
            <p>
              Do not use pageviews, time-on-site, ad impressions, or streak
              length as north stars.
            </p>
          </section>

          <section id="milestones" aria-labelledby="milestones-title">
            <h2 id="milestones-title">9. Milestones</h2>
            <ol>
              <li>
                <strong>M0 — Foundation (done):</strong> public repo, agent
                rules, marketing site, PRD, Strategy on Vercel.
              </li>
              <li>
                <strong>M1 — Clickable Taste Session:</strong> lane + quiz →
                one primary result → act + feedback (mocked or constrained
                catalog).
              </li>
              <li>
                <strong>M2 — South Florida Go Out:</strong> real local place
                matching for launch coverage with organic “where to get it.”
              </li>
              <li>
                <strong>M3 — Remember:</strong> optional account, history, Taste
                DNA start, privacy surface, share card.
              </li>
              <li>
                <strong>M4 — Closed test:</strong> 50–150 testers; measure
                completion, satisfaction, confusion, natural sharing.
              </li>
            </ol>
          </section>

          <section id="acceptance" aria-labelledby="acceptance-title">
            <h2 id="acceptance-title">10. Acceptance criteria (v1 ship)</h2>
            <ul>
              <li>
                A new visitor can complete Go Out → result → feedback without
                creating an account.
              </li>
              <li>
                Result shows one dish-level recommendation and a why line a
                human would say out loud.
              </li>
              <li>
                User can request one alternate without re-answering the full
                quiz.
              </li>
              <li>
                Make Something and Grab a snack each return an actionable
                primary result.
              </li>
              <li>
                Primary recommendation is never a paid placement.
              </li>
              <li>
                Layouts work on mobile viewports; interactive controls are
                keyboard reachable and labeled.
              </li>
              <li>
                Failures (no location, empty catalog, network error) show a
                clear recovery path — not a blank screen.
              </li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
