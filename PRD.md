# Mood Taster

Figure out what you’re craving in under 30 seconds — one specific dish, not another endless menu.

## Problem

When people are hungry but don’t know what they want, they scroll delivery apps, maps, and group chats until the decision feels worse than the hunger. Existing tools dump catalogs and filters onto indecision instead of ending it.

## Solution

Mood Taster is a mobile-first web app. You pick a lane (Go Out, Make Something, or Grab a snack), answer a few short craving questions, and get one dish-level recommendation with a plain-English “why this fits.” You can act on it immediately — directions, cook steps, or a snack path — and mark whether it nailed it.

## Core features (V1)

- Lane pick: Go Out / Make Something / Grab a snack
- Craving quiz (≤5 questions) → one primary food recommendation with “why this fits”
- One alternate pick without restarting the quiz
- Action path for the result (directions / recipe steps / obtain snack)
- Nailed it / Kinda / Nope feedback on the result

## Out of scope

- User accounts, Taste DNA history, and saved profiles
- Native iOS/Android apps
- In-app checkout, delivery, or reservations fulfillment
- Paid/sponsored restaurant placements
- Multi-city expansion, social feed, streaks, calorie tracking
- Voice input, couple/group matching, fridge/pantry scanning

## Success criteria

A judge on their phone completes Go Out → craving quiz → receives one specific dish recommendation with a why line and a place path, then rates it Nailed it / Kinda / Nope — all live, under 45 seconds, no account.

## Tech stack

Next.js + TypeScript on Vercel, built in Cursor.
