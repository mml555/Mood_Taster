# Mood Taster

Match how you feel to what you should taste.

**Site:** [GitHub Pages](https://mml555.github.io/Mood_Taster/)  
**PRD:** [Product requirements](https://mml555.github.io/Mood_Taster/prd/)  
**Repo:** [github.com/mml555/Mood_Taster](https://github.com/mml555/Mood_Taster)

## Stack

- [Next.js](https://nextjs.org) App Router + TypeScript
- Static export deployed to GitHub Pages via Actions (`.github/workflows/deploy-pages.yml`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build         # local static export → out/
GITHUB_PAGES=true npm run build   # export with /Mood_Taster basePath
npm run lint
```

## What’s here

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js pages (home, PRD) and global styles |
| `.github/workflows/` | Pages build + deploy |
| `.cursor/rules/` | Cursor agent rules (IA, coding standards, overview) |
| `CLAUDE.md` | Claude project instructions |
| `AGENTS.md` | Shared agent orientation |

## Contributing norms

See `.cursor/rules/coding-standards.mdc` and `.cursor/rules/information-architecture.mdc`.
