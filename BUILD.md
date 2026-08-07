# Mood Taster: Ship Night build document

Status: ready for team review
Scope: one night, nine tickets, four routes, no backend

---

## 1. What we are shipping

Mood Taster asks Eat out or Cook, then four craving taps, and returns one specific
dish, not a category and not a menu. You can reject it and get another without redoing the
quiz. Rating the result updates a local Taste DNA profile that visibly changes the next
recommendation.

Eat out shows nearby places. Cook shows ingredients and steps from the catalog.

### The judged demo (three minute budget)

This walk is the spec. If a change does not serve one of these ten steps, it is not tonight.

1. Open the public URL in incognito. No login.
2. Tap start.
3. Pick Eat out or Cook, then answer four craving questions.
4. Receive a specific dish with a reason.
5. Tap "Not feeling it".
6. Receive a different dish that still matches the craving.
7. Submit feedback (Nailed it / Kinda / Nope).
8. See Taste DNA update.
9. Start another session.
10. Demonstrate that the recommendation changed because of step 7.

---

## 2. Locked decisions

Each row is something a teammate would otherwise get wrong on their first commit. These are
settled. Raise an objection before you start, not in a PR.

| Ticket text says | We are doing | Why |
|---|---|---|
| Tailwind, deep purple, poppy yellow, large rounded controls | Brand Guide v1 without Tailwind: Ghost White / Indigo / Gold, CSS variables, rounded cards and buttons | `/brand` and `.cursor/rules/design-system.mdc` are source of truth |
| "Create the Next.js application" | It already exists (Next 16, React 19, TypeScript). Ticket 1 shrinks to stubbing four routes and confirming the deploy | Repo state |
| Homepage is the marketing hero | `/` becomes the app entry ("Hungry?"). `/prd` and `/strategy` stay reachable from the footer | Saves a tap in a three minute demo |
| Early Ship Night tickets vs later PRD | `PRD.md` v1.0 + `BACKLOG.md` are the product target; this file remains the Ship Night build record | Post-demo work is ticketed in BACKLOG, not by rewriting these tickets |
| "No external AI is required for the core flow" | Preserved exactly. AI is an enhancement layer and never a dependency | Ticket 4 |

**Dropped, do not build:** the three lane snack path (Grab a snack), PostHog
analytics, live menus, and delivery/reservation booking.

**Now in scope (added after Ship Night tickets):** Eat out vs Cook as the first
quiz step, and full catalog recipes (ingredients + steps) for Cook mode.

**Added after the tickets were written**, on an explicit call, so the "not tonight" list in
section 11 no longer governs these:

| Surface | What it does |
|---|---|
| Eat out / Cook | First quiz step. Cook filters to dishes with recipes; Eat out keeps Nearby |
| Catalog recipes | Ingredients and steps on the result when intent is Cook |
| AI why line | Azure rewrites the deterministic explanation after paint |
| AI riff | One practical tip about eating the dish |
| Conversational reject | "Not feeling it" takes a reason ("too heavy"), and the model moves the craving axes. Ranking stays deterministic |
| Google Places | Nearby spots on the Eat out result screen, auto-loaded on mount |

Places auto-loads rather than waiting for a tap. That fires a location permission prompt inside
the judged flow, which was raised and accepted. The mitigation is that the same slot renders a
maps deep link the instant permission is denied, so the region is never dead.

---

## 3. Architecture

Client side only. No database, no auth, one API route that the product works fine without.

```
  /                 /taste              /result/[id]?f&t&h&a           /dna
  "Hungry?"   ->   4 questions   ->    dish + actions          ->    Taste profile
                        |                   |    ^                        |
                        v                   v    | "Not feeling it"       |
                  answers into         localStorage  (router.replace)     |
                  the URL              Taste DNA <------ ratings ---------+
                        |                   |
                        +---> rank(answers, dna, session) ---> primary + 3+ alternates
```

### The result URL carries the answers

```
/result/birria-tacos?f=savory&t=crunchy&h=filling&a=surprise
```

`[id]` is the **food id**, not a session id, and the four answers ride in the query string.

This falls out of the precompute decision in section 7. The explanation lookup key is
(answers + food id), and a server component cannot read `sessionStorage`, so the answers have
to be in the URL for the lookup to happen on the server. That is what keeps the roughly 960
entry `explanations.json` out of the client bundle.

It pays for itself three more times: direct navigation works with no session, refresh works,
and a result is shareable. "Not feeling it" stays a `router.replace` to the next candidate,
carrying the same query string, so it updates in place without stacking history.

