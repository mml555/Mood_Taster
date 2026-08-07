# Mood Taster

**Product Requirements Document · Web Product · Version 1.0**  
**Status:** Active product reference · Last updated: August 6, 2026  
**Live:** [mood-taster.vercel.app](https://mood-taster.vercel.app/) · Public page: [/prd](https://mood-taster.vercel.app/prd)  
**Build backlog:** [BACKLOG.md](./BACKLOG.md)

---

## Document purpose

This PRD defines product architecture, UX, data, recommendation logic, gamification, accounts, feedback, and technical expectations for Mood Taster.

Primary reference for product, design, frontend, backend, AI/recommendation, QA, and future integrations.

Brand and visual rules live on [/brand](https://mood-taster.vercel.app/brand) and in `.cursor/rules/design-system.mdc`. Ghost White / Indigo / Gold. No gradients. Almost no shadows. Business model and trust rules live on [/strategy](https://mood-taster.vercel.app/strategy).

---

## Ship Night baseline (shipped)

The following is **done** on production and is the floor for all new work. Do not rebuild it.

| Surface | Live route | What shipped |
|---------|------------|--------------|
| Home | `/` | "Hungry?" entry, CTA into quiz |
| Quiz | `/taste` | Intent (Eat out / Cook) + flavor, texture, heaviness, adventure |
| Result | `/result/[id]` | One dish, why line, swipe/rate, "Not feeling it", AI polish when configured |
| Nearby | result (Eat out) | Google Places nearby + Maps fallback |
| Recipe | result (Cook) | Ingredients + steps from catalog |
| Taste DNA | `/dna` | Local profile from ratings; discovery %; reset |
| Accounts | `/signup`, `/login`, `/account` | Optional Supabase; cloud DNA sync; guests still work |
| Rank engine | `src/lib/engine.ts` | Pure `rank()` over ~30-dish catalog |
| Docs | `/prd`, `/strategy`, `/brand`, `/privacy`, `/terms` | Public sources of truth |

**Demo success (met):** Start → intent → craving questions → one dish → alternate → feedback → DNA update → next session shifts. Under three minutes, no account required.

Everything below that is not listed as shipped is **target product**, not current reality. See [BACKLOG.md](./BACKLOG.md) for ticketed gaps.

---

## 1. Product summary

Mood Taster is a mobile-first web app that answers: **What do I actually want to eat?**

Users answer a short craving sequence. Mood Taster returns a **specific** food recommendation. Depending on intent, that may lead to a nearby restaurant, a recipe, or a snack. Users rate whether the craving was understood. Feedback updates personal **Taste DNA**. Over time, matches get more personal.

Gamification (Taste DNA depth, Flavor XP, quests, Food Passport, badges, streaks, Quick Bites) exists to teach the product about the user, encourage exploration, or gather useful feedback. Otherwise it should not exist.

Mood Taster is not a social network.

---

## 2. Vision

Create the world’s simplest personal taste engine.

User: I’m hungry.  
Mood Taster: I know what you want.

---

## 3. Value proposition

Existing food tools are strongest after the user knows what to search for. Mood Taster operates one step earlier: determine the craving, then find the food.

---

## 4. Product principles

1. **Start immediately.** No account before the first recommendation.
2. **Ask less.** Only questions that change the result.
3. **Recommend specifically.** Prefer "Spicy vodka rigatoni" over "Italian."
4. **Make decisions.** Narrow options; do not dump another giant list.
5. **Learn continuously.** Useful interactions improve personalization.
6. **Gamification must produce value.** Teach preference, encourage exploration, or collect feedback.
7. **Mobile first.** Desktop still works; product stays centered and constrained.
8. **No app dependency.** Works in the browser without install.

---

## 5. Target user and jobs

**Primary:** Hungry, does not know what they want (dinner, restaurant, snack, cook, bored with usuals, want something new).

**Core job:** When I’m hungry but don’t know what I want, help me quickly understand my craving and give me something specific to eat.

**Secondary:** Learn what I like so I don’t re-explain myself.

**Tertiary:** Help me discover foods and flavors I may enjoy.

---

## 6. Primary user loop

Crave → Taste → Eat → Rate → Learn → Explore → Crave

1. Open Mood Taster  
2. Choose intent  
3. Answer adaptive craving questions  
4. Engine picks food  
5. Result shown  
6. User acts  
7. Rate / return  
8. Taste DNA updates  
9. XP / exploration updates  
10. Future sessions more personal

---

## 7. Information architecture

| Route | Purpose | Ship Night | Target |
|-------|---------|------------|--------|
| `/` | Taster / home | Shipped | Add three intents + "I have no clue" on home |
| `/taste` | Craving quiz | Shipped | Adaptive questions; snack + no-clue flows |
| `/result/[id]` | Recommendation | Shipped | Richer restaurant cards; structured feedback |
| `/dna` | Taste dashboard | Shipped (basic) | Pref vs experience, XP, develop-your-taste |
| `/favorites` | Saved foods | Shipped (foods) | Place favorites later |
| `/explore` | Quests, Quick Bites, passport | Missing | V1 after baseline |
| `/history` | Past recommendations | Shipped (basic) | Filters Loved / Kinda / Nope / mode; richer place snapshots |
| `/profile` or `/account` | Account / prefs | Partial (`/account`) | Dietary hard constraints, delete, defaults |
| `/auth` family | Auth | Partial (`/login`, `/signup`) | Keep; optional OAuth later |
| `/prd`, `/strategy`, `/brand` | Docs | Shipped | Keep |

**Nav target (authenticated):** Taste · My DNA · Explore · History. Profile from header. Anonymous users primarily use Taste.

---

## 8. Home / Taster

**Job:** Get users into the decision flow immediately. No large marketing wall before product.

**Required:** Logo, heading "Hungry?", secondary "Let’s figure out what you actually want."

**Primary actions (target):** Go out · Make something · Grab a snack  
**Secondary:** I have no clue

**Shipped today:** Single CTA into `/taste`, where Eat out / Cook is step one.

---

## 9. Session model

Every attempt creates a **Taste Session**: session id, user id or anonymous id, timestamp, intent, answers, inferred craving attributes, recommendation, confidence, alternatives, action taken, feedback, XP deltas, DNA changes.

**Shipped:** sessionStorage session (`answers`, `servedIds`, `rejectedIds`) + localStorage DNA. Not a full server session entity yet.

---

## 10. Intents

### Go out (shipped as Eat out)

Determine a specific dish, then find nearby places likely to serve it.

Question dimensions (adaptive; not all every time): occasion, vibe, flavor, texture, temperature, category, cuisine, heaviness, hunger, adventurousness, price, distance, dietary.

**Shipped:** Fixed flavor / texture / heaviness / adventure after intent.

### Make something (shipped as Cook)

Recommend something realistic to cook: time, effort, ingredients, flavor, texture, meal size, dietary, equipment.

**Shipped:** Same craving axes; result shows static catalog recipe. No pantry / effort picker yet.

### Snack (missing)

One snack from sensory craving (sweet/salty, texture, flavor, temperature, hunger, health preference, effort). Curated snack DB.

### I have no clue (missing)

Signature mode: broad sensory pairs (hot/cold, light/filling, crunchy/soft, safe/adventurous) that narrow progressively.

---

## 11. Adaptive question engine (missing)

Target 3–6 questions, ~30 seconds to a useful recommendation. Stop when confidence is enough. Do not ask five more questions because five were configured.

---

## 12. Recommendation object

Ideal fields: id, type, name, description, image, flavor_tags, texture_tags, temperature, heaviness, cuisine, dietary_tags, confidence, taste_match, reason, alternatives, source.

**Shipped:** Catalog `Food` + rank result + template/AI reason. Internal score; UI may not show a percentage.

---

## 13. Result experience

Reveal quickly with a small intentional beat. Specific dish name, sensory tags, why line.

Primary CTA by intent: Find near me / Cook this / Grab this. Secondary: Not feeling it. Tertiary: Why this?

**Not feeling it:** Alternate while preserving preferences; avoid repeats; optional "what was wrong?"

**Restaurants (target):** Max 3 initially: Best match, Closest, Wildcard. Name, image, distance, rating, price, open/closed, relevant dish if known, why, directions. Not a directory.

**Location:** Request only when needed (Go out / restaurant results). Fallback: city / ZIP search. **Shipped:** geolocation on Eat out result; Maps deep link fallback; no manual ZIP UX yet.

---

## 14. Authentication

First recommendation never requires auth. After value: "Don’t lose your taste." Migrate anonymous DNA on signup.

**Shipped:** Username + email + password (Supabase). Guests local-only.  
**Target later:** Google / Apple as additional options. Account deletion must delete cloud DNA.

---

## 15. Taste DNA

Learned preference across sensory dimensions. Preference and experience must stay separate when the richer model ships.

**Shipped dimensions (11):** sweet, spicy, savory, fresh, crunchy, creamy, juicy, soft, light, filling, adventurous. Each: score, confidence, samples.

**Target dimensions:** fuller flavor/texture sets plus hot/cold, light/heavy, familiar/adventurous, simple/complex, healthy/indulgent. Per dimension: preference_score, experience_score, confidence, sample_count, positive/negative counts, xp, level, last_updated.

**Profile completion:** "Taste profile N% discovered" = coverage/confidence, not literal checklist. Increases more slowly over time.

**First use:** After first evidence, show only dimensions with signal. Do not show a wall of zeroes.

**Learning transparency (target):** "Your Taste DNA changed. Spicy ↑ Heavy ↓"

---

## 16. Feedback loop

Highest-priority product interaction after a recommendation.

- **Nailed it** → optional "what hit?" → update DNA, award XP when XP exists  
- **Kinda / Nope** → "what was off?" multi-select → gradual DNA updates  
- Free text optional only  

One negative must not rewrite the whole profile.

**Shipped:** Three-way rating → gradual DNA update. Structured follow-ups missing.

---

## 17. Gamification (post-baseline)

Only if it teaches preference, encourages exploration, or collects feedback.

| System | Purpose | Priority |
|--------|---------|----------|
| Flavor XP / levels | Exploration depth per dimension | P2 |
| Overall taste level labels | Qualitative beside % discovered | P2 |
| Develop your taste | Pref high, experience low → quest CTA | P2 |
| Taste Quests | Personalized exploration challenges | P2 |
| Food Passport | Cuisine exploration stamps | P2 |
| Badges | Rule-based meaningful achievements | P3 |
| Taste Streak | Weekly exploration streak (not daily forced eating) | P2 |
| Quick Bites | Active-learning preference taps | P2 |

Explore page sections: today’s quest, develop your taste, Quick Bite, unexplored cuisines, passport, recent achievements. No social feed.

---

## 18. History and favorites

**History (`/history`):** Past recommendations; filters Loved / Kinda / Nope / Restaurants / Recipes / Snacks; repeat / find again.

**Favorites (`/favorites`):** Save foods (including recipes) from the result. Local first; cloud when signed in. Soft influence only: `+0.05` on score (same ballpark as novelty). Favoriting pizza must not dominate every session. Place favorites not yet shipped. Cook recipes also support Copy to clipboard.

---

## 19. Recommendation engine

**Pipeline:** Interpret answers → craving attributes → hard constraints → candidates → score craving → Taste DNA → novelty → drop rejected/recent → rank → primary + alternatives → explanation.

**Conceptual weights (tune with data):** craving ~50%, DNA ~25%, context ~10%, past feedback ~10%, novelty ~5%.

**Shipped weights:** ~75% quiz, ~20% DNA, ~5% novelty, plus `+0.05` favorite soft boost when saved, minus rejection/recent penalties.

**Hard constraints:** allergies, dietary rules, religious dietary where supported, availability, radius. Never overridden by exploration.

**Comfort vs Explore:** future control; default balanced.

---

## 20. AI responsibilities

May assist: interpret answers, candidates, structured recommendations, explanations, recipe adaptation, menu tagging, optional feedback text.

Use structured schemas. Do not rely on unstructured prose for core app state.

**Shipped:** Optional Azure explain + conversational reject adjust. Rank stays deterministic without AI.

---

## 21. Data sources and taxonomy

Canonical food attributes (flavor, texture, temperature, heaviness, cuisine, category, protein) underpin Taste DNA.

MVP/current: curated catalog + Places text search + optional AI. Do not block on perfect menus. Snack DB should start curated.

---

## 22. Analytics (missing)

Track: home, intent, answers, abandon, recommendation, alternate, restaurant click, recipe open, snack accept, signup shown/completed, feedback, quest, Quick Bite, passport, badge, return.

**North star candidate:** Successful Taste Sessions (Nailed it or strong positive action).

Supporting: completion rate, Nailed it rate, time to recommendation, feedback rate, signup-after-result, repeat usage, DNA growth, quest completion, restaurant action rate.

Directional hypotheses until real data: quiz completion >70%, median time <45s, positive response >50%, feedback >30%, account conversion after useful result >10%.

---

## 23. Performance, responsive, accessibility

Mobile-first. Fast load. Instant question transitions. Loading generally under a few seconds. Cache taxonomy. Lazy nonessential dashboard. Images must not crush performance.

Desktop: centered, max-width constrained. Do not stretch quiz across giant screens.

A11y: contrast, keyboard, semantic HTML, focus-visible, SR labels, not color-only buttons, `prefers-reduced-motion`, meaningful alt on food imagery.

---

## 24. Privacy and safety

Taste data is personal preference. Users can view profile, modify prefs, clear history, delete account. Taste DNA not public by default. No social profile required. Binding detail: [/privacy](https://mood-taster.vercel.app/privacy).

Distinguish **preference** ("I don’t like peanuts") from **safety** ("Peanut allergy"). Safety is stricter. Do not claim medical certainty when restaurant/menu data cannot guarantee allergens. Never sell personal Taste DNA.

---

## 25. Empty and error states

Empty DNA / passport / history / badges should coach the next action, not feel broken.

Required recoveries: location denied, no restaurants, Places failure, AI failure, recommendation timeout, auth failure, no recipe, offline, invalid session.

---

## 26. Roadmap

### Shipped (Ship Night + follow-ons)

Home, Eat out / Cook quiz, structured rank, result, Places nearby, catalog recipes, Nailed/Kinda/Nope, local DNA, optional accounts, AI polish.

### Next (close PRD P0 / early P1)

See [BACKLOG.md](./BACKLOG.md): home intents, snack + no-clue, structured feedback, dietary hard constraints, history, richer DNA model foundations.

### V1 after baseline

Auth hardening, persistent DNA depth, history, full feedback model, Flavor XP, Taste dashboard upgrades, Quick Bites, Food Passport, basic quests, badges, better restaurant + recipe flows, analytics.

### V1.5

Adaptive questions, advanced ranking, contextual taste, personalized quests, better menu understanding, comfort/explore, richer DNA viz.

### Explicitly not V1

Social feed, followers, messaging, public profiles, stranger matching, group dining, delivery marketplace, restaurant ordering, merchant portal, creator program, comments, public restaurant reviews.

### Possible V2 (concept only)

Taste Match between users (couples, friends, groups). Out of current scope.

---

## 27. Design and interaction

**Brand:** Ghost White canvas, Indigo primary, Royal Gold highlight. Large rounded controls. Minimal borders. Bold type. Strong spacing. Selective food photography. Tongue / lockup as brand device.

**Motion:** Quick, subtle, intentional. Entrance `rise` + swipe exit on result. Honor reduced motion. Never manufacture long loading.

**Personality:** Occasional reactive copy ("We’re close." "Yep. Got it.") when it helps. Not on every tap.

**Quiz:** Immediate selection feedback, lightweight progress, always-available back, editable prior answers without full restart.

---

## 28. Onboarding and retention

No traditional multi-screen onboarding. Progressive disclosure through use: Taste → explain result → introduce DNA on feedback → dashboard → later quests/passport.

Retention should not depend on artificial daily engagement. Natural returns: hunger, decide where to eat, recipe, snack, explore, check DNA, rate a prior pick. Gamification strengthens natural behavior.

---

## 29. Core entities (conceptual)

User, Anonymous Visitor, Taste Session, Answer, Recommendation, Food, Restaurant, Recipe, Snack, Taste Dimension, Taste DNA Entry, Feedback, XP Event, Quest, Passport Entry, Badge, Favorite, Quick Bite, Quick Bite Answer.

Event-driven personalization: recommendation and feedback events trigger DNA, XP, badge, passport, and analytics updates so game logic does not tangle through UI.

---

## 30. Development priority

| Priority | Focus |
|----------|-------|
| P0 | Craving quiz quality, surprising recommendations, excellent mobile UX, feedback that teaches |
| P1 | DNA persistence depth, history, restaurant retrieval quality, account prefs |
| P2 | XP, passport, quests, Quick Bites |
| P3 | Badges, advanced animation |

If recommendations suck, no amount of badges will save Mood Taster.

---

## 31. Key product test

Give someone the site with no explanation.

- **5 seconds:** This helps me figure out what I want to eat.  
- **1 minute:** It gave me something that actually sounds good.  
- **After feedback:** Oh, it’s learning what I like.  
- **After several uses:** This thing actually knows my taste.

That progression is the product.

---

## 32. North star

Not more quiz answers, badges, XP, restaurant clicks, or time on site.

**Increase the probability that Mood Taster correctly identifies what the user wants to eat.**

Everything else exists to make that happen.
