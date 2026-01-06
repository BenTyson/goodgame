# Vecna: Automated Game Content Pipeline

**Version:** 2.2
**Created:** 2026-01-04
**Updated:** 2026-01-05
**Status:** All 4 Phases Complete

## Overview

Vecna is a unified admin page that automates the entire game content creation pipeline from BGG import through publication. It replaces the fragmented workflow of `/import` → `/families` → `/games/[id]/wizard` with a single, streamlined interface.

### Design Principles

1. **Seamless Front-to-Back**: One page handles import → enrich → parse → generate → review → publish
2. **Family-Centric**: Process entire game families with base game context inheritance
3. **Minimal Human Input**: Only stop for critical decisions (missing rulebook, ambiguous relations)
4. **Full Data Utilization**: Use ALL available data from BGG, Wikidata, and Wikipedia
5. **Per-Game Publishing**: Publish games individually as they're approved (not batch)

---

## Current State Analysis (Audit Findings)

### Wizard Flow (7 Steps)

| Step | Component | What It Does | Issues |
|------|-----------|--------------|--------|
| 1 | RulebookStep | Manual URL input, auto-discover | Discovery rarely works, doesn't use Wikipedia external links |
| 2 | ParseAnalyzeStep | Parse PDF, calculate Crunch score | Works well |
| 3 | TaxonomyStep | Assign categories/mechanics/themes | Doesn't use Wikipedia category mappings |
| 4 | GenerateContentStep | AI content generation | Only uses `wikipedia_summary`, not gameplay/origins/awards |
| 5 | ImagesStep | Select primary image | Doesn't use Wikipedia images with licensing |
| 6 | RelationsStep | Review game relations | May be redundant with family-level relations |
| 7 | ReviewContentStep | Review generated content | **"Terrible UI"** - only shows subset of fields |

### Content Review UI Problems

1. Only displays overview, quickStart, tips - not coreRules, turnStructure, scoring, keyTerms
2. Editing is basic textarea splitting by newlines
3. No visibility into data sources (what came from where)
4. No side-by-side comparison of source data vs generated content

### AI Content Generation Gaps

**Currently Uses:**
- Rulebook text (primary)
- `wikipedia_summary` (themes, mechanics, reception, awards)

**NOT Using (Should Be):**
- `wikipedia_gameplay` - Direct rules context
- `wikipedia_origins` - Historical background
- `wikipedia_reception` - Critical acclaim for descriptions
- `wikipedia_awards` - Structured award data
- `wikipedia_infobox` - Structured game metadata

### Rulebook Discovery Gaps

**Current Sources (rarely work):**
- Publisher URL pattern matching (`PUBLISHER_PATTERNS` array)
- Web search query suggestion

**Should Prioritize:**
- Wikidata P953 (rulebook URL property) - Already in `games.rulebook_url` if from Wikidata
- Wikipedia external links (`type: 'rulebook'`) - Now extracted, NOT used
- Publisher website from Wikipedia infobox

### Publisher Data

**Available:**
- `game_publishers` junction table with `is_primary` flag
- `publishers` table with name, website, logo, description
- Wikipedia infobox has regional tags: "Z-Man Games (U.S.)", "Hobby Japan (Japan)"

**Not Used:**
- `parsePublishersWithRegion()` function exists but not integrated
- Primary publisher detection for rulebook discovery

### Game Detail Page Data Usage

**Currently Displayed:**
- Core: name, tagline, description, slug
- Stats: player counts, play time, weight, complexity_tier, year
- People: designers_list, publishers_list (with logo, description, website)
- Images: images array, wikidata_image_url, box_image_url
- Taxonomy: categories (not mechanics/themes)
- Content: has_rules, has_score_sheet, has_setup_guide, has_reference
- Awards: from `getGameAwards()` query
- External: bgg_id, official_website, rulebook_url

**NOT Displayed (Available):**
- wikipedia_url, mechanics, themes
- bncs_score (Crunch score)
- wikipedia_summary, wikipedia_origins, wikipedia_gameplay

---

## Vecna Architecture

### Entry Points

