# Locked Decisions

> These decisions are final. Do not re-debate or change without explicit user approval.

## Gotchas (Common Mistakes)

- **Auth Architecture** (CRITICAL - read before touching auth):
  - All auth MUST use `@supabase/ssr` for cookie-based sessions
  - Browser client (`client.ts`): `createBrowserClient` from `@supabase/ssr`
  - Server client (`server.ts`): `createServerClient` from `@supabase/ssr`
  - **NEVER use `@supabase/supabase-js` for browser auth** - it stores in localStorage which conflicts with server cookies
  - Key files:
    - `src/lib/supabase/client.ts` - Browser client (cookies)
    - `src/lib/supabase/server.ts` - Server client (cookies)
    - `src/lib/auth/AuthContext.tsx` - Client-side auth state
    - `src/middleware.ts` - Session refresh on requests
    - `src/app/auth/callback/route.ts` - OAuth callback handler
  - AuthContext rules:
    - Don't `await` profile fetch in `onAuthStateChange` - it blocks `isLoading`
    - Set `isLoading = false` immediately when user is detected
    - Profile fetch should be non-blocking (fire and forget)
  - If auth breaks again, check: Are browser and server both using cookies? Is anything using localStorage?
- **Supabase FK ambiguity**: Use explicit syntax `games!games_family_id_fkey` to avoid PGRST201 errors
- **Barrel exports**: New components must be added to the folder's `index.ts`
- **Build check**: Always run `npm run build` after changes - catches errors lint misses
- **File creation**: Prefer editing existing files over creating new ones
- **Migrations**: Check highest migration number first (`ls supabase/migrations | tail -1`) to avoid collisions
- **No emojis**: Use Lucide icons, never emojis in UI
- **Type regeneration**: After schema changes run `npx supabase gen types typescript --linked > src/types/supabase.ts`
- **File uploads need middleware exclusion**: Upload API routes must be excluded from middleware matcher or FormData parsing fails. See `src/middleware.ts` matcher regex.
- **Large uploads need body size config**: Add `experimental.serverActions.bodySizeLimit: '50mb'` to `next.config.ts` for PDFs >1MB.
- **Published status check**: Use `is_published` flag, NOT `vecna_state === 'published'`. Games can be published via Game Editor without going through Vecna pipeline, causing these values to diverge.
- **Base game regeneration invalidates expansions**: When base game `rules_content` is regenerated, all its expansions automatically reset to `taxonomy_assigned` state. This ensures expansions use fresh base game context. See `generate-content/route.ts`.
- **Parent-child unified save with forwardRef**: When a parent needs to trigger save on a child component, use `forwardRef` + `useImperativeHandle` to expose a `save()` function. See `TaxonomyTab.tsx` (child) and `GameEditor.tsx` (parent with `taxonomyRef.current.save()`).
- **PDF thumbnails render washed out**: `unpdf` renders PDFs with transparent backgrounds, causing colors to appear faded. Use `addWhiteBackground()` in `src/lib/rulebook/thumbnail.ts` to composite onto white before saving.
- **BGG API requires authentication**: BGG XML API v2 now requires Bearer token authentication. Register at `boardgamegeek.com/applications` to get a token. Set `BGG_API_TOKEN` env var. Without it, all API calls return HTTP 401.
- **Puffin service architecture**: BGG data flows through Puffin intermediary service to reduce risk of BGG blocking Boardmello. Set `PUFFIN_ENABLED=true` with `PUFFIN_API_URL` and `PUFFIN_API_KEY` to activate. **No BGG fallback** - if Puffin doesn't have a game, it queues it for fetch and returns pending status. Boardmello retries with 30s window. See `src/lib/bgg/client.ts`.
- **BGG expansion/implementation parsing**: Expansion detection uses item `type` attribute (not link `inbound`). If `type='boardgameexpansion'`, expansion links point to base game. Implementation `inbound=true` means OTHER games reimplement THIS one (we're the original). Key files: Puffin `src/worker/bgg-fetcher.ts`, Boardmello `src/lib/bgg/client.ts`.
- **Railway migrations need public DB URL**: Railway's internal DB hostname (`*.railway.internal`) only works within Railway's network. For running migrations locally, use the `DATABASE_PUBLIC_URL` (has `proxy.rlwy.net` hostname instead).
- **RelationType additions require multiple file updates**: Adding a new relation type (like `promo_of`) requires updates to 5+ `Record<RelationType, string>` objects: `database.ts` (4 objects), `AutoLinkRelations.tsx`, `family-tree/types.ts`, `GameRelationsSection.tsx`, `family-queries.ts`. TypeScript won't catch missing entries if the Record uses optional values.
- **PostgreSQL function return types must match exactly**: When creating `RETURNS TABLE(...)` functions, column types must match the actual table column types exactly. Example: if `user_profiles.custom_avatar_url` is `VARCHAR(500)`, the function must return `VARCHAR(500)` not `TEXT`. Type mismatches cause `42804` errors ("structure of query does not match function result type"). To fix, must `DROP FUNCTION` first then recreate with correct types.
- **RPC functions need GRANT and SECURITY DEFINER**: Database functions called via `supabase.rpc()` need `GRANT EXECUTE ON FUNCTION ... TO authenticated, anon` for access. Functions querying across tables with RLS need `SECURITY DEFINER` to bypass row-level security.
- **RLS policies must avoid self-referencing EXISTS**: A SELECT policy on `table_participants` that uses `EXISTS (SELECT 1 FROM table_participants WHERE ...)` causes infinite recursion. Use simple conditions like `user_id = auth.uid()` or make the SELECT policy public (`USING (true)`) and control access at the tables level.
- **Server components need server client for RLS**: Query functions in `src/lib/supabase/*-queries.ts` use browser client by default. When called from server components (pages, generateMetadata), pass the server client as parameter or RLS checks fail with empty results. Pattern: `getTableWithDetails(id, userId, supabase)` where `supabase = await createClient()` from server.ts.
- **Graceful migration degradation**: When adding features that require new migrations, query functions should silently return empty arrays/null when tables/columns/RPC functions don't exist yet. This allows code to deploy before migrations are applied without breaking the app. Pattern: wrap queries in try/catch and return `[]` or `null` on error. See `table-queries.ts` for examples (getNearbyTables, getFriendsUpcomingTables, getTableComments, getTableRecap).
- **Mapbox token env variable**: Use `NEXT_PUBLIC_MAPBOX_TOKEN` consistently. The Mapbox Geocoder widget uses different naming (`accessToken`), so check component code carefully. Key files: `MapView.tsx`, `LocationPicker.tsx`.
- **Mapbox popup styling needs explicit colors**: CSS variables (`hsl(var(--foreground))`) don't work inside Mapbox popups because they render in a separate DOM context. Use explicit color values like `#ffffff` or `#1a1a1a`. See `MapView.tsx` popup styles.
- **Admin API routes need admin client for cross-table queries**: Admin API routes that query across tables (e.g., checking if games exist by bgg_id) should use `createAdminClient()` not `createClient()`. The user-scoped client respects RLS policies which may filter results unexpectedly. Key file: `src/app/api/admin/puffin/games/route.ts`.
- **Family processing needs locks for concurrency**: Family processing can race if triggered multiple times (e.g., UI click + auto-process). Use `acquireProcessingLock()` and `releaseProcessingLock()` from `src/lib/vecna/processing.ts`. Locks expire after 30 minutes as safety. Uses RPC functions in `00092_processing_lock.sql`.
- **Taxonomy step was no-op until Phase 92**: Before Phase 92, the taxonomy step only changed state without applying suggestions. Now `runTaxonomyStep()` auto-accepts high-confidence (≥70%) suggestions to junction tables (`game_themes`, `game_player_experiences`). Key file: `src/lib/vecna/processing.ts`.
- **Quality validation catches AI artifacts**: Generated content must be validated before publishing. `validateAllContent()` in `src/lib/vecna/quality.ts` detects AI artifacts ("I'll", "Let me", "As an AI") and placeholders ([brackets], TODO, TBD). Use `/api/admin/vecna/[gameId]/validate` endpoint.
- **Taxonomy inserts need source tracking**: All taxonomy junction tables (`game_themes`, `game_player_experiences`, `game_categories`, `game_mechanics`) have a `source` column. Always include `source: 'bgg'` (importer), `'ai'` (Vecna), or `'manual'` (admin) when inserting. Key files: `src/lib/bgg/importer.ts`, `src/lib/vecna/processing.ts`, `src/app/api/admin/games/taxonomy/route.ts`.
- **Large file uploads need direct-to-storage pattern**: Server-side buffering of large files (>10MB PDFs) causes memory issues on Railway. Use signed URLs for direct client-to-Supabase upload: 1) Server generates signed URL via `createSignedUploadUrl()`, 2) Client uploads directly to storage, 3) Server confirms and updates DB. Key files: `src/app/api/admin/rulebook/signed-url/route.ts`, `src/app/api/admin/rulebook/confirm/route.ts`.
- **Static game pages with cookies need force-dynamic**: Game pages using `isAdmin()` (which calls `cookies()`) will fail during static generation with `DYNAMIC_SERVER_USAGE` error. Add `export const dynamic = 'force-dynamic'` to the page. Key file: `src/app/games/[slug]/page.tsx`.

