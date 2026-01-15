# Expansion Roadmap

> Revisit this after 500+ board games with full content.

**Created:** 2024-12-23
**Trigger:** 500 published games with complete content

---

## Phase 1: Board Games (CURRENT)

**Goal:** Become the go-to resource for board game rules, score sheets, and quick reference.

**Target:** 500+ games with full content before considering expansion.

**Focus:**
- Rules summaries (500-1000 words, scannable)
- Score sheets (printable PDFs)
- Quick reference cards
- Setup guides

---

## Phase 2: Trading Card Games

**Trigger:** Phase 1 complete (500+ board games)

### Data Sources
| Source | Coverage | URL |
|--------|----------|-----|
| Scryfall | Magic: The Gathering | https://scryfall.com/docs/api |
| Pokémon TCG API | Pokémon | https://pokemontcg.io/ |
| JustTCG | Multi-TCG pricing | https://justtcg.com/docs |
| TCGAPIs | 40+ TCGs | https://tcgapis.com/ |

### Content Opportunities
- Deck building guides
- Card lookup / searchable database
- Meta snapshots
- Budget deck recommendations
- Printable deck lists

### Priority Order
1. Magic: The Gathering (largest audience, best API)
2. Pokémon TCG (huge casual audience)
3. Yu-Gi-Oh! (dedicated player base)
4. Disney Lorcana (growing, newer)

---

## Phase 3: Tabletop RPGs

**Trigger:** Phase 2 established

### Data Sources
| Source | Coverage | URL |
|--------|----------|-----|
| D&D 5e SRD API | D&D 5th Edition | https://www.dnd5eapi.co/ |
| Open5e | 5e + 3rd party | https://open5e.com/ |
| RPGGeek | All RPGs | Same BGG API, rpggeek.com domain |

### Content Opportunities
- Quick reference cards (spells, conditions, actions)
- Printable character sheets
- Session prep checklists
- Monster stat blocks
- One-page rules summaries for different systems

### Priority Order
1. D&D 5e (dominant market share)
2. Pathfinder 2e
3. Call of Cthulhu
4. Indie RPGs (Blades in the Dark, etc.)

---

## Phase 4: Video Games (Maybe)

**Trigger:** Phases 1-3 successful, clear demand

### Data Sources
| Source | Coverage | URL |
|--------|----------|-----|
| IGDB | 350k+ games | https://www.igdb.com/api |
| RAWG | 500k+ games | https://rawg.io/apidocs (reliability issues) |

### Considerations
- Very different audience than tabletop
- Heavily saturated market (IGN, GameSpot, etc.)
- May not fit "Boardmello" brand
- Consider separate brand if pursuing

### If Pursuing, Focus On
- Couch co-op / local multiplayer (aligns with tabletop audience)
- Board game adaptations (Wingspan, Terraforming Mars apps)
- Party games (Jackbox, etc.)

---

## Completed: Buy/Sell/Trade Marketplace

Full marketplace competing with BGG GeekMarket - **All 5 phases complete.**

**Features:**
- Browse/search with filters, create/edit listings, photo uploads
- In-app messaging between buyers and sellers
- Offers and counter-offer negotiation
- Stripe Connect payments with escrow
- Reputation/feedback system with trust levels

**Future:** Wishlist matching alerts (Phase 6) - not yet implemented

---

## Parking Lot (Ideas to Revisit)

### Features to Add Later
- [ ] Price tracking (Board Game Atlas integration)
- [ ] Play logging
- [ ] "Find players near me"
- [ ] Game night planning tools
- [ ] Comparison pages ("Catan vs Ticket to Ride")

*Note: User collections/wishlists already implemented via shelf system.*

### Additional Data Sources
| Source | Type | Notes |
|--------|------|-------|
| Board Game Atlas | Pricing | https://www.boardgameatlas.com/api/docs |
| Open Trivia DB | Trivia questions | https://opentdb.com/ |
| The Trivia API | Trivia questions | https://the-trivia-api.com/ |

### BGG Data Not Yet Used
- `/plays` - User play logs (popularity metrics)
- `/collection` - User collections ("most owned")
- `/hot` - Trending items
- `versions=1` - Edition/version data
- `videos=1` - YouTube links
- `comments=1` - User reviews/quotes
- Poll data - Best player count, language dependence
- Subranks - Strategy rank, Family rank, etc.

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | Published board games | 500+ |
| 1 | Monthly organic traffic | 10k+ |
| 2 | TCG card entries | 10k+ |
| 3 | RPG reference pages | 100+ |

---

## Brand Considerations

Current: **Boardmello** (boardmello.com)

If expanding beyond board games, consider:
- Rebranding to broader name
- Keeping Boardmello for tabletop, new brand for digital
- "Nomads" umbrella with sub-brands

---

*This document is a snapshot of strategic thinking. Revisit and refine after hitting Phase 1 milestones.*