```
/admin/vecna
├── "Import New" - Enter BGG ID, imports family
├── "Select Existing" - Choose unprocessed family
└── "Single Game" - Import/process standalone game
```

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 1: IMPORT & ENRICH (Automated)                                │
├─────────────────────────────────────────────────────────────────────┤
│ □ Import from BGG (base game + family members)                      │
│ □ Wikidata enrichment (all games)                                   │
│ □ Wikipedia enrichment (all games) - NEW enhanced extraction        │
│ □ Auto-detect family relations from Wikipedia                       │
│ □ Auto-discover rulebook URLs:                                      │
│   1. Wikidata P953 (if present)                                     │
│   2. Wikipedia external links (type: 'rulebook')                    │
│   3. Pattern matching (existing, low success)                       │
│ □ Flag games missing rulebooks                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 2: FAMILY REVIEW (Human Checkpoint)                           │
├─────────────────────────────────────────────────────────────────────┤
│ • Confirm base game selection                                       │
│ • Review auto-detected relations (expansion/standalone/variant)     │
│ • For games missing rulebooks:                                      │
│   - Show primary publisher + website link                           │
│   - Show Wikipedia external links                                   │
│   - Manual URL input                                                │
│ • Approve family structure to continue                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 3: PROCESS GAMES (Sequential with Context)                    │
├─────────────────────────────────────────────────────────────────────┤
│ Process order: Base game first, then expansions chronologically     │
│                                                                     │
│ For each game:                                                      │
│ □ Parse rulebook (if URL available)                                 │
│ □ Calculate Crunch score                                            │
│ □ AI taxonomy assignment:                                           │
│   - Rulebook analysis                                               │
│   - Wikipedia category mappings                                     │
│   - Wikipedia infobox mechanics/themes                              │
│ □ AI content generation (enhanced prompts):                         │
│   - Rulebook text (primary)                                         │
│   - Wikipedia summary (themes, mechanics)                           │
│   - Wikipedia gameplay section                                      │
│   - Wikipedia origins/history                                       │
│   - Wikipedia awards (structured)                                   │
│   - Family context (from base game, for expansions)                 │
│ □ Media selection:                                                  │
│   - Wikipedia images (CC licensed, with metadata)                   │
│   - Wikidata image                                                  │
│   - BGG image (reference only)                                      │
│                                                                     │
│ If game missing rulebook:                                           │
│   → Skip parsing, generate content from Wikipedia + BGG only        │
│   → Flag for manual rulebook addition later                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 4: CONTENT REVIEW (Human Checkpoint, Per-Game)                │
├─────────────────────────────────────────────────────────────────────┤
│ Redesigned UI showing ALL data:                                     │
│                                                                     │
│ ┌─────────────────┬─────────────────┬─────────────────┐            │
│ │ SOURCE DATA     │ GENERATED       │ FINAL OUTPUT    │            │
│ ├─────────────────┼─────────────────┼─────────────────┤            │
│ │ Rulebook excerpt│ AI Overview     │ [Editable]      │            │
│ │ Wikipedia       │ AI Rules        │ [Editable]      │            │
│ │ BGG data        │ AI Setup        │ [Editable]      │            │
│ └─────────────────┴─────────────────┴─────────────────┘            │
│                                                                     │
│ Data source badges on each field (BGG | WD | WP | AI)               │
│ Compliance checklist:                                               │
│   □ BGG attribution added                                           │
│   □ Image licensing verified (CC)                                   │
│   □ Primary publisher correct                                       │
│                                                                     │
│ [Approve & Publish] or [Save Draft]                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 5: PUBLISH (Per-Game)                                         │
├─────────────────────────────────────────────────────────────────────┤
│ □ Set is_published = true                                           │
│ □ Set content_status = 'published'                                  │
│ □ Update family landing page if all games published                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Family Context Inheritance

When processing expansions, include base game context in AI prompts:

```typescript
interface FamilyContext {
  baseGameId: string
  baseGameName: string
  coreMechanics: string[]         // From base game taxonomy or Wikipedia
  coreTheme: string | null        // From base game theme/Wikipedia
  baseSetupSummary: string | null // From base game setup_content
  baseRulesOverview: string | null // From base game rules_content.overview
  componentTypes: string[]        // From base game component_list

  // Enhanced: Base game Wikipedia context for expansions (NEW in Phase 3)
  baseGameOrigins: string | null       // Designer intent, development history
  baseGameReception: string | null     // Critical acclaim, what players love
  baseGameAwards: string[] | null      // Awards won by base game
  baseGameDesigners: string[] | null   // From Wikipedia infobox
  baseGamePublishers: string[] | null  // From Wikipedia infobox
}
```

