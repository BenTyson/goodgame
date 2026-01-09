# Current Status

> Last Updated: 2026-01-09 (Video Management & MediaTab Refactor)

## Current Phase: 61 - Video Management & Media Tab Refactor

YouTube video management for games and admin Media tab componentization.

### Session Summary (2026-01-09) - Video Management & MediaTab Refactor

**Video Management Feature:**
- New `game_videos` table for YouTube video links with type categorization
- Video types: `overview`, `gameplay`, `review`
- Featured video flag (one per game) for public display
- Full CRUD API at `/api/admin/game-videos`
- `VideoManager` component with thumbnail previews, type badges, featured selection

**Dynamic Video on Game Pages:**
- Featured video displays in "Watch" section on `/games/[slug]`
- Fetched via `getGameWithDetails()` query
- Only renders when a featured video exists (no more placeholder)

**MediaTab Component Refactor:**
- Extracted ~300 lines from `GameEditor.tsx` into modular components
- New components in `game-editor/`:
  - `MediaTab.tsx` - Main tab orchestrator
  - `WikimediaCommonsSearch.tsx` - Commons search with results grid
  - `AvailableImageSources.tsx` - Wikipedia/Wikidata/BGG source images
- `GameEditor.tsx` reduced from ~560 to ~237 lines (~58% reduction)
- Pattern matches other tabs (DetailsTab, SourcesTab, etc.)

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/admin/VideoManager.tsx` | Video management UI component |
| `src/components/admin/game-editor/MediaTab.tsx` | Media tab wrapper |
| `src/components/admin/game-editor/WikimediaCommonsSearch.tsx` | Commons search component |
| `src/components/admin/game-editor/AvailableImageSources.tsx` | External sources component |
| `src/app/api/admin/game-videos/route.ts` | Video CRUD API |
| `supabase/migrations/00067_game_videos.sql` | Video table schema |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/admin/GameEditor.tsx` | Refactored to use MediaTab component |
| `src/components/admin/game-editor/index.ts` | Added MediaTab exports |
| `src/lib/supabase/game-queries.ts` | Added featured video to getGameWithDetails |
| `src/components/games/tabs/OverviewTab.tsx` | Dynamic video section |
| `src/app/admin/(dashboard)/games/[id]/page.tsx` | Fetch videos with game data |

**Build Status:** ✓ Compiled successfully

---

## Previous Phase: 60 - Rulebook Thumbnails & Upload

Server-side PDF thumbnail generation and admin PDF upload functionality for rulebooks.

### Session Summary (2026-01-08) - Rulebook Thumbnails & PDF Upload

**Rulebook Thumbnail Generation:**
- Server-side thumbnail generation using `unpdf.renderPageAsImage()` + `@napi-rs/canvas`
- Generates PNG preview from first page of PDF rulebooks
- Auto-generates during parse flow, stores in Supabase storage
- Zero client-side bundle impact (all server-side)

**New Files:**
| File | Purpose |
|------|---------|
| `src/lib/rulebook/thumbnail.ts` | PDF → PNG thumbnail generator |
| `src/app/api/admin/rulebook/upload/route.ts` | PDF file upload endpoint |
| `supabase/migrations/00065_rulebook_thumbnail.sql` | `rulebook_thumbnail_url` column |
| `supabase/migrations/00066_rulebooks_storage.sql` | `rulebooks` storage bucket |

**Rulebook Upload Feature (Vecna Admin):**
- New "Upload PDF File" button in Rulebook Discovery panel
- Validates PDF magic bytes and 50MB size limit
- Uploads to dedicated `rulebooks` storage bucket
- Updates game record with public URL

**RulebookPreview Component Redesign:**
- Full-bleed thumbnail fills card (no padding at top/corners)
- "Official Rulebook" overlay with gradient at top
- Encouraging message: "The best way to learn {game} (other than playing it) is to read the rulebook!"
- Button: "Read the Official Rules"
- Hover overlay for quick access

**Build Configuration:**
- Added `serverExternalPackages: ['@napi-rs/canvas']` to Next.js config for native module support

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/games/tabs/RulesTab.tsx` | Redesigned RulebookPreview with thumbnails |
| `src/app/api/admin/rulebook/parse/route.ts` | Integrated thumbnail generation |
| `src/app/admin/(dashboard)/vecna/components/RulebookDiscovery.tsx` | Added file upload UI |
| `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` | Pass gameSlug prop |
| `next.config.ts` | serverExternalPackages for native modules |
| `src/types/supabase.ts` | Regenerated with new columns |

**Build Status:** ✓ Compiled successfully

---

## Previous Phase: 59 - Game Page UX Overhaul

Apple-inspired tabbed redesign of `/games/[slug]` consolidating hub + sub-pages into a single-page tabbed experience.

### Session Summary (2026-01-08) - Tabbed Game Page & Wikipedia Fixes

**Major UX Redesign:**
- Consolidated `/games/[slug]` hub + 4 sub-pages into single tabbed experience
- Tabs: Overview | How to Play | Setup | Score Sheet
- Removed Reference tab (content merged into Rules tab as "Key Reminders")
- Hash-based tab routing (`/games/catan#rules`)

