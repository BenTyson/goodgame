# Current Status

> Last Updated: 2026-01-03 (Wikipedia AI Enrichment & Auto-Link)

## Current Phase: 46 - Wikipedia AI Enrichment & Family Auto-Link (COMPLETE)

Added AI-powered Wikipedia enrichment to the families admin page. Admins can now automatically discover related games and create relationships between unlinked games using Wikipedia content parsed by Claude Haiku.

### Wikipedia Enrichment (`/admin/families/[id]`)

New "Enrich from Wikipedia" card on family detail pages that:
- Fetches Wikipedia article content via MediaWiki API
- Uses Claude Haiku to extract related games (expansions, sequels, spin-offs)
- Matches extracted games to our database (exact, fuzzy, BGG ID matching)
- Shows games that can be linked to the family

### Auto-Link Relations

New "Auto-Link with AI" button in the Unlinked Games section that:
- Analyzes Wikipedia to determine relationships between games in the family
- Extracts relation types: `expansion_of`, `sequel_to`, `reimplementation_of`, `spin_off_of`, `standalone_in_series`
- Shows confidence levels (high/medium/low) with reasoning
- Auto-selects high-confidence relations for quick approval
- Creates `game_relations` entries with one click

### Import → Family Navigation

After importing games, the report now:
- Detects if all imported games belong to the same family
- Shows "Configure Family" as the primary action button
- Routes admins to the family page for immediate configuration

### Bug Fix: Wikidata Family Series ID

Fixed `linkFamilyFromWikidataSeries()` to update the BGG family's `wikidata_series_id` even when games already have a `family_id` from BGG.

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/admin/families/[id]/wikipedia/route.ts` | Wikipedia enrichment API (POST: analyze, PATCH: link games) |
| `src/app/api/admin/families/[id]/auto-link/route.ts` | Auto-link relations API (POST: analyze, PUT: create relations) |
| `src/components/admin/WikipediaEnrichment.tsx` | Wikipedia enrichment UI component |
| `src/components/admin/AutoLinkRelations.tsx` | Auto-link relations dialog component |

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/bgg/importer.ts` | Fixed `linkFamilyFromWikidataSeries()` to update family's `wikidata_series_id` |
| `src/app/admin/(dashboard)/data/page.tsx` | Added Family Fields section, Wikidata series fields |
| `src/components/admin/FamilyEditor.tsx` | Added WikipediaEnrichment component |
| `src/components/admin/FamilyTreeView.tsx` | Added AutoLinkRelations button, `familyId` prop |
| `src/app/api/admin/import/execute/route.ts` | Added `familyId`, `familyName` to progress events |
| `src/components/admin/import/ImportWizard.tsx` | Added family fields to ImportProgress interface |
| `src/components/admin/import/ImportReport.tsx` | Added "Configure Family" button for single-family imports |

### Data Dictionary Updates

Added to `/admin/data`:
- **Family Fields** section (7 fields including `wikidata_series_id`)
- Game fields: `Wikidata Series ID`, `Wikipedia URL`, `Sequel Relations`
- Updated field counts in stats cards

---

## Phase 45 - Admin Import Page & Wikidata Series Integration (COMPLETE)

New admin import wizard for BGG game imports with real-time progress. Enhanced Wikidata integration to capture Wikipedia URLs, series membership, and sequel relationships. Added admin review workflow for families with unlinked games.

### Admin Import Page (`/admin/import`)

New wizard-based import interface for importing games from BoardGameGeek.

| Step | Description |
|------|-------------|
| **Input** | Enter BGG IDs (comma/newline separated), select relation mode |
| **Preview** | Shows analysis of games to import (new vs existing), related games count |
| **Progress** | Real-time SSE streaming of import progress with status updates |
| **Report** | Final summary with success/failure counts and links to imported games |

**Features:**
- Relation modes: `all` (expansions + base games + reimplementations), `upstream` (just base games), `none`
- Max depth control for recursive relation fetching
- Re-sync existing games option
- Real-time progress via Server-Sent Events (SSE)
- Links to imported games in final report