Expansion AI prompts now include full base game context:
```
=== BASE GAME CONTEXT ===
This expansion is for "${baseGameName}".

Core Mechanics: ${coreMechanics.join(', ')}
Theme: ${coreTheme}
Designers: ${baseGameDesigners.join(', ')}
Publishers: ${baseGamePublishers.join(', ')}

Awards Won: ${baseGameAwards.join(', ')}

Critical Reception:
${baseGameReception}

Design Origins:
${baseGameOrigins}

Base Game Rules Overview:
${baseRulesOverview}

Base Game Setup:
${baseSetupSummary}

Base Game Components: ${componentTypes.join(', ')}
```

This helps the AI understand what made the base game special and generate content that properly positions the expansion.

---

## Data Priority Ranking

For each field, when multiple sources have data:

| Field | Priority 1 | Priority 2 | Priority 3 | Priority 4 |
|-------|-----------|-----------|-----------|-----------|
| Name | Manual override | BGG | Wikidata | - |
| Description | AI Generated | Manual | BGG | - |
| Players/Time | BGG | Wikipedia infobox | Wikidata | - |
| Primary Image | Manual upload | Wikipedia (CC) | Wikidata (CC) | BGG (ref only) |
| Rulebook URL | Manual | Wikidata P953 | Wikipedia ext links | Pattern match |
| Mechanics | Merged (all sources) | - | - | - |
| Publisher | Wikipedia (with region) | BGG primary | Wikidata | - |
| Awards | Wikipedia structured | AI-extracted | - | - |

---

## UI Components (V2)

### Visual Model: 4 Phases

Instead of showing all 11 raw states, the UI displays 4 simplified phases:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   IMPORT    │    PARSE    │  GENERATE   │   PUBLISH   │
│  ●━━━━━━━━━━│━━━━━━━━━━━━━│━━━━━━━━━━━━━│━━━━━━━━━━○  │
│  imported   │ rulebook_*  │ taxonomy_*  │ review_*    │
│  enriched   │ parsing     │ generating  │ published   │
│             │ parsed      │ generated   │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Phase Mapping:**
```typescript
type Phase = 'import' | 'parse' | 'generate' | 'publish'

const PHASE_MAPPING: Record<VecnaState, Phase> = {
  imported: 'import',
  enriched: 'import',
  rulebook_missing: 'parse',
  rulebook_ready: 'parse',
  parsing: 'parse',
  parsed: 'parse',
  taxonomy_assigned: 'generate',
  generating: 'generate',
  generated: 'generate',
  review_pending: 'publish',
  published: 'publish',
}
```

### Main Vecna Page Layout (V2)

```
┌─────────────────────────────────────────────────────────────────────┐
│ VECNA - Game Content Pipeline                                       │
├───────────────────┬─────────────────────────────────────────────────┤
│                   │                                                 │
│ FAMILY SIDEBAR    │  FAMILY HEADER (only if 2+ games)               │
│ ┌───────────────┐ │  ┌─────────────────────────────────────────┐   │
│ │ [Phase Tabs]  │ │  │ Catan Family           [Batch Actions ▾] │   │
│ │ All|Import|...│ │  │ 5/8 published                            │   │
│ └───────────────┘ │  │ ●━━━━━━━●━━━━━━━○━━━━━━━○                │   │
│ ┌───────────────┐ │  │ IMPORT   PARSE   GENERATE  PUBLISH       │   │
│ │ Catan Family  │ │  └─────────────────────────────────────────┘   │
│ │ ●●●○ 5/8 pub  │ │                                                 │
│ │ > Catan      │ │  GAME PANEL (2 tabs)                            │
│ │   Seafarers  │ │  ┌─────────────────────────────────────────┐   │
│ │   Cities     │ │  │ [Pipeline] [Details]                     │   │
│ └───────────────┘ │  ├─────────────────────────────────────────┤   │
│ ┌───────────────┐ │  │ ⚠️ BLOCKED: No rulebook [Find Rulebook] │   │
│ │ Standalone    │ │  ├─────────────────────────────────────────┤   │
│ │ ○○○○ 2 games  │ │  │ Next Action: [Set Rulebook URL]         │   │
│ └───────────────┘ │  │ Status: rulebook_missing                │   │
│                   │  │ Crunch: N/A                              │   │
│                   │  │ Content: Not generated                   │   │
│                   │  └─────────────────────────────────────────┘   │
└───────────────────┴─────────────────────────────────────────────────┘
```

