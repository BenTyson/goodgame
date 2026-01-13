# Current Status

> Last Updated: 2026-01-12

## Current Phase: 73 - Admin Preview on Real Game Pages (COMPLETE)

### Session Summary (2026-01-12) - Admin Preview

**What was done:**
- Replaced outdated `/admin/games/[id]/preview` page with admin access to real `/games/[slug]` page
- Admins now see unpublished games on the actual game page with a subtle preview banner
- Banner shows "Preview" label, game name, "Unpublished" badge, and quick actions (Editor, Publish)
- Non-admins still get 404 for unpublished games
- Old preview URL redirects to new location for backward compatibility
- Unpublished games get `noindex, nofollow` robots directive

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/games/AdminPreviewBanner.tsx` | Frosted glass banner with Editor/Publish actions |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/game-queries.ts` | Added `getGameWithDetailsForAdmin()` - bypasses `is_published` filter |
| `src/lib/supabase/queries.ts` | Added export for new function |
| `src/components/games/index.ts` | Added barrel export for AdminPreviewBanner |
| `src/app/games/[slug]/page.tsx` | Admin check + fallback to admin query + renders banner |
| `src/components/admin/GameEditor.tsx` | Preview button now uses `/games/[slug]`, shows "View Live" or "Preview" based on publish state |
| `src/app/admin/(dashboard)/games/[id]/preview/page.tsx` | Converted to redirect |

**Build Status:** Passing

---

## Previous Phase: 72 - Wikipedia Family Enrichment Auto-Relations (COMPLETE)

### Session Summary (2026-01-12) - Wikipedia Family Enrichment

**What was done:**
- Created shared `family-enrichment.ts` module for Wikipedia→game_relations pipeline
- Auto-creates `game_relations` entries when Wikipedia enrichment runs (expansion_of, sequel_to, spin_off_of)
- Added auto-trigger in BGG importer: when game has family + Wikipedia URL, enrich family automatically
- 30-day throttle on auto-enrichment to avoid repeated API calls for same family
- Refactored `/api/admin/families/[id]/wikipedia` route to use shared module (eliminated code duplication)
- Code cleanup: consolidated RELATION_TYPE_CONFIG, shared orphan calculation, TreeErrorBoundary, fixed Dices icon

