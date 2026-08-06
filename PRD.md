# Mood Taster

Figure out what you're craving in under 30 seconds: one specific dish, not another endless menu.

## Problem

When people are hungry but don't know what they want, they scroll delivery apps, maps, and group chats until the decision feels worse than the hunger. Existing tools dump catalogs and filters onto indecision instead of ending it.

## Solution

Mood Taster is a mobile-first web app. You pick eat out or cook, then answer four short craving questions about flavor, texture, heaviness, and adventure. You get one dish with a plain-English "why this fits." Eat out shows nearby spots. Cook shows ingredients and steps. Not feeling it? Take another pick without restarting. Rating the result updates a local Taste DNA profile that shapes the next session.

## Core features (V1)

- Intent step (Eat out / Cook) plus craving quiz → one primary food recommendation with "why this fits"
- Cook mode: catalog recipes with ingredients and steps on the result
- Eat out mode: nearby places for the recommended dish
- "Not feeling it" alternate pick without restarting the quiz
- Nailed it / Kinda / Nope feedback on the result
- Local Taste DNA that persists on device and affects later rankings
- Taste DNA dashboard with discovery percentage and reset for demos
- Optional accounts (Supabase): username + email + password, cloud-synced Taste DNA
- Guest mode still works with local Taste DNA and no account

## Out of scope

- Delivery or reservation booking
- Snack lane, live menus
- Native iOS/Android apps
- Commercial products for Ship Night: affiliate handoffs, verified visit codes, restaurant SaaS, and aggregate taste intelligence products (future model on `/strategy`; never sell personal Taste DNA)
- Social feed, streaks, calorie tracking
- Voice input, couple/group matching, fridge/pantry scanning

## Privacy and data

- Taste DNA exists to improve matching for the user. It is not a sellable personal profile.
- We never sell personal Taste DNA or individual taste profiles to third parties.
- Future commercial intelligence, if any, is aggregate only, with cohort floors and no user-level export path for buyers.
- Commercial analytics for aggregate products require explicit, unbundled consent, separate from using the core mood → match → act flow.
- Guests keep Taste DNA locally. Optional accounts may sync Taste DNA to the profile. Deletion must actually delete account-held Taste DNA when requested.
- Binding public detail: `/privacy`. Business framing: `/strategy`.

## Success criteria

A judge on their phone completes Start → Eat out or Cook → four craving questions → receives one specific dish with a why line, taps "Not feeling it" for an alternate, rates feedback, sees Taste DNA update, then starts another session where the recommendation shifted. All live, under three minutes, no account.

## Tech stack

Next.js + TypeScript on Vercel, built in Cursor. Ranking is a pure client-side function over a static catalog. Optional accounts and cloud Taste DNA sync use Supabase when configured.
