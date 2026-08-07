# Mood Taster: Claude Code rules

Follow `CLAUDE.md` at the repo root and the Cursor rules in `.cursor/rules/`.

## Always

- Preserve mood → match → act information architecture
- Prefer small, reviewable diffs
- Validate inputs; log errors with context; never swallow exceptions
- Keep secrets out of commits
- Edit `src/` for the site; Vercel deploys from `main`
- Follow Brand Guide v1: Ghost White / Indigo / Gold, short copy, swipe reactions

## Never

- Invent diet/wellness scoring as a primary UX
- Add competing CTAs or card grids to marketing heroes
- Add gradients or outlined button chrome (see `.cursor/rules/design-system.mdc`)
- Use em dashes in copy, metadata, docs, or comments
- Use emojis in product UI
- Commit without an explicit user request
- Reintroduce GitHub Pages as the primary host unless asked
