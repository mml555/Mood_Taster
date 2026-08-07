# Mood Taster: Claude project rules

## What this is

Mood Taster recommends what to eat or drink based on how you feel. Mood first, menus second.

## How to work in this repo

- Read `.cursor/rules/` and this file before large changes
- Follow IA in `.cursor/rules/information-architecture.mdc`
- Follow coding standards in `.cursor/rules/coding-standards.mdc`
- Follow the visual system in `.cursor/rules/design-system.mdc`
- Public source-of-truth pages: PRD (`/prd`), Strategy (`/strategy`), Brand Guide (`/brand`)
- Prefer minimal diffs; do not refactor unrelated code
- Do not invent product features that break the mood → match → act flow
- Monetization must follow Strategy trust rules (organic primary rec; labeled paid surfaces; never sell personal Taste DNA; aggregate-only commercial intelligence)

## Stack

- Next.js App Router + TypeScript in `src/`
- Production: [Vercel](https://mood-taster.vercel.app/)
- Shared styles in `src/app/globals.css`: Ghost White (`--paper`), Indigo
  (`--ink`), Royal Gold (`--accent`); rounded radii; 8px spacing; no gradients;
  almost no shadows

## Safety

- Never commit secrets, tokens, or `.env` files with real values
- Sanitize user-supplied strings before render or storage
- Ask before destructive git operations or force-pushes

## When unsure

Prefer the simpler option that preserves IA and coding standards. Ask before changing public URLs, brand voice, or the core mood → match flow.
