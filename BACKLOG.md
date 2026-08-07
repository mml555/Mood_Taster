# Mood Taster build backlog

**Status:** Active · Last updated: August 6, 2026  
**Source:** [PRD.md](./PRD.md) v1.0 gap vs live product  
**Rule:** If recommendations suck, skip gamification tickets.

Tickets are ordered **P0 → P2**. Each ticket names the **live route or module** it touches.

---

## Shipped baseline (do not rebuild)

| ID | Surface | Route / module |
|----|---------|----------------|
| — | Home entry | `/` |
| — | Quiz (Eat out / Cook + 4 axes) | `/taste` |
| — | Result + reject + rate | `/result/[id]` |
| — | Places nearby | `/api/places` + result Eat out |
| — | Catalog recipes | `catalog.ts` + Cook result |
| — | Local Taste DNA | `/dna` + `dna.ts` |
| — | Optional accounts + DNA sync | `/signup`, `/login`, `/account`, `/api/dna` |
| — | Deterministic rank | `engine.ts` |

---

## P0 — Recommendation quality and craving capture

North star work. Ship before XP, passport, or badges.

### P0-1 · Home intent picker · done
**Routes:** `/`, `/taste`  
**PRD:** §8, §10, §73  

Home shows Go out / Make something / Grab a snack / I have no clue. Each seeds
`/taste?intent=…&from=home` and skips the intent step. Deep link `/taste` still
offers all four intents. Snack catalog and no-clue pairwise flow are P0-2 / P0-3.

---

### P0-2 · Snack intent + curated snack catalog
**Routes:** `/taste`, `/result/[id]`  
**Modules:** `taste-types.ts`, `catalog.ts`, `engine.ts`  
**PRD:** §19, §62  

Add `snack` intent. Curated snack records (name, flavor/texture tags, temperature, hunger suitability, dietary tags, image). Rank filters to snacks. Result CTA is accept / try again (no Places, no full recipe required).

**Done when:** Snack path returns a specific snack in ~30s with why line and feedback.

---

### P0-3 · "I have no clue" narrowing mode
**Routes:** `/taste`  
**PRD:** §16  

Broad pairwise questions (hot/cold, light/filling, crunchy/soft, safe/adventurous) that map into the same craving attributes used by `rank()`. Signature experience; keep copy short and reactive.

**Done when:** Completing no-clue yields a specific dish without using the standard four-axis labels as the first screen.

---

### P0-4 · Structured feedback follow-ups
**Routes:** `/result/[id]`  
**Modules:** `dna.ts`, `ResultView`  
**PRD:** §31–34, §82  

After Nailed it: optional "What hit?" multi-select.  
After Kinda / Nope: "What was off?" multi-select.  
Free text optional only. Gradual DNA updates; show a short "Taste DNA changed" toast with ↑/↓ dims.

**Done when:** Feedback writes dimension-level evidence beyond the current three-button nudge, and the user sees what changed.

---

### P0-5 · Dietary hard constraints
**Routes:** `/account` (or `/profile`), quiz, `engine.ts`  
**PRD:** §26, §56, §70  

Distinguish preference vs safety. Hard constraints (allergies, vegan/vegetarian, etc.) never overridden by novelty. Apply in rank as hard filters. Clear copy that restaurant data cannot guarantee allergens.

**Done when:** A configured allergen/restriction never appears in primary or alternate recommendations from the catalog.

---

### P0-6 · Make Something practicality inputs
**Routes:** `/taste` (Cook), `/result/[id]`  
**PRD:** §17–18  

Add effort/time taps (barely any / ~15 min / I can cook). Prefer catalog recipes that fit. Surface time + difficulty on result. Missing-ingredient / pantry matching can wait.

**Done when:** Cook path asks at least time/effort and ranks with it; result shows time clearly.

---

### P0-7 · Manual location fallback
**Routes:** `/result/[id]` (Eat out), `/api/places`  
**PRD:** §23, §72  

When geolocation denied or fails: city / ZIP search. Keep Maps deep link. Error states with recovery CTAs.

**Done when:** User can get nearby results without granting browser location.

---

## P1 — Memory, places quality, account depth

### P1-1 · Recommendation history
**Routes:** new `/history`  
**PRD:** §52  

Persist sessions (local first; cloud when authed). List food, date, match/intent, rating. Filters: All / Loved / Kinda / Nope / Restaurants / Recipes / Snacks. "Find again" reopens result or re-ranks with same craving.

**Done when:** Guest and authed users can reopen past picks after a reload.

---

### P1-2 · Richer restaurant cards
**Routes:** `/result/[id]`, `/api/places`  
**PRD:** §22  

Up to 3 results labeled Best match / Closest / Wildcard when data allows. Show distance, rating, price, open/closed when API provides them. Avoid directory sprawl.

**Done when:** Eat out result shows labeled cards (not an unlabeled dump) with directions CTA.

---

### P1-3 · Taste DNA preference vs experience
**Routes:** `/dna`  
**Modules:** `dna.ts`, `/api/dna`  
**PRD:** §27–30, §39  

Split preference_score and experience_score (or equivalent). Discovery % from coverage/confidence. "Develop your taste" callout for high pref + low experience. Migrate existing local/cloud profiles safely.

**Done when:** Dashboard shows at least one underexplored dimension with a clear next action (quest can stub to quiz).

---

### P1-4 · Account preferences and deletion
**Routes:** `/account`, `/privacy` alignment  
**PRD:** §26, §69  