## Tech Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Dynamic features, Railway deployment |
| Database | Supabase (PostgreSQL) | Managed, auth-ready, good DX |
| Hosting | Railway | User preference |
| UI Library | shadcn/ui + Tailwind CSS 4 | Modern, customizable, accessible |
| PDF Generation | jsPDF (client-side) | No server costs, instant generation |
| Search | Supabase full-text search | Built-in, no additional service |

## Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Game metadata | Supabase database | Queryable, filterable |
| Game content | Supabase database + AI generation | Vecna pipeline generates from rulebooks |
| Score sheet config | Supabase database | Dynamic, per-game customization |
| User accounts | Google OAuth + shelf feature | Track owned/wanted games with ratings |
| Local dev port | 3399 | User preference |
| Image storage | Supabase Storage | Primary storage for uploaded/cropped images |
| Remote images | Wikimedia Commons + BGG CDN | `upload.wikimedia.org` + `cf.geekdo-images.com` in next.config.ts |
| Game PDFs | `rulebooks` bucket, `game_documents` table | Official Rulebook in `games` table (special parsing); supplementary docs in `game_documents` |
| AI Model | `claude-3-5-haiku-20241022` | Fast, cost-effective for content generation |

## Content

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content source | AI-generated from rulebooks | Vecna pipeline parses PDFs, Claude generates content |
| Rules length | 500-1000 words max | Scannable, not overwhelming |
| Score sheets | Print on single page | Practical for game night |
| Reference cards | One page max | Quick reference at table |

