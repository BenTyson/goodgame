# Database Schema

## Overview

The database uses Supabase (PostgreSQL) with the following main entities:
- **games** - Core game metadata
- **categories** - Game categories (strategy, family, party, etc.)
- **mechanics** - Game mechanics (deck building, worker placement, etc.)
- **collections** - Curated game collections
- **score_sheet_configs** - PDF generation configuration per game
- **affiliate_links** - Centralized affiliate link management

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

## Tables

### games
Primary table for all game metadata.

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

### score_sheet_configs
Per-game PDF configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games |
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
- Full-text search index on games (name, tagline, description, designers)

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
  (SELECT json_agg(al.*) FROM affiliate_links al
   WHERE al.game_id = g.id) as affiliate_links
FROM games g
WHERE g.slug = 'catan';
```
