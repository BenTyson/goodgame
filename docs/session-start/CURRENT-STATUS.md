# Current Status

> Last Updated: 2026-01-02 (Admin Wizard & Wikidata Integration)

## Current Phase: 41 - Admin Wizard Split & Wikidata Data Flow (COMPLETE)

Split the wizard's Parse & Generate step into two focused steps, added Wikidata data visibility throughout the admin UI, and connected Wikidata fields to the public game pages.

### Wizard Flow (8 Steps)

| Step | Name | Description |
|------|------|-------------|
| 1 | Rulebook | Find rulebook URL |
| 2 | **Analyze** | Parse PDF, Crunch Score, taxonomy extraction (Haiku) |
| 3 | Taxonomy | Review AI suggestions |
| 4 | **Content** | Generate guides with model choice (Sonnet/Haiku) |
| 5 | Images | Upload artwork |
| 6 | Relations | Game connections |
| 7 | Review | Check content |
| 8 | Publish | Go live |

### New Components

| File | Purpose |
|------|---------|
| `wizard-steps/ParseAnalyzeStep.tsx` | **NEW** - Parse PDF, Crunch Score, taxonomy (uses Haiku) |
| `wizard-steps/GenerateContentStep.tsx` | **NEW** - Generate rules/setup/reference with model choice |

### Wikidata Data Flow

**Game Detail Page (`/games/[slug]`):**
- Image priority: `wikidata_image_url` > `box_image_url` > placeholder
- External Links section now shows: Official Website, Official Rulebook, BGG link

**Admin Image Badges (`SourcedImage` component):**
- Blue "Wiki" badge for Wikidata CC-licensed images
- Green "Uploaded" badge for user uploads
- Red "BGG" badge (with dim overlay) for reference-only images

**Wizard RulebookStep:**
- Shows "Wikidata Enrichment Available" box when data exists
- Displays badges: Rulebook from Wikidata, Official Website link, CC Image Available
- Rulebook status shows source badge (e.g., "from Wikidata")

### Modified Files

| File | Changes |
|------|---------|
| `src/app/games/[slug]/page.tsx` | Added official_website + rulebook_url to External Links, prioritize wikidata images |
| `src/components/admin/TempImage.tsx` | Renamed to `SourcedImage` with source badges (bgg/wikidata/uploaded) |
| `src/components/admin/AdminSidebar.tsx` | Changed Games icon from Gamepad2 to Dices |
| `src/app/admin/(dashboard)/games/page.tsx` | Updated to use SourcedImage with source detection |
| `src/components/admin/GameEditor.tsx` | Show Wikidata CC image card when available |
| `src/components/admin/game-editor/wizard-steps/ImagesStep.tsx` | Show Wikidata image with badge |
| `src/components/admin/game-editor/wizard-steps/RulebookStep.tsx` | Wikidata status section, source badges |
| `src/components/admin/game-editor/GameSetupWizard.tsx` | 8 steps, new component imports |

### Deprecated

| Item | Replacement |
|------|-------------|
| `ParseGenerateStep` | `ParseAnalyzeStep` + `GenerateContentStep` |
| `TempImage` | `SourcedImage` (alias kept for compatibility) |

---

## Phase 40 - Wikidata Game Enrichment (COMPLETE)

Added game-level Wikidata enrichment to the BGG import pipeline, including CC-licensed images, official websites, and rulebook URLs.

### Key Changes

**New Admin Page:**
- **Data Dictionary** (`/admin/data`) - Reference table showing all fields imported from BGG and Wikidata
- Displays field source (BGG/Wikidata/Both), database column, and notes
- Marks reference-only fields (used internally, not displayed publicly)

**Wikidata Enrichment During Import:**
- During BGG import, now queries Wikidata for matching games (by BGG ID)
- Fetches CC-licensed images from Wikimedia Commons (safe for public display)
- Fetches official game/publisher websites (P856)
- Fetches rulebook URLs (P953 - "full work available at URL")
- Logs data discrepancies between BGG and Wikidata for review

**Publisher Enrichment:**
- Publishers enriched with Wikidata data (website, logo, description)
- Wikidata ID stored for cross-referencing

### New Migration

| Migration | Purpose |
|-----------|---------|
| `00054_wikidata_game_fields.sql` | Add `wikidata_image_url`, `official_website`, `wikidata_last_synced` columns |

### New/Modified Files

