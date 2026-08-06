# Mood Taster — Claude project rules

## What this is

Mood Taster recommends what to eat or drink based on how you feel. Mood first, menus second.

## How to work in this repo

- Read `.cursor/rules/` and this file before large changes
- Follow IA in `.cursor/rules/information-architecture.mdc`
- Follow coding standards in `.cursor/rules/coding-standards.mdc`
- Prefer minimal diffs; do not refactor unrelated code
- Do not invent product features that break the mood → match → act flow

## Stack notes (bootstrap)

- Public marketing site: static HTML/CSS in `docs/` (GitHub Pages)
- Application stack may grow later; do not assume a framework until one exists in-repo

## Safety

- Never commit secrets, tokens, or `.env` files with real values
- Sanitize user-supplied strings before render or storage
- Ask before destructive git operations or force-pushes

## When unsure

Prefer the simpler option that preserves IA and coding standards. Ask before changing public URLs, brand voice, or the core mood → match flow.
