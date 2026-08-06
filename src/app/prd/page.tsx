import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Public product requirements for Mood Taster: problem, users, scope, flows, and success criteria.",
};

export default function PrdPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="prd" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Public product brief · v0.1</p>
          <h1>Mood Taster PRD</h1>
          <p className="lede">
            What we’re building, for whom, and what “done” means for the first
            shippable product — written for collaborators, not buried in a
            private doc.
          </p>
          <p className="doc-meta">
            Status: Draft · Last updated: August 6, 2026 ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">Source repo</a>
          </p>
        </header>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#summary">Summary</a>
            </li>
            <li>
              <a href="#problem">Problem</a>
            </li>
            <li>
              <a href="#goals">Goals &amp; non-goals</a>
            </li>
            <li>
              <a href="#users">Users</a>
            </li>
            <li>
              <a href="#experience">Core experience</a>
            </li>
            <li>
              <a href="#requirements">Requirements</a>
            </li>
            <li>
              <a href="#success">Success metrics</a>
            </li>
            <li>
              <a href="#milestones">Milestones</a>
            </li>
            <li>
              <a href="#open">Open questions</a>
            </li>
          </ol>
        </nav>

        <article className="doc-body">
          <section id="summary" aria-labelledby="summary-title">
            <h2 id="summary-title">1. Summary</h2>
            <p>
              <strong>Mood Taster</strong> helps people decide what to eat or
              drink by starting from how they feel — not from endless menus,
              macros, or “wellness scores.” A user captures a mood, receives a
              short ranked set of matches with a plain-language reason each
              fits, then acts: cook, go, or save.
            </p>
            <p>
              v0 is a focused companion for decision fatigue at mealtime. It is
              not a delivery app, diet coach, or therapy product.
            </p>
          </section>

          <section id="problem" aria-labelledby="problem-title">
            <h2 id="problem-title">2. Problem</h2>
            <p>
              People often know they’re hungry (or restless, celebrating,
              drained) but stall when choosing what to taste. Existing tools
              push catalogs, filters, and sponsored lists — which adds cognitive
              load instead of removing it.
            </p>
            <ul>
              <li>
                Decision fatigue: “What do I want?” turns into scrolling and
                second-guessing.
              </li>
              <li>
                Mismatch: top-rated places and trending recipes ignore the
                emotional context of the moment.
              </li>
              <li>
                Distrust: opaque rankings and paid placements erode confidence
                in picks.
              </li>
            </ul>
          </section>

          <section id="goals" aria-labelledby="goals-title">
            <h2 id="goals-title">3. Goals &amp; non-goals</h2>

            <h3>Goals (v0)</h3>
            <ul>
              <li>
                Capture mood in under 30 seconds (quick pick or short free
                text).
              </li>
              <li>
                Return a short ranked list (target: 3–5 picks) with a clear
                “why this fits” for each.
              </li>
              <li>
                Support at least one actionable outcome per pick (view detail,
                save, or open directions / recipe steps).
              </li>
              <li>
                Keep the primary path as <em>mood → match → act</em> without
                burying it behind long onboarding.
              </li>
            </ul>

            <h3>Non-goals (v0)</h3>
            <ul>
              <li>Calorie tracking, macros, or clinical nutrition advice.</li>
              <li>In-app checkout or food delivery fulfillment.</li>
              <li>Therapeutic mental-health diagnosis or coaching.</li>
              <li>Paid restaurant placement or sponsored ranking.</li>
              <li>Social feed, streaks, or gamified “wellness scores.”</li>
            </ul>
          </section>

          <section id="users" aria-labelledby="users-title">
            <h2 id="users-title">4. Users</h2>
            <dl className="user-list">
              <div>
                <dt>Primary — the undecided eater</dt>
                <dd>
                  Adults who repeatedly hit “I don’t know what I want” at home
                  or nearby. They want a fast, human suggestion — not another
                  filter panel.
                </dd>
              </div>
              <div>
                <dt>Secondary — the curious cook</dt>
                <dd>
                  People open to recipes matched to vibe (comfort, bright,
                  celebratory) when they already have some ingredients or time.
                </dd>
              </div>
              <div>
                <dt>Out of scope for v0</dt>
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
                <strong>Mood</strong> — User selects a mood chip or types a
                short phrase (e.g. “tired but want something bright”). Optional
                later: voice.
              </li>
              <li>
                <strong>Match</strong> — System returns 3–5 picks (recipe,
                place, or flavor direction). Each pick shows name, type, and why
                it fits.
              </li>
              <li>
                <strong>Act</strong> — User opens detail, saves, or takes an
                external action (map / cook steps).
              </li>
              <li>
                <strong>Remember</strong> (optional) — Saved picks and light
                preferences improve future matches without a long profile form.
              </li>
            </ol>
            <p>
              Information architecture rule: one job per screen; brand-first on
              marketing surfaces; no competing CTA clusters in the first
              viewport.
            </p>
          </section>

          <section id="requirements" aria-labelledby="requirements-title">
            <h2 id="requirements-title">6. Requirements</h2>

            <h3>Must have (P0)</h3>
            <ul>
              <li>Mood entry via quick picks and free-text input.</li>
              <li>
                Match results with explainable “why this fits” copy (not opaque
                scores as the primary UI).
              </li>
              <li>Detail view for a single pick with one primary action.</li>
              <li>Save / unsave a pick (local or account-backed).</li>
              <li>
                Public marketing site and this PRD page for shared product
                context.
              </li>
              <li>
                Input validation, accessible controls (keyboard, labels), and
                mobile-usable layouts.
              </li>
            </ul>

            <h3>Should have (P1)</h3>
            <ul>
              <li>
                Location-aware place suggestions when permission is granted.
              </li>
              <li>
                Dietary constraints as soft filters (e.g. vegetarian, no nuts).
              </li>
              <li>Lightweight history of past moods and picks.</li>
              <li>Privacy page describing data collected and retention.</li>
            </ul>

            <h3>Could have (P2)</h3>
            <ul>
              <li>Voice mood capture.</li>
              <li>Fridge / pantry ingredient hints for recipe matches.</li>
              <li>Shareable “mood → pick” cards.</li>
            </ul>
          </section>

          <section id="success" aria-labelledby="success-title">
            <h2 id="success-title">7. Success metrics</h2>
            <ul>
              <li>
                <strong>Activation:</strong> % of visitors who complete a mood
                entry and see matches.
              </li>
              <li>
                <strong>Time-to-match:</strong> median seconds from mood submit
                to results render (target: under 5s perceived).
              </li>
              <li>
                <strong>Act rate:</strong> % of sessions with a detail open,
                save, or outbound action from a pick.
              </li>
              <li>
                <strong>Trust proxy:</strong> qualitative feedback that “why
                this fits” felt accurate (survey or interview).
              </li>
            </ul>
            <p>
              Avoid vanity metrics as north stars (raw pageviews, streak length,
              “optimization” scores).
            </p>
          </section>

          <section id="milestones" aria-labelledby="milestones-title">
            <h2 id="milestones-title">8. Milestones</h2>
            <ol>
              <li>
                <strong>M0 — Foundation (current):</strong> public repo, agent
                rules, marketing site, public PRD.
              </li>
              <li>
                <strong>M1 — Clickable flow:</strong> mood entry → mocked
                matches → detail / save in a prototype.
              </li>
              <li>
                <strong>M2 — Real matches:</strong> production matching for a
                constrained catalog (recipes and/or places).
              </li>
              <li>
                <strong>M3 — Remember:</strong> preferences, history, and
                privacy surface.
              </li>
            </ol>
          </section>

          <section id="open" aria-labelledby="open-title">
            <h2 id="open-title">9. Open questions</h2>
            <ul>
              <li>
                First vertical: recipes only, places only, or both from day
                one?
              </li>
              <li>
                Matching approach for v1: curated rules, LLM-assisted ranking,
                or hybrid — and how we keep explanations honest.
              </li>
              <li>Auth model: anonymous-first with optional account?</li>
              <li>
                Geography: which cities or regions for place data in the first
                launch?
              </li>
            </ul>
            <p>
              Propose answers via{" "}
              <a href="https://github.com/mml555/Mood_Taster/issues">
                GitHub issues
              </a>{" "}
              or a PR that updates this page.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
