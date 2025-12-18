# GOOD GAME - Session Start Document

> **Last Updated**: 2025-12-14
> **Current Phase**: Queued
> **Project Repo**: Not yet created
> **Project Name**: Good Game
> **Tagline**: "GG" (working title)

---

## 1. Quick Context

**What**: A board game directory and tools hub with beautiful UX - combining game discovery, rules summaries, printable score sheets, and quick reference cards.

**Revenue Model**: Display ads + affiliate links (Amazon, game stores)

**Why This Will Work**: BGG has the data but terrible UX. We focus on utility (play aids) over community (forums), with a modern, clean interface.

**Target Revenue**: $500-2K/month

**Passivity Score**: 9/10 - Static content, no accounts, no scraping, add games over time

---

## 2. Full Project Vision

### What We're Building

A comprehensive board game reference site with four pillars:

1. **Game Directory** - Browse and search games with modern UI, smart filters, categories
2. **Rules Summaries** - Condensed "how to play" guides (500-1000 words, scannable)
3. **Printable Score Sheets** - Custom PDFs generated in-browser for each game
4. **Quick Reference Cards** - Setup guides, turn order, scoring summaries, iconography

### The Problem We're Solving

**For new players:**
- Rules are buried in 20-page manuals
- Score pads run out or get lost
- Setup takes forever without a guide

**For game hosts:**
- Teaching games is tedious
- Need quick refreshers before game night
- Want printable aids for the table

**For everyone:**
- BGG is comprehensive but overwhelming and ugly
- Existing rules sites are cluttered with ads
- Score sheets are scattered across BGG files, Etsy, random PDFs

### Why It Will Succeed

1. **Proven SEO model** - Same playbook as Crunch/Clutch
2. **Personal passion** - You love board games (motivation matters for content quality)
3. **Clear gap** - No one owns "beautiful board game reference"
4. **High intent traffic** - "how to play wingspan" = someone about to play
5. **Natural affiliate** - Every game page links to buy the game
6. **Evergreen content** - Rules don't change (usually)

### Target Users

**Primary:**
- Board game hobbyists (own 20+ games)
- Game night hosts
- People learning new games

**Secondary:**
- Parents introducing games to kids
- Teachers using games in education
- Casual players at cafes/bars with board games

### Key Differentiators

| Competitor | Their Approach | Good Game Advantage |
|------------|----------------|---------------------|
| BoardGameGeek | Everything, cluttered | Focused utility, beautiful UX |
| UltraBoardGames | Rules + ads | Cleaner design, score sheets |
| Random PDFs | Scattered, inconsistent | One destination, consistent quality |
| BG Stats App | App-only, tracking focus | Web-first, reference focus |

### Success Metrics

| Metric | 6 Month | 12 Month |
|--------|---------|----------|
| Games Covered | 50 | 150 |
| Monthly Pageviews | 30K | 100K |
| Score Sheet Downloads | 5K | 20K |
| Monthly Revenue | $200-500 | $500-2K |

---

## 3. Technical Architecture

### Stack Decisions (FINAL)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Astro** | SSG, same as Crunch/Clutch, proven |
| Styling | **Tailwind CSS** | Consistent with portfolio |
| Hosting | **Cloudflare Pages** | Free, fast, edge-hosted |
| Analytics | **Plausible** | Privacy-focused |
| PDF Generation | **jsPDF** or **react-pdf** | Client-side, no server costs |
| Search | **Pagefind** | Static site search, no backend |
| Images | **Cloudflare Images** or **local** | Game box art (fair use for reference) |

### Data Strategy

**Option A: Manual Curation (Recommended for MVP)**
- Hand-write content for each game
- Higher quality, more control
- Start with 50 games, expand based on demand

**Option B: BGG API Integration (Future)**
- Pull basic game data (player count, time, weight)
- Still write rules/sheets manually
- API: https://boardgamegeek.com/wiki/page/BGG_XML_API2

**Recommendation:** Start manual, add BGG data layer later for metadata.

### URL Structure