**New Components:**
| Component | Purpose |
|-----------|---------|
| `GamePageTabs.tsx` | Hash-based tab container with URL sync |
| `GameHero.tsx` | Simplified hero with single image, key stats |
| `QuickStatsBar.tsx` | Players/time/complexity/age badges |
| `tabs/OverviewTab.tsx` | Discovery content (about, credits, relations, reviews) |
| `tabs/RulesTab.tsx` | How to Play with Wikipedia integration |
| `tabs/SetupTab.tsx` | Setup checklist and component list |
| `tabs/ScoreSheetTab.tsx` | Score sheet generator |

**Rules Tab Improvements:**
- Wikipedia gameplay section with proper paragraph display
- Compact Core Rules accordion (single card, expandable rows)
- Scoring and End Game moved to sidebar
- Key Reminders card (from old Reference tab)
- Rulebook preview card in sidebar

**Wikipedia Bug Fixes:**
- Fixed `cleanSectionWikitext()` stripping paragraph breaks (`\s` → `[^\S\n]`)
- Added `redirects: 'true'` to all Wikipedia parse API calls
- Articles that redirect (e.g., "Ark_Nova_(board_game)") now work correctly

**Vecna Enhancement - Re-sync Wikipedia:**
- New API: `POST /api/admin/games/[id]/resync-wikipedia`
- New button in Pipeline tab "Reset State" section (next to Re-sync BGG)
- Re-fetches all Wikipedia data without full re-import
- Also added to SourcesDrawer Wikipedia tab

**Files Created:**
```
src/components/games/GamePageTabs.tsx
src/components/games/GameHero.tsx
src/components/games/QuickStatsBar.tsx
src/components/games/tabs/OverviewTab.tsx
src/components/games/tabs/RulesTab.tsx
src/components/games/tabs/SetupTab.tsx
src/components/games/tabs/ScoreSheetTab.tsx
src/components/games/tabs/index.ts
src/app/api/admin/games/[id]/resync-wikipedia/route.ts
```

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/games/[slug]/page.tsx` | Complete restructure with tabs |
| `src/lib/wikipedia/sections.ts` | Fixed paragraph preservation |
| `src/lib/wikipedia/client.ts` | Added redirect following |
| `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` | Added resyncWikipedia |
| `src/app/admin/(dashboard)/vecna/components/SourcesDrawer.tsx` | Added re-sync button |

**Build Status:** ✓ Compiled successfully

---

## Previous Phase: 58 - Game Pages Comprehensive Rebuild

Complete rebuild of `/games/[slug]` hub page and sub-pages (rules, setup, reference, score-sheet) to surface all available game data with next-level UI/UX.

### Session Summary (2026-01-07) - Game Pages Rebuild

**Data Audit:**
- Identified 9+ high-priority data gaps between admin data model and public display
- Missing: mechanics, themes, player experiences, min_age, crunch_score, component_list, artists, expansions/base game relations, Wikipedia content

**Data Layer (Phase 1):**
- Extended `getGameWithDetails()` to fetch themes, player experiences, and artists via junction tables
- Added `getGameRelationsGrouped()` function for structured game relations (base game, expansions, other)
- Re-exported `CrunchBreakdown` and `ComponentList` types from database types

**New Components Created (Phase 2):**
| Component | Purpose |
|-----------|---------|
| `TaxonomySection.tsx` | Displays all 4 taxonomy dimensions with collapsible rows (categories, mechanics, themes, experiences) |
| `ComplexityDisplay.tsx` | Shows Crunch Score with breakdown tooltip, falls back to BGG weight |
| `AgeRating.tsx` | "Ages X+" badge with tier classification |
| `CreditsSection.tsx` | Designers, Artists, Publishers with links and expandable lists |
| `ComponentsList.tsx` | "What's in the Box" - collapsible component grid |
| `WikipediaContent.tsx` | Gameplay/Reception sections with CC-BY-SA attribution |
| `GameRelationsSection.tsx` | Base game callout, expansions grid, family link |

**Hub Page Rebuild (Phase 3):**
- Complete restructure of `/games/[slug]/page.tsx`
- New layout: Hero → Relations → Resources → About → Reception → Reviews → External Links → Related Games
- All new components integrated with proper data fetching
- Graceful degradation when data is missing

**Sub-Pages Polish (Phase 4):**
| Page | Changes |
|------|---------|
| Rules | Added `ComplexityDisplay` component (replaces basic weight badge) |
| Setup | Added `ComplexityDisplay` component to stats bar |
| Reference | Added `ComplexityDisplay`; improved empty state with alternative resource links |
| Score Sheet | Already had tiebreaker display (no changes needed) |

**Files Created:**
```
src/components/games/TaxonomySection.tsx
src/components/games/ComplexityDisplay.tsx
src/components/games/AgeRating.tsx
src/components/games/CreditsSection.tsx
src/components/games/ComponentsList.tsx
src/components/games/WikipediaContent.tsx
src/components/games/GameRelationsSection.tsx
```

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/game-queries.ts` | Extended getGameWithDetails with themes, experiences, artists |
| `src/lib/supabase/family-queries.ts` | Added getGameRelationsGrouped function |
| `src/types/database.ts` | Re-exported CrunchBreakdown, ComponentList types |
| `src/components/games/index.ts` | Barrel exports for all new components |
| `src/app/games/[slug]/page.tsx` | Complete rebuild with new structure |
| `src/app/games/[slug]/rules/page.tsx` | Added ComplexityDisplay |
| `src/app/games/[slug]/setup/page.tsx` | Added ComplexityDisplay |
| `src/app/games/[slug]/reference/page.tsx` | ComplexityDisplay + improved empty state |

