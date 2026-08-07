# Agent instructions for Mood Taster

This file orients coding agents (Cursor, Claude, Codex, etc.).

## Source of truth

| Concern | Location |
|---------|----------|
| Project overview | `.cursor/rules/project-overview.mdc` |
| Coding standards | `.cursor/rules/coding-standards.mdc` |
| Information architecture | `.cursor/rules/information-architecture.mdc` |
| Design system | `.cursor/rules/design-system.mdc` |
| Claude-specific notes | `CLAUDE.md` |
| App source | `src/` (Next.js App Router) |
| Deploy | Vercel: https://mood-taster.vercel.app/ |
| Public PRD | `/prd` (`PRD.md`) |
| Build backlog | `BACKLOG.md` |
| Public GTM strategy | `/strategy` |
| Brand Guide | `/brand` |

## Non-negotiables

1. Mood → match → act is the primary flow
2. Validate inputs; no silent error swallowing
3. No secrets in git
4. Marketing surfaces: brand-first, one job per section
5. Brand Guide v1 visuals: Ghost White / Indigo / Gold; no gradients; almost no shadows
6. Do not commit/push unless the user asks

## Stack bootstrap

- Next.js + TypeScript + App Router
- Production host: Vercel (not GitHub Pages)
- Local: `npm run dev` → http://localhost:3000

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
