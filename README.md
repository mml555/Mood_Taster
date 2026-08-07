# Mood Taster

Match how you feel to what you should taste.

**Site:** [mood-taster.vercel.app](https://mood-taster.vercel.app/)  
**PRD:** [mood-taster.vercel.app/prd](https://mood-taster.vercel.app/prd) · [Markdown](https://raw.githubusercontent.com/mml555/Mood_Taster/main/PRD.md)  
**Strategy:** [GTM & monetization](https://mood-taster.vercel.app/strategy)  
**Brand:** [Rules & design guidelines](https://mood-taster.vercel.app/brand)  
**Repo:** [github.com/mml555/Mood_Taster](https://github.com/mml555/Mood_Taster)

## What was built

A mood → match product with optional accounts:

1. **Home** (`/`) asks "Hungry?" and starts the quiz
2. **Quiz** (`/taste`) starts with Eat out or Cook, then four craving taps (flavor, texture, heaviness, adventure)
3. **Result** (`/result/[id]`) shows one dish and a why. Eat out shows nearby places. Cook shows ingredients and steps
4. **Taste DNA** (`/dna`) shows a preference profile that updates from ratings
5. **Accounts** (`/signup`, `/login`, `/account`) via Supabase: username + email + password, cloud-synced Taste DNA

Guests still work with no account (localStorage only). Accounts need Supabase env vars.

## Accounts (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy URL, anon key, and service role key into `.env` (see `.env.example`)
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor
4. Auth → Email: enable. For local demos, turn off "Confirm email"
5. Restart `npm run dev`

Sign up with username, email, and password. Sign in with email or username + password.

## How recommendations work

`rank(answers, dna, session)` in `src/lib/engine.ts` is a pure function:

```
score = 0.75 * quizMatch
      + 0.20 * dnaMatch
      + 0.05 * novelty
      - rejectionPenalty
      - recentPenalty
```

Quiz answers live in `sessionStorage`. Taste DNA lives in `localStorage`, and syncs to Supabase when signed in.

## Tech stack

- Next.js App Router + TypeScript + React 19
- Hosted on Vercel
- Supabase Auth + Postgres (optional)
- `lucide-react` for icons
- Static food catalog (~30 dishes) with local photos in `public/food/`

## Out of scope (for now)

Snack lane, live menus, delivery booking, native apps, social features.

## What comes next

Richer profile prefs, snack lane later, and optional AI polish for explanations.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

Refresh food photos (Unsplash):

```bash
node scripts/fetch-food-images.js
```

## Photo credits

Food photos are from Unsplash (free for commercial use). Credits by dish:

| Dish | Credit |
|------|--------|
| Crispy hot honey chicken sandwich | Chad Montano / Unsplash |
| Spicy vodka rigatoni | Chad Montano / Unsplash |
| Birria tacos | Emilio Sanchez / Unsplash |
| Poke bowl | Louis Hansel / Unsplash |
| Grilled cheese and tomato soup | Calum Lewis / Unsplash |
| Sour gummy candy | Sharon McCutcheon / Unsplash |
| Mango with Tajín | Charles Deluvio / Unsplash |
| Garlic butter noodles | Dan Gold / Unsplash |
| Miso ramen | Mae Mu / Unsplash |
| Avocado toast with chili flakes | Joseph Gonzalez / Unsplash |
| Korean fried chicken wings | Eiliv Aceron / Unsplash |
| Caprese salad | Jennifer Pallian / Unsplash |
| Chocolate lava cake | Alex Lvrs / Unsplash |
| Citrus shrimp ceviche | Farhad Ibrahimzade / Unsplash |
| Baked mac and cheese | Nathan Dumlao / Unsplash |
| Falafel wrap with tahini | Alan Hardman / Unsplash |
| Thai green curry with chicken | Marissa Grootes / Unsplash |
| Vanilla soft serve cone | Ian Dooley / Unsplash |
| Shakshuka | Toa Heftiba / Unsplash |
| Crispy pork belly bao | Charles Deluvio / Unsplash |
| Watermelon feta salad | Louis Hansel / Unsplash |
| Loaded nachos | Amirali Mirhashemian / Unsplash |
| Iced matcha latte | Ash Edmonds / Unsplash |
| Beef pho | Anh Nguyen / Unsplash |
| Cinnamon sugar churro bites | Fernando Andrade / Unsplash |
| Salmon sashimi plate | Zyanya Citrón / Unsplash |
| Wild mushroom risotto | Chad Montano / Unsplash |
| Elote (Mexican street corn) | Alex Lvrs / Unsplash |
| Pad Thai with shrimp | Marissa Grootes / Unsplash |
| Affogato | Nathan Dumlao / Unsplash |

## Contributing norms

See `.cursor/rules/coding-standards.mdc`, `.cursor/rules/design-system.mdc`, and `.cursorrules`.
