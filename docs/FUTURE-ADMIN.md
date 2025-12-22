# Super Admin - Game Content Management System

> Future feature for scaling content production

## Purpose

A private admin dashboard for managing the game content pipeline:
- Track all games (published, in-progress, planned)
- Curate future games from a master list
- Monitor content completion status
- Manage images, categories, collections
- Daily workflow: pick games from queue, build content, publish

---

## Core Features

### 1. Game Pipeline Board (Kanban-style)

| Backlog | Research | In Progress | Review | Published |
|---------|----------|-------------|--------|-----------|
| 200+ games | 10 games | 3 games | 2 games | 15 games |

**Game Card Shows**:
- Name, thumbnail, BGG rating
- Content checklist (Rules, Setup, Reference, Score Sheet)
- Assigned priority (High/Medium/Low)
- Categories, player count, complexity

### 2. Master Game List

Pre-curated list of 200+ target games pulled from:
- BGG Top 200
- Best gateway games lists
- High search volume games
- Publisher new releases

**Fields**:
- `name`, `bgg_id`, `bgg_rank`
- `priority` (1-5)
- `status` (backlog, researching, in_progress, review, published)
- `content_status` (JSON: rules, setup, reference, score_sheet each true/false)
- `assigned_date`, `published_date`
- `notes`

### 3. Daily Workflow Dashboard

**Today's Focus**:
- 2-3 games assigned for content creation
- Quick actions: "Start Research", "Mark Complete", "Request Review"

**Content Creation Checklist** (per game):
- [ ] Basic info from BGG (auto-fetch possible)
- [ ] Box image + 2-3 gameplay images
- [ ] Rules summary written
- [ ] Setup guide with component list
- [ ] Quick reference card
- [ ] Score sheet config (if applicable)
- [ ] Categories assigned
- [ ] Collections assigned
- [ ] SEO meta title/description
- [ ] Final review & publish

### 4. Image Management

- Upload to Supabase Storage
- Auto-resize for thumbnails
- Track image sources (BGG, publisher, custom)
- Bulk import from BGG API

### 5. Category & Collection Manager

- Create/edit categories
- Create/edit collections
- Drag-drop games into collections
- Set display order

---

## Technical Approach

### Option A: Supabase + Simple React Admin
- Use existing Supabase backend
- Build `/admin` route (protected)
- Supabase Auth for admin login
- Simple React forms + tables

**Pros**: Fast to build, uses existing infra
**Cons**: Custom UI work

### Option B: Use Admin Framework
- **Refine** (refine.dev) - React admin framework
- **AdminJS** - Auto-generates admin from DB
- **Directus** - Headless CMS with admin

**Pros**: Pre-built UI, faster
**Cons**: Learning curve, potential lock-in

### Option C: Notion/Airtable Integration
- Use Notion or Airtable as the "admin"
- Sync to Supabase via API/webhooks
- Best of both: nice UI + real database

**Pros**: Great UX, no custom admin to build
**Cons**: Sync complexity, external dependency

### Recommendation

**Phase 1**: Notion/Airtable for game pipeline tracking (immediate)
**Phase 2**: Build simple `/admin` with Supabase Auth (when hitting 50+ games)
**Phase 3**: Consider Refine or similar if admin needs grow

---

## Database Additions Needed

```sql
-- Game pipeline tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS
  status VARCHAR(20) DEFAULT 'backlog'; -- backlog, researching, in_progress, review, published

ALTER TABLE games ADD COLUMN IF NOT EXISTS
  priority SMALLINT DEFAULT 3; -- 1=highest, 5=lowest

ALTER TABLE games ADD COLUMN IF NOT EXISTS
  content_status JSONB DEFAULT '{"rules": false, "setup": false, "reference": false, "score_sheet": false}';

ALTER TABLE games ADD COLUMN IF NOT EXISTS
  notes TEXT;

ALTER TABLE games ADD COLUMN IF NOT EXISTS
  assigned_date DATE;

-- Master game list (pre-curated targets)
CREATE TABLE game_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER UNIQUE,
  name VARCHAR(255) NOT NULL,
  bgg_rank INTEGER,
  bgg_rating DECIMAL(3,2),
  player_count VARCHAR(20),
  play_time VARCHAR(20),
  complexity DECIMAL(2,1),
  year_published SMALLINT,

  priority SMALLINT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'backlog',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- When ready to build, move from candidates to games table
```

---

## BGG API Integration (Future)

Auto-fetch game data from BoardGameGeek:
- Basic info (players, time, complexity)
- Images
- Categories/mechanics
- Description

```typescript
// Example: Fetch from BGG XML API
async function fetchBGGGame(bggId: number) {
  const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`)
  const xml = await res.text()
  // Parse XML, extract data
  return gameData
}
```

---

## Priority Games to Add to Candidates

### Tier 1 - Gateway Essentials (High Search Volume)
1. Splendor
2. Pandemic
3. Carcassonne
4. 7 Wonders
5. Dominion
6. King of Tokyo
7. Sushi Go
8. Love Letter
9. The Crew
10. Cascadia

### Tier 2 - Modern Classics
11. Scythe
12. Everdell
13. Root
14. Spirit Island
15. Gloomhaven
16. Ark Nova
17. Brass Birmingham
18. Viticulture
19. Great Western Trail
20. Agricola

### Tier 3 - Party & Family
21. Wavelength
22. Just One
23. Dixit
24. Telestrations
25. The Resistance
26. One Night Ultimate Werewolf
27. Skull
28. Coup
29. Sheriff of Nottingham
30. Mysterium

---

## Current Status (Dec 2025)

**16 games now in database** - All pilot games and Tier 1 gateway games complete.

## Future Steps

1. **When hitting 30+ games**: Consider Notion board for tracking game pipeline
2. **When hitting 50+ games**: Build simple `/admin` route with Supabase Auth
3. **Later**: BGG API integration for auto-fetching metadata
