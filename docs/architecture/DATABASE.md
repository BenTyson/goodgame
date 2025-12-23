# Database Schema

## Connection Info

**Project ID**: `jnaibnwxpweahpawxycf`
**Status**: Connected and migrations applied

```bash
# Regenerate types after schema changes
supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts
```

## Overview

The database uses Supabase (PostgreSQL) with the following main entities:
- **games** - Core game metadata with full-text search
- **categories** - Game categories (strategy, family, party, etc.)
- **mechanics** - Game mechanics (deck building, worker placement, etc.)
- **collections** - Curated game collections
- **game_images** - Multiple images per game
- **score_sheet_configs** - PDF generation configuration per game
- **affiliate_links** - Centralized affiliate link management
- **awards** - Board game awards (Spiel des Jahres, Golden Geek, etc.)
- **award_categories** - Categories within each award
- **game_awards** - Links games to awards they've won

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌────────────┐
│ categories  │◄──────│ game_categories  │──────►│   games    │
└─────────────┘       └──────────────────┘       └────────────┘
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│  mechanics  │◄──────│  game_mechanics  │─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│ collections │◄──────│ collection_games │─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│   awards    │◄──────│   game_awards    │─────────────┤
└─────────────┘       └──────────────────┘             │
      │                                                │
┌─────────────┐                                        │
│award_categ. │                                        │
└─────────────┘                                        │
                                                       │
                      ┌──────────────────┐             │
                      │   game_images    │◄────────────┤
                      └──────────────────┘             │
                                                       │
                      ┌──────────────────┐             │
                      │score_sheet_configs│◄───────────┤
                      └──────────────────┘             │
                             │                         │
                      ┌──────────────────┐             │
                      │score_sheet_fields│             │
                      └──────────────────┘             │
                                                       │
                      ┌──────────────────┐             │
                      │ affiliate_links  │◄────────────┘
                      └──────────────────┘
