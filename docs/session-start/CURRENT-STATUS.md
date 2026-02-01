# Current Status

> Last Updated: 2026-01-31

## Current Phase: 97 - Puffin AI Content Frontend (COMPLETE)

### Session Summary (2026-01-31) - Puffin AI Content Frontend

**What was done:**

**Game Page -- Surface Puffin Content:**
- About section now falls back through `wikipedia_summary` -> `puffin_content.description` -> nothing
- Added Quick Start section (Rocket icon) showing `puffinContent.quickStart` after About
- Added Strategy Tips section (Lightbulb icon, collapsible, open by default) after How It Plays
- Added Teaching Script section (GraduationCap icon, collapsible, collapsed by default) after Strategy Tips
- GameHero tagline now falls back to `puffinContent.tagline` when `game.tagline` is empty

**Admin -- Puffin Tab in Game Editor:**
- Created dedicated Puffin tab (8th tab) in admin game editor with Sparkles icon
- Overview card with field count, completeness %, progress bar, last updated, model metadata
- All 22 content fields displayed in 5 groups: Core, Play Modes, Player Experience, Teaching & Tips, Context
- Each field shows green check or gray indicator for present/missing status
- Removed Puffin collapsible section from Sources tab (overview status card remains)

**Admin -- Enrichment Badges & Dashboard:**
- Added amber "C" badge to EnrichmentBadges showing "Has AI content (X/22 fields)"
- Puffin browser passes content status through to badges
- Puffin API route now returns `hasPuffinContent` and `puffinContentFieldCount`
- Dashboard Content Pipeline card shows "AI Content" count with Sparkles icon

**Bug Fix:**
- Fixed `new URL()` crash in SourcesTab Wikipedia external links when URL is malformed

**Content Sync:**
- Ran one-shot sync script pulling content from Puffin API into games table
- 3 games updated with 22/22 fields: Ark Nova, Brass: Birmingham, Dune: Imperium

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/admin/game-editor/PuffinTab.tsx` | Dedicated admin tab showing all 22 Puffin AI content fields |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/games/tabs/OverviewTab.tsx` | About fallback to puffin description, Quick Start/Strategy Tips/Teaching Script sections |
| `src/components/games/GameHero.tsx` | Tagline fallback from puffin_content |
| `src/components/admin/import/EnrichmentBadges.tsx` | Added "C" badge for AI content |
| `src/app/api/admin/puffin/games/route.ts` | Added puffin_content_completeness to query, hasPuffinContent/fieldCount in response |
| `src/components/admin/import/PuffinBrowser.tsx` | Passes content status to EnrichmentBadges |
| `src/components/admin/game-editor/SourcesTab.tsx` | Removed Puffin collapsible section (kept overview card), fixed URL crash |
| `src/components/admin/game-editor/index.ts` | Added PuffinTab export |
| `src/components/admin/GameEditor.tsx` | Added Puffin tab (8th tab), Sparkles icon import |
| `src/app/admin/(dashboard)/page.tsx` | Added puffin_content to stats query, AI Content count in pipeline card |

**Build Status:** Passing

---

## Previous Phase: 96 - Production Vecna Testing & Fixes (COMPLETE)

### Session Summary (2026-01-25) - Production Testing & Bug Fixes

**What was done:**

**Rulebook Upload Memory Fix:**
- Fixed "Failed to fetch" error when uploading large PDFs on production
- Implemented direct-to-Supabase upload using signed URLs (bypasses server memory)
- New 3-step flow: Server generates signed URL → Client uploads directly to storage → Server confirms and updates DB
- No longer buffers entire file in server memory

**AI Content Generation Fixes:**
- Fixed "Invalid JSON response: I notice that..." errors during expansion processing
- Strengthened system prompt to forbid conversational responses
- Added detection for conversational text before JSON parsing
- Clearer error messages when AI fails to return JSON

**Wikipedia Content Cleanup:**
- Removed `[ edit ]` artifacts from Wikipedia extracts
- Decoded HTML entities (`&#91;` → `[`, `&#93;` → `]`)
- Cleaned citation markers with spaces: `[ 1 ]`, `[ 2 ]`
- Removed `[citation needed]` markers

**GameCard Simplification:**
- Removed hover overlay with Rules/Setup/Ref quick action buttons
- Removed BGG weight score display
- Reduced padding throughout for tighter layout

**Other Fixes:**
- Added `YOUTUBE_API_KEY` missing from Railway (user action)
- Fixed game page 500 errors for unpublished games (`force-dynamic` export)

**New Files:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/rulebook/signed-url/route.ts` | Generate signed URL for direct upload |
| `src/app/api/admin/rulebook/confirm/route.ts` | Confirm upload and update game record |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/admin/(dashboard)/vecna/components/discovery/QuickRulebookPopover.tsx` | Use 3-step direct upload flow |
| `src/app/admin/(dashboard)/vecna/components/RulebookDiscovery.tsx` | Use 3-step direct upload flow |
| `src/middleware.ts` | Exclude all `/api/admin/rulebook` routes |
| `src/lib/ai/claude.ts` | Added conversational response detection |
| `src/lib/rulebook/prompts.ts` | Strengthened JSON-only requirements |
| `src/lib/utils/wikipedia.ts` | Added HTML entity decoding, citation cleanup |
| `src/lib/wikipedia/index.ts` | Clean [edit] and citations from fetched content |
| `src/lib/wikipedia/sections.ts` | Clean [edit] and citations from section extraction |
| `src/components/games/GameCard.tsx` | Removed hover overlay, BGG weight, reduced padding |
| `src/app/games/[slug]/page.tsx` | Added `force-dynamic` for cookie-based admin checks |

**Build Status:** Passing

---

## Previous Phase: 95 - Admin Users Page (COMPLETE)

### Session Summary (2026-01-22) - Admin Users Management

**What was done:**
- Created `/admin/users` page for managing user accounts and activity
- Filter tabs: All, Admin, Active (30 days), Inactive, Sellers
- Search by username/display_name with pagination (60 items/page)
- UserTable component with avatar, name, role badge, games count, followers, last active
- UserDetailPanel slide-out sheet with:
  - User header (avatar, name, role, location, joined date)
  - Activity stats grid (games, ratings, reviews, followers, following, last active)
  - Shelf breakdown (owned, want_to_buy, want_to_play, wishlist, previously_owned)
  - Marketplace stats for sellers (sales, purchases, rating, Stripe status)
  - Social links section
  - Admin actions: View Profile, Toggle Admin Role (with confirmation dialog)
- API route for user detail fetching and role updates

**New Files:**
| File | Purpose |
|------|---------|
| `src/lib/supabase/admin-user-queries.ts` | Query functions: getAdminUsers, getAdminUserCounts, getAdminUserDetail, updateUserRole |
| `src/app/admin/(dashboard)/users/page.tsx` | Server component with filters, search, pagination |
| `src/app/admin/(dashboard)/users/components/UserTable.tsx` | Client table component with clickable rows |
| `src/app/admin/(dashboard)/users/components/UserDetailPanel.tsx` | Sheet component with full user details |
| `src/app/api/admin/users/[id]/route.ts` | GET user detail, PATCH role update |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Added Users nav item with UserCog icon |

**Build Status:** Passing

---

## Previous Phase: 94 - Vecna Processing UX Fixes (COMPLETE)

### Session Summary (2026-01-22) - Processing Tab UX & Expansion Handling

**What was done:**

**Processing Tab UX Improvements:**
- Fixed game name truncation in sidebar - now wraps text instead of truncating
- Added `imported` state to Auto Process button visibility (games with rulebooks can now auto-process from imported state)
- Updated imported state action to show "Parse Rulebook" when rulebook exists (skips pointless "enriched" step)
- Changed state labels from completion-based to action-oriented:
  - "Imported/Enriched" → "Needs Processing"
  - "Categorized" → "Needs Generation"
  - "Generated" → "Ready to Publish"
  - Labels now indicate what action is needed, not what was done

**Expansion Content Handling:**
- Updated AI prompts to handle minimal expansion rulebooks (those that say "same rules as base game")
- Prompts now instruct AI to use base game context when expansion rulebook is minimal
- Fixed aggressive expansion state reset - now only sets warning flag instead of resetting state
- Before: Base game regeneration would reset expansions to `taxonomy_assigned` (confusing)
- After: Base game regeneration sets error message "consider regenerating" but preserves state and content

