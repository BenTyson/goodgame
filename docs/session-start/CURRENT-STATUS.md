# Current Status

> Last Updated: 2026-01-07 (Parallel Enrichment & Commons Integration)

## Current Phase: 57 - Import Pipeline Optimization

Added Wikimedia Commons as a direct image source and implemented parallel enrichment fetching for 3x faster game imports.

### Session Summary (2026-01-07) - Parallel Enrichment & Commons Integration

**Wikimedia Commons Integration:**
- New module: `src/lib/wikimedia-commons/` for direct Commons API access
- Search Commons independently (not just via Wikidata P18 property)
- Finds CC-licensed images that aren't linked in Wikipedia articles
- Admin UI: "Search Commons" card in Game Editor Images tab
- API endpoint: `GET /api/admin/commons/search?q=game+name`

**Parallel Enrichment Pipeline:**
- New module: `src/lib/enrichment/` orchestrates parallel fetching
- **Before**: Sequential BGG → Wikidata → Wikipedia (~3-5s per game)
- **After**: Parallel Wikidata | Wikipedia | Commons (~1-1.5s per game)
- Single database update instead of multiple round-trips
- Graceful fallback: if Wikipedia fails but Wikidata has URL, retries
- Timing metrics logged for performance monitoring

**Import Pipeline Changes:**
- Replaced `enrichGameFromWikidata()` with `enrichGameParallel()`
- Commons images discovered during import (logged for admin selection)
- Vecna state determined from enrichment result (no extra DB fetch)
- Family/sequel relations still handled after parallel fetch

**BGA Integration Research:**
- Investigated Board Game Arena as data source
- **Decision: Not recommended** - ToS prohibits scraping, no public API
- Unique BGA data (play counts, actual duration) is nice-to-have, not essential
- Alternative: Official partnership outreach or user-submitted data