**New Files:**
| File | Purpose |
|------|---------|
| `src/lib/wikipedia/family-enrichment.ts` | Shared module for family enrichment (extraction, matching, relation creation) |
| `src/lib/families/orphan-calculation.ts` | Shared utility for calculating orphan games in families |
| `src/components/family-tree/TreeErrorBoundary.tsx` | Error boundary for family tree diagram rendering |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/wikipedia/index.ts` | Added exports for family-enrichment module |
| `src/app/api/admin/families/[id]/wikipedia/route.ts` | Refactored to use shared module, adds relation creation on link |
| `src/lib/bgg/importer.ts` | Added auto-trigger for family enrichment after game import |
| `src/types/database.ts` | Added RELATION_TYPE_CONFIG (consolidated from multiple files) |
| `src/components/admin/family-relations/use-orphan-games.ts` | Uses shared orphan calculation |
| `src/components/family-tree/use-tree-layout.ts` | Uses shared RELATION_TYPE_CONFIG |
| `src/components/admin/FamilyEditor.tsx` | Added TreeErrorBoundary, replaced Gamepad2 with Dices icon |

**Build Status:** Passing

---

## Previous Phase: 71 - Visual Family Tree + Refactoring (COMPLETE)

### Session Summary (2026-01-12) - Visual Family Tree

**What was done:**
- Fixed Wikipedia enrichment matching (family prefix + "&" vs "and" normalization)
- Created visual family tree diagram with SVG connectors and tier-based layout
- Tree hierarchy: Tier 0 (sequels/prequels), Tier 1 (base + standalones), Tier 2+ (expansions)
- Relation type styling: solid/dashed/dotted borders, colored badges
- Mobile fallback to list view
- Redesigned "Manage Relations" from cluttered arrows to clean table layout
- Added edit/delete functionality for existing relations
- Refactored 670-line FamilyTreeView.tsx into 8 modular files

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/family-tree/types.ts` | Tree layout types and relation styling constants |
| `src/components/family-tree/use-tree-layout.ts` | Layout calculation hook (tier/column positioning) |
| `src/components/family-tree/TreeNode.tsx` | Game card with image, name, relation badge |
| `src/components/family-tree/TreeConnector.tsx` | SVG curved path connectors |
| `src/components/family-tree/TreeLegend.tsx` | Relation type legend |
| `src/components/family-tree/FamilyTreeList.tsx` | Mobile fallback (collapsible list) |
| `src/components/family-tree/FamilyTreeDiagram.tsx` | Main visual tree component |
| `src/components/admin/family-relations/types.ts` | Types and constants for relation manager |
| `src/components/admin/family-relations/use-orphan-games.ts` | Hook for finding unlinked games |
| `src/components/admin/family-relations/use-relation-actions.ts` | CRUD operations hook |
| `src/components/admin/family-relations/UnlinkedGamesCard.tsx` | Orphan games UI |
| `src/components/admin/family-relations/ManageRelationsTable.tsx` | Relations table UI |
| `src/components/admin/family-relations/RelationDialog.tsx` | Shared create/edit dialog |
| `src/components/admin/family-relations/FamilyRelationsManager.tsx` | Main orchestrator |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/api/admin/families/[id]/wikipedia/route.ts` | Fixed game matching with family prefix and "&" normalization |
| `src/components/admin/FamilyEditor.tsx` | Integrated FamilyTreeDiagram, updated imports |

**Files Deleted:**
| File | Reason |
|------|--------|
| `src/components/admin/FamilyTreeView.tsx` | Replaced by modular family-relations/ components |

**Build Status:** Passing

---

## Previous Phase: 70 - Vecna Pipeline UI Cleanup (COMPLETE)

### Session Summary (2026-01-12) - Vecna Pipeline UI Cleanup

**What was done:**
- Removed Details tab entirely from VecnaGamePanel (all editing happens in Game Editor)
- Removed tab navigation UI (single Pipeline view now)
- Removed "Approve & Publish" button (publishing happens in Game Editor, not Vecna)
- Removed data status badges (Wikipedia/Wikidata/Rulebook/Content/Crunch)
- Simplified error display to critical errors only (removed percentage/recommendations)
- Reorganized reset actions into two clear groups: Data Refresh + Pipeline Resets
- Added "Reset to Start" nuclear option (returns game to `imported` state)
- Fixed `is_published` bug - was checking `vecna_state === 'published'` instead of `is_published` flag
- Fixed rulebook discovery for `imported` state games
- Added `maxDuration = 120` to upload routes for large PDFs

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` | Major cleanup: removed Details tab, tab navigation, Approve & Publish, data badges; simplified to single Pipeline view; reorganized reset actions |
| `src/app/admin/(dashboard)/vecna/components/VecnaFamilyHeader.tsx` | Fixed published count to use `is_published` flag instead of `vecna_state` |
| `src/app/admin/(dashboard)/vecna/components/FamilyBatchActions.tsx` | Same `is_published` fix |
| `src/app/api/admin/rulebook/upload/route.ts` | Added `maxDuration = 120` for large file uploads |
| `src/app/api/admin/game-documents/route.ts` | Increased `maxDuration` from 60 to 120 |

**Build Status:** Passing

---

## Previous Phase: 69 - Supplementary Game Documents (COMPLETE)

### Session Summary (2026-01-12) - Supplementary Documents

