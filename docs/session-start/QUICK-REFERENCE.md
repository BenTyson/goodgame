# Quick Reference

## Commands

```bash
# Development
npm run dev                    # Start dev server (port 3399)
npm run build                  # Production build
npm run lint                   # ESLint check

# Supabase
supabase login                 # Login to Supabase CLI
supabase link --project-ref jnaibnwxpweahpawxycf  # Link project
supabase db push               # Push migrations to remote
supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts
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
├── rules/page.tsx
├── sitemap.ts                 # Dynamic sitemap
└── robots.ts                  # Robots.txt
```

### Components
```
src/components/
├── ui/                        # shadcn/ui (don't edit directly)
├── layout/                    # Header, Footer, ThemeProvider
├── games/                     # GameCard, GameGrid, GameFilters, ImageGallery, RelatedGames
├── score-sheet/               # ScoreSheetGenerator (jsPDF)
├── setup/                     # SetupChecklist (interactive)
├── search/                    # SearchDialog (Cmd+K)
└── monetization/              # AdUnit, AffiliateButton (planned)
```

### Data & Types
```
src/types/supabase.ts          # Auto-generated from Supabase schema
src/types/database.ts          # Convenience types (GameRow, GameInsert, etc.)
src/data/mock-games.ts         # Mock data: games, categories, collections, images
src/lib/supabase/              # Database clients (client.ts, server.ts)
src/lib/seo/                   # JSON-LD structured data components
supabase/migrations/           # Database schema (8 files)
next.config.ts                 # Remote image patterns (cf.geekdo-images.com)
```

### Type Definitions
```typescript
// From src/types/database.ts
GameRow          // Game without generated columns (for mock data)
Game             // Full game type including fts column
GameInsert       // For inserting new games
Category         // Category type
Collection       // Collection type
GameImage        // Game image type
Award            // Award organization type
AwardCategory    // Award category type
GameAward        // Game-award link type
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

```env
# Client-side (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://jnaibnwxpweahpawxycf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Good Game

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=...
```

## Supabase

**Project ID**: `jnaibnwxpweahpawxycf`

```bash
# After schema changes, regenerate types:
supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts
```

## Design System

- **Primary**: Teal `oklch(0.55 0.15 195)`
- **Shadow variables**: `--shadow-card`, `--shadow-card-hover`, `--shadow-glow-primary`
- **Dark mode**: Warm charcoal (hue 55-70)
- **Light mode**: Warm cream whites

## URLs

- Local dev: http://localhost:3399
- Supabase Dashboard: https://supabase.com/dashboard/project/jnaibnwxpweahpawxycf
- Railway Dashboard: https://railway.app/dashboard