```
goodgame.guide/ (or similar)
├── /                              # Homepage with featured games + search
├── /games/                        # All games A-Z
├── /games/[slug]/                 # Game hub page
│   ├── /games/catan/              # Catan overview
│   ├── /games/catan/rules/        # How to play Catan
│   ├── /games/catan/score-sheet/  # Printable score sheet
│   ├── /games/catan/setup/        # Setup guide
│   └── /games/catan/reference/    # Quick reference card
├── /score-sheets/                 # Browse all score sheets
├── /rules/                        # Browse all rules summaries
├── /categories/
│   ├── /categories/strategy/
│   ├── /categories/family/
│   ├── /categories/party/
│   ├── /categories/cooperative/
│   └── /categories/two-player/
├── /collections/
│   ├── /collections/gateway-games/
│   ├── /collections/under-30-minutes/
│   └── /collections/best-at-2-players/
└── /about/
```

### Content Structure Per Game

Each game gets a hub page + 3-4 subpages:

```
/games/wingspan/
├── index        # Overview: box info, description, links to subpages
├── rules        # How to Play (500-1000 words, scannable)
├── score-sheet  # Interactive PDF generator
├── setup        # Visual setup guide with component checklist
└── reference    # Turn structure, actions, scoring, iconography
```

### Game Data Model

```typescript
interface Game {
  slug: string;
  name: string;
  tagline: string;           // "The bird-collecting engine builder"

  // Basic info
  playerCount: { min: number; max: number; best: number[] };
  playTime: { min: number; max: number };  // minutes
  age: number;               // minimum age
  weight: number;            // 1-5 complexity scale

  // Categorization
  categories: string[];      // strategy, family, party, etc.
  mechanics: string[];       // deck building, worker placement, etc.
  themes: string[];          // nature, sci-fi, medieval, etc.

  // Content flags
  hasRules: boolean;
  hasScoreSheet: boolean;
  hasSetupGuide: boolean;
  hasReference: boolean;

  // Links
  bggId?: number;
  amazonLink?: string;
  publisherLink?: string;

  // Meta
  yearPublished: number;
  designer: string[];
  publisher: string;
}

interface ScoreSheetConfig {
  gameSlug: string;
  playerMin: number;
  playerMax: number;
  fields: ScoreField[];
  layout: 'table' | 'grid' | 'custom';
}

interface ScoreField {
  name: string;
  type: 'number' | 'checkbox' | 'text';
  perPlayer: boolean;
  description?: string;
}
```

### Score Sheet PDF Generation

```typescript
// Client-side PDF generation flow
function generateScoreSheet(game: Game, players: string[]) {
  // 1. User enters player names
  // 2. Select player count
  // 3. Generate PDF with jsPDF
  // 4. Download or print directly

  const doc = new jsPDF();
  doc.text(`${game.name} Score Sheet`, 10, 10);
  // ... render game-specific scoring layout
  doc.save(`${game.slug}-score-sheet.pdf`);
}
```

---

## 4. Game Inventory

### Pilot Games (Phase 1 - Top 10)

Must-haves for launch - highest search volume, most requested:

| Game | Category | Why Include |
|------|----------|-------------|
| Catan | Strategy | Gateway classic, huge search volume |
| Wingspan | Strategy | Modern hit, complex scoring |
| Ticket to Ride | Family | Gateway game, score tracking needed |
| Azul | Abstract | Pattern scoring is confusing |
| Codenames | Party | Rules confusion is common |
| 7 Wonders | Strategy | Complex scoring system |
| Splendor | Strategy | Simple but needs tracker |
| Pandemic | Cooperative | Setup questions common |
| Carcassonne | Strategy | Field scoring confuses everyone |
| Terraforming Mars | Strategy | Complex, long, needs reference |

### Phase 2 Games (11-35)

| Game | Category |
|------|----------|
| Dominion | Deck Building |
| Scythe | Strategy |
| Everdell | Strategy |
| Root | Asymmetric |
| Gloomhaven | Campaign |
| Spirit Island | Cooperative |
| Agricola | Worker Placement |
| Puerto Rico | Strategy |
| Brass Birmingham | Economic |
| Ark Nova | Strategy |
| Cascadia | Family |
| The Crew | Cooperative |
| Mysterium | Party |
| Dixit | Party |
| Sushi Go | Family |
| Love Letter | Filler |
| Patchwork | Two-Player |
| Jaipur | Two-Player |
| 7 Wonders Duel | Two-Player |
| Star Realms | Deck Building |
| Race for the Galaxy | Strategy |
| Concordia | Strategy |
| Viticulture | Worker Placement |
| Great Western Trail | Strategy |
| Clank! | Deck Building |

### Phase 3+ (50-150 games)

Expand based on:
- Search Console data (what are people searching for?)
- User requests
- New popular releases
- Long-tail opportunities

---

