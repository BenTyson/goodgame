# Current Status

> Last Updated: 2025-12-24

## Phase: 9 - Database Normalization

### What's Live
- **16 games** with full content (Rules, Setup, Reference, Score Sheets)
- **6 major awards** with full UI
- **Admin panel** at `/admin` with Google OAuth
- **Image uploads** via Supabase Storage
- **Content pipeline** (BGG scraper + AI generation ready)
- **Separate databases** for staging and production
- **User authentication** with Google OAuth
- **Your Shelf** feature - track games you own/want
- **Normalized entities** - Designers, Publishers, Artists as proper tables
- **Entity pages** - `/designers`, `/publishers` with game listings

### Environments

| Environment | URL | Database |
|-------------|-----|----------|
| **Local** | http://localhost:3399 | Staging Supabase |
| **Staging** | https://goodgame-staging-staging.up.railway.app | Staging Supabase |
| **Production** | https://boardnomads.com | Production Supabase |

### Branch Strategy
| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | `ndskcbuzsmrzgnvdbofd` |
| `main` | Production | `jnaibnwxpweahpawxycf` |

### User Auth & Shelf
| Feature | Status |
|---------|--------|
| Google OAuth login | ✅ |
| User profile auto-creation | ✅ |
| Add games to shelf | ✅ |
| Shelf statuses (owned, want to buy, want to play, wishlist, previously owned) | ✅ |
| Game ratings (1-10) | ✅ |
| Shelf filtering & sorting | ✅ |
| Profile settings page | ✅ |

**Routes:**
- `/login` - User login page
- `/shelf` - Your game collection
- `/settings` - Profile settings

### Admin System (`/admin`)
| Feature | Status |
|---------|--------|
| Google OAuth login | ✅ |
| Magic link email login | ✅ |
| Games list with filters | ✅ |
| Game editor (metadata, content) | ✅ |
| Image upload + gallery management | ✅ |
| Set primary/cover image | ✅ |
| Import queue management | ✅ |
| Dashboard with stats | ✅ |

### Content Pipeline
| Component | Status | Location |
|-----------|--------|----------|
| BGG Scraper | ✅ | `src/lib/bgg/` |
| AI Content Generator | ✅ | `src/lib/ai/` |
| Import Cron API | ✅ | `/api/cron/import-bgg` |
| Generate Cron API | ✅ | `/api/cron/generate-content` |
| Image Upload API | ✅ | `/api/admin/upload` |

**Note:** BGG API requires registration and Bearer token. Register at https://boardgamegeek.com/applications

---

## Supabase Projects

### Staging (`ndskcbuzsmrzgnvdbofd`)
- **Used by**: localhost + Railway staging
- **Purpose**: Safe testing, can reset data
- **URL**: https://ndskcbuzsmrzgnvdbofd.supabase.co

### Production (`jnaibnwxpweahpawxycf`)
- **Used by**: Railway production only
- **Purpose**: Live user data, protected
- **URL**: https://jnaibnwxpweahpawxycf.supabase.co

---

## Environment Variables

### Local (`.env.local`)
```
# Staging Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ndskcbuzsmrzgnvdbofd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Board Nomads
ADMIN_EMAILS=your-email@gmail.com

# BGG API (register at https://boardgamegeek.com/applications)
BGG_API_TOKEN=your-bgg-token

# Cron job authentication
CRON_SECRET=your-cron-secret
```

### Railway Staging
```
NEXT_PUBLIC_SUPABASE_URL=https://ndskcbuzsmrzgnvdbofd.supabase.co
NEXT_PUBLIC_SITE_URL=https://goodgame-staging-staging.up.railway.app
NEXT_PUBLIC_SITE_NAME=Good Game (Staging)
```

### Railway Production
```
NEXT_PUBLIC_SUPABASE_URL=https://jnaibnwxpweahpawxycf.supabase.co
NEXT_PUBLIC_SITE_URL=https://boardnomads.com
NEXT_PUBLIC_SITE_NAME=Good Game
```

---

