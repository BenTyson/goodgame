# Current Status

> Last Updated: 2026-01-15

## Current Phase: 78 - Puffin BGG Intermediary Service (IN PROGRESS)

### Session 4 (2026-01-15) - Platform Rebrand: Board Nomads → Boardmello

**What was done:**
- Renamed platform from "Board Nomads" to "Boardmello" across entire codebase
- Updated all user-facing text, metadata, and SEO references
- Updated User-Agent strings in all external API clients
- Updated all documentation files

**Files Modified (30+ source files):**
| Area | Files | Changes |
|------|-------|---------|
| Layout/SEO | `layout.tsx`, `Header.tsx`, `Footer.tsx`, `json-ld.tsx` | Site name, copyright, SITE_NAME constant |
| Auth | `login/page.tsx`, `LoginContent.tsx`, `admin/login/page.tsx` | Login page titles and branding |
| Pages | Profile, Feed, Marketplace, Recommend pages | Metadata titles |
| Components | `UsernameInput.tsx` | Reserved username, profile URL display |
| SEO | `robots.ts`, `sitemap.ts` | Fallback URLs to boardmello.com |
| AI Prompts | `rulebook/prompts.ts`, `recommend/prompts.ts` | Voice and branding in AI system prompts |
| API Clients | `wikipedia/client.ts`, `wikidata/client.ts`, `wikimedia-commons/client.ts`, `bgg/client.ts`, `rulebook/discovery.ts`, `rulebook/thumbnail.ts` | User-Agent strings |
| Types | `database.ts`, `wikidata/importer.ts` | Comments referencing platform name |

**Documentation Updated:**
- `docs/session-start/` - README, CURRENT-STATUS, DECISIONS, QUICK-REFERENCE
- `docs/INDEX.md`, `docs/DEPLOYMENT.md`, `docs/STRIPE-SETUP.md`
- `docs/EXPANSION-ROADMAP.md`, `docs/archive/phases/PHASES-29-34.md`

**Pending Infrastructure Changes:**
| Service | Changes Needed |
|---------|----------------|
| Railway | Add custom domain `boardmello.com`, update `NEXT_PUBLIC_SITE_URL` env var |
| DNS | Configure CNAME/A records pointing to Railway |
| Supabase (Production) | Update Site URL and Redirect URLs |
| Google Cloud Console | Add `boardmello.com` to OAuth authorized origins |
| Stripe | Update webhook endpoint URL |

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