## 5. Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Deliverables:**
- [ ] Astro project setup with Tailwind
- [ ] Base game page template
- [ ] Game hub layout component
- [ ] Rules page template
- [ ] Score sheet PDF generator (basic)
- [ ] Homepage with game grid
- [ ] 10 pilot games fully built out:
  - Each with: overview, rules, score sheet, setup, reference

**Definition of Done:**
- Site deploys to Cloudflare Pages
- All 10 games have complete content
- Score sheets generate and download
- Mobile responsive
- Lighthouse 90+

### Phase 2: Content Expansion (Week 3-4)

**Deliverables:**
- [ ] 25 more games (35 total)
- [ ] Category landing pages
- [ ] Collections pages (gateway games, quick games, etc.)
- [ ] Search functionality (Pagefind)
- [ ] Internal linking optimization
- [ ] Related games component

**Definition of Done:**
- 35 games with full content
- Category/collection browsing works
- Search returns relevant results

### Phase 3: Polish & Monetize (Week 5-6)

**Deliverables:**
- [ ] Google AdSense integration
- [ ] Amazon affiliate links on all game pages
- [ ] Print-friendly CSS for score sheets
- [ ] SEO optimization (meta tags, schema)
- [ ] Sitemap submission
- [ ] Open Graph images for sharing

**Definition of Done:**
- Ads displaying appropriately
- Affiliate links tracking
- All pages indexed

### Phase 4: Scale (Week 7+)

**Deliverables:**
- [ ] Expand to 50+ games
- [ ] Monitor Search Console for opportunities
- [ ] Add games based on demand
- [ ] Optimize top-performing pages
- [ ] Consider BGG API integration for metadata

---

## 6. Critical Files Reference

