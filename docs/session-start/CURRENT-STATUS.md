# Current Status

> Last Updated: 2025-12-23

## Phase: 6 - Admin System Complete

### What's Live
- **16 games** with full content (Rules, Setup, Reference, Score Sheets)
- **6 major awards** with full UI
- **Admin panel** at `/admin` with Google OAuth
- **Image uploads** via Supabase Storage
- **Content pipeline** (BGG scraper + AI generation ready)
- **Production**: https://boardnomads.com

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

---

## Environment Variables

### Local (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://jnaibnwxpweahpawxycf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Board Nomads
ADMIN_EMAILS=your-email@gmail.com
```

### Railway (Production)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://boardnomads.com
ADMIN_EMAILS
CRON_SECRET
ANTHROPIC_API_KEY
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
└── 00017_cleanup_placeholder_images.sql # Remove old BGG placeholders
```

---

## Key Commands
```bash
npm run dev              # http://localhost:3399
npm run build            # Production build
supabase db push         # Push migrations
git push origin main     # Deploy to Railway

# Regenerate types after schema changes
supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts
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

**Bucket**: `game-images`
- Public read access
- Authenticated upload/delete
- Path: `{game-slug}/{timestamp}-{random}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

---

## OAuth Setup

### Google Cloud Console
- OAuth 2.0 Client ID configured
- Authorized redirect URIs:
  - `https://jnaibnwxpweahpawxycf.supabase.co/auth/v1/callback`
  - `http://localhost:3399/auth/callback` (dev)
  - `https://boardnomads.com/auth/callback` (prod)

### Supabase Auth
- Google provider enabled
- Site URL: `https://boardnomads.com`
- Redirect URLs include localhost + production

---

## Next Steps
- Upload images for all 16 games via admin
- Set up cron-job.org to trigger import/generate APIs
- Add more games via BGG import queue
