# Board Nomads - Quick Start

> Read this first. Get productive in 2 minutes.

## What to Read

| Document | When to Read | Purpose |
|----------|--------------|---------|
| **This file** | First | 2-minute overview |
| [CURRENT-STATUS](CURRENT-STATUS.md) | Always | Current phase + what's live |
| [DECISIONS](DECISIONS.md) | Before proposing changes | Locked architectural choices |
| [QUICK-REFERENCE](QUICK-REFERENCE.md) | When coding | Commands, file paths, types |

## What Is This?

A board game reference site with 4 pillars:
1. **Game Directory** - Browse/search games with filters
2. **Rules Summaries** - Condensed how-to-play guides
3. **Score Sheets** - Printable PDFs generated in-browser
4. **Quick Reference** - Setup guides, turn order, scoring

Plus: **User Shelf** (track games), **Profiles** (social), **Marketplace** (buy/sell/trade), **Recommendations** (AI wizard)

**Revenue**: Display ads + Amazon affiliate links

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15+ (App Router) |
| Database | Supabase (PostgreSQL) |
| UI | Tailwind CSS 4 + shadcn/ui |
| Hosting | Railway |

See [DECISIONS.md](DECISIONS.md) for full stack rationale.

## Quick Commands

```bash
npm run dev          # Dev server (port 3399)
npm run build        # Production build
supabase db push     # Push migrations
```

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for full command reference.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin panel
│   ├── games/        # Game pages
│   ├── marketplace/  # Buy/sell/trade
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Business logic
│   ├── supabase/     # DB queries
│   ├── ai/           # Claude API
│   └── rulebook/     # PDF parsing + BNCS
└── types/            # TypeScript types
```

## Admin Access

1. Go to `/admin`
2. Login with Google (email must be in `ADMIN_EMAILS` env var)
3. Edit games via Setup Wizard or Advanced tabs

## Before Making Changes

1. Read [DECISIONS.md](DECISIONS.md) - Don't re-debate settled choices
2. Check [CURRENT-STATUS.md](CURRENT-STATUS.md) - Know where we are
3. Update CURRENT-STATUS.md when you complete a phase
