# Current Status

> Last Updated: 2026-01-05 (Game Editor Cleanup & UX Improvements)

## Current Phase: 52 - Game Editor & Vecna Phase 4 Complete

Completed comprehensive update to game editor with Sources tab and Pipeline Status. Vecna Phase 4 (Content Review UI) is complete. Game Editor streamlined to 5 tabs with legacy components removed.

### Session Summary (2026-01-05) - Game Editor Cleanup

**Game Editor Streamlined (6 → 5 tabs):**
- Removed Relations tab (outdated, relations managed in Vecna/Families)
- Removed Setup Wizard (legacy, fully replaced by Vecna pipeline)
- Game Editor tabs: Details, Taxonomy, Content, Sources, Images

**UX Improvements:**
- Auto-resize textareas for all content fields (description, rules, setup, reference)
- Moved Crunch Score display from Content tab to Details tab (under Metadata)
- Taxonomy auto-selection: AI suggestions ≥70% confidence now pre-selected
- Publisher list shows Wikipedia infobox publishers with search icons
- Sources tab: quick link icons for BGG/Wikidata/Wikipedia URLs, fixed fetch status

**Image Management Overhaul:**
- Unified image gallery with amber ring for primary image indicator
- Added Wikipedia/Wikidata images to Images tab "Available Sources" section
- Import workflow: "Add to Gallery" buttons for fetching external images
- Color-coded source badges (purple=Wikipedia, blue=Wikidata, red=BGG)
- BGG images marked as "Reference only" (can't import due to licensing)

**New Components:**
- `AutoResizeTextarea` - Textarea that expands based on content

**Files Modified:**
| File | Changes |
|------|---------|
| `GameEditor.tsx` | Removed Relations tab, Setup Wizard; unified image sources UI; image import workflow |
| `ImageUpload.tsx` | Unified grid layout, primary image indicator |
| `DetailsTab.tsx` | Auto-resize textarea, Crunch Score moved here |
| `ContentTab.tsx` | Auto-resize textareas for all fields |
| `RulebookContentTab.tsx` | Auto-resize textareas, removed Crunch Score |
| `TaxonomyTab.tsx` | Auto-selection for ≥70% confidence AI suggestions |
| `SourcesTab.tsx` | Quick link icons, fixed Wikipedia fetch status |
| `TempImage.tsx` | Added 'wikipedia' source type |
| `/api/admin/upload/route.ts` | Added PUT endpoint for external image import |
| `auto-resize-textarea.tsx` | NEW - Auto-expanding textarea component |

---

### Earlier Session (2026-01-05) - Game Editor Update

**Game Editor Audit:**
- Audited game editor for missing VecnaGame fields (~40% were missing)
- Added comprehensive Sources tab for external data display
- Added Pipeline Status section to Details tab
- Removed legacy "Content Status" dropdown (replaced by Vecna state)
- Removed legacy "Generate Game Content" section (replaced by Vecna)

**New Sources Tab (read-only):**
| Section | Content |
|---------|---------|
| Overview | Status cards for BGG/Wikidata/Wikipedia connection |
| BoardGameGeek | ID, type, weight, rating, people, categories, mechanics, relations |
| Wikidata | ID, series ID, official website, CC-licensed image |
| Wikipedia | Article link, infobox, content sections, awards, external links, images |

**Pipeline Status Card (Details Tab):**
- Vecna state with color-coded badge
- Processing indicators (spinner/complete/blocked icons)
- Error display for pipeline failures
- Timestamps: Last Processed, Content Generated, Content Reviewed
- "Open in Vecna" quick link

**Legacy Content Removed:**
- "Generate Game Content" card (Vecna handles this now)
- "Content Status" dropdown (Vecna Pipeline Status replaces it)
- Unused imports and state variables

**Files Modified:**
| File | Changes |
|------|---------|
| `SourcesTab.tsx` | Created - comprehensive external data display |
| `DetailsTab.tsx` | Added Pipeline Status, removed Content Status dropdown |
| `GameEditor.tsx` | Added Sources tab to tabs list |
| `RulebookContentTab.tsx` | Removed generate content section |
| `game-editor/index.ts` | Export SourcesTab |

---

### Earlier Today - Vecna Bug Fixes

**Bug #1: Categories checklist not actionable**
- Added `href` prop to ChecklistItem component
- Unchecked Categories/Thumbnail items link to game editor

**Bug #2: Nested button hydration error**
- "button cannot be descendant of button" in ContentSection
- Fixed by restructuring CollapsibleTrigger and RegenerateButton as siblings

**Bug #3: Redundant family/game headers**
- Made VecnaFamilyHeader compact single-row layout
- Removed progress bar from family header (games show their own)

---

### Earlier Today - Vecna Phase 4 Complete

**Three-Column Review UI:**
- Source Data | AI Generated | Final Output (JSON editor)
- Per-section regeneration with model selector (Haiku/Sonnet/Opus)
- Publish flow: preview links, unpublish, enhanced confirmation
- Dark mode compatible

**New Components:**
- `ContentReviewPanel.tsx` - Three-column review with JSON editor
- `DataSourceBadge.tsx` - Shared badge for data provenance
- `/api/admin/vecna/[gameId]/content` - PATCH endpoint for content edits

---

## What's Live

### Core Features
- **35+ games** in database with full content
- **Game Directory** with filter sidebar, search, pagination
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
- **Vecna Pipeline** (`/admin/vecna`) - Complete 4-phase content pipeline
- **Game Editor** (`/admin/games/[id]`) - 5 tabs: Details, Taxonomy, Content, Sources, Images
- **Import Wizard** (`/admin/import`) - BGG game import with real-time progress
- Rulebook parsing + Crunch Score generation
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Wikidata enrichment during import

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
- User system: profiles, shelf, follows, activities
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions
- Taxonomy: themes, player experiences, source tracking
- **Vecna: processing states, family context**

---

## Next Steps

### Vecna Complete
All 4 phases implemented:
- Phase 1: Foundation (page, sidebar, state management)
- Phase 2: Automation (batch processing, rulebook discovery)
- Phase 3: Enhanced AI (family context, completeness report, model selector)
- Phase 4: Review UI (three-column, JSON editor, publish flow)

### Content Pipeline
- Process more game families through Vecna
- Upload CC-licensed images for all games
- Import more games via Wikidata skill
- Fill in missing primary publishers

### Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats
- Publisher partnerships for official data

---

## Archived Sessions

Older session details archived in `/docs/archive/phases/`:
- [PHASES-39-52.md](../archive/phases/PHASES-39-52.md) - Vecna implementation details
- [PHASES-35-38.md](../archive/phases/PHASES-35-38.md) - Earlier phases
- [PHASES-29-34.md](../archive/phases/PHASES-29-34.md) - Marketplace phases
- [PHASES-21-28.md](../archive/phases/PHASES-21-28.md) - User system phases