**Discovery Tab Improvements:**
- Added error icon indicator on game cards when `vecna_error` is set
- Hover tooltip shows the error message

**Admin Games List Improvements:**
- Replaced BGG reference image fallback with `PlaceholderGameImage` component (gradient + initials)
- Added `hideComingSoon` prop to PlaceholderGameImage for admin context (hides "Image Coming Soon" text)
- Published status badge: now shows just green checkmark icon (removed text, more prominent)
- Hidden badge entirely for games with "none" or empty content status
- Removed unused `Dices` icon import from GameCard

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/admin/(dashboard)/vecna/components/processing/ProcessingTab.tsx` | Kept sidebar at w-80 (not widened) |
| `src/app/admin/(dashboard)/vecna/components/processing/ProcessingQueue.tsx` | Removed `truncate`, added `leading-tight` for text wrapping |
| `src/app/admin/(dashboard)/vecna/components/processing/ProcessingPanel.tsx` | Added `imported` to Auto Process, updated getNextAction for imported+rulebook |
| `src/app/admin/(dashboard)/vecna/components/discovery/GameDiscoveryCard.tsx` | Updated state labels, added error icon |
| `src/lib/vecna/types.ts` | Updated VECNA_STATE_CONFIG labels to action-oriented |
| `src/lib/vecna/context.ts` | Updated expansion note to handle minimal rulebooks |
| `src/lib/rulebook/prompts.ts` | Updated rules/setup/reference prompts for minimal expansion rulebooks |
| `src/app/api/admin/rulebook/generate-content/route.ts` | Changed expansion invalidation to warning-only (preserves state) |
| `src/components/admin/GameCard.tsx` | Replaced BGG/dice fallback with PlaceholderGameImage, updated status badges |
| `src/components/games/PlaceholderGameImage.tsx` | Added `hideComingSoon` prop |

**Build Status:** Passing

---

## Previous Phase: 93 - Taxonomy System Audit & Implementation (COMPLETE)

### Session Summary (2026-01-21) - Taxonomy Improvements

**What was done:**

**Phase 1: Enable New Taxonomy Suggestions**
- Updated AI prompt to enable `newSuggestions` with confidence calibration (0.9+ = perfect, 0.7-0.9 = strong, etc.)
- Added "Create & Apply" UI in TaxonomySelector for new_theme/new_experience suggestions
- Created API endpoint (`/api/admin/games/taxonomy/create`) to create new taxonomy from suggestions
- Parse route already handled newSuggestions storage (verified existing implementation)

**Phase 2: BGG Unmapped Logging**
- Added `trackUnmappedBGGTags()` function to log unmapped BGG categories during import
- Created `bgg_unmapped_tags` tracking table with occurrence counts and example BGG IDs
- Console logs now show which BGG categories didn't map to our taxonomy

**Phase 3: Expand Static Mappings**
- Added theme mappings: Prehistoric, Trains, Transportation, Sports, Educational, Pop-culture, Literary
- Added experience mappings: Dexterity (Action/Dexterity, Flicking, Stacking), Memory, Real-time (Speed, Pattern Recognition)

**Phase 4: Source Tracking**
- Added `source` column to `game_player_experiences` (was missing from migration 00061)
- Updated all taxonomy inserts to include source: 'bgg' (importer), 'ai' (Vecna), 'manual' (admin)
- Backfill marks existing records as 'legacy'

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00094_bgg_unmapped_tracking.sql` | Track unmapped BGG tags with counts |
| `supabase/migrations/00095_player_experience_source.sql` | Add source column to player experiences |
| `src/app/api/admin/games/taxonomy/create/route.ts` | Create new taxonomy from AI suggestions |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/rulebook/prompts.ts` | Updated taxonomy prompt to enable newSuggestions with confidence guidance |
| `src/components/admin/game-editor/TaxonomySelector.tsx` | Added new taxonomy suggestion UI with Create & Apply |
| `src/components/admin/game-editor/TaxonomyTab.tsx` | Added handlers for newly created taxonomy items |
| `src/lib/bgg/importer.ts` | Added unmapped tag tracking, source='bgg' to inserts |
| `src/lib/config/bgg-mappings.ts` | Expanded theme and experience mappings |
| `src/app/api/admin/games/taxonomy/route.ts` | Added source='manual' to all taxonomy inserts |

**Build Status:** Passing

---

## Previous Phase: 92 - Vecna Pipeline & Content Quality (COMPLETE)

### Session Summary (2026-01-21) - Pipeline Fixes + Content Quality System

**What was done:**

**Part 1: Pipeline Issues (8 of 9 fixed)**
- Issue 2: Fixed published expansions reset on cascade (removed 'published' from reset list)
- Issue 8: Added warning when PDF re-parsed in generate step
- Issue 7: Consolidated duplicate `shouldSkipGame()` implementations into shared utility
- Issue 4: Added expansion detection utilities (`getExpansionGameIds()`, `getExpansionInfo()`, `getExpansionsOfGame()`)
- Issue 3: Consolidated 3 duplicate family context builders into `buildFamilyContextFromDb()`
- Issue 5: Added pre-check for stale family context when processing families
- Issue 1: `runTaxonomyStep()` now auto-accepts high-confidence (≥70%) suggestions to junction tables
- Issue 9: Added processing locks to prevent concurrent family processing (30-min expiry)
- Issue 6 (skipped): Transaction safety deferred as optional high-effort item

**Part 2: Wikipedia Storage Enhancements**
- Added 8 new columns for comprehensive Wikipedia data capture
- Updated section extraction to capture variants, strategy, components, lead, legacy sections
- Full article text now stored for complete context during content generation

**Part 3: Prompt Reframing as "Quick Start Guides"**
- Rewrote rules prompts with teaching mindset (vs dry rulebook condensation)
- Added `whatMakesThisSpecial` section (hook, bestMoments, perfectFor, notFor)
- Added `atAGlance` section (goal, onYourTurn, gameEnds, youWin)
- Added `teachingTips` section (openingExplanation, startWithThis, saveForLater)
- Added `complexityNote` for heavy games (>15 pages or >4000 words)

**Part 4: Quality Validation System**
- Created quality.ts with validation functions for rules/setup/reference content
- AI artifact detection (catches "I'll", "Let me", "As an AI", etc.)
- Placeholder detection (catches [brackets], <angles>, TODO, TBD, etc.)
- Quality scoring 0-100 with pass/fail based on errors
- Created validation API endpoint at `/api/admin/vecna/[gameId]/validate`

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00092_processing_lock.sql` | Processing lock columns and RPC functions |
| `supabase/migrations/00093_wikipedia_enhanced_storage.sql` | Enhanced Wikipedia storage columns |
| `src/lib/vecna/quality.ts` | Content quality validation with AI artifact detection |
| `src/app/api/admin/vecna/[gameId]/validate/route.ts` | Validation API endpoint |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/vecna/processing.ts` | Added `runTaxonomyStep()`, `shouldSkipGame()`, lock functions |
| `src/lib/vecna/queries.ts` | Added expansion detection utilities |
| `src/lib/vecna/context.ts` | Added `buildFamilyContextFromDb()` |
| `src/lib/wikipedia/sections.ts` | Extended section extraction (variants, strategy, components) |
| `src/lib/wikipedia/types.ts` | Extended `WikipediaSections` with new fields |
| `src/lib/wikipedia/index.ts` | Updated to capture full text and new sections |
| `src/lib/rulebook/prompts.ts` | Reframed as Quick Start Guide with new sections |
| `src/lib/rulebook/types.ts` | Added new `RulesContent` optional fields |
| `src/app/api/admin/rulebook/generate-content/route.ts` | Uses consolidated context, fixed cascade |
| `src/app/api/admin/vecna/auto-process/route.ts` | Uses shared utilities, processing locks |
| `src/app/api/admin/vecna/family/[familyId]/process/route.ts` | Uses shared utilities, processing locks |

**Build Status:** Passing

---

## Previous Phase: 91 - Vecna Admin UI/UX Redesign (COMPLETE)

### Session Summary (2026-01-21) - Tab-Based Layout Redesign

**What was done:**
- Complete UI/UX redesign of Vecna Admin from split-screen to tab-based layout
- **Discovery Tab**: Full-page card grid for browsing/preparing games with inline rulebook upload
- **Processing Tab**: Queue sidebar + processing panel for running pipeline
- Progressive disclosure: only show what's needed for current task
- Batch selection with floating action bar
- Quick rulebook popover (2-click upload/URL paste)
- Collapsible family sections with progress bars
- Processing queue with pending/active/completed sections

**New Files:**
| File | Purpose |
|------|---------|
| `vecna/components/VecnaAdmin.tsx` | Main container with 2-tab navigation |
| `vecna/components/discovery/DiscoveryTab.tsx` | Full-page discovery view with filters |
| `vecna/components/discovery/DiscoveryFilters.tsx` | Filter bar (state, rulebook, family, sort) |
| `vecna/components/discovery/GameDiscoveryCard.tsx` | Game card with badges, selection, hover actions |
| `vecna/components/discovery/FamilySection.tsx` | Collapsible family groups |
| `vecna/components/discovery/QuickRulebookPopover.tsx` | Inline URL/upload popover |
| `vecna/components/discovery/BatchActionBar.tsx` | Floating selection bar |
| `vecna/components/discovery/index.ts` | Barrel exports |
| `vecna/components/processing/ProcessingTab.tsx` | Split layout with queue + panel |
| `vecna/components/processing/ProcessingQueue.tsx` | Queue sidebar (pending/active/completed) |
| `vecna/components/processing/ProcessingPanel.tsx` | Refactored game panel for processing |
| `vecna/components/processing/index.ts` | Barrel exports |

**Files Modified:**
| File | Changes |
|------|---------|
| `vecna/page.tsx` | Uses VecnaAdmin instead of VecnaPipeline |
| `vecna/components/index.ts` | Added new exports, kept legacy for compatibility |

**Key UX Improvements:**
- Tab-based layout (Discovery | Processing) vs cluttered split-screen
- Full-page card grid vs dense sidebar tree
- Inline rulebook popover (2 clicks) vs buried in pipeline
- Batch selection + floating action bar vs manual one-by-one
- Processing queue with auto-advance vs manual game switching

**Build Status:** Passing

---

## Previous Phase: 90 - Vecna Admin Refactoring (COMPLETE)

### Session Summary (2026-01-21) - Technical Debt Cleanup

**What was done:**
- Extracted `useVecnaStateUpdate` hook eliminating 3 duplicated updateState functions
- Created `fetchGameTaxonomy` utility eliminating ~180 lines of duplicated taxonomy queries
- Fixed unsafe `family_id` type cast in page.tsx
- Extracted 3 reusable components: `JsonEditor`, `RegenerateButton`, `ModelSelector`

**New Files:**
| File | Purpose |
|------|---------|
| `src/hooks/admin/useVecnaStateUpdate.ts` | Hook for Vecna state updates with loading/error states |
| `src/lib/vecna/queries.ts` | Taxonomy query utility with parallel fetches |
| `src/app/admin/(dashboard)/vecna/components/JsonEditor.tsx` | JSON editor with validation |
| `src/app/admin/(dashboard)/vecna/components/RegenerateButton.tsx` | Regenerate content with model selector |
| `src/app/admin/(dashboard)/vecna/components/ModelSelector.tsx` | AI model toggle selector |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/hooks/admin/index.ts` | Added useVecnaStateUpdate export |
| `src/lib/vecna/types.ts` | Added 8 taxonomy join types |
| `src/lib/vecna/index.ts` | Added queries export |
| `src/app/admin/(dashboard)/vecna/page.tsx` | Uses fetchGameTaxonomy, fixed family_id type |
| `src/app/admin/(dashboard)/vecna/components/VecnaGamePanel.tsx` | Uses hook + ModelSelector |
| `src/app/admin/(dashboard)/vecna/components/StateActions.tsx` | Uses hook |
| `src/app/admin/(dashboard)/vecna/components/ContentReviewPanel.tsx` | Uses hook + extracted components |

