# Mood Taster

Match how you feel to what you should taste.

**Site:** [mood-taster.vercel.app](https://mood-taster.vercel.app/)  
**PRD:** [mood-taster.vercel.app/prd](https://mood-taster.vercel.app/prd) · [Markdown](https://raw.githubusercontent.com/mml555/Mood_Taster/main/PRD.md)  
**Strategy:** [GTM & monetization](https://mood-taster.vercel.app/strategy)  
**Brand:** [Rules & design guidelines](https://mood-taster.vercel.app/brand)  
**Repo:** [github.com/mml555/Mood_Taster](https://github.com/mml555/Mood_Taster)

## What was built

A client-only Ship Night product:

1. **Home** (`/`) asks "Hungry?" and starts the quiz
2. **Quiz** (`/taste`) asks four one-tap questions (flavor, texture, heaviness, adventure)
3. **Result** (`/result/[id]`) shows one specific dish, why it fits, feedback, and "Not feeling it"
4. **Taste DNA** (`/dna`) shows a local preference profile that updates from ratings

No accounts, no database, no restaurant or delivery APIs.

## How recommendations work

`rank(answers, dna, session)` in `src/lib/engine.ts` is a pure function:

```
score = 0.75 * quizMatch
      + 0.20 * dnaMatch
      + 0.05 * novelty
      - rejectionPenalty
      - recentPenalty
```

Quiz answers live in `sessionStorage`. Taste DNA lives in `localStorage`. Identical inputs produce identical rankings (stable id tie-break).

## Tech stack

- Next.js App Router + TypeScript + React 19
- Hosted on Vercel
- `lucide-react` for icons
- Static food catalog (~30 dishes) with local photos in `public/food/`

## Out of scope (for now)

Authentication, maps/Places, recipes, lanes, live menus, PostHog, native apps, social features.

## What comes next

Optional AI polish for the explanation line (`/api/explain`), restaurant act paths, and cloud-synced Taste DNA when accounts exist.

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
