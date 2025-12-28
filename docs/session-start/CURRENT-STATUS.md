# Current Status

> Last Updated: 2025-12-27

## Phase: 14 - User Profile Expansion (Top 10 Games)

### What's Live
- **35 games** (16 with full content + 19 BGG top 20 games pending content)
- **11 major awards** with full UI (American, German, International)
- **Admin panel** at `/admin` with Google OAuth
- **Image uploads** via Supabase Storage
- **Content pipeline** (BGG scraper + AI generation ready)
- **Separate databases** for staging and production
- **User authentication** with Google OAuth
- **Your Shelf** feature - track games you own/want (in main nav)
- **Shelf v2 UI** - Card grid layout with tab filters and clickable ratings
- **User profiles** - username, bio, location, social links
- **Public profile pages** at `/u/[username]`
- **Privacy controls** - profile/shelf visibility (both default to public)
- **Normalized entities** - Designers, Publishers, Artists as proper tables
- **Entity pages** - `/designers`, `/publishers` with game listings
- **Game Families** - Series groupings (Catan, Pandemic, etc.) with public pages
- **Game Relations** - Expansions, sequels, reimplementations linked between games
- **Auto-import** - Families and expansion relations from BGG during import
- **Publisher Admin** - Full CRUD with logo upload at `/admin/publishers`
- **Publisher Filters** - A-Z alphabetical, category type, and sort options on `/publishers`
- **Featured Game** - Homepage section with hero image and game details
- **Streamlined Nav** - Removed redundant Rules/Score Sheets links (pages still exist for SEO)
- **Game Keytags** - Trending, Top Rated, Staff Pick, Hidden Gem, New Release (admin toggles)
- **Top 10 Games** - Users can curate their all-time favorite games on profiles

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
| Shelf tab filters (by status) | ✅ |
| Shelf card grid layout (4 cols) | ✅ |
| Shelf sorting (added, name, rating) | ✅ |
| Profile settings page | ✅ |
| Unique usernames (@username) | ✅ |
| Bio, location fields | ✅ |
| Social links (BGG, Twitter, Instagram, Discord, Website) | ✅ |
| Public profile pages | ✅ |
| Profile/shelf visibility controls | ✅ |
| Top 10 Games ranking | ✅ |
| Drag & drop ranking editor | ✅ |