### Component Structure (V2)

```
src/app/admin/(dashboard)/vecna/components/
├── VecnaPipeline.tsx           # Main orchestrator
├── VecnaFamilySidebar.tsx      # Left sidebar with phase filters
├── VecnaFamilyHeader.tsx       # Family-level header + batch actions (NEW)
├── VecnaGamePanel.tsx          # 2-tab game view (NEW, replaces VecnaGameView)
├── VecnaEmptyState.tsx         # Empty state message
├── PipelineProgressBar.tsx     # 4-phase visual indicator (NEW)
├── BlockedStateAlert.tsx       # Prominent blocked/error banners (NEW)
├── SourcesDrawer.tsx           # Debug sources slide-out drawer (NEW)
├── StateActions.tsx            # State transition actions
├── RulebookDiscovery.tsx       # Rulebook URL discovery UI
└── FamilyBatchActions.tsx      # Batch processing dropdown
```

### Game Processing States (Internal)

The 11 states still exist internally for precise tracking:

```typescript
type VecnaState =
  | 'imported'           // BGG data imported
  | 'enriched'           // Wikidata + Wikipedia done
  | 'rulebook_missing'   // BLOCKED: Waiting for manual rulebook URL
  | 'rulebook_ready'     // Rulebook URL confirmed
  | 'parsing'            // Rulebook being parsed
  | 'parsed'             // Rulebook text extracted
  | 'taxonomy_assigned'  // Categories/mechanics assigned
  | 'generating'         // AI content being generated
  | 'generated'          // AI content ready
  | 'review_pending'     // BLOCKED: Ready for human review
  | 'published'          // Live on site
```

**Blocked States:** `rulebook_missing` and `review_pending` show prominent amber banners

---

## Implementation Phases

### Phase 1: Foundation (Sessions 1-2)

**Files to Create:**
- `/src/app/admin/(dashboard)/vecna/page.tsx` - Main Vecna page
- `/src/app/admin/(dashboard)/vecna/components/` - UI components
- `/src/lib/vecna/types.ts` - Type definitions
- `/src/lib/vecna/pipeline.ts` - Pipeline orchestration

**Tasks:**
1. Create Vecna page structure with family sidebar
2. Build unified data view showing ALL sources
3. Add processing state management
4. Implement rulebook discovery with Wikipedia external links

### Phase 2: Automation (Sessions 3-4)

**Files to Modify:**
- `/src/lib/bgg/importer.ts` - Integrate auto-enrichment
- `/src/lib/wikipedia/index.ts` - Add family relation detection
- `/src/app/api/admin/rulebook/discover/route.ts` - Add Wikipedia sources

**Tasks:**
1. Auto-run full enrichment after import
2. Auto-detect family relations from Wikipedia
3. Build rulebook discovery priority chain
4. Create "human checkpoint" UI for missing data

### Phase 3: Enhanced AI (Sessions 5-6)

**Files to Modify:**
- `/src/lib/rulebook/prompts.ts` - Enhanced prompts with all Wikipedia data
- `/src/app/api/admin/rulebook/generate-content/route.ts` - Pass more context

**Tasks:**
1. Update prompts to include wikipedia_gameplay, origins, awards
2. Implement family context inheritance for expansions
3. Improve taxonomy assignment with Wikipedia categories

### Phase 4: Review UI & Polish (Sessions 7-8)

**Files to Create:**
- `/src/app/admin/(dashboard)/vecna/components/ContentReview.tsx`
- `/src/app/admin/(dashboard)/vecna/components/DataSourceBadge.tsx`

