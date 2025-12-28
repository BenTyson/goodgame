# Quick Reference

## Environments

| Environment | URL | Database |
|-------------|-----|----------|
| Local | http://localhost:3399 | Staging |
| Staging | https://goodgame-staging-staging.up.railway.app | Staging |
| Production | https://boardnomads.com | Production |

## Commands

```bash
# Development
npm run dev                    # Start dev server (port 3399)
npm run build                  # Production build
npm run lint                   # ESLint check

# Git (always work on develop)
git checkout develop           # Switch to develop
git push origin develop        # Deploy to staging

# Supabase (linked to staging by default)
npx supabase db push           # Push migrations to staging

# Push to production database
npx supabase link --project-ref jnaibnwxpweahpawxycf
npx supabase db push
npx supabase link --project-ref ndskcbuzsmrzgnvdbofd  # Switch back

# Regenerate types
npx supabase gen types typescript --project-ref ndskcbuzsmrzgnvdbofd > src/types/supabase.ts

# Railway
railway environment staging && railway service goodgame-staging
railway environment production && railway service goodgame
railway logs
```

## Supabase Projects

| Project | Ref ID | Used By |
|---------|--------|---------|
| **Staging** | `ndskcbuzsmrzgnvdbofd` | localhost + Railway staging |
| **Production** | `jnaibnwxpweahpawxycf` | Railway production |

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
├── designers/
│   ├── page.tsx              # Designers listing
│   └── [slug]/page.tsx       # Designer detail
├── publishers/
│   ├── page.tsx              # Publishers listing
│   └── [slug]/page.tsx       # Publisher detail
├── admin/                     # Admin panel
│   ├── login/page.tsx
│   └── (dashboard)/
│       ├── page.tsx          # Dashboard
│       ├── games/            # Game management
│       ├── families/         # Family management
│       ├── publishers/       # Publisher management
│       └── queue/            # Import queue
├── login/page.tsx             # User login
├── shelf/page.tsx             # User's game collection
├── settings/page.tsx          # Profile settings (with image uploads)
├── u/[username]/page.tsx      # Public user profiles (with stats, badges)
├── api/user/profile-image/    # User profile image upload API
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
├── families/                  # FamilyCard, FamilyBadge
├── publishers/                # PublisherCard
├── admin/                     # ImageUpload, LogoUpload, ContentEditor, FamilyEditor, PublisherEditor
├── auth/                      # UserMenu
├── shelf/                     # AddToShelfButton, RatingInput
├── settings/                  # UsernameInput, ProfileImageUpload
├── profile/                   # TopGamesDisplay, TopGamesEditor, ProfileStats
├── score-sheet/               # ScoreSheetGenerator (jsPDF)
├── setup/                     # SetupChecklist (interactive)
├── search/                    # SearchDialog (Cmd+K)
└── monetization/              # AdUnit, AffiliateButton (planned)
```

### Data & Types
```
src/types/supabase.ts          # Auto-generated from Supabase schema
src/types/database.ts          # Convenience types (GameRow, GameInsert, etc.)
src/lib/supabase/              # Database clients (client.ts, server.ts)
src/lib/bgg/                   # BGG API client and importer
src/lib/ai/                    # Claude AI content generator
src/lib/seo/                   # JSON-LD structured data components
src/lib/auth/                  # AuthContext provider
supabase/migrations/           # Database schema (29 files)
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
Designer         // Designer type
Publisher        // Publisher type
Artist           // Artist type
UserProfile      // User profile type (with header_image_url, custom_avatar_url, last_active_at)
UserGame         // User shelf item type
UserTopGame      // User's top 10 ranked games
ShelfStatus      // 'owned' | 'want_to_buy' | 'want_to_play' | 'previously_owned' | 'wishlist'
SocialLinks      // Social links interface (bgg_username, twitter_handle, etc.)
TopGameWithDetails // Top game with game details for display
```

## Environment Variables

```env
# Staging Supabase (localhost + staging)
NEXT_PUBLIC_SUPABASE_URL=https://ndskcbuzsmrzgnvdbofd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Board Nomads

# Admin
ADMIN_EMAILS=your-email@gmail.com
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GameCard.tsx` |
| Utilities | camelCase | `formatPlayerCount.ts` |
| Routes | kebab-case | `/score-sheets` |
| Database | snake_case | `game_categories` |
| CSS classes | kebab-case | `.game-card-header` |

## Design System

- **Primary**: Teal `oklch(0.55 0.15 195)`
- **Shadow variables**: `--shadow-card`, `--shadow-card-hover`, `--shadow-glow-primary`
- **Dark mode**: Warm charcoal (hue 55-70)
- **Light mode**: Warm cream whites

## URLs

- **Local**: http://localhost:3399
- **Staging**: https://goodgame-staging-staging.up.railway.app
- **Production**: https://boardnomads.com
- **Staging Supabase**: https://supabase.com/dashboard/project/ndskcbuzsmrzgnvdbofd
- **Production Supabase**: https://supabase.com/dashboard/project/jnaibnwxpweahpawxycf
- **Railway**: https://railway.app/dashboard