**Top 10 Games:**
- Curate favorite games (any game in database)
- Drag & drop reordering in modal editor
- Podium display (#1-3 large, #4-10 compact)
- Visibility follows profile settings

**Shelf Status Icons (Lucide):**
- Owned: `Package`
- Want to Buy: `ShoppingCart`
- Want to Play: `Dices`
- Wishlist: `Star`
- Previously Owned: `ArchiveX`

**Routes:**
- `/login` - User login page
- `/shelf` - Your game collection (card grid with tab filters)
- `/settings` - Profile settings (username, bio, location, social links, privacy)
- `/u/[username]` - Public user profile page

### Admin System (`/admin`)
| Feature | Status |
|---------|--------|
| Google OAuth login | ✅ |
| Magic link email login | ✅ |
| Games list with filters | ✅ |
| Game editor (metadata, content) | ✅ |
| Game keytag toggles (Publishing tab) | ✅ |
| Game relationships tab | ✅ |
| Image upload + gallery management | ✅ |
| Set primary/cover image | ✅ |
| Import queue management | ✅ |
| Family manager | ✅ |
| Publisher manager | ✅ |
| Publisher logo upload | ✅ |
| Dashboard with stats | ✅ |

**Game Keytags (boolean flags for homepage collections):**
- `is_trending` - Trending Now
- `is_top_rated` - Top Rated
- `is_staff_pick` - Staff Pick
- `is_hidden_gem` - Hidden Gem
- `is_new_release` - New Release

### Game Families & Relations
| Feature | Status |
|---------|--------|
| Family list page (`/families`) | ✅ |
| Family detail page (`/families/[slug]`) | ✅ |
| Family badge on game pages | ✅ |
| Games grouped by relation type on family page | ✅ |
| Admin family manager (`/admin/families`) | ✅ |
| Admin family editor (create/edit/delete) | ✅ |
| Game editor relationships tab | ✅ |
| BGG import auto-creates families | ✅ |
| BGG import auto-creates expansion relations | ✅ |

**Relation Types:** expansion_of, base_game_of, sequel_to, prequel_to, reimplementation_of, spin_off_of, standalone_in_series

### Publishers
| Feature | Status |
|---------|--------|
| Publisher list page (`/publishers`) | ✅ |
| Publisher detail page (`/publishers/[slug]`) | ✅ |
| Alphabetical filter (A-Z) | ✅ |
| Category type filter | ✅ |
| Sort options (name, game count) | ✅ |
| Category badges on cards | ✅ |
| Admin publisher manager (`/admin/publishers`) | ✅ |
| Admin logo upload | ✅ |

**Storage:** `publisher-logos` bucket in Supabase Storage

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
├── 00022_migrate_entity_data.sql    # Populate from bgg_raw_data
├── 00023_user_profile_enhancements.sql # Username, bio, social links, visibility
├── 00024_add_awards_and_reorder.sql # 5 more awards (American/German/International)
├── 00025_bgg_top20_games.sql        # 19 BGG top 20 games
├── 00026_populate_publishers_from_text.sql # Populate publishers from text fields
├── 00027_game_keytags.sql           # Keytag booleans for homepage collections
└── 00028_user_top_games.sql         # User top 10 games ranking
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
| `src/lib/supabase/user-queries.ts` | Shelf + profile CRUD operations |
| `src/components/auth/UserMenu.tsx` | Header user dropdown |
| `src/components/shelf/AddToShelfButton.tsx` | Add game to shelf |
| `src/components/shelf/RatingInput.tsx` | 1-10 star rating |
| `src/components/settings/UsernameInput.tsx` | Username input with availability check |
| `src/app/login/page.tsx` | Login page |
| `src/app/shelf/page.tsx` | Shelf page |
| `src/app/settings/page.tsx` | Profile settings |
| `src/app/u/[username]/page.tsx` | Public profile page |
| `src/components/profile/TopGamesDisplay.tsx` | Top 10 games display with podium |
| `src/components/profile/TopGamesEditor.tsx` | Drag & drop ranking editor modal |

### Content Pipeline
| File | Purpose |
|------|---------|
| `src/lib/bgg/client.ts` | BGG XML API client |
| `src/lib/bgg/importer.ts` | Import games from BGG (includes families + relations) |
| `src/lib/ai/claude.ts` | Claude API client |
| `src/lib/ai/generator.ts` | Generate game content |
| `src/lib/ai/prompts.ts` | AI prompts for content |

### Game Families
| File | Purpose |
|------|---------|
| `src/app/families/page.tsx` | Family list page |
| `src/app/families/[slug]/page.tsx` | Family detail with grouped games |
| `src/components/games/FamilyBadge.tsx` | Badge on game pages |
| `src/components/families/FamilyCard.tsx` | Card for listings |
| `src/app/admin/(dashboard)/families/page.tsx` | Admin family list |
| `src/app/admin/(dashboard)/families/[id]/page.tsx` | Admin family editor |
| `src/components/admin/FamilyEditor.tsx` | Family form component |
| `src/components/admin/GameRelationsEditor.tsx` | Relations tab in game editor |
| `src/components/admin/GamePicker.tsx` | Searchable game selector |
| `src/app/api/admin/families/route.ts` | Family CRUD API |
| `src/app/api/admin/game-relations/route.ts` | Relations CRUD API |

### Publishers
| File | Purpose |
|------|---------|
| `src/app/publishers/page.tsx` | Publisher list page |
| `src/app/publishers/PublishersList.tsx` | Filters + grid (client component) |
| `src/app/publishers/[slug]/page.tsx` | Publisher detail page |
| `src/components/publishers/PublisherCard.tsx` | Publisher card with category badges |
| `src/app/admin/(dashboard)/publishers/page.tsx` | Admin publisher list |
| `src/app/admin/(dashboard)/publishers/[id]/page.tsx` | Admin publisher editor |
| `src/components/admin/PublisherEditor.tsx` | Publisher form component |
| `src/components/admin/LogoUpload.tsx` | Logo upload component |
| `src/app/api/admin/publishers/route.ts` | Publisher CRUD API |
| `src/app/api/admin/publisher-logo/route.ts` | Logo upload API |

---

## Supabase Storage

**Bucket**: `game-images` (exists in both staging and production)
- Public read access
- Authenticated upload/delete
- Path: `{game-slug}/{timestamp}-{random}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

**Bucket**: `publisher-logos` (exists in both staging and production)
- Public read access
- Authenticated upload/delete
- Path: `{publisher-slug}/{timestamp}.{ext}`
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
- Upload images for all games via admin
- Generate content for the 19 new BGG top 20 games
- Set up cron-job.org to trigger import/generate APIs
- Push latest migrations to production when ready
- Import more games to populate families and relations
- Build out social features (following, friends, activity feed)