## Database Migrations
```
supabase/migrations/
├── 00001_initial_schema.sql       # Core tables
├── 00002_seed_data.sql            # Categories + mechanics
├── 00003_game_images.sql          # Images table
├── 00004_seed_games.sql           # First 6 games
├── 00005_more_pilot_games.sql     # 4 more games
├── 00006_tier1_gateway_games.sql  # 6 gateway games
├── 00007_awards_schema.sql        # Awards tables
├── 00008_seed_awards.sql          # 6 awards + winners
├── 00009_game_content.sql         # JSONB content columns
├── 00010_game_families.sql        # Game relations (expansions)
├── 00011_import_queue.sql         # BGG import queue
├── 00012_content_generation_log.sql # AI generation tracking
├── 00013_seed_existing_content.sql  # Migrate hardcoded content
├── 00014_complete_game_content.sql  # All 16 games content
├── 00015_game_images_storage.sql    # Supabase Storage bucket
├── 00016_game_images_rls.sql        # RLS for game_images
├── 00017_cleanup_placeholder_images.sql # Remove old BGG placeholders
├── 00018_queue_bgg_top100.sql       # Queue BGG Top 100 games
├── 00019_seo_collections.sql        # SEO collection pages
├── 00020_user_profiles_and_shelf.sql # User auth + shelf feature
├── 00021_normalize_entities.sql     # Designers, publishers, artists tables
└── 00022_migrate_entity_data.sql    # Populate from bgg_raw_data
```

---

## Key Commands
```bash
npm run dev              # http://localhost:3399
npm run build            # Production build

# Database migrations
npx supabase db push     # Push to staging (default linked)

# Push to production (when needed)
npx supabase link --project-ref jnaibnwxpweahpawxycf
npx supabase db push
npx supabase link --project-ref ndskcbuzsmrzgnvdbofd  # Switch back

# Git workflow (always work on develop)
git checkout develop
git push origin develop  # Deploys to staging

# Deploy to production (via PR)
# Go to: https://github.com/BenTyson/goodgame/compare/main...develop

# Regenerate types after schema changes
npx supabase gen types typescript --project-ref ndskcbuzsmrzgnvdbofd > src/types/supabase.ts

# Railway CLI
railway environment staging && railway service goodgame-staging   # Switch to staging
railway environment production && railway service goodgame        # Switch to production
railway logs                                                      # View logs
```

---

## Key Files

### Admin
| File | Purpose |
|------|---------|
| `src/app/admin/(dashboard)/layout.tsx` | Auth check + admin nav |
| `src/app/admin/(dashboard)/games/[id]/` | Game editor |
| `src/app/admin/login/page.tsx` | OAuth + magic link |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/components/admin/ImageUpload.tsx` | Image upload component |
| `src/app/api/admin/upload/route.ts` | Image upload API |

### User Auth & Shelf
| File | Purpose |
|------|---------|
| `src/lib/auth/AuthContext.tsx` | React auth context provider |
| `src/lib/supabase/user-queries.ts` | Shelf CRUD operations |
| `src/components/auth/UserMenu.tsx` | Header user dropdown |
| `src/components/shelf/AddToShelfButton.tsx` | Add game to shelf |
| `src/components/shelf/RatingInput.tsx` | 1-10 star rating |
| `src/app/login/page.tsx` | Login page |
| `src/app/shelf/page.tsx` | Shelf page |
| `src/app/settings/page.tsx` | Profile settings |

### Content Pipeline
| File | Purpose |
|------|---------|
| `src/lib/bgg/client.ts` | BGG XML API client |
| `src/lib/bgg/importer.ts` | Import games from BGG |
| `src/lib/ai/claude.ts` | Claude API client |
| `src/lib/ai/generator.ts` | Generate game content |
| `src/lib/ai/prompts.ts` | AI prompts for content |

---

## Supabase Storage

**Bucket**: `game-images` (exists in both staging and production)
- Public read access
- Authenticated upload/delete
- Path: `{game-slug}/{timestamp}-{random}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

---

## OAuth Setup

### Google Cloud Console
- OAuth 2.0 Client ID configured
- Authorized redirect URIs:
  - `https://ndskcbuzsmrzgnvdbofd.supabase.co/auth/v1/callback` (staging)
  - `https://jnaibnwxpweahpawxycf.supabase.co/auth/v1/callback` (production)

### Staging Supabase Auth
- Site URL: `https://goodgame-staging-staging.up.railway.app`
- Redirect URLs:
  - `http://localhost:3399/**`
  - `https://goodgame-staging-staging.up.railway.app/**`

### Production Supabase Auth
- Site URL: `https://boardnomads.com`
- Redirect URLs:
  - `https://boardnomads.com/**`

---

## Next Steps
- Upload images for all 16 games via admin
- Set up cron-job.org to trigger import/generate APIs
- Add more games via BGG import queue
- Push user auth migration to production when ready
- Add public shelf viewing (currently private only)