UI for dietary restrictions, disliked foods, default location. Clear history. Delete account + cloud DNA (and document how).

**Done when:** User can set a hard restriction and delete cloud DNA without emailing support.

---

### P1-5 · Favorites (soft influence)
**Routes:** `/result/[id]`, `/dna` or `/history`  
**Modules:** `engine.ts`  
**PRD:** §53  

Save food / place / recipe. Soft boost in rank; never dominate. Cap influence.

**Done when:** Favorite appears in a list and slightly affects rank without locking the catalog to that food.

---

### P1-6 · Analytics event spine
**Modules:** client analytics helper (PostHog or equivalent)  
**PRD:** §63–65  

Instrument: home, intent, question, abandon, recommendation, alternate, places click, recipe open, feedback, signup, DNA update. No PII in props. Dashboard for Successful Taste Sessions.

**Done when:** Funnel from home → recommendation → feedback is visible in the analytics tool for production.

---

### P1-7 · Go Out question depth (fixed bank, not fully adaptive)
**Routes:** `/taste`  
**PRD:** §13–14  

Add optional vibe / hunger / direction questions when snack/clue are not in play. Still cap at ~6 questions. Full adaptive engine is P2.

**Done when:** Eat out can ask 1–2 extra high-value questions without exceeding ~45s median.

---

## P2 — Explore loop and gamification

Only after P0 recommendation quality is solid.

### P2-1 · Explore page shell
**Routes:** new `/explore`  
**PRD:** §50  

Sections: Today’s quest (stub), Develop your taste, Quick Bite, Passport progress, Recent achievements. No social feed. Wire bottom nav for authed users: Taste · DNA · Explore · History.

**Done when:** Authenticated mobile user can reach Explore from persistent nav.

---

### P2-2 · Quick Bites (active learning)
**Routes:** `/explore`, `/dna`  
**PRD:** §48–49  

One-tap pairwise questions prioritized by low-confidence dimensions. Updates DNA. No XP spam for page views.

**Done when:** Answering a Quick Bite visibly moves a low-confidence dimension.

---

### P2-3 · Flavor XP and levels
**Modules:** DNA model, `/dna`  
**PRD:** §36–38  

XP per dimension from try/rate/quest/Quick Bite. Levels secondary to DNA viz. Overall label beside % discovered (New Taster → Taste Master).

**Done when:** Rating a match awards dimension XP and level label can change.

---

### P2-4 · Taste Quests
**Routes:** `/explore`, `/dna`  
**PRD:** §39–41  

Rule-generated quests (tangy, creamy, cuisine, comfort breaker). MVP completion = user confirm. XP / passport rewards when those systems exist.

**Done when:** User can start and complete one quest; DNA/experience updates.

---

### P2-5 · Food Passport
**Routes:** `/explore`, passport detail  
**PRD:** §42–44  

Cuisine stamps from confirmed experiences. Progress N / M. Detail: experiences, avg match, favorite dish, first explored.

**Done when:** Completing a cuisine-tagged recommendation (with confirm) stamps the passport.

---

### P2-6 · Weekly Taste Streak
**Routes:** `/dna` or `/explore`  
**PRD:** §47  

Weekly meaningful action streak (feedback / quest / Quick Bite), not daily forced eating. Lightweight display.

**Done when:** Completing one meaningful action in consecutive weeks increments the streak.

---

### P2-7 · Adaptive question engine
**Routes:** `/taste`  
**PRD:** §15, V1.5  

Dynamic stop when craving confidence is enough. Use DNA gaps and prior answers. Target 3–6 questions.

**Done when:** High-signal early answers can end the quiz early with equal or better Nailed it rate.

---

### P2-8 · Comfort vs Explore control
**Routes:** `/taste` or result  
**PRD:** §58  

User-facing balance control. Default balanced. Novelty weight adjustable without breaking hard constraints.

**Done when:** Explore mode increases novel catalog picks while staying inside predicted liking.

---

## P3 — Later (tracked, not scheduled)

| ID | Item | PRD |
|----|------|-----|
| P3-1 | Badges + rule engine + light celebration | §45–46 |
| P3-2 | Contextual taste (time, meal, weather, occasion) | §35 |
| P3-3 | OAuth (Google / Apple) | §25 |
| P3-4 | Fridge / image ingredient input | §17 |
| P3-5 | Deeper menu understanding | V1.5 |
| P3-6 | Taste Match between users | §77 (V2 concept only) |

---

## Explicitly out of backlog

Do not ticket:

- Social feed, followers, messaging, public profiles
- Delivery marketplace, restaurant ordering, merchant portal
- Stranger matching, group dining as a product
- Selling personal Taste DNA

---

## Suggested sprint order

1. **P0-1 → P0-2 → P0-3** (intents complete the product shape)  
2. **P0-4 → P0-5** (feedback + safety improve learning and trust)  
3. **P0-6 → P0-7** (Cook + location polish)  
4. **P1-1 → P1-3 → P1-6** (memory + DNA depth + analytics)  
5. **P1-2 → P1-4 → P1-5 → P1-7**  
6. **P2-1 → P2-2 → P2-3**, then quests / passport / streak  
7. **P2-7** adaptive engine when question bank is stable  

---

## Acceptance lens (every ticket)

1. Does this raise the odds of a correct craving match?  
2. Does it work on mobile in a browser with no install?  
3. Does it respect Brand Guide and privacy promises?  
4. Is there a clear empty/error recovery?
