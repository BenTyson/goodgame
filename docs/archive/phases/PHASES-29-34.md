# Archived Phases: 29-34 (Recent Development)

> **Archived:** 2026-01-01
> **Status:** All phases COMPLETE
> **Summary:** Legal data sourcing, games page UI, admin enhancements, rulebook pipeline, and admin codebase cleanup.

---

## Phase 34: Admin Layout Unification (COMPLETE)

Refactored admin layout to match the Games/Marketplace sidebar pattern for UI consistency across the site.

### Admin Sidebar Layout (2025-12-31)
- **AdminSidebar Component** - New sidebar component matching GamesSidebar pattern
- **AdminLayoutClient** - Client wrapper for mobile state management
- **Deleted AdminNav.tsx** - Navigation moved into AdminSidebar

### Layout Changes
| Aspect | Before | After |
|--------|--------|-------|
| Mobile nav | Horizontal scrollable tabs | Hamburger → overlay drawer |
| Desktop sidebar | 208px (w-52) | 256px (w-64) |
| Breakpoint | md (768px) | lg (1024px) |
| Sidebar position | Inside container | Full-height sticky |
| Sidebar header | None | Settings icon + "Admin" link |

### Files Modified
- `src/app/admin/(dashboard)/layout.tsx` - Simplified to use AdminLayoutClient
- `src/components/admin/index.ts` - Updated exports

---

## Phase 33: Admin Codebase Cleanup (COMPLETE)

Comprehensive refactoring of admin components to improve maintainability, reduce duplication, and split large monolithic components.

### Shared Admin Hooks (2025-12-31)
**Created:** `src/hooks/admin/`
| File | Purpose |
|------|---------|
| `useAsyncAction.ts` | Encapsulates saving/saved/error state pattern used in 5+ editors |
| `useAutoSlug.ts` | Auto-generates slug from name (used in Publisher, Family, Taxonomy editors) |
| `index.ts` | Barrel exports |

**Created:** `src/lib/utils/format.ts`
- `formatFileSize()` utility for human-readable file sizes

### Dead Code Removal (2025-12-31)
| Location | Issue | Action |
|----------|-------|--------|
| `RulebookEditor.tsx` | `onBncsUpdate` prop never invoked | Removed from interface |
| `PublisherEditor.tsx` | `games` state never updated | Changed to const |
| `game-relations/route.ts` | PATCH handler never called | Removed entirely |
| `RulebookEditor.tsx` | Duplicate `getComplexityLabel`/`getComplexityColor` | Import from `@/lib/rulebook/complexity` |

### Component Splits (2025-12-31)
**RulebookEditor Split** (997 → 349 lines):
```
src/components/admin/rulebook/
├── RulebookUrlSection.tsx      # URL input, validation, auto-discover
├── RulebookParseSection.tsx    # Parse PDF, BNCS generation, parsed text viewer
├── BNCSScoreDisplay.tsx        # BNCS score visualization with breakdown
├── ContentGenerationModal.tsx  # Content generation results dialog
└── index.ts                    # Barrel export
```

**GameEditor Split** (879 → 283 lines):
```
src/components/admin/game-editor/
├── DetailsTab.tsx      # Identity, Players & Time, Metadata cards
├── ContentTab.tsx      # Rules, Setup, Reference content editing
├── PublishingTab.tsx   # Visibility and Collection Tags
└── index.ts            # Barrel export
```

### Client/Server Import Fix (2025-12-31)
**Issue:** `BNCSScoreDisplay.tsx` (client component) importing from `complexity.ts` which imports Anthropic client at module level.

**Solution:** Created `complexity-utils.ts` with pure utility functions:
```
src/lib/rulebook/
├── complexity.ts       # AI-dependent generateBNCS + re-exports from utils
└── complexity-utils.ts # Pure utilities safe for client components
```

### Benefits
- **Reduced code duplication** - Shared hooks for common patterns
- **Smaller components** - RulebookEditor 66% smaller, GameEditor 68% smaller
- **Better UX** - Consistent "Saved!" feedback across all editors
- **Client-safe imports** - No Anthropic client in browser

---