**Tasks:**
1. Build three-column review UI (source | generated | final)
2. Add data source visibility badges
3. Compliance checklist
4. Per-game publish flow

---

## Database Considerations

### Existing Fields (Ready to Use)

| Table | Field | Status |
|-------|-------|--------|
| games | wikipedia_url | ✅ Populated |
| games | wikipedia_summary | ✅ Populated |
| games | wikipedia_infobox | ✅ Populated |
| games | wikipedia_origins | ✅ Populated |
| games | wikipedia_reception | ✅ Populated |
| games | wikipedia_gameplay | ✅ Populated (new) |
| games | wikipedia_images | ✅ Populated (new) |
| games | wikipedia_external_links | ✅ Populated (new) |
| games | wikipedia_awards | ✅ Populated (new) |
| games | rulebook_url | ✅ Ready |
| games | bncs_score | ✅ Ready |
| game_families | base_game_id | ✅ Ready |

### New Fields Needed

| Table | Field | Purpose |
|-------|-------|---------|
| game_families | family_context | JSON - stored base game context for expansions |
| games | vecna_state | Enum - processing state tracking |
| games | vecna_processed_at | Timestamp - when Vecna last processed |

### Migration

```sql
-- /supabase/migrations/00060_vecna_state.sql

-- Add Vecna processing state
CREATE TYPE vecna_state AS ENUM (
  'imported', 'enriched', 'rulebook_missing', 'rulebook_ready',
  'parsing', 'parsed', 'taxonomy_assigned', 'generating',
  'generated', 'review_pending', 'published'
);

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS vecna_state vecna_state DEFAULT 'imported',
  ADD COLUMN IF NOT EXISTS vecna_processed_at TIMESTAMPTZ;

-- Add family context storage
ALTER TABLE game_families
  ADD COLUMN IF NOT EXISTS family_context JSONB;

COMMENT ON COLUMN games.vecna_state IS 'Current state in Vecna processing pipeline';
COMMENT ON COLUMN game_families.family_context IS 'Base game context for expansion processing';
```

---

## API Endpoints

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/vecna/start` | POST | Start pipeline for family |
| `/api/admin/vecna/[gameId]/process` | POST | Process single game |
| `/api/admin/vecna/[gameId]/state` | GET | Get processing state |
| `/api/admin/vecna/[familyId]/status` | GET | Get family pipeline status |

### Modified Endpoints

| Endpoint | Changes |
|----------|---------|
| `/api/admin/rulebook/discover` | Add Wikipedia external links as primary source |
| `/api/admin/rulebook/generate-content` | Pass full Wikipedia context |

---

## Success Metrics

After Vecna is implemented:

1. **Time to publish**: From ~30 min/game → ~5 min/game (excluding rulebook search)
2. **Rulebook discovery rate**: From ~5% → ~40% (with Wikipedia links)
3. **Data utilization**: From ~20% → ~80% of extracted data used
4. **Content quality**: More contextual, accurate AI content with Wikipedia enrichment

---

## Open Questions

1. **Standalone games**: How to handle games with no family? → "Family of 1" approach
2. **Multiple bases**: What if a family has no clear base game? → Let admin designate
3. **Content regeneration**: If base game changes, regenerate expansion content? → TBD
4. **Score sheet generation**: Include in Vecna or separate process? → Separate for now

---

## Appendix: Content Output Schema

### RulesContent (Full Structure)

```typescript
interface RulesContent {
  quickStart: string[]           // 5 key points to start playing
  overview: string               // 3-4 sentences, the hook
  coreRules: {                   // 3-6 rule categories
    title: string
    summary: string
    points: string[]
  }[]
  turnStructure: {               // Complete turn walkthrough
    phase: string
    description: string
    keyChoices: string
  }[]
  scoring: {                     // All scoring methods
    category: string
    points: string
    strategy: string
  }[]
  endGameConditions: string[]    // What triggers end
  winCondition: string           // How winner is determined
  keyTerms: {                    // Game vocabulary
    term: string
    definition: string
  }[]
  tips: string[]                 // Strategic insights
  rulesNotes: string[]           // Common mistakes
}
```

### SetupContent (Full Structure)

```typescript
interface SetupContent {
  overview: string
  estimatedTime: string
  spaceRequired: string
  components: {
    name: string
    quantity: string
    description: string
    sortingTip?: string
  }[]
  beforeYouStart: string[]
  steps: {
    step: number
    title: string
    instruction: string
    details: string
    tip?: string
  }[]
  playerSetup: {
    description: string
    items: string[]
    notes: string
  }
  boardSetup: {
    description: string
    steps: string[]
    playerCountVariations?: string
  }
  firstPlayerRule: string
  readyCheck: string[]
  quickTips: string[]
  commonMistakes: string[]
  storageNotes: string
}
```

### ReferenceContent (Current Schema)

The reference content supports both the AI-generated schema and legacy data:

```typescript
interface ReferenceContent {
  // AI-generated schema (from prompts.ts)
  turnSummary?: (string | { phase?: string; action?: string })[]
  actions?: { name: string; cost: string; effect: string; limit: string }[]
  symbols?: { symbol: string; meaning: string }[]
  scoring?: { category: string; points: string; notes: string }[]
  importantNumbers?: { what: string; value: string; context: string }[]
  reminders?: string[]
  endGame?: string | {
    triggers?: string[]
    finalRound?: string
    winner?: string
    tiebreakers?: string[]
  }