**Files Created:**
| File | Purpose |
|------|---------|
| `src/lib/wikimedia-commons/types.ts` | TypeScript types for Commons API |
| `src/lib/wikimedia-commons/client.ts` | Rate-limited Commons API client |
| `src/lib/wikimedia-commons/index.ts` | Barrel export |
| `src/lib/enrichment/parallel.ts` | Parallel enrichment orchestrator |
| `src/lib/enrichment/index.ts` | Barrel export |
| `src/app/api/admin/commons/search/route.ts` | Admin API for Commons search |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/admin/GameEditor.tsx` | Added Commons search UI in Images tab |
| `src/lib/bgg/importer.ts` | Replaced sequential with parallel enrichment |

**Performance Impact:**
```
Import enrichment: ~3-5s → ~1-1.5s per game (2-3x faster)
New image source: Commons adds 5-15 CC images per popular game
```

---

## Previous Phase: 56 - Admin Games UI/UX Cleanup

Extended the Vecna UI/UX patterns to the Game Editor tabs. Unified iconography, consolidated redundant cards, established typography hierarchy.

### Session Summary (2026-01-07) - Admin Games UI/UX Cleanup

**Design System:**
- **Icon colors**: All decorative icons now use `bg-primary/10 text-primary` (teal)
- **Label typography**: Form labels use `uppercase tracking-wider text-xs text-primary`
- **Block headers**: CardDescription uses `uppercase tracking-wider text-xs` (no teal)
- **Card titles**: All CardTitle elements use `uppercase`
- **Section dividers**: `border-t-4 border-primary/30` (4px teal at 30% opacity)

**DetailsTab Consolidation:**
- Combined Identity + Players & Time + Metadata into one "Game Details" card
- Combined Visibility + Collection Tags into one "Visibility & Tags" card (4-column grid)
- Removed redundant section header text (Players & Time, Metadata)

**RulebookTab Cleanup:**
- Removed AI Content Extraction section (parsing now exclusively in Vecna)
- Combined Extracted Components + Parsed Text into single "Rulebook Content" card
- Components displayed as compact inline tags
- Publisher buttons with primary highlight for `is_primary` publisher

**Admin Pages Removed:**
- Deleted `/admin/wikidata` page (functionality now in Import + Vecna)
- Deleted `/admin/queue` page (functionality now in Vecna pipeline)
- Updated sidebar navigation to remove links
- Updated dashboard to remove queue stats card

**Files Modified:**
| File | Changes |
|------|---------|
| `DetailsTab.tsx` | Consolidated cards, typography hierarchy, dividers |
| `TaxonomyTab.tsx` | Section header styling |
| `RulebookTab.tsx` | Removed parse section, consolidated content card |
| `RulebookUrlSection.tsx` | Publisher buttons, removed validate/discover |
| `ContentTab.tsx` | Typography styling |
| `SourcesTab.tsx` | Icon colors, styling |
| `AdminSidebar.tsx` | Removed queue/wikidata nav links |
| `admin/page.tsx` | Removed queue stats, Import Queue card |
| `games/[id]/page.tsx` | Query includes `is_primary` for publisher ordering |

---

## Previous Phase: 55 - Vecna UI/UX Overhaul

Transformed Vecna from a cluttered workbench into a clean Pipeline Dashboard. Focus on status overview and batch processing; editing happens in Game Editor.

### Session Summary (2026-01-06) - Vecna UI/UX Overhaul

**Design Changes:**
- **Button hierarchy**: Ghost buttons by default, solid only for Publish
- **Color fix**: Orange for "recommended" status (was confusing blue)
- **Removed Review tab**: Now just Pipeline | Details (editing in Game Editor)
- **Model selector timing**: Only shows before generation, not after
- **Compact status card**: Replaced verbose CompletenessReport with collapsible summary
- **Segmented controls**: Phase filters and model selector use subtle selected states

**New Files Created:**
| File | Purpose |
|------|---------|
| `src/lib/vecna/ui-theme.ts` | Centralized STATUS_COLORS and IMPORTANCE_COLORS with dark mode |
| `src/app/admin/(dashboard)/vecna/components/CompactStatusCard.tsx` | Single-line collapsible status summary |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/vecna/completeness.ts` | Blue → orange for "recommended", dark mode support |
| `src/lib/vecna/index.ts` | Export ui-theme |
| `VecnaGamePanel.tsx` | Removed Review tab, ghost buttons, model selector timing fix |
| `VecnaFamilySidebar.tsx` | Ghost filter buttons with subtle selected state |
| `VecnaFamilyHeader.tsx` | Dark mode badges |
| `RulebookDiscovery.tsx` | Outline button variants, dark mode |
| `CompletenessReport.tsx` | Orange for recommended, dark mode throughout |

---

### Earlier Session (2026-01-06) - Vecna Auto-Process

**Vecna Auto-Process Feature:**
- New SSE streaming endpoint: `/api/admin/vecna/auto-process`
- Chains parse → taxonomy → generate automatically
- Real-time progress modal with step tracking
- Model selector (Haiku/Sonnet/Opus) before processing
- Works for both single games and family batches
- Cancel button to abort mid-process

**Parsed Text Viewer Improvements:**
- Now shows structured sections instead of raw text wall
- Each section displays: title, type badge, word count
- Content preview (truncated at 1000 chars per section)
- Falls back to raw text for older parses without structured data
- Copy button exports formatted markdown with section headers

**Database Fix:**
- Applied migration `00063_structured_parsed_text.sql`
- Added `parsed_text_structured` column to `rulebook_parse_log`
- Stores categorized/cleaned rulebook sections for AI Q&A