```

## Migration Files

1. `00001_initial_schema.sql` - Core tables, indexes, RLS, full-text search
2. `00002_seed_data.sql` - Categories and mechanics seed data
3. `00003_game_images.sql` - Game images table
4. `00004_seed_games.sql` - First 6 games
5. `00005_more_pilot_games.sql` - 4 more games
6. `00006_tier1_gateway_games.sql` - 6 gateway games
7. `00007_awards_schema.sql` - Awards tables
8. `00008_seed_awards.sql` - 6 awards + winners
9. `00009_game_content.sql` - JSONB content columns on games
10. `00010_game_families.sql` - Game relations (expansions, sequels)
11. `00011_import_queue.sql` - BGG import queue table
12. `00012_content_generation_log.sql` - AI generation tracking
13. `00013_seed_existing_content.sql` - Migrate hardcoded content to DB
14. `00014_complete_game_content.sql` - Content for all 16 games
15. `00015_game_images_storage.sql` - Supabase Storage bucket setup
16. `00016_game_images_rls.sql` - RLS policies for game_images
17. `00017_cleanup_placeholder_images.sql` - Remove old BGG placeholders

## Tables

### games
Primary table for all game metadata. Includes generated `fts` column for full-text search.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL-friendly identifier (unique) |
| name | VARCHAR(255) | Display name |
| tagline | VARCHAR(500) | Short description |
| description | TEXT | Full description |
| player_count_min | SMALLINT | Minimum players |
| player_count_max | SMALLINT | Maximum players |
| player_count_best | SMALLINT[] | Best player counts |
| play_time_min | SMALLINT | Minimum play time (minutes) |
| play_time_max | SMALLINT | Maximum play time (minutes) |
| min_age | SMALLINT | Minimum age |
| weight | DECIMAL(2,1) | Complexity (1.0-5.0) |
| year_published | SMALLINT | Publication year |
| designers | TEXT[] | Designer names |
| publisher | VARCHAR(255) | Publisher name |
| bgg_id | INTEGER | BoardGameGeek ID |
| amazon_asin | VARCHAR(20) | Amazon product ID |
| has_rules | BOOLEAN | Has rules content |
| has_score_sheet | BOOLEAN | Has score sheet |
| has_setup_guide | BOOLEAN | Has setup guide |
| has_reference | BOOLEAN | Has reference card |
| box_image_url | VARCHAR(500) | Box art image |
| hero_image_url | VARCHAR(500) | Hero/banner image |
| thumbnail_url | VARCHAR(500) | Thumbnail image |
| meta_title | VARCHAR(70) | SEO title |
| meta_description | VARCHAR(160) | SEO description |
| is_published | BOOLEAN | Published status |
| is_featured | BOOLEAN | Featured on homepage |
| rules_content | JSONB | Rules content (quickStart, overview, tips, etc.) |
| setup_content | JSONB | Setup content (playerSetup, boardSetup, etc.) |
| reference_content | JSONB | Reference content (turnSummary, keyRules, etc.) |
| content_status | VARCHAR(20) | none, importing, draft, review, published |
| priority | SMALLINT | Content priority (1-5) |
| bgg_raw_data | JSONB | Raw BGG API response |
| fts | TSVECTOR | Generated full-text search column |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### categories
Game categories for filtering and navigation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier |
| name | VARCHAR(100) | Display name |
| description | TEXT | Category description |
| icon | VARCHAR(50) | Icon identifier |
| display_order | SMALLINT | Sort order |
| is_primary | BOOLEAN | Show in main nav |
| meta_title | VARCHAR(70) | SEO title |
| meta_description | VARCHAR(160) | SEO description |

### mechanics
Game mechanics for filtering.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier |
| name | VARCHAR(100) | Display name |
| description | TEXT | Mechanic description |

### collections
Curated game lists.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier |
| name | VARCHAR(255) | Display name |
| description | TEXT | Full description |
| short_description | VARCHAR(300) | Card preview text |
| hero_image_url | VARCHAR(500) | Collection hero image |
| display_order | SMALLINT | Sort order |
| is_featured | BOOLEAN | Featured status |
| is_published | BOOLEAN | Published status |

### game_images
Multiple images per game with type categorization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games |
| url | TEXT | Image URL |
| alt_text | VARCHAR(255) | Alt text for accessibility |
| caption | TEXT | Optional caption |
| image_type | VARCHAR(20) | 'cover', 'hero', 'gallery', 'setup', 'gameplay', 'components' |
| display_order | SMALLINT | Sort order |
| storage_path | VARCHAR(500) | Supabase storage path (optional) |
| width | INTEGER | Image width |
| height | INTEGER | Image height |
| file_size | INTEGER | File size in bytes |
| is_primary | BOOLEAN | Primary image for type |

### score_sheet_configs
Per-game PDF configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games (unique) |
| layout_type | VARCHAR(20) | 'table', 'grid', 'custom' |
| player_min | SMALLINT | Min players for sheet |
| player_max | SMALLINT | Max players for sheet |
| orientation | VARCHAR(20) | 'portrait', 'landscape' |
| show_game_logo | BOOLEAN | Include logo |
| show_total_row | BOOLEAN | Auto-calculate totals |
| color_scheme | VARCHAR(20) | Color theme |
| custom_styles | JSONB | Custom styling options |

### score_sheet_fields
Individual fields on score sheets.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| config_id | UUID | Foreign key to configs |
| name | VARCHAR(100) | Field identifier |
| field_type | VARCHAR(20) | 'number', 'checkbox', 'text', 'calculated' |
| label | VARCHAR(100) | Display label |
| description | VARCHAR(255) | Help text |
| per_player | BOOLEAN | Column per player |
| is_required | BOOLEAN | Required field |
| default_value | VARCHAR(50) | Default value |
| calculation_formula | TEXT | For calculated fields |
| min_value | INTEGER | Min validation |
| max_value | INTEGER | Max validation |
| display_order | SMALLINT | Sort order |
| section | VARCHAR(50) | Field grouping |

### affiliate_links
Centralized affiliate link management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games |
| provider | VARCHAR(50) | 'amazon', 'miniature_market', etc. |
| url | TEXT | Full affiliate URL |
| label | VARCHAR(100) | Button text |
| is_primary | BOOLEAN | Primary buy button |
| display_order | SMALLINT | Sort order |

### awards
Board game awards and organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Full award name |
| short_name | VARCHAR(50) | Abbreviation (SdJ, KdJ, etc.) |
| country | VARCHAR(50) | Country of origin |
| organization | VARCHAR(255) | Awarding organization |
| description | TEXT | Award description |
| website_url | VARCHAR(500) | Official website |
| logo_url | VARCHAR(500) | Award logo |
| established_year | SMALLINT | Year award started |
| is_active | BOOLEAN | Still being awarded |
| display_order | SMALLINT | Sort order |

### award_categories
Categories within each award (e.g., Game of Year, Expert Game).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| award_id | UUID | Foreign key to awards |
| slug | VARCHAR(100) | URL identifier |
| name | VARCHAR(255) | Category name |
| description | TEXT | Category description |
| display_order | SMALLINT | Sort order |

### game_awards
Links games to awards they've won.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games |
| award_id | UUID | Foreign key to awards |
| category_id | UUID | Foreign key to award_categories |
| year | SMALLINT | Year won |
| result | VARCHAR(20) | 'winner', 'nominee', 'recommended' |
| notes | TEXT | Additional notes |

### import_queue
BGG game import queue for content pipeline.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bgg_id | INTEGER | BGG game ID (unique) |
| name | VARCHAR(255) | Game name |
| source | VARCHAR(50) | bgg_top500, award_winner, manual |
| priority | SMALLINT | Import priority (1-5) |
| status | VARCHAR(20) | pending, importing, imported, failed, skipped |
| imported_game_id | UUID | FK to games (after import) |
| error_message | TEXT | Error details if failed |
| attempts | INTEGER | Number of import attempts |

### content_generation_log
AI content generation tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | FK to games |
| content_type | VARCHAR(20) | rules, setup, reference, all |
| model_used | VARCHAR(50) | Claude model version |
| tokens_used | INTEGER | Token count |
| status | VARCHAR(20) | success, failed |
| error_message | TEXT | Error details |
| generated_content | JSONB | Generated content |
| created_at | TIMESTAMPTZ | Generation timestamp |

### game_families
Game series/family groupings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Family name |
| description | TEXT | Family description |
| bgg_family_id | INTEGER | BGG family ID |

### game_relations
Relationships between games (expansions, sequels, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_game_id | UUID | FK to games |
| target_game_id | UUID | FK to games |
| relation_type | VARCHAR(30) | expansion_of, sequel_to, reimplementation_of, etc. |

## Junction Tables

### game_categories
Many-to-many: games ↔ categories

| Column | Type |
|--------|------|
| game_id | UUID |
| category_id | UUID |
| is_primary | BOOLEAN |

### game_mechanics
Many-to-many: games ↔ mechanics

| Column | Type |
|--------|------|
| game_id | UUID |
| mechanic_id | UUID |

### collection_games
Many-to-many: collections ↔ games (ordered)

| Column | Type |
|--------|------|
| collection_id | UUID |
| game_id | UUID |
| display_order | SMALLINT |
| note | TEXT |

## Indexes

- `games(slug)` - Fast slug lookups
- `games(is_published)` - Filter published games
- `games(is_featured)` - Homepage queries
- `games(weight)` - Complexity filtering
- `games(player_count_min, player_count_max)` - Player count filtering
- `games(fts)` - GIN index for full-text search
- `game_images(game_id)` - Fast image lookups

## Row Level Security (RLS)

All tables have RLS enabled with public read access for:
- Published games (`is_published = true`)
- All categories and mechanics
- Published collections (`is_published = true`)
- All junction tables
- All score sheet configs and fields
- All affiliate links and game images

## Full-Text Search

The `fts` column is a generated `TSVECTOR` combining:
- Name (weight A - highest priority)
- Tagline (weight B)
- Description (weight C)
- Publisher (weight D - lowest priority)

```sql
-- Search function
SELECT * FROM search_games('wingspan');
```

## TypeScript Types

Types are auto-generated from the schema:

```typescript
// src/types/database.ts
import type { GameRow } from '@/types/database'