  // Legacy schema (older data)
  keyRules?: { rule: string; detail: string }[]
  costs?: { item: string; cost: string }[]
  quickReminders?: string[]
}
```

**Note:** The reference page (`/games/[slug]/reference`) handles both schemas and renders whichever fields exist in the data.

---

## Implementation Status

### Phase 1: Foundation (COMPLETE)

**Implemented:**
- `/admin/vecna` page with family sidebar
- `VecnaPipeline` component with state management
- `VecnaFamilySidebar` with search, filter, and collapse functionality
- Processing state enum and tracking columns
- Family context storage in `game_families`
- Taxonomy source tracking (bgg, wikidata, wikipedia, ai, manual)

**Migrations:**
- `00060_vecna_state.sql` - `vecna_state` enum and columns
- `00061_taxonomy_source.sql` - `source` column on junction tables
- `00062_fix_taxonomy_source_default.sql` - Backfill BGG as source

### Phase 2: Automation & Batch Processing (COMPLETE)

**Implemented:**
- Auto-enrichment after import (vecna_state updates in `/lib/bgg/importer.ts`)
- Rulebook URL extraction from Wikipedia external links
- Batch processing for families with `/api/admin/vecna/family/[familyId]/process`
- `FamilyBatchActions` component with processing modes
- Publishing now sets `is_published = true` on games table

**Batch Processing Features:**
- Processing modes: `full`, `parse-only`, `generate-only`, `from-current`
- Order: base game first, then expansions chronologically
- Family context rebuilt after base game completes
- Options: skip blocked games, stop on first error

### UI V2 Redesign (COMPLETE)

**Implemented:**
- Simplified 4-phase visual model (Import → Parse → Generate → Publish)
- Reduced from 6 tabs to 2 tabs (Pipeline + Details)
- New phase filter buttons in sidebar (replaces 11-state dropdown)
- Auto-select first family/game on page load
- Family header only shown for multi-game families
- Sources moved to hidden debug drawer
- Prominent blocked state alerts (amber banners)

**New Files (V2):**
```
src/app/admin/(dashboard)/vecna/components/
├── VecnaFamilyHeader.tsx       # Family-level header + batch actions
├── VecnaGamePanel.tsx          # 2-tab game view (replaces VecnaGameView)
├── PipelineProgressBar.tsx     # 4-phase visual indicator
├── BlockedStateAlert.tsx       # Prominent blocked/error banners
├── SourcesDrawer.tsx           # Debug sources slide-out drawer

