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
├── categories/
│   ├── page.tsx              # Categories listing
│   └── [slug]/page.tsx       # Category detail
├── collections/
│   ├── page.tsx              # Collections listing
│   └── [slug]/page.tsx       # Collection detail
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
src/types/database.ts          # TypeScript types (Game, Category, Collection, GameImage)
src/data/mock-games.ts         # Mock data: games, categories, collections, images
supabase/migrations/           # Database schema (3 files)
next.config.ts                 # Remote image patterns (cf.geekdo-images.com)
```

### Helper Functions (in mock-games.ts)
```typescript
getGameImages(gameSlug)        // Get images for a game
getGameCoverImage(gameSlug)    // Get primary cover image
getCollectionGames(collSlug)   // Get games in a collection
getGameCollections(gameSlug)   // Get collections containing a game
getRelatedGames(gameSlug, limit)  // Get related games by category/complexity/player count
```

### SEO Components (in src/lib/seo/)
```typescript
GameJsonLd          // Game schema for game hub pages
HowToJsonLd         // HowTo schema for rules pages
ItemListJsonLd      // ItemList for game listings
CollectionJsonLd    // Collection schema for collections
BreadcrumbJsonLd    // Breadcrumb navigation schema
OrganizationJsonLd  // Site-wide organization info
WebSiteJsonLd       // Site-wide website info with search
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