Validate every param against the const arrays in section 4. An unknown food id or an
unparseable answer set returns a 404 rather than rendering something wrong.

### Storage split

| Store | Holds | Why that one |
|---|---|---|
| URL query string | The four answers | Readable by the server component, survives refresh and sharing |
| `sessionStorage` | `rejectedIds`, `servedIds` | Per-run state that should clear between demo runs |
| `localStorage` | Taste DNA | Must persist across sessions for the step 10 payoff |

**Read both storages only inside `useEffect`, never during render.** Reading browser storage
during render throws a hydration mismatch and blanks the page. This is the most likely bug in
the build. See risk 1. The URL is exempt, which is another reason the answers live there.

---

## 4. Data model

Tickets 2, 4, and 7 are written by different people against these types. Land this file first.

```ts
// src/lib/taste-types.ts

export const FLAVORS = ['savory', 'spicy', 'sweet', 'fresh'] as const
export const TEXTURES = ['crunchy', 'creamy', 'juicy', 'soft'] as const
export const HEAVINESS = ['light', 'medium', 'filling'] as const
export const ADVENTURE = ['safe', 'curious', 'surprise'] as const

export type Flavor = (typeof FLAVORS)[number]
export type Texture = (typeof TEXTURES)[number]
export type Heaviness = (typeof HEAVINESS)[number]
export type Adventure = (typeof ADVENTURE)[number]

export type Food = {
  id: string                    // kebab-case, stable, appears in the URL
  name: string                  // a specific dish, never a cuisine
  description: string           // one line, what it actually is
  flavorTags: Flavor[]
  textureTags: Texture[]
  heaviness: Heaviness
  temperature: 'hot' | 'cold' | 'room'
  adventurousness: 1 | 2 | 3 | 4 | 5
  dietaryTags: string[]         // 'vegetarian' | 'vegan' | 'gluten-free' | 'contains-pork' ...
  image: string                 // '/food/<id>.jpg', committed locally. See section 8
  imageAlt: string              // required, describes the dish in the photo
  imageCredit?: string          // 'Photographer Name / Unsplash', for the README credits list
  reasonTemplate: string        // "{flavor} and {texture}, and it eats {heaviness}."
}

export type Answers = {
  flavor: Flavor
  texture: Texture
  heaviness: Heaviness | 'any'  // 'any' is the "I don't care" option
  adventure: Adventure
}

export type DnaDimension =
  | 'sweet' | 'spicy' | 'savory' | 'fresh'
  | 'crunchy' | 'creamy' | 'juicy' | 'soft'
  | 'light' | 'filling' | 'adventurous'

export type DnaEntry = {
  score: number        // 0 to 1, starts at 0.5 (neutral, not unknown)
  confidence: number   // 0 to 1, derived from samples
  samples: number
}

export type DnaProfile = Record<DnaDimension, DnaEntry>

// Answers now travel in the URL query string, not here. See section 3.
export type SessionState = {
  rejectedIds: string[]
  servedIds: string[]
}

export type ScoredFood = {
  food: Food
  score: number
  matchedAttributes: string[]   // up to 3, display ready
  explanation: string
}

export type Recommendation = {
  primary: ScoredFood
  alternates: ScoredFood[]      // always 2 or more, so 3+ candidates total
}
```

---

## 5. The scoring formula

This is the contract between Tickets 2, 4, and 7. `rank()` is pure: same inputs, same output,
no IO, no randomness.

```
score = 0.75 * quizMatch
      + 0.20 * dnaMatch
      + 0.05 * novelty
      - rejectionPenalty
      - recentPenalty
```

Every component normalizes to 0 to 1 **before** weighting. If they do not, the percentages are
decorative.

**Neutral is 0.5, and neutral is not negative.** "I don't care" on heaviness, and any dimension
with no DNA evidence, both score 0.5. A missing signal must never read as a bad match.

### quizMatch (weighted mean of four sub scores)

| Sub score | Weight | Rule |
|---|---|---|
| flavor | 0.35 | 1.0 on a tag hit, 0.5 on an adjacent flavor, else 0 |
| texture | 0.30 | 1.0 on a tag hit, 0.5 on an adjacent texture, else 0 |
| heaviness | 0.20 | `'any'` gives 0.5 to everything. Else `1 - abs(a - b) / 2` on light=0, medium=1, filling=2 |
| adventure | 0.15 | Target is safe=1.5, curious=3, surprise=4.5. Score is `1 - abs(food.adventurousness - target) / 4` |

Adjacency (this is what stops hard zeroes from flattening the ranking):

