# Mood Taster — Claude Code rules

Follow `CLAUDE.md` at the repo root and the Cursor rules in `.cursor/rules/`.

## Always

- Preserve mood → match → act information architecture
- Prefer small, reviewable diffs
- Validate inputs; log errors with context; never swallow exceptions
- Keep secrets out of commits
- Edit `src/` for the site; run `npm run build:pages` to refresh `docs/`

## Never

- Invent diet/wellness scoring as a primary UX
- Add competing CTAs or card grids to marketing heroes
- Commit without an explicit user request
