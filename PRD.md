# Mood Taster

Figure out what you're craving in under 30 seconds: one specific dish, not another endless menu.

## Problem

When people are hungry but don't know what they want, they scroll delivery apps, maps, and group chats until the decision feels worse than the hunger. Existing tools dump catalogs and filters onto indecision instead of ending it.

## Solution

Mood Taster is a mobile-first web app. You answer four short questions about flavor, texture, heaviness, and adventure, then get one dish-level recommendation with a plain-English "why this fits." Not feeling it? Take another pick without restarting. Rating the result updates a local Taste DNA profile that shapes the next session.

## Core features (V1)

- Craving quiz (exactly four questions) → one primary food recommendation with "why this fits"
- "Not feeling it" alternate pick without restarting the quiz
- Nailed it / Kinda / Nope feedback on the result
- Local Taste DNA that persists on device and affects later rankings
- Taste DNA dashboard with discovery percentage and reset for demos
- Optional accounts (Supabase): username + email + password, cloud-synced Taste DNA
- Guest mode still works with local Taste DNA and no account

## Out of scope

- Restaurant maps, Google Places UX, delivery, or reservations
- Recipes, lanes (Go Out / Make / Snack), or live menus
- Native iOS/Android apps
- Paid/sponsored restaurant placements
- Social feed, streaks, calorie tracking
- Voice input, couple/group matching, fridge/pantry scanning

## Success criteria

A judge on their phone completes Start → four craving questions → receives one specific dish with a why line, taps "Not feeling it" for an alternate, rates feedback, sees Taste DNA update, then starts another session where the recommendation shifted. All live, under three minutes, no account.

## Tech stack

Next.js + TypeScript on Vercel, built in Cursor. Ranking is a pure client-side function over a static catalog. No database.