**Legal Data Sourcing:**
- Wikidata: CC0 (free use)
- Wikipedia: CC-BY-SA (requires attribution - implemented in WikipediaContent)
- BGG Facts: Public domain (names, dates, counts)
- BGG User Content: Avoided (ratings, rankings, descriptions)

**Build Status:** ✓ Compiled successfully

---

## What's Live

### Core Features
- **35+ games** in database with full content
- **Game Directory** with filter sidebar, search, pagination
- **Game Pages** with comprehensive data display (categories, mechanics, themes, experiences, complexity, relations)
- **Rules Summaries**, **Score Sheets** (PDF), **Quick Reference**
- **Your Shelf** - Track owned/wanted games with ratings
- **User Profiles** at `/u/[username]` with Top 10 games, insights, badges
- **Following System** + Activity Feed at `/feed`
- **Recommendation Engine** at `/recommend`

### Marketplace
- Full buy/sell/trade system with listings, messaging, offers
- Stripe Connect payments with escrow
- Reputation/feedback system

### Admin
- **Vecna Pipeline** (`/admin/vecna`) - 4-phase content pipeline, 2-tab game panel (Pipeline + Details)
- **Game Editor** (`/admin/games/[id]`) - 6 tabs: Details, Taxonomy, Rulebook, Content, Sources, Media
- **Import Wizard** (`/admin/import`) - BGG game import with relation management and real-time progress
- Rulebook parsing + Crunch Score generation
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Parallel enrichment with Wikidata + Wikipedia + Wikimedia Commons
- YouTube video management with type categorization (overview/gameplay/review)

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

67 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions
- Taxonomy: themes, player experiences, source tracking
- **Vecna: processing states, family context**

---

## Next Steps

### Content Pipeline
- Process more game families through Vecna
- Use Commons search to fill image gaps
- Import more games via Wikidata skill
- Fill in missing primary publishers

### Potential Future Initiatives
- **Publisher website scrapers** - Official rulebooks, images from publisher sites
- **YouTube Data API** - Video thumbnails, popularity metrics
- **Kickstarter integration** - Original campaign descriptions, component lists
- **Community features** - User image uploads, data corrections, reviews
- **Local discovery** - Find gamers nearby, game nights
- **Official partnerships** - BGA, publisher data sharing agreements

---

## Archived Sessions

Older session details archived in `/docs/archive/phases/`:
- [PHASES-53-57.md](../archive/phases/PHASES-53-57.md) - Parallel enrichment, Admin UI cleanup, Vecna UI overhaul
- [PHASES-39-52.md](../archive/phases/PHASES-39-52.md) - Vecna implementation details
- [PHASES-35-38.md](../archive/phases/PHASES-35-38.md) - Earlier phases
- [PHASES-29-34.md](../archive/phases/PHASES-29-34.md) - Marketplace phases
- [PHASES-21-28.md](../archive/phases/PHASES-21-28.md) - User system phases
