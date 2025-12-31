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
| Theme | **Light mode only** | Cleaner, simpler, better readability |
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

## Legal Data Sourcing Strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary data source | Wikidata (CC0) | Legally bulletproof, public domain |
| Secondary source | Publisher rulebook PDFs | Primary sources, original parsing |
| Tertiary source | Publisher partnerships | Official data with permission |
| BGG data | **Never scrape** | ToS violation, legal risk |
| BGG IDs | Keep for linking only | Cross-reference, "View on BGG" links |
| Image strategy | Publisher partnerships + user uploads | No BGG image scraping |
| Complexity score | **Board Nomads Complexity Score (BNCS)** | AI-generated from rulebooks (differentiator) |
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
- ~~Dark mode with purple primary~~ - Removed (too harsh, brown/purple mix didn't work)
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
- Dark mode theme