## Monetization

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary revenue | Display ads (AdSense) | Passive, scales with traffic |
| Secondary revenue | Amazon affiliate links | Natural fit for game pages |
| Tracking | UTM parameters from day 1 | Enable affiliate network later |

## UI/UX Design

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme | Light and dark mode | User toggle available |
| Primary color | **Fresh teal** (`oklch(0.55 0.15 195)`) | Modern, energetic, approachable |
| Background | Clean white | Lets content shine, professional |
| Color palette | **Monochromatic teal** | Unified look, no rainbow of colors |
| Logo icon | **Dices** (lucide-react) | Board game appropriate (not video game controller) |
| Mobile-first | Yes | Game night use case |
| Print styles | Required | Score sheets must print clean |
| Search | Cmd+K command palette | Modern, fast |
| Main navigation | Games, Publishers, Awards, Categories, Feed, Shelf, Recommend | Streamlined, Recommend as featured button |
| Emoji usage | **Never use emoji** in UI | User preference, prefer clean Lucide icons |

## Game Recommendation Engine

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Route | `/recommend` | Clear, memorable URL |
| Question count | 5 adaptive questions | Enough signal without fatigue |
| Question styles | Mixed (scenario cards, slider) | Engaging variety |
| Algorithm | Hybrid (rule-based + AI) | Reliability with intelligence |
| Personalization | Template fallback + Claude AI | Works even without API |
| Archetype reveal | Fun personality reveal | Memorable, shareable |
| Results count | Top 3 + 4 "also consider" | Focused but options available |
| Theme question | Skip for social games | Party games are theme-light |
| Nav placement | Featured pill button after Shelf | Prominent but not intrusive |