| File | Purpose |
|------|---------|
| `src/app/admin/(dashboard)/data/page.tsx` | **NEW** - Data Dictionary admin page |
| `src/components/ui/table.tsx` | **NEW** - shadcn Table component |
| `src/components/admin/AdminSidebar.tsx` | Added "Data" nav item |
| `src/lib/wikidata/queries.ts` | Added P953 (rulebookUrl) to SPARQL queries |
| `src/lib/wikidata/client.ts` | Added `rulebookUrl` to `WikidataBoardGame` interface |
| `src/lib/bgg/importer.ts` | Added `enrichGameFromWikidata()` function |

### Database Schema Changes

```sql
-- New columns on games table
wikidata_image_url VARCHAR(500)   -- CC-licensed image from Wikimedia Commons
official_website VARCHAR(500)      -- Official publisher/game website
wikidata_last_synced TIMESTAMPTZ   -- When Wikidata data was last synced

-- Updated column
rulebook_source TEXT  -- Now includes 'wikidata' as source option
```

### Image Strategy

| Source | Usage | Legal Status |
|--------|-------|--------------|
| Wikidata (P18) | Primary display | CC-licensed, safe for public use |
| BGG | Fallback/reference only | Copyright, internal reference only |

---

## Phase 39 - Crunch Score Redesign (COMPLETE)

Redesigned the complexity scoring system from "BNCS" (Board Nomads Complexity Score) to "Crunch Score" with a new 1-10 scale and BGG calibration.

### Key Changes

