# Current Status

> Last Updated: 2026-01-05 (Vecna Phase 3: Enhanced AI + Completeness Report)

## Current Phase: 52 - Vecna Enhanced AI & Data Completeness

Enhanced AI content generation with full Wikipedia context, fixed taxonomy data loss, and added comprehensive data completeness reporting.

### Session Summary (2026-01-05) - Phase 3: Enhanced AI

**Data Completeness Report:**
- New report shows what data is MISSING after pipeline completes
- 9 categories: Core Data, External Sources, Publisher Data, Rulebook, Taxonomy, Rules/Setup/Reference Content, Images
- Field importance levels: Critical (red), Important (amber), Recommended (blue), Optional (gray)
- Appears in Pipeline tab when game reaches `generated` or `review_pending` state

**New Fields Tracked:**
| Field | Importance | Source |
|-------|------------|--------|
| Origins/History | Important | `wikipedia_origins` |
| Reception/Reviews | Important | `wikipedia_reception` |
| **US Publisher** | **Critical** | `wikipedia_infobox.publishersWithRegion` |
| Player Experiences | Important | `game_player_experiences` |

**Taxonomy Data Loss Fix:**
- **Player Experiences** were completely missing from Vecna pipeline - now fixed
- Added queries to both `getFamilies()` and `getStandaloneGames()` in Vecna page
- Added to VecnaGame type and displayed in Taxonomy accordion

**Enhanced Family Context for Expansions:**
- FamilyContext now includes 5 new fields from base game Wikipedia data
- AI prompts for expansions now receive: origins, reception, awards, designers, publishers
- Better content generation that understands what made the base game special

**Model Selector:**
- UI toggle to select AI model: Haiku (fast), Sonnet (balanced), Opus (best)
- Appears when ready to generate content (`taxonomy_assigned` or `review_pending`)
- Haiku is ideal for testing/debugging prompts

**New Components:**
| Component | Purpose |
|-----------|---------|
| `CompletenessReport.tsx` | Collapsible data completeness report UI |
| `src/lib/vecna/completeness.ts` | Field checking utility with 9 categories |

**Files Updated:**
- `src/lib/vecna/types.ts` - Enhanced FamilyContext with 5 new fields, added player_experiences to VecnaGame
- `src/lib/vecna/context.ts` - `buildFamilyContextSection()` outputs enhanced base game context
- `src/lib/vecna/pipeline.ts` - `buildFamilyContext()` accepts Wikipedia fields
- `src/app/api/admin/rulebook/generate-content/route.ts` - Fetches full base game Wikipedia data, model selector support
- `src/app/api/admin/vecna/family/[familyId]/build-context/route.ts` - Stores enhanced context
- `src/app/api/admin/vecna/family/[familyId]/process/route.ts` - Rebuilds with enhanced data
- `src/app/admin/(dashboard)/vecna/page.tsx` - Queries player_experiences
- `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` - Model selector, player experiences display, completeness report

---

## Previous Session (2026-01-04) - Vecna UI V2

**UI Simplification:**
- Reduced visual complexity: 11 states → 4-phase visual model (Import → Parse → Generate → Publish)
- Reduced tabs: 6 tabs → 2 tabs (Pipeline + Details)
- Moved Sources tab → hidden "Debug Sources" drawer (rarely used)
- Auto-select first family/game on page load (no more empty welcome screen)
- Only show family header when family has 2+ games (no redundant UI for single-game families)

**New Components Created:**
| Component | Purpose |
|-----------|---------|
| `PipelineProgressBar.tsx` | 4-phase visual progress indicator |
| `PipelineProgressDots.tsx` | Compact dots variant for sidebar |
| `BlockedStateAlert.tsx` | Prominent amber/blue/red banners for blocked states |
| `VecnaFamilyHeader.tsx` | Family header with batch actions dropdown |
| `VecnaGamePanel.tsx` | New 2-tab game view (replaces VecnaGameView) |
| `SourcesDrawer.tsx` | Slide-out drawer for debug/sources data |