**Files Created:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/vecna/auto-process/route.ts` | SSE streaming auto-process endpoint |
| `src/app/admin/(dashboard)/vecna/components/AutoProcessModal.tsx` | Progress modal with step tracking |

**Files Modified:**
| File | Changes |
|------|---------|
| `VecnaGamePanel.tsx` | Added Auto Process button, useEffect state sync fix |
| `VecnaFamilyHeader.tsx` | Added model selector, Auto Process menu item |
| `RulebookParseSection.tsx` | Structured sections display, section badges |

---

### Earlier Session (2026-01-06) - Rulebook Tab & Import Enhancements

**Game Editor - New Rulebook Tab (6 tabs total):**
- Created new `RulebookTab.tsx` with parsed text viewer
- Tab order: Details, Taxonomy, Rulebook, Content, Sources, Images
- Parsed text viewer with "Full Text" and "By Section" modes
- Section categorization (overview, components, setup, gameplay, etc.)
- Collapsible sections with copy buttons and word counts

**Import Page Enhancements:**
- Relations now show actual game names (not just "+7" counts)
- Collapsible RelationSection components for expansions/base games/reimplementations
- Click X to exclude games, Undo to restore
- Excluded games respected during import execution
- "Go to Vecna" button added to ImportReport as primary action

**Vecna Improvements:**
- Added "Re-sync BGG" button in Reset State section
- New API endpoint: `/api/admin/games/[id]/sync-bgg`
- Re-syncs BGG data and re-runs category/theme mappings
- Removed redundant "Next Action" card wrapper (kept action button)

**Category Import Fix:**
- Fixed `BGG_CATEGORY_MAP` slugs to match database
- Was: 'family-games', 'party-games', etc.
- Now: 'family', 'party', etc. (matching actual DB slugs)
- Added missing mappings: Animals, Environmental, Zombies, etc.

**Files Created:**
| File | Purpose |
|------|---------|
| `src/components/admin/game-editor/RulebookTab.tsx` | Rulebook management + parsed text viewer |
| `src/app/api/admin/games/[id]/sync-bgg/route.ts` | Re-sync BGG data endpoint |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/admin/GameEditor.tsx` | Added 6th tab (Rulebook), updated grid |
| `src/components/admin/game-editor/index.ts` | Export RulebookTab |
| `src/app/api/admin/import/analyze/route.ts` | Return `relationsDetail` with game data |
| `src/app/api/admin/import/execute/route.ts` | Respect `excludedBggIds` |
| `src/components/admin/import/ImportWizard.tsx` | Added RelationGame type, excludedBggIds |
| `src/components/admin/import/ImportPreview.tsx` | RelationSection components |
| `src/components/admin/import/ImportInput.tsx` | Pass excludedBggIds |
| `src/components/admin/import/ImportReport.tsx` | Added "Go to Vecna" button |
| `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` | Re-sync BGG button, removed redundant wrapper |
| `src/lib/config/bgg-mappings.ts` | Fixed category slugs |

---

### Session Summary (2026-01-05) - Game Editor Cleanup

**Game Editor (6 tabs):**
- Removed Relations tab (outdated, relations managed in Vecna/Families)
- Setup Wizard files deleted (replaced by Vecna pipeline)
- Game Editor tabs: Details, Taxonomy, Rulebook, Content, Sources, Images

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
- **Vecna Pipeline** (`/admin/vecna`) - 4-phase content pipeline, 2-tab game panel (Pipeline + Details)
- **Game Editor** (`/admin/games/[id]`) - 6 tabs: Details, Taxonomy, Rulebook, Content, Sources, Images
- **Import Wizard** (`/admin/import`) - BGG game import with relation management and real-time progress
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

### Completed Infrastructure
- **Vecna Pipeline**: All 4 phases (Foundation, Automation, Enhanced AI, Review UI)
- **Parallel Enrichment**: 3x faster imports with Wikidata + Wikipedia + Commons
- **Commons Integration**: Direct CC-licensed image search

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
- [PHASES-39-52.md](../archive/phases/PHASES-39-52.md) - Vecna implementation details
- [PHASES-35-38.md](../archive/phases/PHASES-35-38.md) - Earlier phases
- [PHASES-29-34.md](../archive/phases/PHASES-29-34.md) - Marketplace phases
- [PHASES-21-28.md](../archive/phases/PHASES-21-28.md) - User system phases