**Rebranding:**
- Renamed from "BNCS" to "Crunch Score" (simpler, more fun)
- New 1-10 scale (distinct from BGG's 1-5 weight)

**New Tier System:**
| Score | Tier | Description |
|-------|------|-------------|
| 1.0-2.0 | Breezy | Quick to learn, minimal rules |
| 2.1-4.0 | Light | Family-friendly depth |
| 4.1-6.0 | Crunchy | Solid complexity |
| 6.1-8.0 | Heavy | Meaty decisions |
| 8.1-10.0 | Brain Burner | Maximum crunch |

**BGG Calibration:**
- Formula: `crunchScore = (aiScore * 0.85) + (bggNormalized * 0.15)`
- BGG weight (1-5) normalized to 1-10 scale
- BGG reference stored for transparency (`crunch_bgg_reference`)

### New Migration

| Migration | Purpose |
|-----------|---------|
| `00053_crunch_score.sql` | Rename BNCS → Crunch columns, update constraint 1-10, add BGG reference |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/rulebook/types.ts` | `CrunchBreakdown`, `CrunchResult` types (with legacy aliases) |
| `src/lib/rulebook/complexity.ts` | `generateCrunchScore()`, BGG calibration logic |
| `src/lib/rulebook/complexity-utils.ts` | `getCrunchLabel()`, `getCrunchColor()`, new tier functions |
| `src/lib/rulebook/prompts.ts` | `getCrunchScorePrompt()` for 1-10 AI scoring |
| `src/components/admin/rulebook/CrunchScoreDisplay.tsx` | New UI component (renamed from BNCSScoreDisplay) |
| `src/app/api/admin/rulebook/parse/route.ts` | Fetches BGG weight, stores `crunch_bgg_reference` |
| `src/app/api/admin/games/[id]/reset-content/route.ts` | `resetCrunch` option (legacy `resetBNCS` alias) |
| All wizard/editor components | Updated to use `crunch_*` columns |

### Database Schema Changes

```sql
-- Renamed columns
bncs_score → crunch_score (DECIMAL 3,1, range 1-10)
bncs_breakdown → crunch_breakdown (JSONB)
bncs_generated_at → crunch_generated_at (TIMESTAMPTZ)

-- New column
crunch_bgg_reference (DECIMAL 2,1) -- BGG weight used for calibration

-- Existing scores converted: (score - 1) / 4 * 9 + 1 (maps 1-5 to 1-10)
```

### Backward Compatibility

All legacy names supported via aliases:
- `BNCSBreakdown` → `CrunchBreakdown`
- `BNCSResult` → `CrunchResult`
- `generateBNCS()` → `generateCrunchScore()`
- `getBNCSPrompt()` → `getCrunchScorePrompt()`
- `resetBNCS` API option → `resetCrunch`

---

## Phase 38 - AI-Powered Taxonomy Wizard (COMPLETE)

Added AI-powered theme and player experience extraction to the game setup wizard. The AI analyzes parsed rulebook text and suggests taxonomy assignments for admin review.

### New Migration

| Migration | Purpose |
|-----------|---------|
| `00052_taxonomy_suggestions.sql` | Stores AI-generated taxonomy suggestions pending admin review |

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/admin/games/taxonomy/route.ts` | API for GET/POST/PATCH taxonomy assignments |
| `src/app/api/admin/games/[id]/reset-content/route.ts` | API to reset parsed content for testing |
| `src/components/admin/game-editor/TaxonomySelector.tsx` | Multi-select UI with AI suggestion badges |
| `src/components/admin/game-editor/wizard-steps/TaxonomyStep.tsx` | New wizard step (Step 3) |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/database.ts` | Added `TaxonomySuggestion` types, `TaxonomyExtractionResult`, updated `ReferenceContent.endGame` to union type |
| `src/lib/rulebook/prompts.ts` | Added `getTaxonomyExtractionPrompt()` for theme/experience extraction |
| `src/lib/ai/claude.ts` | Added `repairJSON()` function for AI response sanitization |
| `src/app/api/admin/rulebook/parse/route.ts` | Now extracts taxonomy during parse phase |
| `src/components/admin/game-editor/GameSetupWizard.tsx` | 7-step wizard with Taxonomy as step 3 |
| `src/components/admin/game-editor/wizard-steps/index.ts` | Exports `TaxonomyStep` |
| `src/components/admin/game-editor/wizard-steps/ParseGenerateStep.tsx` | Added Reset dropdown menu |
| `src/components/admin/game-editor/wizard-steps/ReviewContentStep.tsx` | Added `formatEndGame()` helper |
| `src/components/admin/game-editor/ContentTab.tsx` | Added `formatEndGame()` helper |
| `src/components/admin/game-editor/RulebookContentTab.tsx` | Added `formatEndGame()` helper |

### Wizard Flow (as of Phase 38, now 8 steps)

| Step | Name | Description |
|------|------|-------------|
| 1 | Rulebook | Find rulebook URL |
| 2 | Parse | Generate Crunch Score + taxonomy extraction |
| 3 | **Taxonomy** | **NEW** - Review AI suggestions, select themes/experiences |
| 4 | Content | Generate rules/setup/reference guides |
| 5 | Images | Upload artwork |
| 6 | Relations | Game connections |
| 7 | Review | Check content |
| 8 | Publish | Go live |

*Note: Step 2 was split into "Analyze" (step 2) and "Content" (step 4) in Phase 41.*

### Key Features

**AI Taxonomy Extraction:**
- Analyzes parsed rulebook text to suggest themes and player experiences
- Returns confidence scores (0-100%) and reasoning for each suggestion
- Suggests new taxonomies when existing ones don't fit

**Admin Review UI:**
- AI suggestions pre-selected with confidence badges
- Two-section layout: Themes + Player Experiences
- Primary selection toggle for themes
- Full list of available options for manual additions

**Legal Compliance:**
- Categories & Mechanics remain publisher-only (no AI suggestions)
- Themes & Player Experiences generated from original rulebook analysis
- No BGG data used for taxonomy assignment

### Technical Improvements

**JSON Repair Function (`repairJSON` in `src/lib/ai/claude.ts`):**
- Fixes smart/curly quotes → straight quotes
- Fixes quotes used as apostrophes (e.g., `Martin"s` → `Martin's`)
- Removes trailing commas before `}` or `]`
- Fixes unquoted property names
- Removes `//` comments
- Extracts JSON from extra text

**Reset Content API (`POST /api/admin/games/[id]/reset-content`):**
- Options: `resetRulebook`, `resetCrunch` (or `resetBNCS`), `resetContent`, `resetTaxonomy`, `resetAll`
- Clears: Crunch Score, rules/setup/reference content, taxonomy suggestions, parse logs
- UI: Reset dropdown in ParseGenerateStep

**ReferenceContent.endGame Type Fix:**
- Updated from `string` to `string | { triggers: string[]; finalRound?: string; winner: string; tiebreakers?: string[] }`
- Added `formatEndGame()` helper to render both formats
- Fixes React "Objects are not valid as a React child" error

**Claude Model ID:**
- Working model: `claude-3-5-haiku-20241022`
- Used for all AI calls (data extraction, BNCS, taxonomy, content generation)

---

## Phase 37 - Game Relations Data Pipeline (COMPLETE)

Enhanced game relation management with retroactive sync, family auto-detection, and admin UI improvements.

### New Scripts

| Script | Purpose |
|--------|---------|
| `scripts/sync-game-relations.ts` | Sync relations from `bgg_raw_data` to `game_relations` table |
| `scripts/backfill-bgg-images.ts` | Backfill `reference_images` for games missing thumbnails |

### Modified Scripts

| Script | Changes |
|--------|---------|
| `scripts/process-import-queue.ts` | Added family auto-detection from game names, stores `reference_images` in `bgg_raw_data` |
| `scripts/import-missing-relations.ts` | Added `--skip-promos` flag to filter promotional items |

### Key Features

**Relation Sync Script (`sync-game-relations.ts`):**
```bash
npx tsx scripts/sync-game-relations.ts --dry-run          # Preview changes
npx tsx scripts/sync-game-relations.ts --family=CATAN     # Sync specific family
npx tsx scripts/sync-game-relations.ts --type=expansions  # Only expansion relations
npx tsx scripts/sync-game-relations.ts --limit=10         # Limit games processed
```

**Family Auto-Detection:**
- Games with colons create families automatically (e.g., "CATAN: Seafarers" → CATAN family)
- Also detects parentheses and en-dash patterns
- Minimum 3 characters for family name

**Relation Direction:**
- Relations point FROM child TO parent (e.g., "Seafarers expansion_of CATAN")
- Sync script processes both `expandsGame`/`implementsGame` (direct) and `expansions`/`implementations` arrays (reverse)

### Admin Families Page Redesign

| Change | Description |
|--------|-------------|
| Thumbnail images | Shows base game thumbnail (oldest by year or explicit `base_game_id`) |
| Relation counts | Displays "3 Expansions", "2 Reimplementations", etc. |
| Filter buttons | Filter by relation type (Expansions, Sequels, Reimplementations, Spin-offs) |
| Compact cards | Removed icon, moved badges to image overlay, `padding="none"` |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/admin/(dashboard)/families/page.tsx` | Complete redesign with thumbnails, filters, relation counts |

### Database Notes

- `game_relations` stores explicit parent-child relationships
- `bgg_raw_data.expansions[]` and `bgg_raw_data.implementations[]` contain BGG references
- Sync script creates `game_relations` entries when both games exist in DB
- Fixed PostgreSQL PGRST201 error by specifying FK: `games!games_family_id_fkey`

---

## Phase 36 - Admin Image Cropper (COMPLETE)

Added image cropping functionality to the admin game image uploader with preset aspect ratios.

### New Files

| File | Purpose |
|------|---------|
| `src/lib/utils/image-crop.ts` | Canvas-based crop utility with aspect ratio presets |
| `src/components/admin/ImageCropper.tsx` | Modal dialog with react-easy-crop integration |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/admin/ImageUpload.tsx` | Added image type selector, crop flow, cropper modal |
| `src/app/api/admin/upload/route.ts` | Accepts `imageType` param, syncs to games table by type |
| `src/components/admin/index.ts` | Added ImageCropper export |

### Image Type Options

| Type | Default Ratio | Syncs To |
|------|---------------|----------|
| **Cover** | 4:3 | `box_image_url`, `thumbnail_url` |
| **Hero** | 16:9 | `hero_image_url` |
| **Gallery** | 4:3 | `game_images` table only |

### Upload Flow

1. Select image type (Cover/Hero/Gallery)
2. Select or drop an image file
3. Cropper modal opens with default aspect ratio for type
4. User can change ratio (1:1, 4:3, 16:9, 3:2)
5. Adjust zoom and position
6. Apply crop → uploads cropped image to Supabase

### Dependencies Added

- `react-easy-crop` - Lightweight image cropping library

---

## Phase 35 - Admin Game Editor UX Overhaul (COMPLETE)

Redesigned the admin game editor with a Setup Wizard for new games and consolidated tabs for power users.

### Setup Wizard (2025-12-31)

**New Hook:**
| File | Purpose |
|------|---------|
| `src/hooks/admin/useWizardProgress.ts` | localStorage-based wizard state with step tracking |

**New Components:**
| File | Purpose |
|------|---------|
| `GameSetupWizard.tsx` | Main wizard orchestrator |
| `WizardStepIndicator.tsx` | Visual step indicator with checkmarks |
| `wizard-steps/RulebookStep.tsx` | Step 1: Find/validate rulebook URL |
| `wizard-steps/ParseGenerateStep.tsx` | Step 2: Parse PDF + generate BNCS + content |
| `wizard-steps/ImagesStep.tsx` | Step 3: Upload primary and gallery images |
| `wizard-steps/ReviewContentStep.tsx` | Step 4: Review generated content |
| `wizard-steps/PublishStep.tsx` | Step 5: Final review + publish |
| `wizard-steps/index.ts` | Barrel exports |

### Tab Consolidation (2025-12-31)

**Before (6 tabs):** Details, Publishing, Rulebook, Content, Images, Relations

**After (4 tabs):** Details, Rulebook & Content, Images, Relations

**Created:**
| File | Purpose |
|------|---------|
| `RulebookContentTab.tsx` | Merged Rulebook + Content tabs |

**Modified:**
| File | Changes |
|------|---------|
| `DetailsTab.tsx` | Added Visibility Settings, Collection Tags, Content Status |
| `GameEditor.tsx` | Added wizard/advanced mode toggle |
| `src/components/admin/game-editor/index.ts` | Updated exports |
| `src/hooks/admin/index.ts` | Added useWizardProgress export |

**Deleted:**
| File | Reason |
|------|--------|
| `PublishingTab.tsx` | Merged into DetailsTab |

### Wizard Flow

| Step | Complete When |
|------|---------------|
| 1. Rulebook | URL validated OR skipped |
| 2. Parse & Generate | BNCS score exists AND content generated |
| 3. Images | At least 1 image uploaded OR skipped |
| 4. Review | User clicks "Looks Good" |
| 5. Publish | User clicks "Publish Game" |

### UX Behavior

- **Unpublished games**: Wizard auto-starts, can exit to tabs via "Exit to Advanced"
- **Published games**: Always show tab-based Advanced Editor
- **Wizard header**: Progress bar, step indicator, exit button
- **Progress persistence**: localStorage keyed by `wizard-progress-{gameId}`

---

## Recent Phases (29-34) - Summaries

> Full details: [PHASES-29-34.md](../archive/phases/PHASES-29-34.md)

| Phase | Summary |
|-------|---------|
| **34** | Admin Layout Unification - Sidebar pattern matching Games/Marketplace |
| **33** | Admin Codebase Cleanup - Shared hooks, component splits (RulebookEditor 66% smaller) |
| **32** | Rulebook Content Pipeline V2 - Content generation, parsed text storage, preview page |
| **31** | Admin Enhancements - BGG reference images, navigation fixes |
| **30** | Games Page UI Unification - Sidebar layout, prominent search bar |
| **29** | Legal Data Sourcing - 688 games imported, BNCS scoring, publisher rulebook pipeline |

---

## Archived Phases (21-28) - Marketplace Build

> Full details: [PHASES-21-28.md](../archive/phases/PHASES-21-28.md)

Complete marketplace implementation:
- Phase 21: Listings foundation
- Phase 22: Messaging system
- Phase 23: Offers & negotiation
- Phase 24: Stripe Connect payments
- Phase 25: Reputation & feedback
- Phase 26: Discovery & alerts
- Phase 27: Seller Dashboard V2
- Phase 28: UI/UX unification

---

## Earlier Phases (17-20) - Features

| Phase | Feature |
|-------|---------|
| **20** | Categories page - DB-driven with game counts |
| **19** | Games page Filter UI V2 - Collapsible sidebar, dynamic grid |
| **18** | Taxonomy system - Categories, Mechanics, Themes, Player Experiences, Complexity Tiers |
| **17** | Recommendation Engine - Wizard at `/recommend`, gamer archetypes, AI ranking |

---

## What's Live

### Core Features
- **35 games** in database (16 with full content + 19 pending)
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
- Seller Dashboard with sidebar layout

### Admin
- Game editor with Setup Wizard and Advanced Mode
- Rulebook parsing + Crunch Score generation (1-10 scale with BGG calibration)
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Image upload with cropping (Cover 4:3, Hero 16:9, Gallery)
- **Data Dictionary** (`/admin/data`) - Field reference for BGG/Wikidata imports
- Wikidata enrichment during BGG import (CC images, websites, rulebooks)

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

54 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities, notifications
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions, feedback
- Taxonomy: themes, player experiences, complexity tiers
- Rulebook: Crunch Score (1-10), parse logs

Recent migrations (46-54):
- `00046_data_source_tracking.sql` - Data provenance
- `00047_data_source_seed.sql` - Seed data enum
- `00048_rulebook_bncs.sql` - Rulebook parsing + BNCS (legacy)
- `00049_rulebook_parsed_text.sql` - Parsed text storage
- `00052_taxonomy_suggestions.sql` - AI taxonomy suggestions
- `00053_crunch_score.sql` - BNCS → Crunch Score (1-10 scale, BGG calibration)
- `00054_wikidata_game_fields.sql` - Wikidata enrichment (image, website, rulebook)

---

## Next Steps

### Content
- Upload images for all games via admin
- Generate content for pending games
- Import more games via Wikidata skill

### Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats
- Publisher partnerships for official data
