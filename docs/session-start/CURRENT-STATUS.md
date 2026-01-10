# Current Status

> Last Updated: 2026-01-10 (Game Detail Page Code Cleanup)

## Current Phase: 66 - Game Detail Page Code Cleanup

Code cleanup and refactoring of `/games/[slug]` page for better organization and reduced duplication.

### Session Summary (2026-01-10) - Code Cleanup

**New Utility Files:**
- `src/lib/utils/complexity.ts` - Consolidated complexity tier logic (previously duplicated in 3 components)
- `src/lib/utils/wikipedia.ts` - Wikipedia content cleaning utilities (citation removal, markup cleaning)
- `src/lib/utils/youtube.ts` - YouTube URL utilities (thumbnails, embeds, ID extraction)

**New Custom Hooks:**
- `src/hooks/use-media-modal.ts` - Shared modal navigation with keyboard nav (Escape, arrows), body overflow management
- `src/hooks/use-expandable-list.ts` - Expand/collapse pattern for lists (used by TaxonomySection, CreditsSection)

**New Shared Component:**
- `src/components/games/MediaModal.tsx` - Shared modal shell for media galleries (backdrop, navigation, close button)

**Code Deduplication:**
- Extracted ~300+ lines of duplicate code across components
- ImageGallery reduced from ~236 to ~135 lines
- VideoCarousel reduced from ~214 to ~108 lines
- Removed duplicate Wikipedia cleaning regex from RulesTab/OverviewTab
- Removed duplicate `getThumbnailUrl` from VideoCarousel

**Data Layer Optimization:**
- Parallelized `getGameWithDetails()` queries using `Promise.all()`
- Changed from 12+ sequential queries to 1 initial + 12 parallel queries

**Files Created:**
| File | Purpose |
|------|---------|
| `src/lib/utils/complexity.ts` | Complexity tier utilities (getCrunchTier, getComplexityLabel) |
| `src/lib/utils/wikipedia.ts` | Wikipedia content cleaning (cleanWikipediaContent, truncateAtWordBoundary) |
| `src/lib/utils/youtube.ts` | YouTube utilities (getYouTubeThumbnailUrl, getYouTubeEmbedUrl) |
| `src/hooks/use-media-modal.ts` | Modal state/navigation hook |
| `src/hooks/use-expandable-list.ts` | Expand/collapse list hook |
| `src/components/games/MediaModal.tsx` | Shared media modal shell |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/games/ImageGallery.tsx` | Use useMediaModal hook, MediaModal component |
| `src/components/games/VideoCarousel.tsx` | Use useMediaModal hook, MediaModal component, youtube utils |
| `src/components/games/TaxonomySection.tsx` | Use useExpandableList hook |
| `src/components/games/CreditsSection.tsx` | Use useExpandableList hook |
| `src/components/games/tabs/RulesTab.tsx` | Use wikipedia utilities |
| `src/components/games/tabs/OverviewTab.tsx` | Use wikipedia utilities, useExpandableList hook |
| `src/lib/supabase/game-queries.ts` | Parallelized getGameWithDetails queries |

**Build Status:** Compiled successfully

---

## What's Live

### Core Features
- **35+ games** in database with full content
- **Game Directory** with filter sidebar, search, pagination
- **Game Pages** with comprehensive data display (categories, mechanics, themes, experiences, complexity, relations)
- **D10 Sphere Rating** in hero section - 3D marble-style 1-10 rating with auth gating
- **Awards display** in hero section with expandable list
- **"Buy on Amazon" button** in hero section (when ASIN available)
- **Expandable sections** for mechanics, credits, and other overflow content
- **Rules Summaries**, **Score Sheets** (PDF), **Quick Reference**
- **Your Shelf** - Track owned/wanted/played games with ratings
- **User Profiles** at `/u/[username]` with Top 10 games, insights, badges
- **Following System** + Activity Feed at `/feed`
- **Recommendation Engine** at `/recommend`

### Marketplace
- Full buy/sell/trade system with listings, messaging, offers
- Stripe Connect payments with escrow
- Reputation/feedback system

### Admin
- **Vecna Pipeline** (`/admin/vecna`) - 4-phase content pipeline, 2-tab game panel (Pipeline + Details)
- **Game Editor** (`/admin/games/[id]`) - 7 tabs: Details, Taxonomy, Rulebook, Content, Sources, Media, Purchase
- **Import Wizard** (`/admin/import`) - BGG game import with relation management and real-time progress
- Rulebook parsing + Crunch Score generation
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Parallel enrichment with Wikidata + Wikipedia + Wikimedia Commons
- YouTube video management with type categorization (overview/gameplay/review)
- **Awards sync** from Wikipedia to normalized `game_awards` table
- **ASIN enrichment** from Wikidata with name-search fallback + manual entry
- **Purchase links management** - Global retailers table with URL patterns, per-game links in Purchase tab

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

69 migrations in `supabase/migrations/` covering:
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
- [PHASES-58-65.md](../archive/phases/PHASES-58-65.md) - Game pages rebuild, tabbed UX, ratings, purchase links
- [PHASES-53-57.md](../archive/phases/PHASES-53-57.md) - Parallel enrichment, Admin UI cleanup, Vecna UI overhaul
- [PHASES-39-52.md](../archive/phases/PHASES-39-52.md) - Vecna implementation details
- [PHASES-35-38.md](../archive/phases/PHASES-35-38.md) - Earlier phases
- [PHASES-29-34.md](../archive/phases/PHASES-29-34.md) - Marketplace phases
- [PHASES-21-28.md](../archive/phases/PHASES-21-28.md) - User system phases
