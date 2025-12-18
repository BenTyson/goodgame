# Good Game - Quick Start

> Read this first. Get productive in 2 minutes.

## What Is This?

A board game reference site with 4 pillars:
1. **Game Directory** - Browse/search games with filters
2. **Rules Summaries** - Condensed how-to-play guides
3. **Score Sheets** - Printable PDFs generated in-browser
4. **Quick Reference** - Setup guides, turn order, scoring

**Revenue**: Display ads + Amazon affiliate links

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Database | Supabase (PostgreSQL) |
| Hosting | Railway |
| UI | Tailwind CSS 4 + shadcn/ui |
| PDF | jsPDF (client-side) |
| Theme | Light mode only (teal primary) |

## Key Commands

```bash
npm run dev          # Start dev server (port 3399)
npm run build        # Production build
npm run lint         # ESLint
```

## Important Files

| File | Purpose |
|------|---------|
| `src/app/games/[slug]/page.tsx` | Game hub template (with ImageGallery) |
| `src/components/score-sheet/` | PDF generation |
| `src/components/games/ImageGallery.tsx` | Photo gallery with lightbox |
| `src/lib/supabase/` | Database clients |
| `src/data/mock-games.ts` | Mock data with images |
| `supabase/migrations/` | DB schema (3 files) |
| `next.config.ts` | Image remote patterns |

## Current Phase

Check `CURRENT-STATUS.md` for what's done and what's next.

## Before Making Changes

1. Read `DECISIONS.md` - Don't re-debate settled choices
2. Check `CURRENT-STATUS.md` - Know where we are
3. Update `CURRENT-STATUS.md` when you're done