## Phase 32: Rulebook Content Pipeline V2 (COMPLETE)

Enhanced the rulebook parsing and content generation system with full content pipeline, storage, and admin preview features.

### Content Generation Pipeline (2025-12-31)
- **Generate Content API** (`/api/admin/rulebook/generate-content`) - Generates rules, setup, and reference content from parsed rulebook
- **Three Content Types** - Rules summary, setup guide, and quick reference card
- **Parallel Generation** - All three content types generated simultaneously for speed
- **Stored Text Reuse** - Uses stored parsed text when available (avoids re-parsing PDF)

### Content Types Generated
- **Rules Content** (`rules_content` JSONB): quickStart, overview, coreRules, turnStructure, scoring, endGameConditions, winCondition, tips
- **Setup Content** (`setup_content` JSONB): overview, estimatedTime, components, steps, playerSetup, firstPlayerRule, quickTips, commonMistakes
- **Reference Content** (`reference_content` JSONB): turnSummary, keyActions, importantRules, endGame, scoringSummary, iconography, quickReminders

### Parsed Text Storage (2025-12-31)
- **New Migration** (`00049_rulebook_parsed_text.sql`): `parsed_text` column on `rulebook_parse_log`, `latest_parse_log_id` column on `games`
- **View Parsed Text API** (`/api/admin/rulebook/parsed-text`)
- **Admin UI** - "View Parsed Text" button with expandable viewer and copy button

### Content Generation Modal (2025-12-31)
- Success modal showing counts for each generated section
- Processing time display
- Action buttons: "Close & Refresh" and "View Game Page"

### Game Preview Page (2025-12-31)
- **New Route** - `/admin/games/[id]/preview`
- Preview banner, missing content warnings, section availability
- Admin navigation: "Back to Editor" and "View Live" buttons

---

## Phase 31: Admin Enhancements (COMPLETE)

Improved admin UX with BGG reference images and navigation fixes.

### BGG Reference Images in Admin (2025-12-31)
- **TempImage Component** - New component displaying images with red "Temp" badge overlay
- **Admin Games List** - Falls back to BGG reference thumbnail when no `thumbnail_url` exists
- **GameEditor Images Tab** - Shows BGG box art reference when no images uploaded

### Admin Navigation Fix (2025-12-31)
- **Issue** - Sidebar nav active state wasn't updating on client-side navigation
- **Root Cause** - Layout was a Server Component reading pathname from headers (stale on navigation)
- **Fix** - Created `AdminNav` client component using `usePathname()` hook
- **Note** - `AdminNav` was later replaced by `AdminSidebar` in Phase 34

### BGG Import Script Fix (2025-12-31)
- **Issue** - 21 games failed to import due to invalid `data_source` enum value ('bgg-extractor')
- **Fix** - Changed to `data_source: 'seed' as const` in `scripts/import-bgg-extract.ts`
- **Result** - Re-ran import: 21 imported, 654 updated, 0 failed

---

## Phase 30: Games Page UI Unification (COMPLETE)

Redesigned the games page (`/games`) to match the marketplace sidebar layout pattern for consistency across the site.

### Games Page Sidebar Layout (2025-12-31)
- **GamesSidebar Component** - New full-height sticky sidebar with "The Games" header and dice icon
- **Embedded Filter Mode** - Updated `FilterSidebar` to support `embedded` prop for sidebar integration
- **Prominent Search Bar** - Large search input at top of main content with clear button
- **Consistent Layout** - Matches marketplace pattern: sidebar left, main content right
- **Mobile Support** - Hamburger menu with overlay drawer on mobile

### Search Functionality (2025-12-31)
- **URL-based Search** - Search query persists in URL (`?q=...`)
- **Combined with Filters** - Search works together with taxonomy and range filters
- **Server-side Filtering** - Added `query` field to `GameFilters` interface
- **ilike Search** - Filters games by name using case-insensitive pattern matching

### New/Updated Components
```
src/components/games/
├── GamesSidebar.tsx           # NEW - Sidebar wrapper matching marketplace
├── filters/
│   └── FilterSidebar.tsx      # UPDATED - Added embedded prop + onClearAll
└── index.ts                   # UPDATED - Export GamesSidebar
```