**Phase System Added to `src/lib/vecna/types.ts`:**
```typescript
type Phase = 'import' | 'parse' | 'generate' | 'publish'
PHASE_MAPPING: Record<VecnaState, Phase>
getPhaseForState(), isBlockedState(), getCompletedPhases()
```

**Publishing Fix:**
- Fixed `/api/admin/vecna/[gameId]/state` to actually set `is_published = true` when publishing
- Unpublishing (review_pending from published) now sets `is_published = false`

**Reference Page Rewrite (`/games/[slug]/reference`):**
- Removed ~400 lines of hardcoded legacy game data (Catan, Wingspan, etc.)
- Updated `ReferenceContent` type to support both AI schema and legacy schema
- Page now renders dynamically based on database content
- Handles multiple data formats: `turnSummary` as strings or objects, `endGame` as string or object
- Shows "content being generated" message when no meaningful content exists

**Known Issue:**
- Some games (e.g., Gloomhaven) have malformed `reference_content` with empty action fields
- Data needs to be regenerated via Vecna pipeline for these games

---

## Previous Session (2026-01-04) - Phase 50

**Data Audit & Surfacing:**
- Audited all data sources (BGG, Wikidata, Wikipedia) to ensure nothing is "left on the table"
- Expanded `VecnaGame` type with 25+ new fields organized by source
- Updated Vecna page queries to fetch 40+ fields per game

**Batch Processing:**
- Created `/api/admin/vecna/family/[familyId]/process` endpoint
- Created `FamilyBatchActions` component for family-level processing
- Processing modes: `full`, `parse-only`, `generate-only`, `from-current`

**Rulebook Management:**
- Added dedicated "Rulebook" tab (always accessible regardless of state)
- Manual URL input without requiring discovery click

---

## Phase 49 - Vecna Pipeline Implementation (COMPLETE)

Implemented the Vecna automated game content pipeline at `/admin/vecna`. This is a unified admin page that shows all games organized by family with their processing state, allowing admins to manage the entire content pipeline from a single location.

### Vecna Pipeline Overview

| Feature | Description |
|---------|-------------|
| **Family Sidebar** | Collapsible sidebar showing all families with game counts and progress |
| **Game View** | Three-tab interface: Overview, Taxonomy, Data Sources |
| **Processing States** | 11-state pipeline from `imported` to `published` |
| **Taxonomy Sources** | Source badges showing origin: BGG, WD, WP, AI, Manual |
| **Expandable Content** | Long text sections are expandable for full reading |

### New Files Created

| File | Purpose |
|------|---------|
| `/src/app/admin/(dashboard)/vecna/page.tsx` | Main Vecna page with data fetching |
| `/src/app/admin/(dashboard)/vecna/components/VecnaPipeline.tsx` | Pipeline orchestrator with state management |
| `/src/app/admin/(dashboard)/vecna/components/VecnaFamilySidebar.tsx` | Collapsible family tree sidebar |
| `/src/app/admin/(dashboard)/vecna/components/VecnaGameView.tsx` | Game detail view with tabs |
| `/src/app/admin/(dashboard)/vecna/components/VecnaEmptyState.tsx` | Empty state with stats |
| `/src/app/admin/(dashboard)/vecna/components/StateActions.tsx` | State transition actions |
| `/src/app/admin/(dashboard)/vecna/components/RulebookDiscovery.tsx` | Rulebook URL discovery UI |
| `/src/app/admin/(dashboard)/vecna/components/FamilyBatchActions.tsx` | Batch processing UI for families |
| `/src/app/api/admin/vecna/family/[familyId]/process/route.ts` | Batch processing API endpoint |
| `/src/lib/vecna/types.ts` | Type definitions for Vecna pipeline |
| `/src/lib/vecna/pipeline.ts` | Pipeline orchestration logic |
| `/src/lib/vecna/context.ts` | Family context utilities |
| `/src/lib/vecna/index.ts` | Barrel exports |

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `00060_vecna_state.sql` | Add `vecna_state` enum and columns to games, `family_context` to families |
| `00061_taxonomy_source.sql` | Add `source` column to taxonomy junction tables |
| `00062_fix_taxonomy_source_default.sql` | Fix existing taxonomy to show BGG as source |

