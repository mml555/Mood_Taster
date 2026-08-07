export function PrdArticle() {
  return (
    <article className="doc-body">
      <section id="baseline" aria-labelledby="baseline-title">
        <h2 id="baseline-title">Ship Night baseline (shipped)</h2>
        <p>
          The floor for all new work. Do not rebuild it.
        </p>
        <ul>
          <li>
            <strong>Home</strong> (<code>/</code>): Hungry? entry into the quiz
          </li>
          <li>
            <strong>Quiz</strong> (<code>/taste</code>): Eat out or Cook, then
            flavor, texture, heaviness, adventure
          </li>
          <li>
            <strong>Result</strong> (<code>/result/[id]</code>): one dish, why
            line, swipe/rate, Not feeling it, optional AI polish
          </li>
          <li>
            <strong>Eat out</strong>: nearby places via Places + Maps fallback
          </li>
          <li>
            <strong>Cook</strong>: ingredients and steps from the catalog
          </li>
          <li>
            <strong>Taste DNA</strong> (<code>/dna</code>): local profile from
            ratings; optional Supabase sync
          </li>
          <li>
            <strong>Accounts</strong> (<code>/signup</code>,{" "}
            <code>/login</code>, <code>/account</code>): optional; guests still
            work
          </li>
          <li>
            <strong>Rank</strong>: pure <code>rank()</code> over a curated dish
            catalog
          </li>
        </ul>
        <p>
          Demo bar met: start → intent → craving questions → one dish →
          alternate → feedback → DNA update → next session shifts. Under three
          minutes, no account required.
        </p>
      </section>

      <section id="summary" aria-labelledby="summary-title">
        <h2 id="summary-title">1. Product summary</h2>
        <p>
          Mood Taster is a mobile-first web app that answers one hard question:
          what do I actually want to eat?
        </p>
        <p>
          Users answer a short craving sequence. Mood Taster returns a{" "}
          <strong>specific</strong> food recommendation. Depending on intent,
          that may lead to a nearby restaurant, a recipe, or a snack. Rating
          whether the craving was understood updates personal Taste DNA. Over
          time, matches get more personal.
        </p>
        <p>
          Gamification exists only when it teaches preference, encourages
          exploration, or gathers useful feedback. Mood Taster is not a social
          network.
        </p>
      </section>

      <section id="vision" aria-labelledby="vision-title">
        <h2 id="vision-title">2. Vision and value</h2>
        <p>
          Create the world&apos;s simplest personal taste engine. Existing food
          tools are strongest after the user knows what to search for. Mood
          Taster operates one step earlier: determine the craving, then find the
          food.
        </p>
        <p>
          <strong>User:</strong> I&apos;m hungry.
          <br />
          <strong>Mood Taster:</strong> I know what you want.
        </p>
      </section>

      <section id="principles" aria-labelledby="principles-title">
        <h2 id="principles-title">3. Principles</h2>
        <ol>
          <li>Start immediately. No account before the first recommendation.</li>
          <li>Ask less. Only questions that change the result.</li>
          <li>
            Recommend specifically. Prefer spicy vodka rigatoni over Italian.
          </li>
          <li>Make decisions. Narrow options; do not dump another list.</li>
          <li>Learn continuously from useful interactions.</li>
          <li>
            Gamification must produce value: preference, exploration, or
            feedback.
          </li>
          <li>Mobile first. Desktop stays centered and constrained.</li>
          <li>No app dependency. Works in the browser.</li>
        </ol>
      </section>

      <section id="jobs" aria-labelledby="jobs-title">
        <h2 id="jobs-title">4. Jobs to be done</h2>
        <p>
          <strong>Core:</strong> When I&apos;m hungry but don&apos;t know what I
          want, help me quickly understand my craving and give me something
          specific to eat.
        </p>
        <p>
          <strong>Secondary:</strong> Learn what I like so I don&apos;t
          re-explain myself.
        </p>
        <p>
          <strong>Tertiary:</strong> Help me discover foods and flavors I may
          enjoy.
        </p>
        <p>
          Loop: Crave → Taste → Eat → Rate → Learn → Explore → Crave
        </p>
      </section>

      <section id="ia" aria-labelledby="ia-title">
        <h2 id="ia-title">5. Information architecture</h2>
        <ul>
          <li>
            <code>/</code> Taster (shipped; target: four intent actions on home)
          </li>
          <li>
            <code>/taste</code> Quiz (shipped; target: snack, no clue, adaptive)
          </li>
          <li>
            <code>/result/[id]</code> Recommendation (shipped)
          </li>
          <li>
            <code>/dna</code> Taste dashboard (shipped basic; target: richer DNA)
          </li>
          <li>
            <code>/explore</code> Quests, Quick Bites, passport (missing)
          </li>
          <li>
            <code>/history</code> Past recommendations (missing)
          </li>
          <li>
            <code>/account</code> Account / prefs (partial)
          </li>
        </ul>
        <p>
          Authenticated nav target: Taste · My DNA · Explore · History. Anonymous
          users primarily use Taste.
        </p>
      </section>

      <section id="intents" aria-labelledby="intents-title">
        <h2 id="intents-title">6. Intents</h2>
        <h3>Go out (shipped as Eat out)</h3>
        <p>
          Specific dish, then nearby places. Target question bank includes vibe,
          flavor, texture, hunger, dietary, and more. Adaptive: stop when enough
          signal. Shipped today: fixed four craving axes after intent.
        </p>
        <h3>Make something (shipped as Cook)</h3>
        <p>
          Practical recipes: time, effort, ingredients, sensory craving. Shipped:
          same axes plus catalog recipe on the result. Effort/time picker is
          next.
        </p>
        <h3>Snack (missing)</h3>
        <p>
          One snack from sensory craving. Curated snack data. No Places
          dependency.
        </p>
        <h3>I have no clue (missing)</h3>
        <p>
          Signature mode: broad pairs (hot or cold, light or filling, crunchy or
          soft, safe or adventurous) that narrow the craving.
        </p>
      </section>

      <section id="result" aria-labelledby="result-title">
        <h2 id="result-title">7. Result and places</h2>
        <p>
          Reveal quickly. Specific name, sensory tags, why line. Primary CTA by
          intent. Secondary: Not feeling it (alternate without full restart).
          Tertiary: Why this?
        </p>
        <p>
          Restaurants: max three primary cards (Best match, Closest, Wildcard
          when data allows). Not a directory. Request location only when needed.
          Fallback: city or ZIP. Shipped: geolocation on Eat out + Maps deep
          link.
        </p>
      </section>

      <section id="dna" aria-labelledby="dna-title">
        <h2 id="dna-title">8. Taste DNA and feedback</h2>
        <p>
          Taste DNA is learned preference across sensory dimensions. Shipped: 11
          dimensions with score, confidence, and samples. Target: separate
          preference vs experience, XP, levels, and fuller dimension set.
        </p>
        <p>
          Feedback is one of the highest-priority interactions: Nailed it / Kinda
          / Nope, then structured &quot;what hit&quot; or &quot;what was
          off&quot; multi-selects. Gradual weighting. One nope must not rewrite
          the profile. First-use DNA shows only dimensions with evidence.
        </p>
        <p>
          Profile completion reads as &quot;Taste profile N% discovered&quot;
          (coverage and confidence, not a checklist).
        </p>
      </section>

      <section id="engine" aria-labelledby="engine-title">
        <h2 id="engine-title">9. Recommendation engine</h2>
        <p>
          Interpret answers → craving attributes → hard constraints → candidates
          → score → Taste DNA → novelty → drop rejected/recent → rank → explain.
        </p>
        <p>
          Conceptual target weights: craving ~50%, DNA ~25%, context ~10%, past
          feedback ~10%, novelty ~5%. Shipped today: roughly 75% quiz, 20% DNA,
          5% novelty, minus rejection penalties.
        </p>
        <p>
          Hard constraints (allergies, dietary rules, radius) never yield to
          exploration. AI may polish explanations and interpret reject notes;
          core rank stays deterministic without AI.
        </p>
      </section>

      <section id="auth" aria-labelledby="auth-title">
        <h2 id="auth-title">10. Auth and privacy</h2>
        <p>
          First recommendation never requires an account. After value: save Taste
          DNA. Shipped: username + email + password via Supabase; guests stay
          local. Later: optional Google / Apple. Deletion must delete cloud DNA.
        </p>
        <p>
          Never sell personal Taste DNA. Distinguish preference from safety
          allergies. Binding detail: <a href="/privacy">Privacy</a>. Business
          framing: <a href="/strategy">Strategy</a>. Brand:{" "}
          <a href="/brand">Brand Guide</a>.
        </p>
      </section>

      <section id="gamification" aria-labelledby="gamification-title">
        <h2 id="gamification-title">11. Explore and gamification</h2>
        <p>
          Post-baseline only, and only when it improves matching or useful
          exploration:
        </p>
        <ul>
          <li>Flavor XP and levels per dimension</li>
          <li>Develop your taste (high preference, low experience)</li>
          <li>Taste Quests</li>
          <li>Food Passport (cuisine stamps)</li>
          <li>Quick Bites (active learning taps)</li>
          <li>Weekly exploration streaks (not forced daily eating)</li>
          <li>Badges for meaningful behavior</li>
        </ul>
        <p>
          Explore is not a social feed. Favorites may soft-influence rank but
          must not dominate.
        </p>
      </section>

      <section id="roadmap" aria-labelledby="roadmap-title">
        <h2 id="roadmap-title">12. Roadmap</h2>
        <h3>Shipped</h3>
        <p>
          Home, Eat out / Cook quiz, rank, result, Places, catalog recipes,
          feedback, local DNA, optional accounts, AI polish.
        </p>
        <h3>Next (P0 / early P1)</h3>
        <p>
          Home intents, snack + no clue, structured feedback, dietary hard
          constraints, history, richer DNA foundations. Ticketed in{" "}
          <a href="https://github.com/mml555/Mood_Taster/blob/main/BACKLOG.md">
            BACKLOG.md
          </a>
          .
        </p>
        <h3>V1 after baseline</h3>
        <p>
          Persistent DNA depth, XP, Taste dashboard upgrades, Quick Bites,
          passport, quests, badges, better places/recipes, analytics.
        </p>
        <h3>V1.5</h3>
        <p>
          Adaptive questions, advanced ranking, contextual taste,
          comfort/explore, richer DNA visualization.
        </p>
        <h3>Not V1</h3>
        <p>
          Social feed, followers, messaging, public profiles, stranger matching,
          group dining, delivery marketplace, restaurant ordering, merchant
          portal, creator program, comments, public restaurant reviews.
        </p>
      </section>

      <section id="priority" aria-labelledby="priority-title">
        <h2 id="priority-title">13. Development priority</h2>
        <ul>
          <li>
            <strong>P0:</strong> Craving quiz quality, surprising
            recommendations, excellent mobile UX, feedback that teaches
          </li>
          <li>
            <strong>P1:</strong> DNA depth, history, restaurant quality, account
            prefs
          </li>
          <li>
            <strong>P2:</strong> XP, passport, quests, Quick Bites
          </li>
          <li>
            <strong>P3:</strong> Badges, advanced animation
          </li>
        </ul>
        <p>
          If recommendations suck, no amount of badges will save Mood Taster.
        </p>
      </section>

      <section id="north-star" aria-labelledby="north-star-title">
        <h2 id="north-star-title">14. North star</h2>
        <p>
          Not more quiz answers, badges, XP, restaurant clicks, or time on site.
        </p>
        <p>
          <strong>
            Increase the probability that Mood Taster correctly identifies what
            the user wants to eat.
          </strong>
        </p>
        <p>
          Product test: within five seconds they understand the job; within one
          minute they get something that sounds good; after feedback they see it
          learning; after several uses it knows their taste.
        </p>
      </section>
    </article>
  );
}
