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
| Main navigation | Games, Publishers, Awards, Categories, Collections, Shelf | Streamlined, no redundant links |
| Emoji usage | **Never use emoji** in UI | User preference, prefer clean Lucide icons |

### Design History
- ~~Dark mode with purple primary~~ - Removed (too harsh, brown/purple mix didn't work)
- ~~Rainbow content type colors~~ - Removed (visual chaos, replaced with unified teal)
- ~~Gamepad2 icon~~ - Replaced with Dices (video game controller inappropriate for board games)
- ~~Rules/Score Sheets in nav~~ - Removed (redundant, just filtered game lists; pages kept for SEO)
- ~~Publisher initials with rainbow colors~~ - Changed to muted grays (less harsh on eyes)
- ~~Emoji in shelf dropdown/keytags~~ - Replaced with Lucide icons (cleaner, more professional)

## Images

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Image gallery | Custom ImageGallery component | Lightbox, thumbnails, navigation |
| Development images | BoardGameGeek URLs | Real images without hosting cost during dev |
| Production images | Supabase Storage | Self-hosted, no external dependencies |
| Image types | cover, hero, gallery, setup, gameplay, components | Categorized for different uses |
| Profile images | Supabase Storage (`user-profiles` bucket) | Header banners and custom avatars |

## What NOT to Build (MVP)

- ~~User accounts / authentication~~ ✅ Built
- Community features (comments, forums)
- ~~Game ratings / reviews~~ ✅ Built (personal ratings on shelf)
- ~~User profiles~~ ✅ Built (with header images, avatars, stats, badges)
- ~~Top 10 rankings~~ ✅ Built (drag & drop editor)
- Mobile app
- ~~BGG data scraping~~ ✅ Built (import pipeline)
- Premium/paid tier
- Dark mode theme