### Processing States

```
imported → enriched → rulebook_ready → parsing → parsed →
  taxonomy_assigned → generating → generated → review_pending → published

       ↘ rulebook_missing (waiting for manual URL)
```

### UI Features

- **Collapsible Sidebars**: Both Vecna sidebar and main admin sidebar can be collapsed
- **State Filter**: Filter games by processing state
- **Search**: Search across families and games
- **Progress Bars**: Visual progress for each family
- **Source Badges**: Show origin of each taxonomy tag (BGG, WD, WP, AI, Manual)
- **Expandable Text**: Long content sections can be expanded/collapsed

---

## Phase 48 - Wikipedia Tier 1 Extraction (COMPLETE)

Enhanced Wikipedia extraction with images, external links, and structured awards. Created comprehensive Vecna specification based on full system audit.

### New Wikipedia Extraction Modules

| Module | Purpose |
|--------|---------|
| `src/lib/wikipedia/images.ts` | Article images with Commons metadata, licensing |
| `src/lib/wikipedia/external-links.ts` | Categorized links (rulebook, official, publisher, store, video) |
| `src/lib/wikipedia/awards.ts` | Structured awards from Reception section (25+ known awards) |

### New Database Fields

```sql
-- Migration: 00059_wikipedia_tier1_fields.sql
games.wikipedia_images        -- JSONB: Article images with URLs, dimensions, licenses
games.wikipedia_external_links -- JSONB: Categorized links (rulebook, official, etc.)
games.wikipedia_awards        -- JSONB: Parsed awards (name, year, winner/nominated)
games.wikipedia_gameplay      -- TEXT: Gameplay section for AI content
```

### Vecna Specification

Created comprehensive spec at `/docs/VECNA-SPEC.md` covering:
- Full system audit findings
- 5-stage pipeline architecture
- Family context inheritance for expansions
- Data priority rankings
- UI mockups and component design

---

## Phase 47 - Wikipedia Context for Game Wizard (COMPLETE)

Added Wikipedia article context to enhance AI-generated content (rules, setup, reference) in the game wizard. When a game has a Wikipedia URL, the system automatically fetches and summarizes the article, then includes this context when generating content.

### Wikipedia Context in Content Generation

The GenerateContentStep (Step 4) now:
- Auto-fetches Wikipedia summary when entering the step (if URL exists but no summary stored)
- Shows status UI: fetching spinner, loaded checkmark, or error with retry
- Stores AI-summarized Wikipedia content in database for reuse
- Passes Wikipedia context to all three content generation prompts

### Database Changes

| Migration | Purpose |
|-----------|---------|
| `00057_wikipedia_summary.sql` | Add `wikipedia_summary` (JSONB), `wikipedia_fetched_at` to games |

---

## Phase 46 - Wikipedia AI Enrichment & Family Auto-Link (COMPLETE)

Added AI-powered Wikipedia enrichment to the families admin page. Admins can now automatically discover related games and create relationships between unlinked games using Wikipedia content parsed by Claude Haiku.

### Wikipedia Enrichment (`/admin/families/[id]`)

- Fetches Wikipedia article content via MediaWiki API
- Uses Claude Haiku to extract related games (expansions, sequels, spin-offs)
- Matches extracted games to our database (exact, fuzzy, BGG ID matching)
- Shows games that can be linked to the family

### Auto-Link Relations

- Analyzes Wikipedia to determine relationships between games in the family
- Extracts relation types: `expansion_of`, `sequel_to`, `reimplementation_of`, etc.
- Shows confidence levels (high/medium/low) with reasoning
- Creates `game_relations` entries with one click

---

## Phase 45 - Admin Import Page & Wikidata Series Integration (COMPLETE)

New admin import wizard for BGG game imports with real-time progress. Enhanced Wikidata integration to capture Wikipedia URLs, series membership, and sequel relationships.

### Admin Import Page (`/admin/import`)

