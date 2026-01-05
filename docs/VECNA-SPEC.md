# Vecna: Automated Game Content Pipeline

**Version:** 1.2
**Created:** 2026-01-04
**Updated:** 2026-01-04
**Status:** Phase 2 In Progress - Batch Processing & Data Surfacing

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
  coreMechanics: string[]        // From base game taxonomy
  coreTheme: string              // From base game theme
  baseSetupSummary: string       // From base game setup_content
  baseRulesOverview: string      // From base game rules_content.overview
  componentTypes: string[]       // From base game component_list
}
```

Expansion AI prompts will include:
```
This is an expansion to "${baseGameName}".

BASE GAME CONTEXT:
- Core mechanics: ${coreMechanics.join(', ')}
- Theme: ${coreTheme}
- Setup summary: ${baseSetupSummary}
- Rules overview: ${baseRulesOverview}

EXPANSION RULEBOOK:
${expansionRulebookText}

Generate content that builds on the base game...
```

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

## UI Components

### Main Vecna Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ VECNA - Game Content Pipeline                            [Settings] │
├───────────────────┬─────────────────────────────────────────────────┤
│                   │                                                 │
│ FAMILY SIDEBAR    │  MAIN CONTENT AREA                              │
│                   │                                                 │
│ ┌───────────────┐ │  ┌─────────────────────────────────────────┐   │
│ │ Pandemic      │ │  │ Stage Progress: ████████░░░░ 65%        │   │
│ │ [Base Game]   │ │  │ Currently: Processing "On the Brink"    │   │
│ │ ✅ Published  │ │  └─────────────────────────────────────────┘   │
│ └───────────────┘ │                                                 │
│ ┌───────────────┐ │  ┌─────────────────────────────────────────┐   │
│ │ On the Brink  │ │  │                                         │   │
│ │ [Expansion]   │ │  │  [Game Processing Panel]                │   │
│ │ 🔄 Processing │ │  │                                         │   │
│ └───────────────┘ │  │  - Rulebook Status                      │   │
│ ┌───────────────┐ │  │  - Crunch Score                         │   │
│ │ In the Lab    │ │  │  - Taxonomy                             │   │
│ │ [Expansion]   │ │  │  - Content Generation Progress          │   │
│ │ ⏳ Queued     │ │  │  - Media Selection                      │   │
│ └───────────────┘ │  │                                         │   │
│ ┌───────────────┐ │  └─────────────────────────────────────────┘   │
│ │ The Cure      │ │                                                 │
│ │ [Standalone]  │ │                                                 │
│ │ ⚠️ No Rulebook│ │                                                 │
│ └───────────────┘ │                                                 │
│                   │                                                 │
└───────────────────┴─────────────────────────────────────────────────┘
```

### Game Processing States

```typescript
type GameProcessingState =
  | 'imported'           // BGG data imported
  | 'enriched'           // Wikidata + Wikipedia done
  | 'rulebook_missing'   // Waiting for manual rulebook URL
  | 'rulebook_ready'     // Rulebook URL confirmed
  | 'parsing'            // Rulebook being parsed
  | 'parsed'             // Rulebook text extracted
  | 'taxonomy_assigned'  // Categories/mechanics assigned
  | 'generating'         // AI content being generated
  | 'generated'          // AI content ready
  | 'review_pending'     // Ready for human review
  | 'published'          // Live on site
```

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

### ReferenceContent (Full Structure)

```typescript
interface ReferenceContent {
  turnSummary: {
    phase: string
    required: boolean
    actions: string[]
    notes?: string
  }[]
  actionCosts: {
    action: string
    cost: string
    effect: string
    limit?: string
  }[]
  resourceConversions: {
    from: string
    to: string
    when: string
  }[]
  importantRules: {
    rule: string
    context: string
  }[]
  timingRules: {
    situation: string
    resolution: string
  }[]
  endGame: {
    triggers: string[]
    finalRound?: string
    winner: string
    tiebreakers: string[]
  }
  scoringSummary: {
    category: string
    calculation: string
    maxPossible?: string
  }[]
  iconography: {
    symbol: string
    meaning: string
    examples: string
  }[]
  commonQuestions: {
    question: string
    answer: string
  }[]
  quickReminders: string[]
}
```

---

## Implementation Status

### Phase 1: Foundation (COMPLETE)

**Implemented:**
- `/admin/vecna` page with family sidebar
- `VecnaPipeline` component with state management
- `VecnaFamilySidebar` with search, filter, and collapse functionality
- `VecnaGameView` with three tabs (Overview, Taxonomy, Data Sources)
- Processing state enum and tracking columns
- Family context storage in `game_families`
- Taxonomy source tracking (bgg, wikidata, wikipedia, ai, manual)

**Files Created:**
```
src/app/admin/(dashboard)/vecna/
├── page.tsx                    # Main page with data fetching
└── components/
    ├── VecnaPipeline.tsx       # Pipeline orchestrator
    ├── VecnaFamilySidebar.tsx  # Collapsible family tree
    ├── VecnaGameView.tsx       # Game detail view with 6 tabs
    ├── VecnaEmptyState.tsx     # Empty state with stats
    ├── StateActions.tsx        # State transition actions
    ├── RulebookDiscovery.tsx   # Rulebook URL discovery UI
    ├── FamilyBatchActions.tsx  # Batch processing for families
    └── index.ts                # Barrel exports

src/app/api/admin/vecna/family/[familyId]/process/
└── route.ts                    # Batch processing API

src/lib/vecna/
├── types.ts                    # VecnaState, VecnaGame, VecnaFamily, etc.
├── pipeline.ts                 # Pipeline orchestration logic
├── context.ts                  # Family context utilities
└── index.ts                    # Barrel exports
```

**Migrations:**
- `00060_vecna_state.sql` - `vecna_state` enum and columns
- `00061_taxonomy_source.sql` - `source` column on junction tables
- `00062_fix_taxonomy_source_default.sql` - Backfill BGG as source

### Phase 2: Automation (IN PROGRESS)

**Implemented:**
- Auto-enrichment after import (vecna_state updates in `/lib/bgg/importer.ts`)
- Rulebook URL extraction from Wikipedia external links
- Batch processing for families with `/api/admin/vecna/family/[familyId]/process`
- `FamilyBatchActions` component with processing modes
- Dedicated "Rulebook" tab (always accessible)
- Manual URL input without discovery click

**New Files:**
```
src/app/admin/(dashboard)/vecna/components/FamilyBatchActions.tsx
src/app/api/admin/vecna/family/[familyId]/process/route.ts
```

**Batch Processing Features:**
- Processing modes: `full`, `parse-only`, `generate-only`, `from-current`
- Order: base game first, then expansions chronologically
- Family context rebuilt after base game completes
- Options: skip blocked games, stop on first error
- Results display: "X advanced" vs "X blocked" vs "X skipped"

**Bug Fixes:**
- Cookie forwarding for internal API auth
- Hydration error in AlertDialogDescription
- Stale state when switching games (key prop)

**Remaining:**
- Improve rulebook discovery success rate
- More end-to-end testing with various families

### Phase 3: Enhanced AI (PLANNED)

**To Implement:**
- Full Wikipedia context in prompts (gameplay, origins, awards)
- Family context inheritance for expansions
- Improved taxonomy assignment with Wikipedia categories

### Phase 4: Review UI & Polish (PLANNED)

**To Implement:**
- Three-column review UI (source | generated | final)
- Data source visibility badges throughout
- Compliance checklist
- Per-game publish flow