// GameRow - Game without fts column (for mock data)
// Game - Full game type with fts
// GameInsert - For inserting new games
// Category, Collection, GameImage, etc.
```

## Common Queries

### Get published games with categories
```sql
SELECT g.*,
  array_agg(DISTINCT c.name) as category_names
FROM games g
LEFT JOIN game_categories gc ON g.id = gc.game_id
LEFT JOIN categories c ON gc.category_id = c.id
WHERE g.is_published = true
GROUP BY g.id;
```

### Search games
```sql
SELECT * FROM search_games('wingspan');
```

### Get game with all relations
```sql
SELECT g.*,
  (SELECT json_agg(c.*) FROM categories c
   JOIN game_categories gc ON c.id = gc.category_id
   WHERE gc.game_id = g.id) as categories,
  (SELECT json_agg(m.*) FROM mechanics m
   JOIN game_mechanics gm ON m.id = gm.mechanic_id
   WHERE gm.game_id = g.id) as mechanics,
  (SELECT json_agg(gi.*) FROM game_images gi
   WHERE gi.game_id = g.id
   ORDER BY gi.display_order) as images,
  (SELECT json_agg(al.*) FROM affiliate_links al
   WHERE al.game_id = g.id) as affiliate_links
FROM games g
WHERE g.slug = 'catan';
```

### Get game images by type
```sql
SELECT * FROM game_images
WHERE game_id = 'uuid-here'
  AND image_type = 'gallery'
ORDER BY display_order;
```
