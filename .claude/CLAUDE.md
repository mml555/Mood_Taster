# Mood Taster: Claude Code rules

Follow `CLAUDE.md` at the repo root and the Cursor rules in `.cursor/rules/`.

## Always

- Preserve mood → match → act information architecture
- Prefer small, reviewable diffs
- Validate inputs; log errors with context; never swallow exceptions
- Keep secrets out of commits
- Edit `src/` for the site; Vercel deploys from `main`
- Separate UI with spacing and type; keep the palette to ink, paper, and accent

## Never

- Invent diet/wellness scoring as a primary UX
- Add competing CTAs or card grids to marketing heroes
- Add gradients, borders, or box shadows (see `.cursor/rules/design-system.mdc`)
- Use em dashes in copy, metadata, docs, or comments
- Commit without an explicit user request
- Reintroduce GitHub Pages as the primary host unless asked