```ts
const NEAR_FLAVOR  = { savory: ['spicy'], spicy: ['savory'], sweet: ['fresh'], fresh: ['sweet'] }
const NEAR_TEXTURE = { crunchy: ['juicy'], juicy: ['crunchy'], creamy: ['soft'], soft: ['creamy'] }
```

### dnaMatch

Collect the food's dimensions: its `flavorTags`, its `textureTags`, its `heaviness` when
`light` or `filling`, and `adventurous` when `adventurousness >= 4`. For each, fade the stored
score toward neutral by its confidence, then average:

```
effective(d) = 0.5 + (dna[d].score - 0.5) * dna[d].confidence
dnaMatch     = mean(effective) over the food's dimensions, or 0.5 if none have samples
```

Confidence weighting is what stops one early rating from dominating the ranking.

### novelty and penalties

```
novelty          = 1 - min(1, timesServed / 3)
rejectionPenalty = 0.5 if id is in session.rejectedIds     // large by design, sinks it
recentPenalty    = 0.1 if id is in the last 5 served
```

Rejected foods stay in the ranked list rather than being filtered out, so `alternates` never
runs dry unexpectedly. They just sort to the bottom.

**Ties break on stable id sort.** This is what makes "identical inputs produce predictable
results" true.

### DNA update on feedback

Only dimensions the rated food actually carries are touched.

```
base = { nailed: +0.20, kinda: +0.07, nope: -0.12 }[rating]
learningRate = 1 / (1 + samples * 0.5)     // 1.0, 0.67, 0.50, 0.40, 0.33 ...
delta = base * learningRate

score      = clamp(score + delta, 0, 1)
samples   += 1
confidence = min(1, samples / 5)
```

The decaying learning rate is the acceptance criterion "a single rating cannot radically change
a score". A flat delta fails Ticket 7. Do not simplify this.

Discovery percentage on `/dna` is the mean confidence across all eleven dimensions.

---

## 6. Tickets

All P0. Dependencies are listed so parallel tracks are unambiguous.

| # | Ticket | Depends on | Can run parallel with |
|---|---|---|---|
| 1 | App shell and deploy | none | 2 |
| 2 | Food catalog | none | 1 |
| 3 | Quiz flow | 1 | 2 |
| 4 | Recommendation engine | 2 | 3 |
| 5 | Result experience | 3, 4 | none |
| 6 | Not feeling it | 5 | 7 |
| 7 | Feedback and Taste DNA | 5 | 6 |
| 8 | Taste DNA dashboard | 7 | none |
| 9 | QA and submission | all | none |

Land `src/lib/taste-types.ts` before anything else. It unblocks 2, 4, and 7 simultaneously.

---

### Ticket 1: App shell and deploy

**Reduced scope.** The Next.js app, TypeScript, ESLint, and the design system already exist.
There is no scaffolding and no Tailwind.

Stub `/`, `/taste`, `/result/[id]`, and `/dna` so they render without errors, wire navigation
between them, extend the `current` union in `src/components/SiteHeader.tsx`, and confirm a
Vercel deploy from `main` while the screens are still empty. Deploying before feature work is
the entire point of this ticket.

Install `lucide-react`, the only new runtime dependency. Icon rules are in section 8.

- [ ] App loads from a public URL with no authentication
- [ ] Mobile layout works at roughly 375px
- [ ] Desktop layout stays centered and usable
- [ ] All four routes render without errors
- [ ] A deploy completes before feature work is finished

---

### Ticket 2: Food catalog

About 30 foods in `src/lib/catalog.ts`, matching the `Food` type exactly. Specific dishes only.
"Spicy vodka rigatoni" is a food. "Italian" is not.

Seed examples from the spec: crispy hot honey chicken sandwich, spicy vodka rigatoni, birria
tacos, poke bowl, grilled cheese and tomato soup, sour gummy candy, mango with Tajin, garlic
butter noodles.

**Coverage is the real acceptance criterion, not the row count.** Write a throwaway script or a
test that asserts at least five foods score well against every one of the fourteen answer
values. A path with two candidates produces an obviously wrong recommendation on stage.

Spread `adventurousness` across the full 1 to 5 range, or "Surprise me" returns the same dish
as "Safe favorite".

**Images are part of this ticket, not Ticket 5.** Source, resize, and commit 30 photos to
`public/food/` per section 8, and write `imageAlt` for each. This is the slowest part of the
ticket, so start it before the attribute tagging rather than after.

- [ ] Every food has complete structured attributes
- [ ] Foods cover all available quiz answers
- [ ] Names are specific dishes, never broad cuisines
- [ ] At least five foods reasonably match each major preference direction
- [ ] Catalog imports with no API and no database
- [ ] Every food has a committed local photo that visibly shows that dish
- [ ] Every food has non-empty `imageAlt`
- [ ] Photo sources are Unsplash or Pexels only, credits captured for the README