**What was done:**
- Added supplementary PDF document uploads to admin game editor (Documents tab)
- Document types: Gameplay Guide, Glossary, Icon Overview, Setup Guide, FAQ, Misc
- Official Rulebook remains special (keeps parsing, Crunch Score) in separate section
- Created `GameDocumentsCard` for public game page sidebar
- Added Resources block to Overview, How to Play, and Setup tabs
- Styling: teal icons, uppercase titles with letter spacing, type labels (not filenames)

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00072_game_documents.sql` | Database schema with `document_type` enum and `game_documents` table |
| `src/app/api/admin/game-documents/route.ts` | API endpoint for upload/list/delete documents |
| `src/components/admin/game-editor/DocumentRow.tsx` | Display row for uploaded document with delete |
| `src/components/admin/game-editor/SupplementaryDocumentsSection.tsx` | Upload UI with type selector |
| `src/components/admin/game-editor/DocumentsTab.tsx` | Renamed from RulebookTab, adds supplementary docs section |
| `src/components/games/GameDocumentsCard.tsx` | Public sidebar component showing resources |
| `src/lib/upload/validation.ts` | PDF validation utilities (magic bytes, secure filenames) |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Added `DocumentType`, `DOCUMENT_TYPE_LABELS`, `GameDocument` types |
| `src/components/admin/GameEditor.tsx` | Renamed Rulebook tab to Documents, updated icon |
| `src/components/admin/game-editor/index.ts` | Updated exports for DocumentsTab |
| `src/lib/supabase/queries.ts` | Added `getGameDocuments()` query |
| `src/app/games/[slug]/page.tsx` | Pass `gameDocuments` to Overview, Rules, Setup tabs |
| `src/components/games/tabs/OverviewTab.tsx` | Added GameDocumentsCard to sidebar |
| `src/components/games/tabs/RulesTab.tsx` | Added `gameDocuments` prop, GameDocumentsCard to sidebar |
| `src/components/games/tabs/SetupTab.tsx` | Added `gameDocuments` prop, GameDocumentsCard to sidebar |
| `src/middleware.ts` | Excluded upload routes from middleware matcher |
| `next.config.ts` | Added `serverActions.bodySizeLimit: '50mb'` for large PDFs |

**Build Status:** Passing

---

## Previous Phase: 68 - Auth System Fix + Vibes UI (COMPLETE)

### Session 4 (2026-01-11) - Vibes Rating Flow Fixes

**What was done:**
- Added delete rating functionality to `RatingFollowUpDialog` (trash icon button)
- Fixed bug where rating from hero section didn't show follow-up dialog
- HeroRating now triggers the same dialog flow as VibesTab
- Moved Vibes tab to appear after Setup tab in game page order

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/ratings/RatingFollowUpDialog.tsx` | Added `onDelete` prop, `isEditing` prop, delete button with destructive styling |
| `src/components/ratings/HeroRating.tsx` | Added dialog state, handlers for save/skip/delete, renders RatingFollowUpDialog |
| `src/components/games/GameHero.tsx` | Added `gameName` prop to HeroRating |
| `src/components/vibes/VibesTab.tsx` | Added `handleDeleteRating`, passes `onDelete` and `isEditing` to dialog |
| `src/lib/auth/AuthContext.tsx` | Fixed build error (replaced invalid `.abortSignal()` with `Promise.race`) |
| `src/app/games/[slug]/page.tsx` | Reordered tabs: Overview → How to Play → Setup → Vibes → Score Sheet |

**Build Status:** Passing

---

### Session 3 (2026-01-11) - Root Cause Found and Fixed

**Status: FIXED** - Auth system rebuilt with proper library alignment.

**Root Cause Identified:**
Library mismatch between browser and server clients:
- Browser client (`client.ts`) was using `@supabase/supabase-js` which stores sessions in **localStorage**
- Server/middleware was using `@supabase/ssr` which stores sessions in **cookies**
- When middleware refreshed tokens and wrote to cookies, the browser client never saw them (it was looking in localStorage)
- Session state diverged after refreshes, breaking auth

**Why Previous Fixes Failed:**
Session 2 tried switching to `@supabase/ssr` but didn't clear stale localStorage data from the old client. The conflicting auth state caused `getSession()` to hang.

**The Fix:**
1. **`client.ts`** - Switched from `@supabase/supabase-js` to `@supabase/ssr`'s `createBrowserClient`
   - Sessions now use cookies, matching server/middleware
   - Removed problematic singleton pattern