### Known Issue: Turbopack Bug (2025-12-31)
Some pages hang with `Maximum call stack size exceeded at Map.set` error in Turbopack dev mode. Workaround: Use production build (`npm run build && npm start`).

---

## Phase 29: Legal Data Sourcing Strategy (COMPLETE)

Building a legally defensible data pipeline to compete with BGG without scraping copyrighted content.

### Phase 1: Seed Data Import (2025-12-31)
- **688 games imported** from `data/seed-games.json` into database
- Games imported as `is_published: false` (admin queue only)
- Content status set to `none` (needs enrichment)
- Data source tracked as `data_source: 'seed'`

### Phase 2: Publisher & Rulebook Pipeline (2025-12-31)
**Rulebook Library** (`src/lib/rulebook/`):
| File | Purpose |
|------|---------|
| `types.ts` | TypeScript types for PDF parsing, BNCS, discovery |
| `parser.ts` | PDF text extraction using pdf-parse |
| `prompts.ts` | AI prompts for extracting game data from rulebooks |
| `complexity.ts` | Boardmello Complexity Score (BNCS) generation |
| `discovery.ts` | Publisher URL pattern matching for rulebook discovery |
| `index.ts` | Barrel exports |

**Admin UI:**
- New **Rulebook** tab in game editor (`/admin/games/[id]`)
- Rulebook URL input with validation, Auto-discover button
- Parse & Generate BNCS button, BNCS score display with 5-dimension breakdown

**API Routes** (`/api/admin/rulebook/`):
| Route | Purpose |
|------|---------|
| `validate/` | Validate rulebook URL is a valid PDF |
| `discover/` | Auto-discover rulebook using publisher patterns |
| `parse/` | Parse PDF, extract data, generate BNCS |

**Database Migration** (`00048_rulebook_bncs.sql`):
- `rulebook_url`, `rulebook_source`, `rulebook_parsed_at` columns on games
- `bncs_score` (1.0-5.0), `bncs_breakdown` (JSONB), `bncs_generated_at`
- `component_list` JSONB for extracted components
- `publisher_rulebook_patterns` table with 9 publisher URL patterns
- `rulebook_parse_log` table for tracking parse attempts

**BNCS Scoring Dimensions:**
1. Rules Density - Amount of rules to learn
2. Decision Space - Choices per turn
3. Learning Curve - Time to understand
4. Strategic Depth - Mastery difficulty
5. Component Complexity - Game state tracking

### Phase 2b: Enhanced Discovery & Publisher Data (2025-12-31)
- **Priority 1**: Use publisher website URL from database (16 common path patterns)
- **Priority 2**: Use known publisher patterns (Stonemaier, CMON, etc.)
- **Priority 3**: Web search fallback with generated Google query

**Publisher Data Enrichment Scripts:**
| Script | Purpose |
|--------|---------|
| `scripts/enrich-publishers-from-bgg.ts` | Full enrichment: find BGG IDs + fetch websites |
| `scripts/backfill-publisher-websites.ts` | Fetch websites for publishers with existing BGG IDs |

### Admin Queue Redesign (2025-12-31)
- **Repurposed `/admin/queue`** as master content pipeline
- Shows all unpublished games from `games` table (not old `import_queue`)
- Summary cards: Content Status, Data Source, Image Status, Total
- Filters: Status, Source, Images
- Pagination: 50 items per page with accurate counts

### Legal Data Strategy
- **Wikidata** (CC0 licensed) as foundation layer
- **Publisher rulebook PDFs** for original content
- **Publisher partnerships** for official data
- **Boardmello Complexity Score (BNCS)** - AI-generated from rulebooks (differentiator)
- **BGG Collection Import** - User data portability feature

**What's Safe to Use (Facts):**
- Game names, publication years, player count, play time, minimum age
- Designer/publisher/artist names, category/mechanic concepts
- Award winners (public record)

**What's Proprietary to BGG (Avoid):**
- Weight/complexity scores (user-submitted)
- Ratings and rankings
- User-submitted descriptions
- BGG's specific data structure