**Build Status:** Passing

---

## Previous Phase: 89 - Remove BGG Content from Public Pages (COMPLETE)

### Session Summary (2026-01-20) - Use Wikipedia Instead of BGG

**What was done:**
- About section now uses Wikipedia summary (CC-licensed) instead of BGG description
- Tagline no longer populated from BGG during import - will be generated by Vecna
- Hidden BGG external link on game pages (can re-enable later)
- Family Tree tab now includes preview-visible games (not just published)

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/games/tabs/OverviewTab.tsx` | About section uses `wikipedia_summary` instead of `description`, removed BGG link from External Links |
| `src/lib/bgg/importer.ts` | Set `tagline: null` instead of BGG description excerpt |
| `src/lib/supabase/family-queries.ts` | `getGameFamilyTreeData()` includes `is_preview_visible` games |

**Content Sources (Preview Pages):**
| Section | Source | Status |
|---------|--------|--------|
| About | Wikipedia summary | CC-licensed, safe |
| Tagline | None until Vecna | Hidden |
| How It Plays | Wikipedia gameplay | CC-licensed, safe |
| Taxonomy | Mapped to our terms | Safe |
| External Links | Official website, Rulebook only | BGG hidden |

**Build Status:** Passing

---

## Previous Phase: 88 - Importer Puffin Consolidation (COMPLETE)

### Session Summary (2026-01-20) - Single Puffin Call Import

**What was done:**
- Consolidated import to single Puffin API call (was: BGG fetch + separate enriched fetch)
- Removed redundant Wikidata publisher enrichment - now uses Puffin's `publisherData[]`
- Updated `upsertPublisher()` to accept `PuffinPublisherData` instead of calling Wikidata directly
- Updated `linkGamePublishers()` to pass Puffin publisher data for enrichment
- Removed `fetchEnrichedGame()` call - `bggData` from initial fetch is already `ConsolidatedGameData`
- Disabled Wikipedia family enrichment (Claude API) during import - existing family data sufficient

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/bgg/client.ts` | Added `PuffinPublisherData` interface, `publisherData` to `ConsolidatedGameData`, `fetchFromPuffin` always uses `?enriched=true` |
| `src/lib/bgg/importer.ts` | Removed `enrichPublisher` import, updated `upsertPublisher()` to use Puffin data, updated `linkGamePublishers()` signature, removed redundant `fetchEnrichedGame()` call, disabled Wikipedia family enrichment |

**Import Flow Change:**
- **Before:** `fetchBGGGameWithStatus()` → insert → `fetchEnrichedGame()` → apply enrichment → `enrichPublisher()` per publisher → `enrichFamilyFromWikipedia()` (Claude)
- **After:** `fetchBGGGameWithStatus()` → insert with enrichment already included → use `publisherData[]` from response

**Build Status:** Passing

---

## Previous Phase: 87 - Preview Pages for Puffin-Imported Games (COMPLETE)

### Session Summary (2026-01-20) - Preview Pages Before Vecna

**What was done:**
- Enable games to appear publicly after Puffin import, before Vecna processing
- Users find games in search/browse, see Puffin-provided data, can request priority processing
- Created `is_preview_visible` column - games become visible once enriched by Puffin
- Content request system tracks user interest for Vecna queue prioritization
- PlaceholderGameImage component with SVG-based styled placeholders (seeded colors, game initials)
- ContentPlaceholder component for Rules/Setup tabs with request button
- "Most Requested" section in Vecna admin sidebar

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00091_preview_pages.sql` | content_requests table, game_request_counts view, is_preview_visible column |
| `src/components/games/PlaceholderGameImage.tsx` | SVG placeholder with game initials and decorative elements |
| `src/components/games/ContentPlaceholder.tsx` | Elegant placeholder for Rules/Setup with request button |
| `src/lib/supabase/request-queries.ts` | Query functions for content requests |
| `src/app/api/games/[gameId]/content-request/route.ts` | GET/POST content request API |
| `src/hooks/useContentRequest.ts` | Client hook for request state |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/game-queries.ts` | Updated visibility filters to include `is_preview_visible` games |
| `src/components/games/GameHero.tsx` | Uses PlaceholderGameImage for missing images |
| `src/components/games/GameCard.tsx` | Uses PlaceholderGameImage for missing images |
| `src/components/games/tabs/RulesTab.tsx` | Uses ContentPlaceholder when no content |
| `src/components/games/tabs/SetupTab.tsx` | Uses ContentPlaceholder when no content |
| `src/lib/bgg/importer.ts` | Sets `is_preview_visible = true` on enrichment |
| `src/app/admin/(dashboard)/vecna/components/VecnaFamilySidebar.tsx` | Added Most Requested section |