---

### Ticket 3: Four question craving flow

Homepage: "Hungry?", "Let's figure out what you actually want.", one primary start button. The
existing `.hero`, `.lede`, and `.cta` classes already do this.

Questions, in order:

1. **What kind of flavor?** Savory / Spicy / Sweet / Fresh
2. **What texture sounds right?** Crunchy / Creamy / Juicy / Soft
3. **How heavy?** Light / Medium / Filling / I don't care
4. **How adventurous?** Safe favorite / A little different / Surprise me

One question per screen, single tap to answer and advance. Keep the step in a URL search param
so browser back works on mobile instinct, and render a visible Back control as well. Answers
are preserved when stepping backward. On completion, route to
`/result/<primaryId>?f=&t=&h=&a=` with the answers in the query string (section 3).

- [ ] Starts with no account
- [ ] Intent step plus four craving questions (five taps total)
- [ ] Usable one handed on mobile
- [ ] Back does not restart the flow
- [ ] Completed answers reach the engine
- [ ] Typical completion under 20 seconds

---

### Ticket 4: Recommendation engine

`rank(answers, dna, session): Recommendation` in `src/lib/engine.ts`. Pure function, formula in
section 5. Explanation building lives in `src/lib/explain.ts` and interpolates the food's
`reasonTemplate` with the words the user actually tapped.

- [ ] Identical inputs produce predictable results
- [ ] Different answer combinations produce meaningfully different foods
- [ ] Taste DNA affects ranking
- [ ] Rejected foods take a strong penalty
- [ ] The primary is never a broad category
- [ ] At least three ranked candidates return
- [ ] No external AI or restaurant API is needed for this to work

---

### Ticket 5: Result experience

`/result/[id]/page.tsx` is a server component: await `params` and `searchParams`, validate both,
look the food up, `notFound()` on an unknown id or unparseable answers, read the precomputed
explanation from `explanations.json`, and hand the food plus its explanation to a client
`ResultView`. The explanation JSON stays on the server and never enters the client bundle.

`ResultView` reads DNA and session state in an effect and re-ranks, then optionally calls
`/api/explain` after paint for the Azure-polished line.

Display "We got it.", the food image, the dish name as the dominant element, three matched
attributes, and the explanation. Actions: Nailed it, Kinda, Nope, Not feeling it, and "Why
this?" which expands the explanation inline.

**Direct navigation still works**, because the answers are in the URL. A valid result link
opened in a fresh incognito tab renders the full result. Only the DNA-influenced part of the
ranking is missing, which is invisible to the viewer. This is a real improvement over reading
answers from `sessionStorage`, where the same link rendered a degraded page.

- [ ] Result appears immediately after the fourth answer
- [ ] Dish name is visually dominant
- [ ] Explanation references the user's actual answers
- [ ] Feedback actions are clearly visible
- [ ] Works with no restaurant or delivery integration
- [ ] Refresh and direct navigation do not crash
- [ ] A result URL pasted into a fresh incognito tab renders the full result
- [ ] `explanations.json` does not appear in the client bundle

---

### Ticket 6: Not feeling it

Keep the answers, mark the current food rejected in session state, take the next ranked
candidate, and `router.replace` to it so the screen updates in place without stacking history.
Optionally show "Okay, different direction."

- [ ] User does not return to question one
- [ ] The rejected food is not shown again immediately
- [ ] The alternative still matches the original craving
- [ ] Multiple alternatives can be requested in a row
- [ ] A real empty state appears when alternatives run out

---

### Ticket 7: Feedback and local Taste DNA

Eleven dimensions in `localStorage`, update math in section 5. After a rating, show "Your Taste
DNA changed." with the deltas, for example "Spicy up, Crunchy up".

Ship a reset control. Repeated demo runs need it, and it is an acceptance criterion.

- [ ] Taste DNA persists across refresh
- [ ] First time users do not see a large empty profile
- [ ] Only matched dimensions update
- [ ] One rating cannot radically move a score
- [ ] Updated DNA affects ranking in a later session
- [ ] Local data can be reset for repeated demos

---

### Ticket 8: Taste DNA dashboard

`/dna`: "Your Taste", discovery percentage, strongest flavor preferences, strongest texture
preferences, confidence or sample counts, recent changes, and a button to start another
session. Only render dimensions with actual evidence.