src/lib/vecna/types.ts          # Added Phase type, PHASE_MAPPING, helper functions
```

**Current Component Structure:**
```
src/app/admin/(dashboard)/vecna/components/
├── VecnaPipeline.tsx           # Main orchestrator (updated for V2 layout)
├── VecnaFamilySidebar.tsx      # Left sidebar (updated with phase filters)
├── VecnaFamilyHeader.tsx       # NEW: Family header + batch actions
├── VecnaGamePanel.tsx          # NEW: 2-tab game view
├── VecnaEmptyState.tsx         # Simplified empty state
├── PipelineProgressBar.tsx     # NEW: 4-phase progress indicator
├── BlockedStateAlert.tsx       # NEW: Blocked state banners
├── SourcesDrawer.tsx           # NEW: Debug drawer
├── StateActions.tsx            # State transition actions
├── RulebookDiscovery.tsx       # Rulebook URL discovery UI
├── FamilyBatchActions.tsx      # Batch processing dropdown
└── VecnaGameView.tsx           # DEPRECATED: Old 6-tab view (kept for reference)
```

### Phase 3: Enhanced AI (COMPLETE)

**Implemented (2026-01-05):**
- ✅ Full Wikipedia context in prompts (gameplay, origins, awards already working)
- ✅ Enhanced family context inheritance for expansions (5 new fields)
- ✅ Data completeness report showing missing fields after pipeline
- ✅ Player experiences taxonomy fix (was completely missing from Vecna)
- ✅ Model selector UI (Haiku/Sonnet/Opus) for content generation
- ✅ Primary Publisher as Critical field

**New Files:**
```
src/lib/vecna/completeness.ts              # Field checking utility
src/app/admin/(dashboard)/vecna/components/CompletenessReport.tsx  # Report UI
```

**Completeness Report Categories (9):**
1. Core Game Data - name, year, player counts, play time, weight
2. External Sources - BGG, Wikidata, Wikipedia (origins, reception, awards)
3. Publisher Data - publishers listed, **Primary Publisher (Critical)**, regional publishers
4. Rulebook & Parsing - rulebook URL, crunch score
5. Taxonomy - categories, mechanics, themes, **player experiences**
6. Rules Content - quickStart, coreRules, turnStructure, winCondition, etc.
7. Setup Content - steps, components, estimatedTime, playerSetup, etc.
8. Reference Content - turnSummary, keyActions, endGame, scoringSummary
9. Images - thumbnail, box art, hero image, CC-licensed images

**Model Options:**
| Model | Speed | Cost | Temperature | Best For |
|-------|-------|------|-------------|----------|
| Haiku | Fastest | Cheapest | 0.4 | Testing, debugging |
| Sonnet | Balanced | Medium | 0.6 | Production (default) |
| Opus | Slowest | Highest | 0.7 | Best quality |

### Phase 4: Content Review UI (COMPLETE)

**Implemented (2026-01-05):**
- ✅ Three-column review UI (source | generated | final)
- ✅ Data source visibility badges throughout (shared DataSourceBadge component)
- ✅ "Review" tab appears when game reaches generated/review_pending/published states
- ✅ Completeness report field consolidation (player count, play time, BGG data merged)
- ✅ JSON editor for manual content tweaks (format, reset, save, validation)
- ✅ Per-section content regeneration with model selector (Haiku/Sonnet/Opus)
- ✅ Publish flow: preview links, unpublish capability, enhanced confirmation
- ✅ Readiness checklist (rules, setup, reference, thumbnail, categories)
- ✅ Dark mode compatible styling

**New Files:**
```
src/lib/vecna/DataSourceBadge.tsx                              # Shared badge component
src/app/admin/(dashboard)/vecna/components/ContentReviewPanel.tsx  # Three-column review UI
/api/admin/vecna/[gameId]/content                              # PATCH endpoint for content edits
```

**Bug Fixes (2026-01-05):**
- Fixed nested button hydration error in ContentSection
- Made VecnaFamilyHeader compact to reduce UI redundancy
- Added actionable links to checklist items (Categories/Thumbnail → game editor)

---

## All Phases Complete

Vecna is now fully implemented with all 4 phases:

| Phase | Status | Key Features |
|-------|--------|--------------|
| 1. Foundation | ✅ Complete | Page, sidebar, state management, migrations |
| 2. Automation | ✅ Complete | Batch processing, rulebook discovery, publishing |
| 3. Enhanced AI | ✅ Complete | Family context, completeness report, model selector |
| 4. Review UI | ✅ Complete | Three-column review, JSON editor, publish flow |