**New Files:**
- `src/app/admin/(dashboard)/import/page.tsx` - Import page
- `src/app/api/admin/import/analyze/route.ts` - Analyze BGG IDs before import
- `src/app/api/admin/import/execute/route.ts` - Execute import with SSE progress
- `src/components/admin/import/ImportWizard.tsx` - Main wizard component
- `src/components/admin/import/ImportInput.tsx` - BGG ID input step
- `src/components/admin/import/ImportPreview.tsx` - Preview step with analysis
- `src/components/admin/import/ImportProgress.tsx` - Real-time progress display
- `src/components/admin/import/ImportReport.tsx` - Final report with summary

### Database Changes

| Migration | Purpose |
|-----------|---------|
| `00055_wikipedia_url.sql` | Add `wikipedia_url`, `wikidata_series_id` to games |
| `00056_game_families_wikidata_series.sql` | Add `wikidata_series_id` to game_families |

### New Data Captured During Import

| Field | Source | Example |
|-------|--------|---------|
| `wikipedia_url` | Wikidata sitelinks | `https://en.wikipedia.org/wiki/Gloomhaven` |
| `wikidata_series_id` | Wikidata P179 | `Q99748715` (Gloomhaven series) |
| Series membership | Wikidata | All 3 Gloomhaven games linked to same series |
| Sequel relations | Wikidata P155/P156 | Auto-creates `sequel_to` relations |

### Wikidata Query Enhancements

- **Wikipedia URL** - Now fetched via sitelinks (English Wikipedia)
- **Series membership (P179)** - Detects game series (e.g., "Gloomhaven" series)
- **Sequel relationships** - P155 (follows) and P156 (followed by) properties
- **New query** - `GAMES_IN_SERIES_QUERY` fetches all games in a series with BGG IDs

### Auto-Family Creation

During import, the system now:
1. Checks if game is part of a Wikidata series
2. Creates/links family from series if BGG didn't create one
3. Stores `wikidata_series_id` on family for future matching
4. Creates sequel relations when P155/P156 properties exist

### Admin Review Workflow

| Feature | Description |
|---------|-------------|
| **"Needs Review" filter** | Families list shows filter for families with unlinked games |
| **"X unlinked" badge** | Amber badge on family cards showing orphan count |
| **Link dialog** | Click "Link" on orphan games to assign relations |
| **Orphan calculation** | Games not connected to family tree are identified |

### Files Changed

| File | Changes |
|------|---------|
| `src/lib/wikidata/queries.ts` | Added Wikipedia URL, series, sequel properties to GAME_BY_BGG_ID_QUERY; new GAMES_IN_SERIES_QUERY |
| `src/lib/wikidata/client.ts` | Parse new fields, added `getGamesInSeries()`, new types |
| `src/lib/wikidata/index.ts` | Export new functions and types |
| `src/lib/bgg/importer.ts` | `enrichGameFromWikidata()` now stores Wikipedia URL, creates families from series, creates sequel relations |
| `src/app/admin/(dashboard)/families/page.tsx` | Added orphan count, "Needs Review" filter, unlinked badge |
| `src/components/admin/FamilyTreeView.tsx` | Added "Link" button for orphan games with relation dialog |

### Test Results

```
Game: Gloomhaven
Wikipedia URL: https://en.wikipedia.org/wiki/Gloomhaven
Series ID: Q99748715
Series Name: Gloomhaven

Series Members (all with BGG IDs):
  - Gloomhaven [BGG: 174430]
  - Gloomhaven: Jaws of the Lion [BGG: 291457]
  - Frosthaven [BGG: 295770]
```

---

## Phase 44 - Wizard Bug Fixes & Polish (COMPLETE)

Critical bug fixes for the admin wizard navigation and data loading issues.

### Bug Fixes

| Issue | Root Cause | Fix |
|-------|------------|-----|
| **TaxonomyStep duplicate footer** | Internal "Skip + Save & Continue" buttons duplicated wizard footer | Removed internal footer, added auto-save on unmount |
| **GenerateContentStep Next greyed** | `onComplete()` not called after successful generation | Call `onComplete()` immediately after success |
| **RelationsStep infinite spinner** | `onDataLoaded` in useEffect deps caused re-render loop | Use ref for callback, removed from deps |
| **ParseAnalyzeStep Next greyed** | Required `crunchScore` but AI sometimes fails to return valid JSON | Check `wordCount > 0` instead (PDF parsed = success) |
| **Auto-navigation skipping steps** | TaxonomyStep used `handleStepComplete` (navigates) instead of `handleMarkComplete` | Fixed callback usage |
| **Can't re-enter wizard for published games** | `showWizard` condition excluded published games | Changed to `editorMode` state, always show wizard button |
| **GamePicker only shows few games** | RLS restricting results to published games | New admin API endpoint bypasses RLS |