- [ ] Works after one completed rating
- [ ] Strongest dimensions are easy to understand
- [ ] Discovery percentage rises as feedback accumulates
- [ ] Profile updates without an account
- [ ] Empty state points at the first session
- [ ] Demo ready on mobile

---

### Ticket 9: Polish, QA, submission

Run the full ten step demo above. Then: loading states, error states, responsive QA,
keyboard and focus states, a `.cursorrules` file at the repo root (the repo currently has
`.cursor/rules/*.mdc` but not this file, and it is an acceptance criterion), public GitHub
repo, README, final Vercel deploy, submission links.

README covers what was built, how recommendations work, the tech stack, what is out of scope,
and what comes next. Add a photo credits list from the `imageCredit` fields. Neither Unsplash
nor Pexels requires attribution, but crediting 30 photographers costs nothing and reads well to
a judge.

- [ ] Full demo performs in under three minutes
- [ ] Public URL works in incognito
- [ ] No login required
- [ ] Repository is public
- [ ] `.cursorrules` is committed
- [ ] README covers all five topics
- [ ] No broken buttons on the demo path
- [ ] Production console has no blocking errors

---

## 7. External AI

Two providers, two phases, and they do not overlap.

Runtime uses a **provider chain: Gemini first, Azure OpenAI as backup.** Measured per call,
including connection setup:

| Provider | Latency | Notes |
|---|---|---|
| Gemini 3.1 Flash Lite | 1.8s to 2.2s | Free, and the faster of the two. One call in three hung outright during testing |
| Azure `gpt-5.6-terra` | 2.0s to 3.9s | ~1.0s of that is generation. Billed, but did not fail once |

Gemini leads because it is faster and free. Azure sits behind it because Gemini is the less
reliable of the two. Gemini's timeout is 6s, Azure's is 8s.

**Where the latency actually goes.** Generation is only about 1s. Connection setup (DNS, TCP,
TLS) measured 0.7s to 1.3s per cold connection, which is 20% to 35% of the total. Node's global
fetch agent pools connections, so warm instances skip it. Do not introduce custom agents.

Two changes cut real time:

- **One request, not two.** `/api/explain` originally issued parallel calls for the why line and
  the riff. It now asks for both in a single JSON reply. That halves quota cost and, on a cold
  instance, halves the handshakes. End to end this took the route from about 4s to **1.3s cold
  and 0.7s warm**.
- **Timeouts sized to measurement, not to guesswork.** The original 2.5s ceiling was below
  Azure's actual latency, so every call aborted and the feature silently did nothing while
  appearing wired up.

### Why explanations are precomputed

Measured on our own project, Gemini free tier gives **20 requests per day** on the Flash models
and **500 RPD** on the Flash Lite models. We hit the 2.5 Flash ceiling during planning. Twenty
requests is one result screen, twenty times. A night of team testing plus judging would exhaust
it before the demo starts.

The engine is a pure function, so the explanation is too. The answer space is finite and small:

```
4 flavors x 4 textures x 4 heaviness (incl. "any") x 3 adventure = 192 combinations
```

Each combination resolves deterministically to a ranked list of dishes, so every explanation
the product will ever show can be generated once, reviewed by a human, and committed. Runtime
quota stops being a risk because there is no runtime quota.

### Build time: `scripts/generate-explanations.ts`

Generates an explanation for the **top 5 dishes per combination**, not just the primary, because
"Not feeling it" walks down the ranking and every dish it surfaces needs a line. That is up to
960 entries, written to `src/lib/explanations.json`.

**Batch the combinations, roughly 10 per request.** This is a quota requirement, not an
optimization. Unbatched, one run is 960 requests against a 500 RPD ceiling and cannot finish. At
10 per call a run costs about 96 requests, which leaves room to regenerate several times in one
day. Late catalog changes need that room.

Dependencies: the script needs both the catalog (Ticket 2) and the engine (Ticket 4) finished,
since it has to know which dish each combination resolves to. **Budget for this in the
schedule.** It is the one build step that cannot start early and cannot be rushed, and a
catalog edit afterwards means regenerating.

A human reads the output before it is committed. Also use Gemini offline to draft the catalog
entries themselves, same review rule.

### Runtime: Azure OpenAI, enhancement only

```
engine -> dish + precomputed explanation   (instant, from JSON, always correct)
             |   after paint, ~2.5s abort
        Azure OpenAI  -> a fresher line
             |   on error, timeout, or unset
        keep the precomputed line
```

The floor here is an AI-written sentence that a human already approved, not a template. If
Azure never responds, the demo is still showing generated copy.

**We are on the Foundry v1 Responses API**, not the classic Azure OpenAI surface. Getting this
wrong costs an hour, so it is spelled out:

| | Classic (do not use) | v1 GA (ours) |
|---|---|---|
| Path | `/openai/deployments/<name>/chat/completions` | `/openai/v1/responses` |
| `api-version` | Required, requests fail without it | **Not required. There is no such variable** |
| Deployment | In the URL path | In the body as `model` |
| Body | `messages` | `input`, plus optional `instructions` |
| Client | `AzureOpenAI()` | Plain `OpenAI()` with `baseURL`, or raw `fetch` |

Minimal call, which is the whole integration:

```
POST https://<resource>.services.ai.azure.com/openai/v1/responses
api-key: $AZURE_OPENAI_API_KEY
Content-Type: application/json

{ "model": "gpt-5.6-terra",
  "instructions": "<the one sentence rule>",
  "input": "<dish name, matched attributes, current line>",
  "max_output_tokens": 60 }
```

Read the text off `output_text`. Use raw `fetch` rather than adding the `openai` package. It is
a single POST, and `coding-standards.mdc` says to avoid abstraction until a second use appears.

**Measured behaviour of this deployment**, confirmed against the live resource rather than
assumed:

- **Latency is about 4 seconds**, not the 2.5s this document originally guessed. Any timeout
  below that silently returns nothing. `/api/explain` uses 8s, which is safe because it fires
  after paint on an already-complete result screen.
- **There is no top-level `output_text` in the REST response.** That field is an SDK
  convenience. Raw callers must walk `output[]` for the item with `type: "message"`, then its
  `content[]` for `type: "output_text"`. Coding to the docs' example returns `undefined`.
- **It is a reasoning model**, defaulting to `effort: "medium"`. We send `low`. Budget
  `max_output_tokens` well above the sentence length you want, since reasoning is spent first.
- `store: true` is the default, so Azure retains responses.

Rules:

- Keys stay server side in `/api/explain`. Never `NEXT_PUBLIC_`. There is no legitimate
  `NEXT_PUBLIC_` variable in this build, so treat any new one as a mistake.
- **Every variable is optional.** The app must build, deploy, and pass the full demo with an
  empty environment. Anything that throws on a missing key is a bug.
- **`GEMINI_API_KEY` is never set in Vercel.** It is a local build tool credential. Setting it
  in production means someone wired Gemini into a request path, which is a bug.
- Env vars, documented in `.env.example` with no real values:

  | Variable | Phase | Notes |
  |---|---|---|
  | `GEMINI_API_KEY` | build | Local only. Never in Vercel |
  | `GEMINI_MODEL` | build | Must be a Flash Lite variant. The 20 RPD models cannot finish a run |
  | `GEMINI_BATCH_SIZE` | build | Default 10. Lower values risk exceeding the daily ceiling |
  | `AZURE_OPENAI_ENDPOINT` | runtime | Includes the `/openai/v1/` suffix, **with** trailing slash |
  | `AZURE_OPENAI_API_KEY` | runtime | Sent as the `api-key` header |
  | `AZURE_OPENAI_DEPLOYMENT` | runtime | Deployment name, sent in the body as `model`. Currently `gpt-5.6-terra` |
  | `AZURE_OPENAI_REASONING_EFFORT` | runtime | Defaults to `low` in code. The model's own default is `medium`, which costs latency |
  | `GOOGLE_PLACES_API_KEY` | runtime | **Must not carry an HTTP referrer restriction.** See below |

  **The Places key is referrer restricted, and that is handled in code.** Google enforces the
  restriction against the `Referer` header, which a server side request does not send by
  default, producing `403 API_KEY_HTTP_REFERRER_BLOCKED`. `/api/places` therefore sets `Referer`
  explicitly from `PLACES_REFERRER`, and uses `node:https` rather than `fetch` so the header
  goes out verbatim.

  **A shell-exported variable beats `.env`.** `~/.zshrc` exported a different
  `GOOGLE_PLACES_API_KEY` (twice), and because `process.env` wins over `.env` files, the app
  silently used the wrong key and returned `403 PERMISSION_DENIED` on every lookup while `.env`
  looked correct. If Places fails, check for an ambient export before you touch anything else:

  ```
  echo $GOOGLE_PLACES_API_KEY          # should be empty
  grep -n GOOGLE_PLACES_API_KEY ~/.zshrc
  ```

  The route logs the first ten characters of the key it actually used on a non-200, which makes
  this visible instead of silent.

  The three Azure variables are all-or-nothing. Two of three means "Azure not configured" and
  the call is skipped, not attempted and failed.

  There is deliberately **no `AZURE_OPENAI_API_VERSION`**. The v1 GA endpoint does not take one.
  If someone adds it back, they are building against the classic path by mistake.