**Build Status:** Passing

---

## Previous Phase: 86 - Puffin Browser Import Feature (COMPLETE)

### Session Summary (2026-01-20) - 1-Click Import from Puffin

**What was done:**
- Added "Browse Puffin" tab to admin import page for browsing and importing games from Puffin cache
- Removed legacy single/batch BGG import options (all imports now flow through Puffin)
- Added enrichment and rank filters to Puffin API (`GET /admin/api/games`)
- Created Boardmello proxy endpoint that merges Puffin data with import status
- Built PuffinBrowser component with search, filters, paginated table, and multi-select
- "Import Selected" goes through preview flow, "Quick Import" bypasses preview
- Fixed weight constraint bug (games with weight 0 now stored as null)
- Fixed import status detection (switched to admin client to bypass RLS)

**New Files:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/puffin/games/route.ts` | Proxy endpoint merging Puffin data with Boardmello import status |
| `src/components/admin/import/PuffinBrowser.tsx` | Browse UI with search, filters, table, selection, action bar |
| `src/components/admin/import/EnrichmentBadges.tsx` | W/P/R badges for Wikidata/Wikipedia/Rulebook status |

**Files Modified:**
| File | Changes |
|------|---------|
| `puffin/src/db/admin.ts` | Added GamesListFilters interface, enrichment/rank filters to getGamesList() |
| `puffin/src/api/routes/admin.ts` | Added filter query params (enriched, hasWikidata, hasWikipedia, hasRulebook, minRank, maxRank) |
| `src/components/admin/import/ImportInput.tsx` | Simplified to only show PuffinBrowser (removed legacy BGG options) |
| `src/components/admin/import/ImportWizard.tsx` | Added handlePuffinImport and handlePuffinQuickImport handlers |
| `src/components/admin/import/index.ts` | Added PuffinBrowser and EnrichmentBadges exports |
| `src/lib/bgg/importer.ts` | Fixed weight constraint (clamp to 1-5 range or null) |

**Build Status:** Passing

---

## Previous Phase: 85 - Navigation Menu Bar Redesign (COMPLETE)

### Session Summary (2026-01-19) - Navigation Simplification

**What was done:**
- Simplified navigation from 9 flat items to 5 items + 1 dropdown + 1 featured button
- Before: Games | Publishers | Awards | Categories | Feed | Tables | Shelf | Marketplace | [Recommend]
- After: Games | Explore (dropdown) | Tables | Bazaar | Profile | [Recommend]
- Created Explore dropdown containing Publishers, Awards, Categories
- Renamed "Marketplace" display name to "Bazaar" (URL unchanged)
- Added Profile link (auth-aware, only shows when logged in)
- Removed Feed and Shelf from nav (accessible via profile pages and UserMenu)
- Updated mobile menu with collapsible Explore section

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Complete navigation restructure: added Explore dropdown, Profile link, collapsible mobile menu section |

**Build Status:** Passing

---

## Previous Phase: 84 - Tables Code Audit & Optimization (COMPLETE)

### Session Summary (2026-01-19) - Tables Feature Optimization

**What was done:**
- Comprehensive code audit and optimization of `/tables` and `/tables/discover` features
- Reduced query count in `getTableWithDetails()` from 5 sequential queries to 2 parallel queries
- Changed `inviteFriendsToTable()` from loop inserts to single batch insert
- Fixed discover page double-fetch issue (was fetching once with default location, then again with user location)
- Created centralized row mapping utilities eliminating ~200 LOC of duplicate mapping code
- Extracted large components into reusable hooks (useDiscoverTables, useTableActions, useTableDialogs)
- Added React.memo to list components (TableCard, DiscoverTableCard)
- Added useMemo for participant filtering in ParticipantsList
- Added debounced game search (300ms) in CreateTableForm

**New Files:**
| File | Purpose |
|------|---------|
| `src/lib/supabase/table-mappers.ts` | Row mapping utilities (mapTableCardRow, mapNearbyTableRow, etc.) |
| `src/hooks/tables/useDiscoverTables.ts` | Discovery location + fetch hook with double-fetch fix |
| `src/hooks/tables/useTableActions.ts` | Table action handlers (RSVP, invite, cancel, delete, leave) |
| `src/hooks/tables/useTableDialogs.ts` | Dialog state management hook |
| `src/hooks/tables/index.ts` | Barrel exports |
| `src/components/tables/DiscoverTableCard.tsx` | Memoized discover page table card |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/table-queries.ts` | Use mappers, consolidated queries, batch inserts |
| `src/app/tables/discover/DiscoverContent.tsx` | Use hooks, fix double fetch (569→350 LOC) |
| `src/app/tables/[id]/TableDetailContent.tsx` | Use hooks for actions and dialogs |
| `src/components/tables/CreateTableForm.tsx` | Added debounced search with useMemo |
| `src/components/tables/ParticipantsList.tsx` | Memoized filtering with useMemo |
| `src/components/tables/TableCard.tsx` | Wrapped with React.memo |
| `src/components/tables/index.ts` | Added DiscoverTableCard export |

**Build Status:** Passing

---

## Previous Phase: 83 - Tables Phase 2 (COMPLETE)

### Session Summary (2026-01-19) - Tables Phase 2 Continuation