```
goodgame/
├── src/
│   ├── components/
│   │   ├── GameCard.astro          # Game preview card
│   │   ├── GameGrid.astro          # Grid of game cards
│   │   ├── GameHeader.astro        # Game page header with info
│   │   ├── GameNav.astro           # Sub-navigation (rules, score, etc.)
│   │   ├── ScoreSheetGenerator.tsx # PDF generation (React island)
│   │   ├── SetupChecklist.astro    # Component checklist
│   │   ├── QuickReference.astro    # Reference card layout
│   │   ├── CategoryBadge.astro     # Category/mechanic badges
│   │   ├── BuyButton.astro         # Affiliate link button
│   │   └── Search.tsx              # Search component
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Site-wide layout
│   │   ├── GameLayout.astro        # Game page wrapper
│   │   └── ContentLayout.astro     # Rules/guide content layout
│   ├── pages/
│   │   ├── index.astro             # Homepage
│   │   ├── games/
│   │   │   ├── index.astro         # All games listing
│   │   │   └── [slug]/
│   │   │       ├── index.astro     # Game hub
│   │   │       ├── rules.astro     # How to play
│   │   │       ├── score-sheet.astro
│   │   │       ├── setup.astro
│   │   │       └── reference.astro
│   │   ├── categories/
│   │   │   └── [category].astro
│   │   ├── collections/
│   │   │   └── [collection].astro
│   │   ├── score-sheets.astro      # All score sheets
│   │   └── rules.astro             # All rules
│   ├── content/
│   │   └── games/                  # Markdown content per game
│   │       ├── catan/
│   │       │   ├── index.md        # Overview
│   │       │   ├── rules.md        # How to play
│   │       │   ├── setup.md        # Setup guide
│   │       │   └── reference.md    # Quick reference
│   │       ├── wingspan/
│   │       └── ...
│   ├── data/
│   │   ├── games.json              # Game metadata
│   │   ├── categories.json         # Category definitions
│   │   └── collections.json        # Curated collections
│   └── lib/
│       ├── pdf.ts                  # PDF generation utilities
│       ├── search.ts               # Search utilities
│       └── seo.ts                  # SEO helpers
├── public/
│   ├── images/
│   │   └── games/                  # Game box art
│   └── og-images/                  # Social share images
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

---

## 7. Context for AI Agents

### Instructions for New Sessions

1. **Read this entire document first**
2. **Check project-tracker.md** for current status
3. **This is a content-heavy project** - quality of rules/guides matters
4. **Do not re-debate decided decisions**
5. **Focus on the current phase** deliverables
6. **Update this document** at session end

### Decisions Already Made (DO NOT CHANGE)

- Stack: Astro + Tailwind + Cloudflare Pages
- Client-side PDF generation (no server)
- Manual content curation for MVP (no scraping)
- Four pillars: directory, rules, score sheets, reference
- No user accounts for MVP
- Ad + affiliate monetization

### Open Questions (Decide Later)

- Exact domain name
- BGG API integration (later, for metadata)
- Premium tier for ad-free printables
- Community submissions (probably not)
- Mobile app (probably not)

### Common Pitfalls to Avoid

1. **Don't scrape BGG** - Write original content
2. **Don't use copyrighted images without care** - Box art is generally fair use for reference
3. **Don't over-complicate score sheets** - Keep them clean and printable
4. **Don't write novel-length rules** - Condense to essentials
5. **Don't skip mobile testing** - Many users on phones
6. **Don't forget print CSS** - Score sheets must print cleanly

### Content Guidelines

**Rules pages should:**
- Be 500-1000 words max
- Use bullet points and headers
- Include "Quick Start" summary at top
- Link to official rules PDF
- Have clear turn structure

**Score sheets should:**
- Work for all player counts the game supports
- Include space for player names
- Have clear scoring categories
- Print on single page when possible
- Include game name and branding

**Setup guides should:**
- Have component checklist
- Show visual layout if helpful
- Note first-game setup vs subsequent
- Include common mistakes

**Reference cards should:**
- Fit on one page
- Include turn structure
- List all actions/options
- Have iconography legend
- Include scoring summary

---

## 8. Session Log

### 2025-12-14 - Initial Planning

- Researched board game tools landscape
- Identified gap: no beautiful, utility-focused hub
- Defined four pillars: directory, rules, score sheets, reference
- Named project "Good Game" (working title)
- Created this session-start document
- Next: Begin development or queue behind other projects

---

## Appendix: SEO Keyword Targets

### High Volume (Target First)

| Keyword Pattern | Example | Est. Monthly Searches |
|-----------------|---------|----------------------|
| "how to play [game]" | how to play catan | 10K-50K per game |
| "[game] rules" | wingspan rules | 5K-20K per game |
| "[game] score sheet" | ticket to ride score sheet | 1K-5K per game |
| "[game] setup" | pandemic setup | 1K-5K per game |

### Long Tail Opportunities

- "[game] scoring explained"
- "[game] quick reference"
- "[game] cheat sheet"
- "[game] player aid"
- "[game] turn order"
- "printable [game] score card"
- "[game] rules pdf"
- "how to score [game]"

### Category Keywords

- "best gateway board games"
- "board games for 2 players"
- "quick board games under 30 minutes"
- "board games like catan"
- "cooperative board games"

---

## Appendix: Affiliate Programs

### Amazon Associates
- 4-4.5% commission on board games
- Easy to implement
- Wide selection

### Game Store Affiliates
- **Miniature Market** - Check for program
- **CoolStuffInc** - Check for program
- **BoardGameBliss** - Check for program
- **Zatu Games** (UK) - Has affiliate program

### Publisher Direct
- Some publishers have direct affiliate programs
- Higher commission but more complex

---

## Appendix: Sample Rules Page Structure

```markdown
# How to Play Wingspan

> Build the best bird sanctuary and attract the most impressive birds.

## Quick Start (TL;DR)
- Take 1 of 4 actions per turn: play bird, gain food, lay eggs, draw cards
- Birds give you powers when you activate their habitat
- Most points from birds + bonus cards + end-of-round goals wins

## Setup
[Link to setup guide]

## Turn Structure
On your turn, do ONE of these:

### 1. Play a Bird
- Pay the food cost shown on the card
- Pay 1 egg per bird already in that row
- Place in matching habitat (forest, grassland, wetland)

### 2. Gain Food
- Roll dice in birdfeeder
- Take food matching dice you select
- Activate forest bird powers (left to right)

[... etc ...]

## Scoring
| Category | Points |
|----------|--------|
| Bird cards | Face value |
| Bonus cards | As printed |
| End-of-round goals | 1st: 5, 2nd: 3, 3rd: 2 |
| Eggs on birds | 1 each |
| Cached food | 1 each |
| Tucked cards | 1 each |

## Common Questions

**Q: Can I play a bird without paying eggs?**
A: Only if it's the first bird in that row.

[... etc ...]

---
*Official rules: [Stonemaier Games](https://stonemaiergames.com/games/wingspan/rules/)*
*Buy Wingspan: [Amazon](affiliate-link)*
```