- **Model output is untrusted input**, at build time and at runtime both. Strip markup and
  control characters, collapse whitespace, enforce one sentence and a length cap, and reject any
  em dash, which this repo bans everywhere. A violation at build time fails the entry loudly so
  a human fixes it. A violation at runtime silently keeps the precomputed line.
- Azure is billed per call. It fires once per result view, after paint. Confirm the spend is
  acceptable for a night of testing before wiring it up.
- Prompts carry dish names and answer words only. Nothing user identifying goes to a provider.

---

## 8. Design system

`.cursor/rules/design-system.mdc` and `/brand` govern every screen. Brand Guide v1:
Ghost White canvas, Indigo primary, Royal Gold highlight.

- `--paper` `#fdfaff`, `--ink` `#510c85`, `--accent` `#ffdf6e`.
  Every other neutral is a `color-mix` of paper and ink. No fourth hue.
- Rounded language: cards 20px, buttons 14px, pills fully rounded. 8px spacing.
- No gradients. No outlined buttons. Shadows rare (main result card only).
- Extend `src/app/globals.css`. Use the existing spacing ramp, do not invent values.
- Primary actions: indigo fill, light text (`.cta`). Highlight: gold fill, indigo text.
- Keep `:focus-visible` rings on everything interactive.

**Quiz choices.** Soft rounded selectable rows (`--ink-raised`). Selected state is
indigo fill with light text. Progress reads as "01 / 04".

**Result reactions.** Swipe right / ♡ = like (`nailed`). Swipe left / × = nope then
next. ↻ = try again without rating. Quiet links keep Kinda and conversational Why?.
No success green or failure red.

### Icons

Unicode reaction marks (♡ × ↻) plus `lucide-react` where needed. No emoji
anywhere in the product.

- Icons inherit `currentColor`. Gold is for highlights, not every icon.
- One stroke width for lucide (`strokeWidth={1.5}`), sizes from a short set (16, 20, 24).
- Icons are functional, never decorative.
- Every icon-only control needs an `aria-label`. Icons inside a labelled button get
  `aria-hidden`.

Working map:

| Surface | Control |
|---|---|
| Quiz back | `ArrowLeft` / ← |
| Like | ♡ |
| Not for me | × |
| Try again | ↻ |
| Why this? (expand) | `ChevronDown` |
| Taste DNA link and dashboard | `Sparkles` |
| Reset | `RotateCcw` |

### Food images

Real photography, roughly 30 shots, one per food.

**Source:** Unsplash first, Pexels as the fallback. Both are free for commercial use with no
attribution required. Do not pull from Google Images or a recipe blog, the licensing is not
there.

**Store them locally.** Download, resize to 800px wide, JPEG at quality 80, target under 120KB
each, and commit to `public/food/<id>.jpg`. `Food.image` is then `/food/<id>.jpg`.

Local files rather than hotlinking, because a venue network on demo night is the wrong place to
discover a CDN timeout, and it avoids `remotePatterns` config, rate limits, and any chance of a
photo being taken down between now and judging. Total payload lands around 3MB, which is fine
in `public/`.

**Rendering:**

- Use `next/image` with explicit `width` and `height`, `sizes` set for a 390px viewport, and
  `priority` on the result screen hero so it is not the thing the judge waits for.
- Inside the recommendation card, media uses `--radius-card` masking. No gradient scrim over
  the photo. Dish name sits below, not overlaid.
- `imageAlt` is required on every food. Empty alt is not acceptable here, the photo carries
  real information.
- **Ship a fallback.** If an image 404s or is still being sourced, render a flat `--ink-soft`
  block at the same aspect ratio with the dish name in it. A broken image icon on stage is
  worse than no image.

**Verify every photo actually shows the dish.** Thirty images sourced quickly is thirty chances
to put a burger under "poke bowl". This needs a human pass, not a search-and-paste.

---