### New Features

| Feature | Description |
|---------|-------------|
| **Reset Wizard button** | Dropdown with "Reset Progress Only" or "Reset Everything" options |
| **Crunch error messages** | Specific errors: "Wrong rulebook", "Reference card detected", "Too short", etc. |
| **GamePicker "Draft" badge** | Shows amber badge for unpublished games in relation picker |

### Files Changed

| File | Changes |
|------|---------|
| `GameSetupWizard.tsx` | Reset dropdown, `editorMode` state, fixed callbacks |
| `GameEditor.tsx` | Always show "Setup Wizard" button, `editorMode` toggle |
| `TaxonomyStep.tsx` | Removed internal footer, auto-save on unmount |
| `GenerateContentStep.tsx` | Immediate `onComplete()` call |
| `RelationsStep.tsx` | Removed auto-completion useEffect |
| `ParseAnalyzeStep.tsx` | Success = `wordCount > 0`, show crunch error separately |
| `GameRelationsEditor.tsx` | Ref for `onDataLoaded`, removed from deps |
| `GamePicker.tsx` | Uses admin API, shows Draft badge |
| `useWizardProgress.ts` | Added `resetProgress` export |
| `complexity.ts` | `analyzeCrunchError()` for specific messages |
| `claude.ts` | Include raw response in JSON parse errors |
| `/api/admin/games/route.ts` | New GET endpoint for game search |

---

## Phase 43 - Wizard UI Polish V2 (COMPLETE)

Comprehensive UI polish for the admin wizard, making it cleaner and more cohesive for frequent admin use.

### Bug Fix

- **Step-skipping after image upload** - Separated `handleMarkComplete` (just marks step complete) from `handleStepComplete` (marks complete AND navigates). Steps now use `handleMarkComplete` for auto-detection, preventing auto-navigation when RelationsStep mounts.

### New Shared Components

| File | Purpose |
|------|---------|
| `WizardStepHeader.tsx` | Unified step header with consistent color theming per step number |
| `StatusAlert.tsx` | Unified success/error/warning/info/reset alerts |
| `InfoPanel.tsx` | Metadata displays (model info, Wikidata enrichment, etc.) |

### UI Improvements

| Component | Changes |
|-----------|---------|
| `WizardStepIndicator` | Larger circles (h-9), cleaner design, SkipForward icon for skipped steps |
| `GameSetupWizard` | Smaller header with truncation, sticky nav footer with backdrop blur |
| `ContentSection` | Cleaner collapsible header, Ready/Empty status badges, animated chevron |
| `CrunchScoreDisplay` | Color-coded score bars (green→blue→amber→red), cleaner card layout |
| `ImageUpload` | Visual type selector cards, polished upload zone with rounded corners |
| All 8 wizard steps | Consistent styling via `WizardStepHeader` |

### Step Color Theming

| Step | Color |
|------|-------|
| 1 Rulebook | Violet |
| 2 Analyze | Blue |
| 3 Taxonomy | Indigo |
| 4 Content | Cyan |
| 5 Images | Emerald |
| 6 Relations | Teal |
| 7 Review | Amber |
| 8 Publish | Green |

### Files Changed

- `src/components/admin/game-editor/GameSetupWizard.tsx` - Navigation fix, UI polish
- `src/components/admin/game-editor/WizardStepIndicator.tsx` - Cleaner design
- `src/components/admin/game-editor/wizard-steps/WizardStepHeader.tsx` - **NEW**
- `src/components/admin/game-editor/wizard-steps/StatusAlert.tsx` - **NEW**
- `src/components/admin/game-editor/wizard-steps/InfoPanel.tsx` - **NEW**
- `src/components/admin/game-editor/wizard-steps/review-content/ContentSection.tsx` - Polish
- `src/components/admin/rulebook/CrunchScoreDisplay.tsx` - Polish
- `src/components/admin/ImageUpload.tsx` - Polish
- All 8 wizard step components - Use WizardStepHeader, StatusAlert, InfoPanel