**What was done:**
- Configured Mapbox integration for Discover page
- Fixed LocationPicker: replaced Mapbox Geocoder widget with custom implementation using Mapbox Geocoding API (fixed duplicate inputs, z-index issues)
- Added privacy selector to CreateTableForm (Public/Friends/Private), changed default from 'private' to 'public'
- Applied 5 pending migrations (00086-00090) for Tables Phase 2 features
- Fixed hydration mismatch errors with Select component (hasMounted state pattern)
- Fixed map popup styling with explicit dark colors (CSS variables didn't apply in popup)
- Set default location to Wheat Ridge, Colorado for Discover page
- Added graceful degradation in API when location_lat/lng columns don't exist

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/tables/discover/DiscoverContent.tsx` | Default location (Wheat Ridge CO), `hasMounted` state for hydration fix, location banner instead of blocking screen |
| `src/components/maps/MapView.tsx` | Fixed token env variable name, explicit dark popup styles |
| `src/components/maps/LocationPicker.tsx` | Complete rewrite: custom implementation with Input + Mapbox Geocoding API, proper z-index dropdown |
| `src/components/tables/CreateTableForm.tsx` | Added privacy selector UI (Globe/UserCheck/Lock), default 'public' |
| `src/app/api/tables/route.ts` | Added location_lat/lng handling with graceful fallback |

**Build Status:** Passing

---

### Session Summary (2026-01-19) - Tables Phase 2 Features (Initial)

**What was done:**
- Discover Tables page with Mapbox GL JS map view + list toggle
- Friends' Tables section showing upcoming tables from friends
- Table Comments system with threaded discussion
- Post-Table Recap feature (multi-step wizard: attendance, rating, notes)
- Table starting reminder cron job (sends notifications 1 hour before)
- Graceful degradation pattern: all Phase 2 features silently return empty/null when migrations not applied

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00086_tables_location_and_visibility.sql` | Location coordinates, public/friends-only visibility |
| `supabase/migrations/00087_tables_discover_functions.sql` | RPC functions for nearby tables, friends tables |
| `supabase/migrations/00088_table_comments.sql` | Comments table and RLS |
| `supabase/migrations/00089_table_recaps.sql` | Recap table, attended tracking, complete_table_with_recap RPC |
| `supabase/migrations/00090_table_reminder_tracking.sql` | reminder_sent_at, get_tables_needing_reminders RPC |
| `src/components/tables/TableComments.tsx` | Comments display and add form |
| `src/components/tables/TableRecapForm.tsx` | Multi-step recap wizard (attendance, rating, notes) |
| `src/components/tables/TableRecapView.tsx` | Recap display with stars, attendees, highlights |
| `src/components/maps/MapView.tsx` | Mapbox GL JS map component |
| `src/components/maps/index.ts` | Barrel exports with MapMarker type |
| `src/app/tables/DiscoverContent.tsx` | Discover page with map/list toggle |
| `src/app/tables/FriendsTablesSection.tsx` | Friends' upcoming tables |
| `src/app/api/tables/[id]/comments/route.ts` | GET/POST comments |
| `src/app/api/tables/[id]/recap/route.ts` | GET/POST/PATCH recap |
| `src/app/api/cron/table-reminders/route.ts` | Cron endpoint for reminder notifications |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/types/tables.ts` | Added TableRecap, TableComment types, attended field on participants |
| `src/lib/supabase/table-queries.ts` | Added recap, comments, nearby, friends queries + graceful degradation |
| `src/components/tables/index.ts` | Added TableComments, TableRecapForm, TableRecapView exports |
| `src/app/tables/page.tsx` | Added Discover and Friends sections |
| `src/app/tables/[id]/page.tsx` | Fetch comments and recap |
| `src/app/tables/[id]/TableDetailContent.tsx` | Display recap button/view and comments |

**Build Status:** Passing

---

## Previous Phase: 82 - Tables Feature Phase 1 (COMPLETE)

### Session Summary (2026-01-18) - Tables MVP Implementation

**What was done:**
- Created Tables feature for game meetup planning with friend invites and RSVP
- Database schema with `tables` and `table_participants` tables, RLS policies, notification types
- Full API routes for CRUD, invites, and RSVP management
- Components: TableCard, RSVPButtons, ParticipantsList, InviteFriendsDialog, CreateTableForm
- Pages: My Tables listing, Create Table wizard, Table Detail
- Added "Tables" to main navigation header
- Extended notification system for table_invite, table_rsvp, table_starting, table_cancelled

**RLS Debugging (3 migrations):**
- Migration 00082: Initial schema with RLS - caused infinite recursion
- Migration 00083: First fix attempt - still recursion
- Migration 00084: Simplified policies - fixed recursion but broke INSERT
- Migration 00085: Final fix - `table_participants` SELECT now public (`USING (true)`), tables SELECT references participants safely

**Fixed client/server context issue:**
- Query functions were using browser client in server components
- Updated `getTableWithDetails` and `getTableParticipants` to accept optional Supabase client parameter
- API route now creates tables using server client directly

**Build Status:** Passing

---

## Previous Phase: 81 - Family Tree V2 UI Polish (COMPLETE)

### Session Summary (2026-01-18) - Premium Visual Polish

**What was done:**
- Transformed functional family tree into visually polished premium experience
- Added CSS animations: `pulse-subtle` for base game glow, `selection-pulse` for selected nodes
- Updated layout constants: NODE_GAP 24→32px, TIER_GAP 60→72px for better breathing room
- Gradient connector lines with glow layer, highlight overlay, and faded ends
- Glassmorphism badges with color-matched glows for relation types
- Base game hero treatment: centered golden gradient badge + ambient radial glow
- Selection state: multi-layer ring + scale bump + pulsing animation
- Redesigned TreeLegend as floating pill with colored indicator dots
- Added subtle gradient background to tree container
- Moved family info from prominent top banner to subtle inline text below legend

**New Files:**
| File | Purpose |
|------|---------|
| (CSS additions to globals.css) | Family tree animations and glow effects |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/globals.css` | Added `@keyframes pulse-subtle`, `selection-pulse`, `.tree-node--base::before`, `.tree-node--selected::after` |
| `src/components/family-tree/types.ts` | Updated NODE_GAP/TIER_GAP/NODE_HEIGHT, richer relation colors, uppercase shortLabels, added FamilyInfo interface |
| `src/components/family-tree/TreeConnector.tsx` | SVG gradients, glow layer (6px/15% opacity), main line with gradient stroke, white highlight overlay |
| `src/components/family-tree/TreeLegend.tsx` | Floating pill redesign with `rounded-full`, glassmorphism, colored dots with glow |
| `src/components/family-tree/TreeNode.tsx` | `group/node` hover states, CSS variable shadows, `-translate-y-1` hover, `rounded-xl`, glassmorphism badges, golden base badge |
| `src/components/family-tree/FamilyTreeDiagram.tsx` | Gradient background, `p-6 rounded-xl`, added `familyInfo` prop, subtle family info below legend |
| `src/components/games/tabs/FamilyTreeTab.tsx` | Removed top info banner, passes `familyInfo` to diagram |

**Build Status:** Passing

---

## Previous Phase: 80 - Puffin Enrichment Integration (COMPLETE)

### Session Summary (2026-01-18) - Simplify Import with Puffin Pre-Enrichment

**What was done:**
- Replaced local `enrichGameParallel()` with Puffin's pre-enriched data via `?enriched=true`
- Added Puffin enrichment types to client.ts (WikidataResult, WikipediaResult, CommonsImage, ConsolidatedGameData)
- Created `fetchEnrichedGame()` function for enriched data fetching
- Created `enrichment-mapper.ts` module to map Puffin data to Boardmello's database format
- Simplified helper function signatures (`linkFamilyFromWikidataSeries`, `createWikidataSequelRelations`)
- Fixed family enrichment to only trigger on FIRST game in family (not every game)
- Removed 30-day re-enrichment during import (will be background job instead)
- Created comprehensive Puffin integration plan at `/puffin/BOARDMELLO-INTEGRATION-PLAN.md`

**Import Flow Change:**
- **Before:** Import → Insert → `enrichGameParallel()` (1.5s of parallel API calls to Wikidata/Wikipedia/Commons)
- **After:** Import with `?enriched=true` → Insert with enrichment data already included

**Remaining Slowdowns Identified (for Puffin to solve):**
1. Publisher Wikidata enrichment - Still calling Wikidata per publisher during import
2. Family enrichment - Still runs AI extraction (but now only for first game in family)

**Puffin Integration Plan Created:**
- Priority 1: Publisher enrichment (cache in Puffin, avoid per-import Wikidata calls)
- Priority 2: Curated images system (Amazon API, Commons selection, manual uploads)
- Priority 3: Game browse/search API (enable import widget in Boardmello)
- Priority 4: Admin UI for image curation

**New Files:**
| File | Purpose |
|------|---------|
| `src/lib/bgg/enrichment-mapper.ts` | Maps Puffin ConsolidatedGameData to Boardmello's DB format |
| `/puffin/BOARDMELLO-INTEGRATION-PLAN.md` | Comprehensive plan for Puffin-side work |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/bgg/client.ts` | Added Puffin enrichment types + `fetchEnrichedGame()` function |
| `src/lib/bgg/importer.ts` | Replaced `enrichGameParallel()` with Puffin enrichment, simplified helper signatures, fixed family enrichment trigger |
| `src/lib/bgg/index.ts` | Added exports for new types and functions |

**Build Status:** Passing

---

## Previous Phase: 79 - Friends System (COMPLETE)

### Session Summary (2026-01-17) - Friends System

**What was done:**
- Built complete friends system where mutual follows = friends (both users follow each other)
- Created `/discover` page for finding and connecting with users
- Added Friends tab to user profiles showing mutual friends AND following (non-friends)
- Created shelf comparison feature (`/u/[username]/compare`)
- Added "Recommend to Friend" button on game pages
- FriendsVibes component now shows only mutual friends instead of all follows

**Bug Fixes:**
- Fixed RPC function return types (VARCHAR(500) mismatch with TEXT caused empty `{}` errors)
- Added SECURITY DEFINER to friend functions (required to bypass RLS for aggregate queries)
- Added GRANT EXECUTE permissions for anon/authenticated roles on all friend functions

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00077_friends_system.sql` | DB functions: get_mutual_friends, are_friends, get_friend_suggestions, get_friends_of_friends, get_recently_active_users, get_friend_count, get_shelf_comparison, search_users + last_active_at trigger |
| `supabase/migrations/00078_game_recommendation_notification.sql` | Adds game_recommendation notification type |
| `supabase/migrations/00079_friends_system_grants.sql` | GRANT EXECUTE on friend functions to anon/authenticated |
| `supabase/migrations/00080_friends_security_definer.sql` | Add SECURITY DEFINER to bypass RLS |
| `supabase/migrations/00081_friends_fix_return_types.sql` | Fix VARCHAR/TEXT type mismatch in return types |
| `src/lib/supabase/friend-queries.ts` | TypeScript query functions for all friend operations |
| `src/app/discover/page.tsx` | Discover page with search and suggestion sections |
| `src/components/discover/UserSearchBar.tsx` | Debounced user search with results |
| `src/components/discover/UserCard.tsx` | User card component with follow button |
| `src/components/discover/SuggestedUsersSection.tsx` | "People You May Know" based on mutual games |
| `src/components/discover/FriendsOfFriendsSection.tsx` | Friends of your friends suggestions |
| `src/components/discover/RecentlyActiveSection.tsx` | Recently active users for discovery |
| `src/components/discover/index.ts` | Barrel exports |
| `src/app/api/users/search/route.ts` | User search API endpoint |
| `src/app/api/users/suggested/route.ts` | Friend suggestions API endpoint |
| `src/components/profile/ProfileFriendsTab.tsx` | Friends tab with two sections: Friends (mutual) + Following (non-friends) |
| `src/components/profile/MutualFriendsIndicator.tsx` | Mutual friends badge/indicator |
| `src/app/u/[username]/compare/page.tsx` | Shelf comparison page |
| `src/components/profile/ShelfComparison.tsx` | Comparison UI with stats and tabs |
| `src/components/games/RecommendToFriendButton.tsx` | Recommend game button |
| `src/components/games/RecommendToFriendDialog.tsx` | Friend selector dialog for recommendations |
| `src/app/api/recommendations/send/route.ts` | Send game recommendation API |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Added Friend types (Friend, FriendWithProfile, SuggestedFriend, FriendOfFriend, etc.), added game_recommendation to NotificationType |
| `src/lib/supabase/queries.ts` | Added exports for friend query functions |
| `src/lib/supabase/vibe-queries.ts` | Added getMutualFriendsVibes() for mutual friends only |
| `src/components/vibes/FriendsVibes.tsx` | Uses getMutualFriendsVibes instead of getFriendsVibesJoin |
| `src/components/profile/ProfileTabs.tsx` | Added Friends tab with Users icon |
| `src/app/u/[username]/ProfileContent.tsx` | Integrated ProfileFriendsTab |
| `src/app/u/[username]/page.tsx` | Pass currentUserId to ProfileContent |
| `src/components/profile/ProfileHeader.tsx` | Added "Compare Shelves" button for other users |
| `src/components/games/GameHero.tsx` | Added RecommendToFriendButton to CTAs |
| `src/components/games/index.ts` | Added RecommendToFriendButton exports |

**Build Status:** Passing

---

## Previous Phase: 78 - Puffin BGG Intermediary Service (COMPLETE)

### Session 7 (2026-01-16) - Promos & Extras System

**What was done:**
- Added lightweight promo system for publisher promos, Kickstarter extras, convention exclusives
- Promos are simplified game records linked to parent games via `is_promo` flag and `parent_game_id`
- Display in dedicated "Promos & Extras" tab on game pages (only visible when promos exist)
- Promos excluded from game directory, search, trending, community stats, sitemap
- Promos allowed on user shelf and marketplace

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00076_game_promos.sql` | Schema: is_promo flag, parent_game_id, updated search_games() |
| `src/components/games/PromoCard.tsx` | Minimal card with image, name, year, BGG link |
| `src/components/games/tabs/PromosTab.tsx` | Grid display with intro text |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Added `promo_of` to RelationType, PromoGame interface, updated all RELATION_TYPE configs |
| `src/lib/supabase/family-queries.ts` | Added `getGamePromos()`, updated relation labels/inverse types |
| `src/lib/supabase/game-queries.ts` | Added `.or('is_promo.is.null,is_promo.eq.false')` to all public queries |
| `src/app/games/[slug]/page.tsx` | Added Promos tab integration with count display |
| `src/app/sitemap.ts` | Excluded promos from sitemap |
| `src/app/admin/(dashboard)/games/page.tsx` | Added "Promos" filter tab |
| `src/components/games/GamePageTabs.tsx` | Added Gift icon to iconMap |
| `src/components/games/GameRelationsSection.tsx` | Added promo_of to relationIcons |
| `src/components/admin/AutoLinkRelations.tsx` | Added promo_of to RELATION_LABELS |
| `src/components/family-tree/types.ts` | Added promo_of to RELATION_STYLES |
| `src/data/mock-games.ts` | Added parent_game_id and is_promo to type |

**Build Status:** Passing

---

### Session 6 (2026-01-16) - Homepage Revamp

**What was done:**
- Complete homepage redesign focused on engagement and community
- Added trending games section with recent rating activity
- Added community pulse section showing live activity feed
- Added awards section showcasing recent major award winners
- Added community stats bar (games, ratings, collectors counts)
- Added shelf CTA section encouraging users to build their shelf
- Condensed content tools section (removed score sheets from primary display)
- De-emphasized score sheets, kept focus on rules/setup/reference tools
- Fixed several type errors related to nullable fields and import locations

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/home/index.ts` | Barrel exports for home components |
| `src/components/home/CommunityStatsBar.tsx` | Stats banner showing games/ratings/collectors |
| `src/components/home/TrendingGamesSection.tsx` | Trending games with vibe stats |
| `src/components/home/CommunityPulseSection.tsx` | Recent community activity feed |
| `src/components/home/AwardsSection.tsx` | Recent award winners showcase |
| `src/components/home/ShelfCTASection.tsx` | Build your shelf call-to-action |
| `src/components/home/ContentToolsSection.tsx` | Condensed 3 content tools |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/game-queries.ts` | Added `getTrendingGames()`, `getCommunityStats()`, `getRecentCommunityActivity()` |
| `src/lib/supabase/award-queries.ts` | Added `getRecentAwardWinners()`, fixed nullable award_id handling |
| `src/lib/supabase/queries.ts` | Updated exports for new query functions |
| `src/app/page.tsx` | Complete restructure with new sections and parallel data fetching |

**Homepage Section Order:**
1. Hero with community stats
2. Trending Games
3. Community Pulse (activity feed)
4. Awards Section
5. Featured Game
6. Featured Games Grid
7. Shelf CTA
8. Recommendation CTA
9. Content Tools (condensed)
10. Categories
11. Final CTA

**Build Status:** Passing

---

### Session 5 (2026-01-15) - Awards Pre-Population from Wikidata

**What was done:**
- Built awards pre-population system from Wikidata, independent of game imports
- Awards can now exist in database before their games are imported (identified by BGG ID)
- When games are later imported, they auto-link to pending awards
- Award pages show placeholder cards for games not yet in database (with BGG link)

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00075_awards_bgg_id_support.sql` | Schema: nullable game_id, new bgg_id/game_name/wikidata_game_id columns |
| `src/lib/wikidata/award-queries.ts` | SPARQL queries for Wikidata P166 (award received) |
| `src/lib/wikidata/award-importer.ts` | Import logic + `linkPendingAwards()` function |
| `src/app/api/admin/awards/import-wikidata/route.ts` | Admin API: GET stats, POST import (with ?award= filter) |
| `src/app/admin/(dashboard)/awards/page.tsx` | Admin UI for per-award imports with stats |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/wikidata/index.ts` | Added exports for award functions |
| `src/lib/supabase/award-queries.ts` | Updated `AwardWinner` type and `getAwardWinners()` to include pending games |
| `src/lib/bgg/importer.ts` | Auto-links pending awards when game is imported |
| `src/app/awards/[slug]/page.tsx` | Placeholder cards for pending games with BGG links |
| `src/components/admin/AdminSidebar.tsx` | Added Awards tab with Trophy icon |

**Wikidata Awards Supported:**
- Spiel des Jahres, Kennerspiel des Jahres, Kinderspiel des Jahres
- Deutscher Spiele Preis, As d'Or, Origins Award
- Golden Geek Award, International Gamers Award

**Admin Features:**
- `/admin/awards` - Per-award import buttons with linked/pending counts
- Import individual awards or all at once
- Stats show coverage percentage per award

**Build Status:** Passing

---

### Session 4 (2026-01-15) - Platform Rebrand & Coming Soon Page

**What was done:**

**Part 1: Rebrand Board Nomads → Boardmello**
- Renamed platform across entire codebase (30+ files)
- Updated all user-facing text, metadata, SEO references
- Updated User-Agent strings in all external API clients
- Updated all documentation files

**Part 2: Production Coming Soon Page**
- Created coming soon page with email signup form (`/coming-soon`)
- Added middleware intercept for production-only coming soon mode
- URL-based admin bypass: `?access=CODE` sets 30-day cookie
- Email signups stored in `coming_soon_signups` table
- Design: Text-only logo (all caps, wide letter-spacing), subtle teal radial gradient
- Copy: "Probably the best thing ever." / "Make a Good Decision" button

**Part 3: Production Database Reset**
- Cleared all test games and related data from production database
- Preserved: taxonomy tables, user accounts, coming soon signups
- Production is clean and ready for fresh game imports at launch

**New Files:**
| File | Purpose |
|------|---------|
| `src/app/coming-soon/page.tsx` | Coming soon page with email signup |
| `src/app/api/coming-soon/route.ts` | Email signup API endpoint |
| `supabase/migrations/00074_coming_soon_signups.sql` | Signups table |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/middleware.ts` | Added coming soon intercept logic with bypass |

**Environment Variables (Production Only):**
```
COMING_SOON_MODE=true
COMING_SOON_BYPASS_CODE=your_secret_code
```

**Local Development:**
- Navigate directly to `http://localhost:3399/coming-soon` to view/edit the page
- No redirect occurs locally (env var not set) - normal site works as usual
- Optional: Add `COMING_SOON_MODE=true` to `.env.local` to test full redirect flow

**Admin Access Flow (Production):**
1. Visit `boardmello.com?access=CODE` → bypass cookie set
2. Navigate to `/admin` → admin login page
3. Login with Google (email in `ADMIN_EMAILS`) → full admin access

**Infrastructure Changes Completed:**
- Railway: Custom domain `boardmello.com` configured, env vars set
- DNS: Records configured
- Supabase: Site URL and redirects updated, migrations pushed to both staging and production
- Google Cloud: OAuth origins updated
- Stripe: Webhook endpoint updated

**Deployment:** Merged to `main` and deployed to production

**Build Status:** Passing

---

### Session 3 (2026-01-15) - Data Consistency & Auto-Discovery

**What was done:**
- Fixed critical BGG parsing discrepancies between Puffin and Boardmello:
  - Expansion relationships: Puffin now uses item `type` attribute (matching Boardmello logic)
  - Implementation relationships: Fixed `inbound` attribute interpretation (was inverted)
- Removed direct BGG access from Boardmello - all BGG data now flows through Puffin only
- Added automatic retry mechanism when games are pending in Puffin (6 retries × 5s = 30s total)
- Added auto-discovery of related games when fetching in Puffin:
  - Base games (if expansion)
  - All expansions
  - Original games (if reimplementation)
  - Reimplementations
  - BGG family members (game series only, excludes publishers/awards/etc.)
- Built scheduler system for continuous content discovery:
  - 6 seed tiers with ~300 curated games (classics, modern hits, gateway, Kickstarter, etc.)
  - Stale data refresh for games older than 7 days
  - Worker idle-time processing (auto-progresses through tiers when queue is empty)
- Added cron API endpoints for external scheduling via cron-job.org

**New Files (Puffin repo):**
| File | Purpose |
|------|---------|
| `src/api/routes/cron.ts` | Cron endpoints: discover-hot, discover-next, discover-tier, refresh-stale, status |

**Files Modified (Puffin repo):**
| File | Changes |
|------|---------|
| `src/worker/bgg-fetcher.ts` | Fixed expansion/implementation parsing, added `fetchBGGFamilyMembers()` |
| `src/worker/queue-processor.ts` | Added `queueRelatedGames()`, `doIdleWork()`, worker pause/resume exports |
| `src/worker/discovery.ts` | Added `SEED_TIERS`, `refreshNextStaleGame()`, `getStaleGameCount()`, `discoverFromTier()`, `getDiscoveryStatus()` |
| `src/api/server.ts` | Added cron router |

**Files Modified (Boardmello repo):**
| File | Changes |
|------|---------|
| `src/lib/bgg/client.ts` | Removed BGG direct fallback, added `BGGFetchResult` type, `fetchBGGGameWithStatus()`, `fetchBGGGamesWithStatus()` |
| `src/lib/bgg/importer.ts` | Added `fetchWithRetry()` with 30s retry window |
| `src/lib/bgg/index.ts` | Updated exports for new status functions |

**Cron Endpoints:**
| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `POST /cron/discover-hot` | Every 6 hours | BGG Hot 50 trending games |
| `POST /cron/discover-next` | Daily | Auto-picks next incomplete tier |
| `POST /cron/refresh-stale?count=50` | Every 4 hours | Refresh stale game data |
| `GET /cron/status` | On-demand | Discovery progress + queue stats |

**Build Status:** Passing (both repos)

---

### Session 2 (2026-01-14) - Admin Interface

**What was done:**
- Built full admin interface for Puffin with dark theme UI
- Technology: Static HTML + Alpine.js + Tailwind CSS (via CDN) - zero build step
- Four pages: Dashboard, Queue Management, Games Cache, Fetch History
- Real-time dashboard with auto-refresh (5s interval)
- Worker pause/resume control from UI
- Queue actions: retry failed, remove, bump priority, manual fetch
- Games browser with search, staleness filtering, detail modal
- Fixed auth middleware to skip `/admin` routes (both UI and API)
- Fixed Dockerfile to copy static files for production deployment
- Resolved Railway deployment issues (duplicate projects causing confusion)

**New Files (Puffin repo):**
| File | Purpose |
|------|---------|
| `src/api/routes/admin.ts` | All admin API endpoints (stats, queue, games, history, worker) |
| `src/db/admin.ts` | Admin database queries |
| `src/public/admin/index.html` | Dashboard with stats cards, worker control, activity feed |
| `src/public/admin/queue.html` | Queue management with filtering and actions |
| `src/public/admin/games.html` | Games cache browser with search and staleness filter |
| `src/public/admin/history.html` | Fetch history with stats |
| `src/public/admin/js/admin.js` | Shared Alpine.js utilities |

**Files Modified (Puffin repo):**
| File | Changes |
|------|---------|
| `src/api/server.ts` | Added static file serving for `/admin`, mounted admin router |
| `src/api/middleware/auth.ts` | Skip auth for all `/admin` routes |
| `src/worker/queue-processor.ts` | Added pause/resume with exposed worker state |
| `Dockerfile` | Copy `src/public` for admin static files |

**Admin URLs:**
- Dashboard: `https://puffin-production.up.railway.app/admin/`
- Queue: `https://puffin-production.up.railway.app/admin/queue.html`
- Games: `https://puffin-production.up.railway.app/admin/games.html`
- History: `https://puffin-production.up.railway.app/admin/history.html`

**Build Status:** Passing

---

### Session 1 (2026-01-14) - Puffin Service Creation & Deployment

**What was done:**
- Created **Puffin** - a separate BGG data intermediary service to reduce risk of BGG blocking Boardmello
- Architecture: `Boardmello → Puffin API → Puffin DB ← BGG API (background worker)`
- Full Node.js/Express service with PostgreSQL database deployed on Railway
- Background worker continuously fetches and caches BGG game data
- Boardmello client updated to use Puffin first, with BGG fallback

**Puffin Service (Separate Repo: github.com/BenTyson/puffin):**

| Component | Purpose |
|-----------|---------|
| `src/api/` | Express REST API (health, game, games endpoints) |
| `src/worker/` | Queue processor, BGG fetcher with rate limiting (1.1s), discovery |
| `src/db/` | PostgreSQL client, games/queue/history tables |
| `src/shared/` | Config, types (BGGRawGame interface matching Boardmello) |
| `Dockerfile` | Multi-stage build for Railway deployment |
| `railway.toml` | Railway deployment config with health checks |

**Database Schema:**
- `games` - Cached BGG game data (matches BGGRawGame interface exactly)
- `fetch_queue` - Priority queue for background fetching
- `fetch_history` - Audit log of all fetch attempts

**API Endpoints:**
| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check with DB and queue status |
| `GET /api/v1/game/:bggId` | Single game fetch (queues if missing) |
| `GET /api/v1/games?ids=...` | Batch fetch up to 100 games |
| `POST /api/v1/games/request` | Request fetch for specific BGG IDs |

**Railway Deployment:**
- Service URL: `https://puffin-production.up.railway.app`
- PostgreSQL database with public connection string
- Environment variables: `PORT`, `DATABASE_URL`, `API_KEYS`, `BGG_API_TOKEN`, `WORKER_ENABLED`

**Boardmello Integration:**

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/bgg/client.ts` | Added Puffin integration: `fetchFromPuffin()`, `fetchFromPuffinBatch()`, `requestPuffinFetch()`, health tracking with 60s recovery, Puffin-first fetching with BGG fallback |

**New Environment Variables (Boardmello):**
```
PUFFIN_ENABLED=true
PUFFIN_API_URL=https://puffin-production.up.railway.app/api/v1
PUFFIN_API_KEY=puffin_sk_...
```

**Key Technical Decisions:**
- BGG now requires Bearer token authentication (`BGG_API_TOKEN`)
- Puffin uses same `BGGRawGame` interface as Boardmello for seamless integration
- Priority queue system: CRITICAL(1) → HIGH(10) → NORMAL(50) → LOW(80)
- Rate limiting: 1.1s between BGG requests, max 20 IDs per batch
- Health check gracefully handles missing tables during initial deployment
- **Boardmello has NO direct BGG access** - all BGG data flows through Puffin only (security isolation)

**Railway Configuration (DONE):**
- Production: `PUFFIN_ENABLED=true`, `PUFFIN_API_URL`, `PUFFIN_API_KEY` set
- Staging: Same configuration applied
- No `BGG_API_TOKEN` in Boardmello (intentional - Puffin only)

**Build Status:** Passing (both repos)

---

## Previous Phase: 77 - Admin Editor Entity Selectors & UX (COMPLETE)

### Session Summary (2026-01-13) - Entity Selectors & Editor Polish

**What was done:**
- Added image metadata stripping on upload using `sharp` (removes EXIF, IPTC, XMP data)
- Replaced text inputs for Publishers/Designers/Artists with searchable EntitySelector dropdowns
- EntitySelector features: search existing entities, create new on-the-fly, multi-select with badges, first item auto-marked as primary
- Created API endpoints for entity search (`/api/admin/entities`) and game-entity linking (`/api/admin/entities/link`)
- Moved Published toggle from Visibility & Tags card to prominent position in page header
- Renamed "Visibility & Tags" to "Collection Tags" (now 6 flags in 3-column grid)
- Added teal styling to editor tabs (active state: teal background tint, teal text)

**New Files:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/entities/route.ts` | GET search + POST create entities |
| `src/app/api/admin/entities/link/route.ts` | POST update game-entity junction table links |
| `src/components/admin/game-editor/EntitySelector.tsx` | Searchable multi-select combobox for entities |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/api/admin/upload/route.ts` | Added `sharp` import, `stripImageMetadata()` function, strips metadata before storage upload |
| `src/lib/supabase/game-queries.ts` | Added `LinkedEntity` type, `linked_designers/publishers/artists` to `GameWithMedia`, fetch entities in `getGameEditorData()` |
| `src/components/admin/GameEditor.tsx` | Added entity state management, entity change handlers, save entities to junction tables, moved Published toggle to header with Switch component, added teal tab styling |
| `src/components/admin/game-editor/DetailsTab.tsx` | Replaced text inputs with EntitySelector components, renamed card to "Collection Tags", removed Published switch |
| `src/components/admin/game-editor/index.ts` | Added EntitySelector export |

**Build Status:** Passing

---

## Previous Phase: 76 - Game Page UX Polish & Setup Guide Preview (COMPLETE)

### Session Summary (2026-01-13) - Game Page Polish

**What was done:**
- Cleaned up Critical Reception styling: removed quote icon and blockquote, expandable inline content, subtle attribution (10px, 60% opacity)
- Renamed "Critical Reception" to "Reception"
- Adjusted How It Plays section: removed bordered card wrapper, "Continue Learning" button with teal outline and right arrow
- Redesigned Setup Tab for cleaner presentation: smaller outline step circles, hover-reveal tips, removed bordered Before You Start section, simple bullets for Player Setup, consolidated sidebar cards
- Added Setup Guide document preview to Setup tab sidebar (matches Rulebook preview in How to Play)
- Created shared `DocumentPreview` component for rulebook/setup guide previews
- Added thumbnail generation for game documents on PDF upload
- Fixed washed-out thumbnail colors by adding white background compositing (PDF renders with transparent background)

**New Files:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00073_game_document_thumbnails.sql` | Add thumbnail_url column to game_documents |
| `src/components/games/DocumentPreview.tsx` | Shared preview component for PDF documents |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/games/WikipediaContent.tsx` | Added 'use client', useState for expandable content, removed Quote/blockquote styling, subtle attribution |
| `src/components/games/tabs/OverviewTab.tsx` | GameplayTeaser: removed bordered card, teal outline "Continue Learning" button with ArrowRight |
| `src/components/games/tabs/SetupTab.tsx` | Major cleanup: smaller outline step circles, hover tips, removed card wrappers, simple bullets, added Setup Guide preview |
| `src/components/games/tabs/RulesTab.tsx` | Uses shared DocumentPreview for rulebook preview |
| `src/lib/rulebook/thumbnail.ts` | Added `generateDocumentThumbnail()`, `deleteDocumentThumbnail()`, `addWhiteBackground()` for proper color rendering |
| `src/app/api/admin/game-documents/route.ts` | Generate thumbnail on PDF upload, delete thumbnail on document delete |
| `src/components/games/index.ts` | Added DocumentPreview export |

**Build Status:** Passing

---

## Previous Phase: 75 - Game Editor Data Preloading & Unified Save (COMPLETE)

### Session Summary (2026-01-13) - Game Editor Preloading

**What was done:**
- Consolidated all tab data fetching into single page load (18 parallel queries)
- Added client-side LRU cache for game editor data (5 games, 5-minute TTL)
- Unified save button - single button now saves both Details and Taxonomy changes
- Fixed save button UX - disabled when no unsaved changes

**New Files:**
| File | Purpose |
|------|---------|
| `src/hooks/admin/useGameEditorCache.ts` | LRU cache hook for game editor data |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/supabase/game-queries.ts` | Added `getGameEditorData()` consolidated query, new types (TaxonomyData, DocumentsData, PurchaseData, GameEditorData) |
| `src/app/admin/(dashboard)/games/[id]/page.tsx` | Simplified to use consolidated query |
| `src/components/admin/GameEditor.tsx` | New `editorData` prop, cache integration, unified save with ref, fixed disabled state |
| `src/components/admin/game-editor/TaxonomyTab.tsx` | Converted to forwardRef, exposes `save()` via useImperativeHandle, removed Save Taxonomy button |
| `src/components/admin/game-editor/DocumentsTab.tsx` | Accepts preloaded data via `initialData` prop, removed fetch |
| `src/components/admin/game-editor/SupplementaryDocumentsSection.tsx` | Accepts `initialDocuments` prop |
| `src/components/admin/game-editor/PurchaseLinksTab.tsx` | Accepts preloaded data via `initialData` prop, removed fetch |
| `src/hooks/admin/index.ts` | Export new cache hook |
| `src/components/admin/game-editor/index.ts` | Export TaxonomyTabRef type |

**Build Status:** Passing

---

## Previous Phase: 74 - Admin Workflow Fixes: Import & Vecna (COMPLETE)

### Session Summary (2026-01-13) - Admin Workflow Fixes

**What was done:**
- Reviewed Import wizard and Vecna pipeline for weaknesses from admin perspective (identified 27 issues)
- Fixed top 5 pre-launch issues to prevent data/content rework:

1. **Duplicate BGG ID detection** - Import input now auto-deduplicates pasted IDs and shows warning
2. **Clearer relation mode descriptions** - Updated UI to explain "All Relations" includes fan filtering, "Upstream" doesn't import expansions
3. **Family context invalidation** - When base game content regenerated, expansions auto-reset to `taxonomy_assigned` and family context rebuilds
4. **Improved error messages** - Technical errors now mapped to user-friendly explanations with suggested actions

**Files Modified:**
| File | Changes |
|------|---------|
| `src/components/admin/import/ImportInput.tsx` | Added deduplication, duplicate count warning, clearer relation mode descriptions |
| `src/app/api/admin/rulebook/generate-content/route.ts` | Added expansion invalidation when base game regenerated, rebuilds family context |
| `src/app/admin/(dashboard)/vecna/components/BlockedStateAlert.tsx` | Added `parseErrorMessage()` for user-friendly error mapping with suggestions |

**Future Work:**
- 22 remaining issues documented in `docs/backlog/ADMIN-WORKFLOW-ISSUES.md` organized by priority tier (A-E)

**Build Status:** Passing

---

## Previous Phase: 73 - Admin Preview on Real Game Pages (COMPLETE)

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
- **Game Editor** (`/admin/games/[id]`) - 8 tabs: Details, Taxonomy, Documents, Content, Sources, Puffin, Media, Purchase
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