## 9. Risks, ranked

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Hydration mismatch.** Every screen reads `sessionStorage` or `localStorage`. A read during render blanks the page | All storage reads go inside `useEffect`. Render a neutral first paint |
| 2 | **Quiz UI versus the design system.** Outlined pills fight Brand Guide v1 | Section 8. Soft rounded rows, indigo selected fill |
| 3 | **Catalog coverage.** Fewer than five matches on a path returns something obviously wrong | Ticket 2 ships a coverage assertion, not just 30 rows |
| 4 | **DNA learning rate.** A flat delta lets one rating swing a dimension and fails Ticket 7 | Decaying rate, section 5 |
| 5 | **The explanation generation run is a schedule bottleneck.** It cannot start until both the catalog and the engine are done, and a catalog edit afterwards means regenerating | Freeze the catalog before the run. Batch at 10 per request so a regeneration costs ~96 of the 500 daily requests, not 960 |
| 6 | **AI latency on stage** | Precomputed line renders instantly. Azure is after paint with a hard timeout, and failure is invisible |
| 7 | **Direct navigation to a result URL** | Answers are in the query string, so it just works. Validate the params and 404 on garbage |
| 8 | **A photo that does not match its dish.** Thirty images sourced fast is thirty chances to put a burger under "poke bowl" | Human review pass over the whole catalog, Ticket 2 |
| 9 | **Image payload.** Unoptimized downloads can push a page into multiple MB on venue wifi | 800px, quality 80, under 120KB each, `next/image` with `priority` only on the result hero |
| 10 | **Scope creep at hour six** | Section 11 |

---

## 10. QA checklist

- [ ] `npm run lint` and `npm run build` clean
- [ ] Production console free of blocking errors
- [ ] Full judged path at 390px wide, timed under three minutes
- [ ] Refresh the result page, it survives
- [ ] Open a valid result URL in a fresh incognito tab, the full result renders
- [ ] Open `/result/not-a-real-dish`, get a 404 and not an exception
- [ ] Open a result URL with a garbage answer param, get a 404 and not a wrong result
- [ ] `explanations.json` covers every one of the 192 combinations, verified by a script and not
      by spot checking
- [ ] Every precomputed line has been read by a human
- [ ] Clear `localStorage`, `/dna` shows its empty state
- [ ] Reset control returns `/dna` to the empty state after several ratings
- [ ] "Not feeling it" three times in a row, then the empty state
- [ ] Keyboard only pass through a full session, focus rings visible throughout
- [ ] With all Azure variables unset, the result page renders instantly with the precomputed
      line and no console error
- [ ] `GEMINI_API_KEY` is NOT present in the Vercel environment
- [ ] Public URL loads in incognito with no login
- [ ] Every one of the 30 photos loads, and each one shows the dish it is labelled with
- [ ] Rename one image file locally and confirm the fallback block renders instead of a broken
      image icon
- [ ] No emoji anywhere in the product surface
- [ ] Result screen on throttled 3G still shows the dish name and reason before the photo lands

---

## 11. Explicitly not tonight

No tickets, no branches, no "quick" additions:

snack lane, live menu search, delivery or reservation booking, saved history,
favorites, quests, badges, XP, Food Passport, social functionality, native apps,
image recognition.

Eat out vs Cook, catalog recipes, Google Places on Eat out results, and optional
auth are in scope now (see section 2).

Also dropped from earlier drafts of this project: PostHog analytics.

---

## 12. Build order

1. `taste-types.ts`, then app shell and deploy (Ticket 1) alongside the catalog (Ticket 2)
2. Quiz flow (3) alongside the engine (4)
3. **Freeze the catalog, then run `generate-explanations.ts`** (section 7)
4. Result experience (5)
5. Not feeling it (6) alongside feedback and Taste DNA (7)
6. Dashboard (8)
7. QA and submission (9)

Tickets 1 and 2 run in parallel. Ticket 8 does not start until Ticket 7 works.

**Step 3 is the one hard sequencing constraint in the night.** It needs the catalog and the
engine both finished, it takes real wall-clock time, and every catalog edit after it means
another run. Work that ordering into the schedule rather than discovering it at 2am. The result
screen can be built against a handful of hand-written explanations while the run is in flight.

Optional if the clock allows: `vitest` over `engine.ts` and `dna.ts`, covering reproducibility,
rejection sinking, and the bound on a single rating's effect. It is the safest thing to cut.

---

## 13. Open items for review

1. Photography is the largest unbounded task in the build. Thirty sourced, resized, verified,
   and credited images is plausibly two hours of one person's night, and it blocks nothing else
   if it starts first. Assign it to a dedicated owner on Ticket 2 rather than folding it into
   the attribute tagging.
2. **Azure spend.** With explanations precomputed, Azure is a per-view billed call that improves
   an already-good sentence. Somebody should confirm the cost of a night of team testing plus
   judging is acceptable, and decide whether it stays on for the demo or is a nice-to-have that
   gets switched off by unsetting four variables.
3. Post-Ship Night product work is tracked in `BACKLOG.md` (P0→P2) against `PRD.md` v1.0.
   `/prd` mirrors the PRD. This BUILD file stays the Ship Night record.
4. Git commits, making the repository public, and the Vercel deploy need an explicit go ahead.