---

## Phase 42 - Wizard Modular Refactor + Performance (COMPLETE)

Major refactor of GameSetupWizard focusing on stability, performance, and maintainability.

### Bug Fixes

- **Step-skipping bug** - Fixed unstable callback references causing wizard to jump from step 5 to step 8
- **Race conditions** - Replaced `window.location.reload()` with `router.refresh()` in ParseAnalyzeStep and GenerateContentStep

### New Module: `src/lib/admin/wizard/`

| File | Purpose |
|------|---------|
| `index.ts` | Barrel exports |
| `types.ts` | Shared types: `Publisher`, `GameWithRelations`, `SelectedTaxonomyItem`, `WizardStepProps` |
| `content-utils.ts` | Shared utilities: `formatEndGame`, `parseGameContent`, `hasGeneratedContent` |
| `WizardContext.tsx` | Context provider (infrastructure for future migration) |

### New Module: `src/components/.../review-content/`

| File | Purpose |
|------|---------|
| `ContentSection.tsx` | Reusable collapsible section with view/edit toggle |
| `RulesContentSection.tsx` | Rules content display/edit |
| `SetupContentSection.tsx` | Setup content display/edit |
| `ReferenceContentSection.tsx` | Reference content display/edit |

### Performance Optimizations

| Component | Changes |
|-----------|---------|
| `useWizardProgress.ts` | Stable callbacks via `useRef` + functional state updates |
| `TaxonomySelector.tsx` | `useMemo` for sorted items, suggestion maps; `useCallback` for handlers |
| All wizard steps | `useCallback` wrapped handlers for stable references |
| `ReviewContentStep.tsx` | Split into modular components (382 → 115 lines, 70% reduction) |

### Files Modified (21 total)

- `src/hooks/admin/useWizardProgress.ts` - Stable callbacks fix
- `src/components/admin/game-editor/GameSetupWizard.tsx` - useCallback handlers
- `src/components/admin/game-editor/TaxonomySelector.tsx` - Full memoization
- All 8 wizard step components - useCallback optimization
- Content display components - Using shared utilities

---

## Phase 41 - Admin Wizard Split & Wikidata Data Flow (COMPLETE)

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

## Recent Phases (35-38) - Admin Wizard & AI Taxonomy

> Full details: [PHASES-35-38.md](../archive/phases/PHASES-35-38.md)

| Phase | Summary |
|-------|---------|
| **38** | AI-Powered Taxonomy Wizard - Theme/experience extraction from rulebooks |
| **37** | Game Relations Pipeline - Sync scripts, family auto-detection |
| **36** | Admin Image Cropper - Preset aspect ratios (4:3, 16:9) |
| **35** | Game Editor UX Overhaul - Setup Wizard, tab consolidation |

---

## Earlier Phases (29-34) - Summaries

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
- **Import Wizard** (`/admin/import`) - BGG game import with real-time SSE progress
- Game editor with Setup Wizard and Advanced Mode
- Rulebook parsing + Crunch Score generation (1-10 scale with BGG calibration)
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Family tree visualization with orphan detection and "Needs Review" filter
- Image upload with cropping (Cover 4:3, Hero 16:9, Gallery)
- **Data Dictionary** (`/admin/data`) - Field reference for BGG/Wikidata imports
- Wikidata enrichment during BGG import (CC images, websites, Wikipedia URLs, series detection)

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

56 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities, notifications
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions, feedback
- Taxonomy: themes, player experiences, complexity tiers
- Rulebook: Crunch Score (1-10), parse logs

Recent migrations (50-56):
- `00050_game_families_base_game.sql` - Add base_game_id to game_families
- `00051_has_unimported_relations.sql` - Track games with unimported relations
- `00052_taxonomy_suggestions.sql` - AI taxonomy suggestions
- `00053_crunch_score.sql` - BNCS → Crunch Score (1-10 scale, BGG calibration)
- `00054_wikidata_game_fields.sql` - Wikidata enrichment (image, website, rulebook)
- `00055_wikipedia_url.sql` - Wikipedia URL + Wikidata series ID on games
- `00056_game_families_wikidata_series.sql` - Wikidata series ID on game_families

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