## External APIs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| BGG data | **Puffin intermediary service** | Separate service caches BGG data, reduces blocking risk |
| BGG direct fallback | Bearer token auth required | Register at `boardgamegeek.com/applications` |
| YouTube API | Data API v3 (search + videos) | Video search in admin Media tab |
| YouTube thumbnails | `img.youtube.com/vi/{id}/mqdefault.jpg` | Free, no API call needed |

### Puffin Service

| Config | Value |
|--------|-------|
| Repository | `github.com/BenTyson/puffin` (separate from Boardmello) |
| Production URL | `https://puffin-production.up.railway.app` |
| Port | 2288 |
| Tech Stack | Node.js + Express + PostgreSQL |
| Rate Limiting | 1.1s between BGG requests, max 20 IDs per batch |
| Auth | API key via `Authorization: Bearer {API_KEY}` header |

**Environment Variables (Boardmello):**
- `PUFFIN_ENABLED` - Set to `true` to use Puffin
- `PUFFIN_API_URL` - Puffin API base URL (e.g., `https://puffin-production.up.railway.app/api/v1`)
- `PUFFIN_API_KEY` - API key for Puffin authentication
- `BGG_API_TOKEN` - BGG API token (used for direct fallback)

## AI-Powered Data Enrichment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wikipedia enrichment | Family admin page (not import) | Interactive review before linking |
| Wikipedia AI model | Claude Haiku | Fast, cost-effective for extraction |
| Wikipedia API | MediaWiki API | Official, well-documented |
| Game matching | Exact → Fuzzy → BGG ID | Multiple strategies for accuracy |
| Auto-link relations | AI analyzes Wikipedia article | Extracts expansion_of, sequel_to, etc. |
| Relation confidence | High/Medium/Low levels | Admin reviews before creating |
| Auto-select | High confidence only | Safe default, admin can add more |
| Import → Family nav | Single-family imports route to family page | Family config before game wizard |

## Vecna Pipeline UI

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State visualization | 4 phases (Import/Parse/Generate/Publish) | Simpler than 11 raw states |
| Game panel | Single Pipeline view (no tabs) | Details tab removed - editing in Game Editor |
| Sources data | Hidden in drawer | Rarely used, clutters main UI |
| Blocked states | Prominent amber/red banners | Errors must be unmissable |
| Family header | Only for multi-game families | Single-game families don't need it |
| Auto-selection | First family + first game on load | No empty welcome screen |
| Batch actions | Dropdown in family header | Prominent but not cluttering sidebar |
| Publishing | Happens in Game Editor only | Vecna ends at "generated" state |
| Button hierarchy | Ghost default | Solid buttons removed (no Publish) |
| Model selector | Only at `taxonomy_assigned` | Choose before generation, not after |
| Status colors | Orange for "recommended" | Blue reserved for processing/active states |
| Error display | Critical errors only | Removed percentage/recommendations |
| Reset actions | Two groups: Data Refresh + Pipeline Resets | Clear separation of concerns |
| Phase filters | Ghost buttons with subtle selected state | Segmented control pattern |
| Color system | Centralized in `ui-theme.ts` | STATUS_COLORS with full dark mode |

## Marketplace UI/UX

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout pattern | Sidebar + main content (Faire-inspired) | Modern, efficient use of space |
| Sidebar width | 240px desktop, 64px tablet, drawer on mobile | Responsive breakpoints |
| Quick links | Link to dashboard tabs, not standalone pages | Centralized seller experience |
| Dashboard deep linking | `?tab=` URL parameter | Shareable, bookmarkable states |
| Filter embedding | `embedded` prop on MarketplaceFilterSidebar | Reusable in sidebar wrapper |
| Saved searches | Separate page (not dashboard tab) | Discovery feature, different context |
| Mobile pattern | Hamburger drawer overlay | Consistent across browse/dashboard |

