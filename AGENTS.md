# Agent instructions — Mood Taster

This file orients coding agents (Cursor, Claude, Codex, etc.).

## Source of truth

| Concern | Location |
|---------|----------|
| Project overview | `.cursor/rules/project-overview.mdc` |
| Coding standards | `.cursor/rules/coding-standards.mdc` |
| Information architecture | `.cursor/rules/information-architecture.mdc` |
| Claude-specific notes | `CLAUDE.md` |
| Public site | `docs/` (GitHub Pages) |

## Non-negotiables

1. Mood → match → act is the primary flow
2. Validate inputs; no silent error swallowing
3. No secrets in git
4. Marketing surfaces: brand-first, one job per section
5. Do not commit/push unless the user asks

## Repo bootstrap

- Public GitHub repo with Pages served from `/docs` on `main`
- Start here for docs and static site; app code lands beside `docs/` as the product grows
