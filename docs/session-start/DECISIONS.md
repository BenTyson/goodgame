# Locked Decisions

> These decisions are final. Do not re-debate or change without explicit user approval.

## Tech Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14+ App Router | Dynamic features, Railway deployment |
| Database | Supabase (PostgreSQL) | Managed, auth-ready, good DX |
| Hosting | Railway | User preference |
| UI Library | shadcn/ui + Tailwind CSS 4 | Modern, customizable, accessible |
| PDF Generation | jsPDF (client-side) | No server costs, instant generation |
| Search | Supabase full-text search | Built-in, no additional service |

## Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Game metadata | Supabase database | Queryable, filterable |
| Game content | TypeScript objects (inline) | Simpler than MDX, works with mock data |
| Score sheet config | Supabase database | Dynamic, per-game customization |
| User accounts | Google OAuth + shelf feature | Track owned/wanted games with ratings |
| Local dev port | 3399 | User preference |
| Image storage | Supabase Storage (planned) | Currently using BGG URLs for development |
| Remote images | BoardGameGeek CDN | `cf.geekdo-images.com` configured in next.config.ts |
| AI Model | `claude-3-5-haiku-20241022` | Fast, cost-effective for content generation |

## Content

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content source | Original, hand-written | Quality control, no legal issues |
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
| YouTube API | Data API v3 (search + videos) | Video search in admin Media tab |
| YouTube thumbnails | `img.youtube.com/vi/{id}/mqdefault.jpg` | Free, no API call needed |

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
| Game detail tabs | 2 tabs (Pipeline + Details) | Review tab removed, editing in Game Editor |
| Sources data | Hidden in drawer | Rarely used, clutters main UI |
| Blocked states | Prominent amber/red banners | Errors must be unmissable |
| Family header | Only for multi-game families | Single-game families don't need it |
| Auto-selection | First family + first game on load | No empty welcome screen |
| Batch actions | Dropdown in family header | Prominent but not cluttering sidebar |
| Publishing | Updates `is_published` flag | Game actually goes live on main site |
| Button hierarchy | Ghost default, solid for Publish only | Reduces visual noise |
| Model selector | Only at `taxonomy_assigned` | Choose before generation, not after |
| Status colors | Orange for "recommended" | Blue reserved for processing/active states |
| Status display | CompactStatusCard (collapsible) | Single-line summary, expandable details |
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
| Development images | BoardGameGeek URLs | Real images without hosting cost during dev |
| Production images | Supabase Storage | Self-hosted, no external dependencies |
| Image types | cover, hero, gallery, setup, gameplay, components | Categorized for different uses |
| Profile images | Supabase Storage (`user-profiles` bucket) | Custom avatars |

## What NOT to Build (MVP)

- ~~User accounts / authentication~~ ✅ Built
- Community features (comments, forums)
- ~~Game ratings / reviews~~ ✅ Built (personal ratings on shelf)
- ~~User profiles~~ ✅ Built (card-based layout, avatars, stats, badges)
- ~~Top 10 rankings~~ ✅ Built (drag & drop editor)
- Mobile app
- ~~BGG data scraping~~ ✅ Built (import pipeline)
- ~~Game recommendations~~ ✅ Built (wizard + AI at `/recommend`)
- Premium/paid tier
- ~~Dark mode theme~~ ✅ Built (theme toggle)
