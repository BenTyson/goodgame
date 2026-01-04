# Current Status

> Last Updated: 2026-01-04 (Vecna Pipeline Phase 1 Complete)

## Current Phase: 49 - Vecna Pipeline Implementation (COMPLETE)

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

### Vecna Phase 2: Automation
- Auto-run enrichment after import
- Rulebook discovery priority chain (Wikidata → Wikipedia → Pattern matching)
- Batch processing for families

### Content
- Process games through Vecna pipeline
- Upload images for all games via admin
- Import more games via Wikidata skill

### Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats
- Publisher partnerships for official data