## Games Page UI/UX

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout pattern | Sidebar + main content (matches marketplace) | Site-wide consistency |
| Sidebar header | "The Games" with Dice5 icon | Descriptive, appropriate icon |
| Search bar | Prominent, 48px height, top of main content | Easy discoverability |
| Search + filters | Combined via URL params (`?q=...&categories=...`) | Bookmarkable, shareable |
| Filter embedding | `embedded` prop on FilterSidebar | Reusable in sidebar wrapper |
| Mobile pattern | Hamburger drawer overlay | Consistent with marketplace |
| No page header | Removed "All Games" header/description | Redundant with sidebar header |
| Hero image ratio | 4:3 aspect ratio | Matches primary image crop ratio |

## Rating System

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rating scale | 1-10 points | Standard board game rating scale |
| Visual style | 3D spheres (marbles) | Board-game themed, not traditional stars |
| Sphere rendering | SVG with radial gradients | Crisp at any size, 3D depth effect |
| Rating storage | `user_games.rating` column | Existing table, no new schema needed |
| Auto-shelf behavior | Add as "played" status | Rating implies you've played the game |
| Auth flow | Click triggers login, then rate | Seamless UX, no modal interruption |
| Aggregate display | Below personal rating | Shows community consensus |

## Legal Data Sourcing Strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary data source | Wikidata (CC0) | Legally bulletproof, public domain |
| Secondary source | Publisher rulebook PDFs | Primary sources, original parsing |
| Tertiary source | Publisher partnerships | Official data with permission |
| BGG data | **Never scrape** | ToS violation, legal risk |
| BGG IDs | Keep for linking only | Cross-reference, "View on BGG" links |
| Image strategy | Publisher partnerships + user uploads | No BGG image scraping |
| Complexity score | **Crunch Score** (1-10 scale) | AI-generated from rulebooks, calibrated with BGG weight |
| User BGG data | Collection import via API | User-initiated, their own data |
| Data provenance | Track per-game `data_source` field | Legal audit trail |
| Seed data import | Factual data only (names, player counts, etc.) | Facts not copyrightable |

### What's Safe to Use (Facts)
- Game names, publication years
- Player count, play time, minimum age
- Designer/publisher/artist names
- Category/mechanic concepts (not BGG's taxonomy)
- Award winners (public record)

### What's Proprietary to BGG (Avoid)
- Weight/complexity scores (user-submitted)
- Ratings and rankings
- User-submitted descriptions
- BGG's specific data structure

### Design History
- ~~Dark mode with purple primary~~ - Changed to teal primary, dark mode now supported
- ~~Rainbow content type colors~~ - Removed (visual chaos, replaced with unified teal)
- ~~Gamepad2 icon~~ - Replaced with Dices (video game controller inappropriate for board games)
- ~~Rules/Score Sheets in nav~~ - Removed (redundant, just filtered game lists; pages kept for SEO)
- ~~Publisher initials with rainbow colors~~ - Changed to muted grays (less harsh on eyes)
- ~~Emoji in shelf dropdown/keytags~~ - Replaced with Lucide icons (cleaner, more professional)
- ~~Profile header/banner images~~ - Removed in V3 redesign (clean card-based layout, Airbnb-inspired)
- ~~Content badges at bottom of game cards~~ - Removed (redundant with hover badges, saves vertical space)
- ~~Categories link to /categories/[slug]~~ - Changed to link to `/games?categories={slug}` (uses filter UI, less redundancy)

## Images

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Image gallery | Custom ImageGallery component | Lightbox, thumbnails, navigation |
| Primary images | Wikimedia Commons | CC-licensed, legally safe |
| Uploaded images | Supabase Storage | Self-hosted, cropped versions |
| Image types | cover, hero, gallery, setup, gameplay, components | Categorized for different uses |
| Profile images | Supabase Storage (`user-profiles` bucket) | Custom avatars |

## Not Building (Out of Scope)

- Community features (comments, forums)
- Mobile app
- Premium/paid tier
