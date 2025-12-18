# Quick Reference

## Commands

```bash
# Development
npm run dev                    # Start dev server (port 3399)
npm run build                  # Production build
npm run lint                   # ESLint check

# Supabase (after setup)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## File Locations

### App Routes
```
src/app/
├── page.tsx                   # Homepage
├── games/
│   ├── page.tsx              # All games listing
│   └── [slug]/
│       ├── page.tsx          # Game hub
│       ├── rules/page.tsx
│       ├── score-sheet/page.tsx
│       ├── setup/page.tsx
│       └── reference/page.tsx
├── categories/[slug]/page.tsx
├── collections/[slug]/page.tsx
├── score-sheets/page.tsx
└── rules/page.tsx
```

### Components
```
src/components/
├── ui/                        # shadcn/ui (don't edit directly)
├── layout/                    # Header, Footer, ThemeProvider
├── games/                     # GameCard, GameGrid, GameFilters, ImageGallery
├── score-sheet/               # ScoreSheetGenerator (jsPDF)
├── setup/                     # SetupChecklist (interactive)
└── monetization/              # AdUnit, AffiliateButton (planned)
```

### Data & Config
```
src/lib/supabase/              # Database clients
src/types/database.ts          # TypeScript types (includes GameImage)
src/data/mock-games.ts         # Mock data with images
supabase/migrations/           # Database schema (3 files)
next.config.ts                 # Remote image patterns (cf.geekdo-images.com)
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GameCard.tsx` |
| Utilities | camelCase | `formatPlayerCount.ts` |
| Routes | kebab-case | `/score-sheets` |
| Database | snake_case | `game_categories` |
| CSS classes | kebab-case | `.game-card-header` |

## Environment Variables

```
NEXT_PUBLIC_*     # Exposed to browser
SUPABASE_*        # Server-only secrets
```

## URLs

- Local dev: http://localhost:3399
- Supabase Dashboard: https://supabase.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
