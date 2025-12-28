# Board Nomads - Quick Start

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
| Framework | Next.js 15+ (App Router) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (images) |
| Auth | Supabase Auth (Google OAuth) |
| Hosting | Railway |
| Domain | boardnomads.com |
| UI | Tailwind CSS 4 + shadcn/ui |
| PDF | jsPDF (client-side) |

## Features

- **Game Directory** - Browse/search games with filters
- **Rules Summaries** - Condensed how-to-play guides
- **Score Sheets** - Printable PDFs generated in-browser
- **Quick Reference** - Setup guides, turn order, scoring
- **Your Shelf** - Track games you own, want, or have played (with ratings)

## Key Commands

```bash
npm run dev          # Start dev server (port 3399)
npm run build        # Production build
supabase db push     # Push migrations to Supabase
```

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin panel (protected)
│   │   ├── (dashboard)/ # Auth-protected routes
│   │   └── login/       # Admin login page
│   ├── api/
│   │   ├── admin/upload/ # Image upload API
│   │   └── cron/        # BGG import + AI generation
│   ├── auth/callback/   # OAuth callback
│   ├── games/[slug]/    # Game pages
│   ├── login/           # User login page
│   ├── shelf/           # User's game collection
│   └── settings/        # Profile settings
├── components/
│   ├── admin/           # Admin components
│   ├── auth/            # User auth components
│   ├── games/           # Game display components
│   ├── shelf/           # Shelf components
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── ai/              # Claude API + prompts
│   ├── auth/            # Auth context
│   ├── bgg/             # BGG scraper
│   └── supabase/        # DB clients + queries
└── types/               # TypeScript types
```

## Admin Access

1. Go to `/admin`
2. Login with Google (email must be in `ADMIN_EMAILS` env var)
3. Edit games, upload images, manage content

## Current Phase

Check `CURRENT-STATUS.md` for what's done and what's next.

## Before Making Changes

1. Read `DECISIONS.md` - Don't re-debate settled choices
2. Check `CURRENT-STATUS.md` - Know where we are
3. Update `CURRENT-STATUS.md` when you're done