| Step | Description |
|------|-------------|
| **Input** | Enter BGG IDs (comma/newline separated), select relation mode |
| **Preview** | Shows analysis of games to import (new vs existing), related games count |
| **Progress** | Real-time SSE streaming of import progress with status updates |
| **Report** | Final summary with success/failure counts and links to imported games |

---

## Recent Phases (40-44)

| Phase | Summary |
|-------|---------|
| **44** | Wizard Bug Fixes - Step navigation, infinite loading, auto-save fixes |
| **43** | Wizard UI Polish V2 - Shared components, color theming, step headers |
| **42** | Wizard Modular Refactor - Performance optimization, stable callbacks |
| **41** | Admin Wizard Split - 8 steps, Wikidata visibility, ParseAnalyzeStep + GenerateContentStep |
| **40** | Wikidata Game Enrichment - CC images, websites, rulebook URLs from Wikidata |

---

## What's Live

### Core Features
- **35+ games** in database with full content
- **Game Directory** with filter sidebar, search, pagination
- **Rules Summaries**, **Score Sheets** (PDF), **Quick Reference** for content-complete games
- **Your Shelf** - Track owned/wanted games with ratings
- **User Profiles** at `/u/[username]` with Top 10 games, insights, badges
- **Following System** + Activity Feed at `/feed`
- **Game Reviews** with aggregate ratings
- **Recommendation Engine** at `/recommend`

### Marketplace
- Full buy/sell/trade system with listings, messaging, offers
- Stripe Connect payments with escrow
- Reputation/feedback system
- Saved searches and wishlist alerts

### Admin
- **Vecna Pipeline** (`/admin/vecna`) - Unified content pipeline with family sidebar
- **Import Wizard** (`/admin/import`) - BGG game import with real-time SSE progress
- Game editor with Setup Wizard and Advanced Mode
- Rulebook parsing + Crunch Score generation (1-10 scale with BGG calibration)
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management with source tracking
- Family tree visualization with orphan detection and "Needs Review" filter
- Image upload with cropping (Cover 4:3, Hero 16:9, Gallery)
- **Data Dictionary** (`/admin/data`) - Field reference for BGG/Wikidata imports
- Wikidata enrichment during BGG import (CC images, websites, Wikipedia URLs, series detection)
- **Collapsible sidebars** - Both main admin and Vecna sidebars can be collapsed

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

62 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities, notifications
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions, feedback
- Taxonomy: themes, player experiences, complexity tiers, **source tracking**
- Rulebook: Crunch Score (1-10), parse logs
- **Vecna: processing states, family context**

Recent migrations (57-62):
- `00057_wikipedia_summary.sql` - Wikipedia summary storage
- `00058_wikipedia_enrichment.sql` - Wikipedia enrichment fields
- `00059_wikipedia_tier1_fields.sql` - Wikipedia images, external links, awards
- `00060_vecna_state.sql` - Vecna processing state enum and columns
- `00061_taxonomy_source.sql` - Taxonomy source tracking (bgg, wikidata, wikipedia, ai, manual)
- `00062_fix_taxonomy_source_default.sql` - Fix existing taxonomy to show BGG as source

---

## Next Steps

### Vecna Phase 3: Enhanced AI (COMPLETE)
- ✅ Full Wikipedia context in prompts (gameplay, origins, awards)
- ✅ Family context inheritance for expansions (5 new fields)
- ✅ Data completeness report
- ✅ Player experiences taxonomy fix
- ✅ Model selector (Haiku/Sonnet/Opus)
- Improved taxonomy assignment with Wikipedia categories (remaining)

### Vecna Phase 4: Review UI & Polish
- Three-column review UI (source | generated | final)
- Data source visibility badges throughout
- Compliance checklist
- Content regeneration for games with malformed data
- Per-game publish flow improvements

### Content
- Process Gloomhaven family through full pipeline (3 games generated, ready for review)
- Upload images for all games via admin
- Import more games via Wikidata skill
- Fill in missing US publishers (Critical in completeness report)

### Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats
- Publisher partnerships for official data
