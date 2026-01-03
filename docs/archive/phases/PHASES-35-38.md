# Phases 35-38: Admin Wizard & AI Taxonomy

> Archived: 2026-01-02

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

**JSON Repair Function (`repairJSON` in `src/lib/ai/claude.ts`):**
- Fixes smart/curly quotes → straight quotes
- Fixes quotes used as apostrophes (e.g., `Martin"s` → `Martin's`)
- Removes trailing commas before `}` or `]`
- Fixes unquoted property names
- Removes `//` comments
- Extracts JSON from extra text

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
```

**Family Auto-Detection:**
- Games with colons create families automatically (e.g., "CATAN: Seafarers" → CATAN family)
- Also detects parentheses and en-dash patterns

**Admin Families Page Redesign:**
- Thumbnail images showing base game
- Relation counts with filter buttons
- Compact cards with image overlays

---

## Phase 36 - Admin Image Cropper (COMPLETE)

Added image cropping functionality to the admin game image uploader with preset aspect ratios.

### New Files

| File | Purpose |
|------|---------|
| `src/lib/utils/image-crop.ts` | Canvas-based crop utility with aspect ratio presets |
| `src/components/admin/ImageCropper.tsx` | Modal dialog with react-easy-crop integration |

### Image Type Options

| Type | Default Ratio | Syncs To |
|------|---------------|----------|
| **Cover** | 4:3 | `box_image_url`, `thumbnail_url` |
| **Hero** | 16:9 | `hero_image_url` |
| **Gallery** | 4:3 | `game_images` table only |

### Upload Flow

1. Select image type (Cover/Hero/Gallery)
2. Select or drop an image file
3. Cropper modal opens with default aspect ratio
4. Adjust zoom and position
5. Apply crop → uploads cropped image to Supabase

### Dependencies Added

- `react-easy-crop` - Lightweight image cropping library

---

## Phase 35 - Admin Game Editor UX Overhaul (COMPLETE)

Redesigned the admin game editor with a Setup Wizard for new games and consolidated tabs for power users.

### Setup Wizard

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
| `wizard-steps/ParseGenerateStep.tsx` | Step 2: Parse PDF + generate content |
| `wizard-steps/ImagesStep.tsx` | Step 3: Upload images |
| `wizard-steps/ReviewContentStep.tsx` | Step 4: Review generated content |
| `wizard-steps/PublishStep.tsx` | Step 5: Final review + publish |

### Tab Consolidation

**Before (6 tabs):** Details, Publishing, Rulebook, Content, Images, Relations

**After (4 tabs):** Details, Rulebook & Content, Images, Relations

### Wizard Flow

| Step | Complete When |
|------|---------------|
| 1. Rulebook | URL validated OR skipped |
| 2. Parse & Generate | Crunch Score exists AND content generated |
| 3. Images | At least 1 image uploaded OR skipped |
| 4. Review | User clicks "Looks Good" |
| 5. Publish | User clicks "Publish Game" |

### UX Behavior

- **Unpublished games**: Wizard auto-starts, can exit to tabs via "Exit to Advanced"
- **Published games**: Always show tab-based Advanced Editor
- **Progress persistence**: localStorage keyed by `wizard-progress-{gameId}`