2. **`AuthContext.tsx`** - Added robustness improvements:
   - Added `cleanupLegacyStorage()` to clear stale localStorage auth data on mount
   - Fixed initialization order: `onAuthStateChange` now set up BEFORE `getSession()`
   - Added 3-second timeout safety net to prevent infinite loading states
   - Added try-catch to all async operations to prevent silent failures
   - Added React Strict Mode double-initialization guard

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/client.ts` | Switched to `@supabase/ssr`, removed singleton |
| `src/lib/auth/AuthContext.tsx` | Added localStorage cleanup, fixed init order, added error handling |

**Build Status:** Passing

**Testing Completed:**
- Fresh login via Google OAuth - works
- Persistence across 10+ page refreshes - works
- Persistence across dev server restart - works
- Multi-tab sync - works
- `sb-*` cookies present, localStorage empty - confirmed

**Other work from earlier sessions:**
- Created `RatingFollowUpDialog.tsx` for post-rating flow (shelf status + thoughts)
- Updated `RatingPopover.tsx` with `onRatingSaved` callback
- Removed "Your Thoughts" section from VibesTab (now in dialog)

---

## Previous Phase: 67 - Vibes Rating System

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00070_game_vibe_stats.sql` | Materialized view for pre-computed rating stats |
| `supabase/migrations/00071_vibe_functions.sql` | Database functions for vibe queries |
| `src/lib/supabase/vibe-queries.ts` | Query functions for vibes (stats, pagination, friends) |
| `src/components/vibes/VibeDistribution.tsx` | 10-dice row with proportional sizing based on votes |
| `src/components/vibes/VibeCard.tsx` | Individual vibe card with D10 badge and thoughts |
| `src/components/vibes/VibeStatsCard.tsx` | Large 3D sphere showing "The Vibe" average |
| `src/components/vibes/VibeFilters.tsx` | Sort/filter controls for vibes feed |
| `src/components/vibes/FriendsVibes.tsx` | Friends' vibes callout with stacked avatars |
| `src/components/vibes/VibesTab.tsx` | Main tab component with 2-column layout |
| `src/components/vibes/index.ts` | Barrel exports for vibes components |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Added vibe types (GameVibeStats, VibeWithUser, VIBE_COLORS, etc.) |
| `src/components/games/GamePageTabs.tsx` | Added Sparkles icon to icon map |
| `src/app/games/[slug]/page.tsx` | Integrated Vibes tab with data fetching |
| `src/lib/auth/AuthContext.tsx` | Major rewrite for auth debugging (see above) |
| `src/app/login/LoginContent.tsx` | Debug logging added |

**Build Status:** Compiled successfully (auth broken at runtime)

---

## What's Live

### Core Features
- **35+ games** in database with full content
- **Game Directory** with filter sidebar, search, pagination
- **Game Pages** with comprehensive data display (categories, mechanics, themes, experiences, complexity, relations)
- **D10 Sphere Rating** in hero section - 3D marble-style 1-10 rating with auth gating
- **Vibes Tab** - Social ratings with distribution visualization, friends' vibes, thoughts
- **Awards display** in hero section with expandable list
- **"Buy on Amazon" button** in hero section (when ASIN available)
- **Expandable sections** for mechanics, credits, and other overflow content
- **Rules Summaries**, **Score Sheets** (PDF), **Quick Reference**
- **Your Shelf** - Track owned/wanted/played games with ratings
- **User Profiles** at `/u/[username]` with Top 10 games, insights, badges
- **Following System** + Activity Feed at `/feed`
- **Recommendation Engine** at `/recommend`

### Marketplace
- Full buy/sell/trade system with listings, messaging, offers
- Stripe Connect payments with escrow
- Reputation/feedback system

### Admin
- **Vecna Pipeline** (`/admin/vecna`) - 4-phase content pipeline, 2-tab game panel (Pipeline + Details)
- **Game Editor** (`/admin/games/[id]`) - 7 tabs: Details, Taxonomy, Rulebook, Content, Sources, Media, Purchase
- **Import Wizard** (`/admin/import`) - BGG game import with relation management and real-time progress
- Rulebook parsing + Crunch Score generation
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Parallel enrichment with Wikidata + Wikipedia + Wikimedia Commons
- YouTube video management with type categorization (overview/gameplay/review)
- **Awards sync** from Wikipedia to normalized `game_awards` table
- **ASIN enrichment** from Wikidata with name-search fallback + manual entry
- **Purchase links management** - Global retailers table with URL patterns, per-game links in Purchase tab

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

71 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions
- Taxonomy: themes, player experiences, source tracking
- **Vecna: processing states, family context**

---

## Next Steps

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
- [PHASES-58-65.md](../archive/phases/PHASES-58-65.md) - Game pages rebuild, tabbed UX, ratings, purchase links
- [PHASES-53-57.md](../archive/phases/PHASES-53-57.md) - Parallel enrichment, Admin UI cleanup, Vecna UI overhaul
- [PHASES-39-52.md](../archive/phases/PHASES-39-52.md) - Vecna implementation details
- [PHASES-35-38.md](../archive/phases/PHASES-35-38.md) - Earlier phases
- [PHASES-29-34.md](../archive/phases/PHASES-29-34.md) - Marketplace phases
- [PHASES-21-28.md](../archive/phases/PHASES-21-28.md) - User system phases
