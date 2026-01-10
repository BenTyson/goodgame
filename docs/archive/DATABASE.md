# Database Schema

## Connection Info

| Environment | Project ID | URL |
|-------------|------------|-----|
| **Staging** | `ndskcbuzsmrzgnvdbofd` | https://ndskcbuzsmrzgnvdbofd.supabase.co |
| **Production** | `jnaibnwxpweahpawxycf` | https://jnaibnwxpweahpawxycf.supabase.co |

```bash
# Regenerate types (use linked project - staging by default)
npx supabase gen types typescript --linked > src/types/supabase.ts
```

## Overview

The database uses Supabase (PostgreSQL) with the following main entities:
- **games** - Core game metadata with full-text search
- **categories** - Game categories (strategy, family, party, etc.)
- **mechanics** - Game mechanics (deck building, worker placement, etc.)
- **themes** - Game themes/settings (fantasy, sci-fi, historical, etc.)
- **player_experiences** - How players interact (competitive, cooperative, solo, etc.)
- **complexity_tiers** - Weight-based classifications (gateway, family, medium, heavy, expert)
- **bgg_tag_aliases** - Maps BGG IDs to internal taxonomy for imports
- **designers** - Game designers (normalized from TEXT[])
- **publishers** - Game publishers (normalized from VARCHAR)
- **artists** - Game artists (normalized)
- **collections** - Curated game collections
- **game_families** - Game series (Catan, Pandemic, etc.)
- **game_relations** - Relationships between games (expansions, sequels)
- **game_images** - Multiple images per game
- **score_sheet_configs** - PDF generation configuration per game
- **affiliate_links** - Centralized affiliate link management
- **awards** - Board game awards (Spiel des Jahres, Golden Geek, etc.)
- **award_categories** - Categories within each award
- **game_awards** - Links games to awards they've won
- **user_profiles** - User profile data (linked to Supabase auth)
- **user_games** - User's game shelf/collection tracking

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
│   themes    │◄──────│   game_themes    │─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│player_exper.│◄──────│game_player_exper.│─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐                                        │
│complex_tiers│◄───────────────────────────────────────┤ (complexity_tier_id)
└─────────────┘                                        │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│  designers  │◄──────│  game_designers  │─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│ publishers  │◄──────│ game_publishers  │─────────────┤
└─────────────┘       └──────────────────┘             │
                                                       │
┌─────────────┐       ┌──────────────────┐             │
│   artists   │◄──────│  game_artists    │─────────────┤
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
┌─────────────┐                                        │
│game_families│◄───────────────────────────────────────┤ (family_id)
└─────────────┘                                        │
                                                       │
┌──────────────────────────────────────────────────────┤
│                  game_relations                      │ (source → target)
└──────────────────────────────────────────────────────┘
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

┌─────────────┐
│bgg_tag_alias│ (maps BGG IDs → themes/experiences/categories/mechanics)
└─────────────┘
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
18. `00018_queue_bgg_top100.sql` - Queue BGG Top 100 games for import
19. `00019_seo_collections.sql` - SEO-optimized collection pages
20. `00020_user_profiles_and_shelf.sql` - User profiles and game shelf
21. `00021_normalize_entities.sql` - Designers, publishers, artists tables + junction tables
22. `00022_migrate_entity_data.sql` - Populate entities from bgg_raw_data JSONB
23. `00023_user_profile_enhancements.sql` - Username, bio, social links, visibility settings
24. `00024_add_awards_and_reorder.sql` - 5 more awards (American/German/International)
25. `00025_bgg_top20_games.sql` - 19 BGG top 20 games
26. `00026_populate_publishers_from_text.sql` - Populate publishers from text fields
27. `00027_game_keytags.sql` - Keytag booleans (is_trending, is_top_rated, etc.)
28. `00028_user_top_games.sql` - User top 10 games ranking
29. `00029_profile_enhancements.sql` - Header image, custom avatar, last_active_at
30. `00030_user_follows.sql` - Following system
31. `00031_user_activities.sql` - Activity feed
32. `00032_user_notifications.sql` - Notifications with trigger
33. `00033_game_reviews.sql` - Review columns on user_games
34. `00034_add_review_activity_type.sql` - Review activity type
35. `00035_themes_table.sql` - Themes table + game_themes junction
36. `00036_player_experiences_table.sql` - Player experiences + junction
37. `00037_complexity_tiers.sql` - Complexity tiers + games.complexity_tier_id
38. `00038_bgg_tag_aliases.sql` - BGG alias system for imports
39. `00039_marketplace_foundation.sql` - Feature flags, marketplace notification/activity types
40. `00040_marketplace_listings.sql` - Marketplace tables, enums, storage bucket
41. `00041_marketplace_messaging.sql` - Conversations, messages, triggers, RPC functions
42. `00042_marketplace_offers.sql` - Offers table, enums, RPC functions, triggers
43. `00043_marketplace_transactions.sql` - Transactions, Stripe Connect, payment flow
44. `00044_marketplace_feedback.sql` - Feedback/reputation system
45. `00045_marketplace_discovery.sql` - Saved searches, wishlist alerts, similar listings
46. `00046_data_source_tracking.sql` - Data provenance (data_source enum, wikidata_id, field_sources)
47. `00047_data_source_seed.sql` - Add 'seed' to data_source enum
48. `00048_rulebook_bncs.sql` - Rulebook parsing + BNCS scoring columns (legacy)
49. `00049_rulebook_parsed_text.sql` - Parsed text storage + latest_parse_log_id
50. `00050_game_families_base_game.sql` - Add base_game_id to game_families
51. `00051_has_unimported_relations.sql` - Track games with unimported relations
52. `00052_taxonomy_suggestions.sql` - AI taxonomy suggestions
53. `00053_crunch_score.sql` - Rename BNCS → Crunch Score, 1-10 scale, BGG calibration
54. `00054_wikidata_game_fields.sql` - Wikidata enrichment columns (image, website, rulebook)
55. `00055_wikipedia_url.sql` - Add wikipedia_url, wikidata_series_id to games
56. `00056_game_families_wikidata_series.sql` - Add wikidata_series_id to game_families
57. `00057_wikipedia_summary.sql` - Wikipedia summary storage
58. `00058_wikipedia_enrichment.sql` - Wikipedia enrichment fields
59. `00059_wikipedia_tier1_fields.sql` - Wikipedia images, external links, awards, gameplay
60. `00060_vecna_state.sql` - Vecna processing state enum and columns
61. `00061_taxonomy_source.sql` - Taxonomy source tracking on junction tables
62. `00062_fix_taxonomy_source_default.sql` - Backfill BGG as default source
63. `00063_structured_parsed_text.sql` - Structured JSONB for categorized rulebook text
64. `00064_image_attribution.sql` - Image source enum and licensing columns
65. `00065_rulebook_thumbnail.sql` - Rulebook thumbnail URL column on games
66. `00066_rulebooks_storage.sql` - Rulebooks storage bucket for PDF uploads
67. `00067_game_videos.sql` - YouTube video embeds table (game_videos)
68. `00068_retailers.sql` - Retailers table and game purchase links
69. `00069_add_played_status.sql` - Add 'played' to shelf_status enum

## Core Enums

### vecna_state
Processing state for the Vecna content pipeline.

| Value | Description |
|-------|-------------|
| `imported` | BGG data imported |
| `enriched` | Wikidata + Wikipedia done |
| `rulebook_missing` | Waiting for manual rulebook URL |
| `rulebook_ready` | Rulebook URL confirmed |
| `parsing` | Rulebook being parsed |
| `parsed` | Rulebook text extracted |
| `taxonomy_assigned` | Categories/mechanics assigned |
| `generating` | AI content being generated |
| `generated` | AI content ready |
| `review_pending` | Ready for human review |
| `published` | Live on site |

### data_source
Data provenance tracking for legal compliance.

| Value | Description |
|-------|-------------|
| `legacy_bgg` | Imported from BGG before legal review |
| `wikidata` | Sourced from Wikidata (CC0 public domain) |
| `rulebook` | Extracted from publisher rulebook PDF |
| `publisher` | Official data from publisher partnership |
| `community` | User-submitted data (moderated) |
| `manual` | Admin-entered data |
| `seed` | Bulk-imported factual seed data |

### shelf_status
User game shelf status.

| Value | Description |
|-------|-------------|
| `owned` | User owns this game |
| `want_to_buy` | User wants to buy this game |
| `want_to_play` | User wants to play this game |
| `previously_owned` | User previously owned this game |
| `wishlist` | On user's wishlist |
| `played` | User has played (rated) but doesn't own |

### image_source
Image provenance for game_images.

| Value | Description |
|-------|-------------|
| `publisher` | Official publisher images (with permission or fair use) |
| `wikimedia` | Wikimedia Commons (CC licensed) |
| `bgg` | BoardGameGeek (development only) |
| `user_upload` | User-submitted images |
| `press_kit` | Official press kit / media kit |
| `promotional` | Promotional materials |

---

## Marketplace Enums

### listing_type
| Value | Description |
|-------|-------------|
| `sell` | Selling for money |
| `trade` | Trading for other games |
| `want` | Looking for this game |

### listing_status
| Value | Description |
|-------|-------------|
| `draft` | Not yet published |
| `active` | Currently visible and available |
| `pending` | Transaction in progress |
| `sold` | Successfully sold |
| `traded` | Successfully traded |
| `expired` | Auto-expired after duration |
| `cancelled` | Manually cancelled by seller |

### game_condition
| Value | Description |
|-------|-------------|
| `new_sealed` | Factory sealed, never opened |
| `like_new` | Played 1-2 times, mint condition |
| `very_good` | Light wear, all components present |
| `good` | Moderate wear, complete and playable |
| `acceptable` | Heavy wear or minor damage, playable |

### shipping_preference
| Value | Description |
|-------|-------------|
| `local_only` | Local pickup only |
| `will_ship` | Willing to ship (default) |
| `ship_only` | Shipping only, no local pickup |

### offer_type
| Value | Description |
|-------|-------------|
| `buy` | Cash offer only |
| `trade` | Trade offer only |
| `buy_plus_trade` | Cash plus trade |

### offer_status
| Value | Description |
|-------|-------------|
| `pending` | Awaiting response |
| `accepted` | Offer accepted |
| `declined` | Offer declined |
| `countered` | Counter-offer made |
| `expired` | Auto-expired after 48 hours |
| `withdrawn` | Withdrawn by buyer |

### transaction_status
| Value | Description |
|-------|-------------|
| `pending_payment` | Awaiting payment |
| `payment_processing` | Payment being processed |
| `payment_held` | Payment held in escrow |
| `shipped` | Item shipped by seller |
| `delivered` | Delivery confirmed |
| `completed` | Transaction complete, funds released |
| `refund_requested` | Buyer requested refund |
| `refunded` | Payment refunded |
| `disputed` | Under dispute resolution |
| `cancelled` | Transaction cancelled |

### shipping_carrier
| Value | Description |
|-------|-------------|
| `usps` | USPS |
| `ups` | UPS |
| `fedex` | FedEx |
| `dhl` | DHL |
| `other` | Other carrier |

### feedback_role
| Value | Description |
|-------|-------------|
| `buyer` | Buyer rating the seller |
| `seller` | Seller rating the buyer |

### trust_level
| Value | Description |
|-------|-------------|
| `new` | No completed transactions |
| `established` | 1-4 completed sales |
| `trusted` | 5+ sales with 4.0+ rating |
| `top_seller` | 20+ sales with 4.5+ rating |

### alert_frequency
| Value | Description |
|-------|-------------|
| `instant` | Send alert immediately when match found |
| `daily` | Daily digest of matching listings |
| `weekly` | Weekly digest of matching listings |

### alert_status
| Value | Description |
|-------|-------------|
| `active` | Alerts are enabled |
| `paused` | Alerts temporarily disabled |
| `expired` | Alert has expired |

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
| family_id | UUID | FK to game_families (optional) |
| is_published | BOOLEAN | Published status |
| is_featured | BOOLEAN | Featured on homepage |
| rules_content | JSONB | Rules content (quickStart, overview, tips, etc.) |
| setup_content | JSONB | Setup content (playerSetup, boardSetup, etc.) |
| reference_content | JSONB | Reference content (turnSummary, keyRules, etc.) |
| content_status | VARCHAR(20) | none, importing, draft, review, published |
| priority | SMALLINT | Content priority (1-5) |
| bgg_raw_data | JSONB | Raw BGG API response |
| complexity_tier_id | UUID | FK to complexity_tiers (auto-assigned by weight) |
| is_trending | BOOLEAN | Keytag: Trending Now |
| is_top_rated | BOOLEAN | Keytag: Top Rated |
| is_staff_pick | BOOLEAN | Keytag: Staff Pick |
| is_hidden_gem | BOOLEAN | Keytag: Hidden Gem |
| is_new_release | BOOLEAN | Keytag: New Release |
| data_source | data_source | Data provenance (legacy_bgg, wikidata, rulebook, publisher, community, manual, seed) |
| wikidata_id | VARCHAR(20) | Wikidata Q-ID (e.g., Q12345) |
| wikidata_image_url | VARCHAR(500) | CC-licensed image from Wikimedia Commons |
| official_website | VARCHAR(500) | Official game/publisher website (from Wikidata P856) |
| wikidata_last_synced | TIMESTAMPTZ | When Wikidata enrichment was last run |
| field_sources | JSONB | Per-field provenance tracking |
| rulebook_url | TEXT | URL to official rulebook PDF (Wikidata P953 or publisher) |
| rulebook_source | TEXT | How rulebook was found (auto-discover, manual, publisher, wikidata) |
| rulebook_parsed_at | TIMESTAMPTZ | When rulebook was last parsed |
| rulebook_thumbnail_url | TEXT | PNG thumbnail of first page (generated during parse) |
| crunch_score | DECIMAL(3,1) | Crunch Score (1.0-10.0) - AI complexity rating |
| crunch_breakdown | JSONB | Crunch dimension scores (rulesDensity, decisionSpace, etc.) |
| crunch_generated_at | TIMESTAMPTZ | When Crunch Score was generated |
| crunch_bgg_reference | DECIMAL(2,1) | BGG weight used for calibration (1.0-5.0) |
| component_list | JSONB | Components extracted from rulebook |
| latest_parse_log_id | UUID | FK to rulebook_parse_log |
| wikipedia_url | VARCHAR(500) | English Wikipedia article URL |
| wikidata_series_id | VARCHAR(20) | Wikidata Q-number for the game series (P179 property) |
| wikipedia_summary | JSONB | AI-summarized Wikipedia content (themes, mechanics, reception, awards) |
| wikipedia_gameplay | TEXT | Gameplay section from Wikipedia |
| wikipedia_origins | TEXT | Origins/history section from Wikipedia |
| wikipedia_images | JSONB | Article images with Commons metadata, licensing |
| wikipedia_external_links | JSONB | Categorized external links (rulebook, official, publisher, etc.) |
| wikipedia_awards | JSONB | Parsed awards from Wikipedia (name, year, winner/nominated) |
| vecna_state | vecna_state | Current state in Vecna processing pipeline |
| vecna_processed_at | TIMESTAMPTZ | When Vecna last processed this game |
| vecna_error | TEXT | Error message if Vecna processing failed |
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
| bgg_id | INTEGER | BoardGameGeek mechanic ID |

### themes
Game themes/settings for filtering (Fantasy, Sci-Fi, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier (unique) |
| name | VARCHAR(100) | Display name |
| description | TEXT | Theme description |
| icon | VARCHAR(50) | Lucide icon name |
| display_order | SMALLINT | Sort order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Seeded themes:** fantasy, sci-fi, historical, horror, nature, mythology, mystery, war, economic, pirates, medieval, post-apocalyptic, abstract, humor, steampunk

### player_experiences
How players interact (Competitive, Cooperative, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier (unique) |
| name | VARCHAR(100) | Display name |
| description | TEXT | Experience description |
| icon | VARCHAR(50) | Lucide icon name |
| display_order | SMALLINT | Sort order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Seeded experiences:** competitive, cooperative, team-based, solo, social, narrative, asymmetric, hidden-roles

### complexity_tiers
Weight-based game classifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier (unique) |
| name | VARCHAR(100) | Display name |
| description | TEXT | Tier description |
| icon | VARCHAR(50) | Lucide icon name |
| weight_min | DECIMAL(2,1) | Minimum weight (inclusive) |
| weight_max | DECIMAL(2,1) | Maximum weight (exclusive) |
| display_order | SMALLINT | Sort order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Seeded tiers:**
| Tier | Weight Range | Description |
|------|--------------|-------------|
| gateway | 1.0 - 1.8 | Perfect for newcomers |
| family | 1.8 - 2.5 | Great for family game nights |
| medium | 2.5 - 3.2 | Satisfying depth without overwhelm |
| heavy | 3.2 - 4.0 | For dedicated gamers |
| expert | 4.0 - 5.0 | Ultimate complexity |

**Note:** Games link to tiers via `games.complexity_tier_id` (auto-assigned during BGG import)

### bgg_tag_aliases
Maps BGG category/mechanic IDs to internal taxonomy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bgg_id | INTEGER | BGG category/mechanic ID |
| bgg_name | VARCHAR(255) | Original BGG name |
| bgg_type | VARCHAR(50) | 'category', 'mechanic', 'family' |
| target_type | VARCHAR(50) | 'category', 'mechanic', 'theme', 'player_experience' |
| target_id | UUID | FK to target table |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Unique constraint:** (bgg_id, bgg_type, target_type)

**Usage:** During BGG import, the importer looks up aliases first (by BGG ID), then falls back to name-based mapping.

### designers
Game designers (normalized from TEXT[] on games).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Display name |
| bio | TEXT | Designer biography |
| photo_url | VARCHAR(500) | Profile photo |
| website | VARCHAR(500) | Personal website |
| bgg_id | INTEGER | BGG designer ID |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### publishers
Game publishers (normalized from VARCHAR on games).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Display name |
| description | TEXT | Publisher description |
| logo_url | VARCHAR(500) | Company logo |
| website | VARCHAR(500) | Company website |
| country | VARCHAR(100) | Country of origin |
| founded_year | SMALLINT | Year founded |
| bgg_id | INTEGER | BGG publisher ID |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### artists
Game artists.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Display name |
| bio | TEXT | Artist biography |
| photo_url | VARCHAR(500) | Profile photo |
| website | VARCHAR(500) | Portfolio website |
| bgg_id | INTEGER | BGG artist ID |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

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
Multiple images per game with type categorization and attribution.

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
| source | image_source | Image source (publisher, wikimedia, bgg, user_upload, press_kit, promotional) |
| source_url | TEXT | Original source URL |
| attribution | TEXT | Attribution text for image |
| license | TEXT | License (e.g., 'CC BY-SA 4.0', 'Used with permission', 'Fair use') |

### game_videos
YouTube video embeds per game.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Foreign key to games |
| youtube_url | TEXT | Full YouTube URL |
| youtube_video_id | TEXT | Extracted video ID for embedding |
| title | TEXT | Optional custom title (falls back to YouTube title) |
| video_type | TEXT | 'overview', 'gameplay', 'review' |
| display_order | INTEGER | Sort order |
| is_featured | BOOLEAN | Featured video shows prominently |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint:** (game_id, youtube_video_id) - Prevent duplicate videos per game

### retailers
Global retailer definitions for purchase links.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL identifier (unique) |
| name | VARCHAR(100) | Display name |
| logo_url | TEXT | Retailer logo |
| brand_color | VARCHAR(7) | Hex color (e.g., #FF9900) |
| url_pattern | TEXT | URL template with placeholders ({product_id}, {asin}, {affiliate_tag}) |
| affiliate_tag | VARCHAR(100) | Affiliate tag for this retailer |
| retailer_type | VARCHAR(20) | 'online', 'local', 'marketplace' |
| display_order | SMALLINT | Sort order |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

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
Game series/family groupings (e.g., Catan, Pandemic, Ticket to Ride).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | URL identifier (unique) |
| name | VARCHAR(255) | Family name |
| description | TEXT | Family description |
| hero_image_url | VARCHAR(500) | Banner image for family page |
| base_game_id | UUID | FK to games - the primary/original game in family |
| bgg_family_id | INTEGER | BGG family ID (for import matching) |
| wikidata_series_id | VARCHAR(20) | Wikidata Q-number for series (P179), used for import matching |
| family_context | JSONB | Base game context for expansion processing (mechanics, theme, setup, rules overview) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Notes:**
- Games link to families via `games.family_id`
- `family_context` stores base game context for Vecna expansion processing
- `base_game_id` identifies the original game (used for thumbnails, canonical reference)
- Auto-created during BGG import from game name patterns (colons, parentheses, en-dashes)
- Auto-created from Wikidata series (P179) when detected during import
- Example: "CATAN: Seafarers" auto-creates "CATAN" family
- Example: Games in Wikidata "Gloomhaven" series (Q99748715) auto-link to family
- Public pages at `/families` and `/families/[slug]`
- Admin management at `/admin/families`
- "Needs Review" filter shows families with unlinked games
- When querying games in a family, use explicit FK: `games!games_family_id_fkey` to avoid PGRST201 ambiguity

### game_relations
Explicit relationships between games (expansions, sequels, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_game_id | UUID | FK to games (the game with the relation) |
| target_game_id | UUID | FK to games (the related game) |
| relation_type | VARCHAR(30) | See relation types below |
| display_order | SMALLINT | Sort order |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Relation Types:**
| Type | Example |
|------|---------|
| `expansion_of` | Catan: Seafarers → Catan |
| `base_game_of` | Catan → Catan: Seafarers |
| `sequel_to` | Pandemic Legacy S2 → S1 |
| `prequel_to` | Jaws of the Lion → Gloomhaven |
| `reimplementation_of` | Brass: Birmingham → Brass |
| `spin_off_of` | Dune: Uprising → Dune: Imperium |
| `standalone_in_series` | Frosthaven (standalone in Gloomhaven series) |

**Notes:**
- Store relations in one direction only (child → parent, e.g., expansion → base)
- Query bidirectionally and display inverse labels
- Created via:
  1. BGG import when both games exist (`process-import-queue.ts`)
  2. Retroactive sync from `bgg_raw_data` (`sync-game-relations.ts`)
- `bgg_raw_data` stores BGG references in `expansions[]`, `implementations[]`, `expandsGame`, `implementsGame`
- Sync script creates relations when target game exists in DB

### publisher_rulebook_patterns
URL patterns for auto-discovering publisher rulebooks.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| publisher_id | UUID | FK to publishers |
| url_pattern | TEXT | URL pattern template with {slug} placeholder |
| priority | SMALLINT | Priority order (lower = try first) |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Seeded publishers:** Stonemaier Games, Leder Games, CMON, Fantasy Flight Games, Czech Games Edition, Rio Grande Games, Z-Man Games, Pandasaurus Games, Restoration Games

### rulebook_parse_log
Tracks rulebook parsing attempts for debugging and auditing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | FK to games |
| rulebook_url | TEXT | URL that was parsed |
| status | VARCHAR(20) | success, failed, partial |
| page_count | SMALLINT | Number of pages parsed |
| word_count | INTEGER | Total words extracted |
| parsed_text | TEXT | Full extracted text (for reuse in content generation) |
| parsed_text_structured | JSONB | Structured/categorized rulebook text (sections, cleaned text) |
| error_message | TEXT | Error details if failed |
| parse_duration_ms | INTEGER | How long parsing took |
| created_at | TIMESTAMPTZ | When parsing occurred |

### user_profiles
User profile data linked to Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| display_name | VARCHAR(100) | User display name |
| username | VARCHAR(30) | Unique @username |
| avatar_url | VARCHAR(500) | Google OAuth profile image |
| custom_avatar_url | VARCHAR(500) | Custom uploaded avatar (overrides avatar_url) |
| header_image_url | VARCHAR(500) | Profile header image (exists but unused in V3 UI) |
| bio | TEXT | User biography |
| location | VARCHAR(100) | User location |
| social_links | JSONB | Social links (bgg_username, twitter_handle, etc.) |
| role | VARCHAR(20) | 'user' or 'admin' |
| shelf_visibility | VARCHAR(20) | 'private' or 'public' |
| profile_visibility | VARCHAR(20) | 'private' or 'public' |
| last_active_at | TIMESTAMPTZ | Last activity timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### user_games
User's game shelf/collection tracking with optional reviews.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| game_id | UUID | FK to games |
| status | shelf_status | owned, want_to_buy, want_to_play, previously_owned, wishlist, played |
| rating | SMALLINT | User rating (1-10) |
| notes | TEXT | Personal notes |
| review | TEXT | Review content (plain text) |
| review_updated_at | TIMESTAMPTZ | When review was last edited |
| acquired_date | DATE | When acquired |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint**: One entry per user per game (user_id, game_id)

### user_top_games
User's top 10 favorite games ranking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| game_id | UUID | FK to games |
| rank | SMALLINT | Position in top 10 (1-10) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraints**: (user_id, game_id), (user_id, rank)

### user_follows
Following relationships between users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| follower_id | UUID | FK to user_profiles (user doing the following) |
| following_id | UUID | FK to user_profiles (user being followed) |
| created_at | TIMESTAMPTZ | When follow occurred |

**Unique constraint**: (follower_id, following_id)

### user_activities
Activity feed entries for social features.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| activity_type | VARCHAR(30) | follow, shelf_add, shelf_update, rating, top_games_update, review, listing_created, listing_sold, listing_traded |
| target_user_id | UUID | FK to user_profiles (for follow activities) |
| target_game_id | UUID | FK to games (for game-related activities) |
| metadata | JSONB | Additional activity data |
| created_at | TIMESTAMPTZ | When activity occurred |

### user_notifications
User notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles (notification recipient) |
| notification_type | VARCHAR(30) | new_follower, rating, new_offer, offer_accepted, offer_declined, offer_countered, offer_withdrawn, offer_expired, new_message, transaction_shipped, transaction_delivered, feedback_received, wishlist_match, listing_match, wishlist_listing |
| from_user_id | UUID | FK to user_profiles (who triggered it) |
| game_id | UUID | FK to games (if game-related) |
| message | TEXT | Notification message |
| is_read | BOOLEAN | Whether notification has been read |
| created_at | TIMESTAMPTZ | When notification was created |

### feature_flags
Feature flags for gradual rollout of new features.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| flag_key | VARCHAR(100) | Unique flag identifier (e.g., marketplace_enabled) |
| is_enabled | BOOLEAN | Global enabled state |
| allowed_user_ids | UUID[] | Array of users with beta access |
| metadata | JSONB | Additional flag configuration |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Seeded flags:**
- `marketplace_enabled` - Master switch for marketplace visibility
- `marketplace_beta_access` - Allow specific users early access

### user_marketplace_settings
User marketplace preferences, shipping location, and Stripe Connect info.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles (unique) |
| stripe_account_id | VARCHAR(100) | Stripe Connect account ID |
| stripe_account_status | VARCHAR(50) | pending, verified, etc. |
| stripe_onboarding_complete | BOOLEAN | Onboarding finished |
| stripe_charges_enabled | BOOLEAN | Can accept payments |
| stripe_payouts_enabled | BOOLEAN | Can receive payouts |
| default_shipping_preference | shipping_preference | Default for new listings |
| ships_from_location | VARCHAR(200) | Shipping origin |
| ships_to_countries | TEXT[] | Countries willing to ship to |
| pickup_location_city | VARCHAR(100) | Local pickup city |
| pickup_location_state | VARCHAR(100) | Local pickup state |
| pickup_location_country | VARCHAR(100) | Local pickup country |
| pickup_location_postal | VARCHAR(20) | Local pickup ZIP |
| pickup_location_lat | DECIMAL(10,8) | Latitude for distance search |
| pickup_location_lng | DECIMAL(11,8) | Longitude for distance search |
| notification_preferences | JSONB | Marketplace notification settings |
| total_sales | INTEGER | Denormalized sales count |
| total_purchases | INTEGER | Denormalized purchases count |
| total_trades | INTEGER | Denormalized trades count |
| seller_rating | DECIMAL(3,2) | Average seller rating |
| buyer_rating | DECIMAL(3,2) | Average buyer rating |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### marketplace_listings
Board game marketplace listings for buy/sell/trade.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | FK to user_profiles |
| game_id | UUID | FK to games |
| listing_type | listing_type | sell, trade, or want |
| status | listing_status | draft, active, pending, sold, traded, expired, cancelled |
| title | VARCHAR(200) | Optional custom title |
| condition | game_condition | Physical condition (null for want listings) |
| condition_notes | TEXT | Additional condition details |
| description | TEXT | Listing description |
| price_cents | INTEGER | Price in cents (100-1000000) |
| currency | VARCHAR(3) | Currency code (default USD) |
| accepts_offers | BOOLEAN | Allow offers below asking |
| minimum_offer_cents | INTEGER | Minimum acceptable offer |
| trade_preferences | TEXT | What seller wants in trade |
| trade_game_ids | UUID[] | Games wanted in trade |
| shipping_preference | shipping_preference | local_only, will_ship, ship_only |
| shipping_cost_cents | INTEGER | Shipping cost in cents |
| shipping_notes | TEXT | Shipping details |
| location_city | VARCHAR(100) | Seller city |
| location_state | VARCHAR(100) | Seller state |
| location_country | VARCHAR(100) | Seller country |
| location_postal | VARCHAR(20) | Seller ZIP |
| location_lat | DECIMAL(10,8) | Latitude for distance search |
| location_lng | DECIMAL(11,8) | Longitude for distance search |
| is_featured | BOOLEAN | Featured listing |
| view_count | INTEGER | View counter |
| save_count | INTEGER | Watchlist counter |
| expires_at | TIMESTAMPTZ | Auto-expiration date |
| published_at | TIMESTAMPTZ | When made active |
| sold_at | TIMESTAMPTZ | When sold/traded |
| fts | TSVECTOR | Full-text search (generated) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### listing_images
Photos for marketplace listings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| listing_id | UUID | FK to marketplace_listings |
| url | TEXT | Image URL |
| storage_path | VARCHAR(500) | Supabase storage path |
| alt_text | VARCHAR(255) | Alt text |
| width | INTEGER | Image width |
| height | INTEGER | Image height |
| file_size | INTEGER | File size in bytes |
| mime_type | VARCHAR(50) | MIME type |
| display_order | SMALLINT | Sort order |
| is_primary | BOOLEAN | Primary image for listing |
| created_at | TIMESTAMPTZ | Creation timestamp |

### listing_saves
User watchlist/favorites for listings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| listing_id | UUID | FK to marketplace_listings |
| notes | TEXT | User's private notes |
| created_at | TIMESTAMPTZ | When saved |

**Unique constraint:** (user_id, listing_id)

### marketplace_conversations
Message threads between buyers and sellers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| listing_id | UUID | FK to marketplace_listings |
| buyer_id | UUID | FK to user_profiles |
| seller_id | UUID | FK to user_profiles |
| buyer_unread_count | INTEGER | Unread messages for buyer |
| seller_unread_count | INTEGER | Unread messages for seller |
| last_message_at | TIMESTAMPTZ | When last message was sent |
| buyer_archived | BOOLEAN | Archived by buyer |
| seller_archived | BOOLEAN | Archived by seller |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint:** (listing_id, buyer_id)

### marketplace_messages
Individual messages in conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to marketplace_conversations |
| sender_id | UUID | FK to user_profiles |
| content | TEXT | Message content |
| is_read | BOOLEAN | Whether recipient has read |
| is_system_message | BOOLEAN | System-generated message |
| created_at | TIMESTAMPTZ | When sent |

### marketplace_offers
Offers on marketplace listings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| listing_id | UUID | FK to marketplace_listings |
| buyer_id | UUID | FK to user_profiles |
| seller_id | UUID | FK to user_profiles |
| offer_type | offer_type | buy, trade, buy_plus_trade |
| status | offer_status | pending, accepted, declined, etc. |
| amount_cents | INTEGER | Cash offer amount |
| trade_game_ids | UUID[] | Games offered in trade |
| message | TEXT | Message with offer |
| parent_offer_id | UUID | FK to parent (for counter-offers) |
| counter_count | INTEGER | Number of counters in chain |
| expires_at | TIMESTAMPTZ | Auto-expiration (48 hours) |
| responded_at | TIMESTAMPTZ | When seller responded |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### marketplace_transactions
Payment transactions linking offers to Stripe.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| offer_id | UUID | FK to marketplace_offers |
| listing_id | UUID | FK to marketplace_listings |
| buyer_id | UUID | FK to user_profiles |
| seller_id | UUID | FK to user_profiles |
| stripe_payment_intent_id | VARCHAR(100) | Stripe PaymentIntent ID |
| stripe_checkout_session_id | VARCHAR(100) | Stripe Checkout Session ID |
| stripe_charge_id | VARCHAR(100) | Stripe Charge ID |
| stripe_transfer_id | VARCHAR(100) | Stripe Transfer ID |
| amount_cents | INTEGER | Item amount in cents |
| shipping_cents | INTEGER | Shipping cost in cents |
| platform_fee_cents | INTEGER | Platform fee (3%) |
| stripe_fee_cents | INTEGER | Stripe fee (2.9% + $0.30) |
| seller_payout_cents | INTEGER | Amount seller receives |
| currency | VARCHAR(3) | Currency code (USD) |
| status | transaction_status | Current transaction state |
| shipping_carrier | shipping_carrier | Shipping carrier used |
| tracking_number | VARCHAR(200) | Tracking number |
| shipped_at | TIMESTAMPTZ | When item shipped |
| delivered_at | TIMESTAMPTZ | When delivery confirmed |
| paid_at | TIMESTAMPTZ | When payment confirmed |
| released_at | TIMESTAMPTZ | When funds released |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Helper functions:**
- `create_transaction_from_offer(offer_id)` - Create transaction from accepted offer
- `mark_transaction_paid(id, payment_intent_id)` - Mark as paid
- `ship_transaction(id, carrier, tracking)` - Add shipping info
- `confirm_delivery(id)` - Confirm receipt
- `release_transaction_funds(id)` - Release funds to seller
- `request_refund(id)` - Request refund

### marketplace_feedback
Feedback and ratings for completed transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| transaction_id | UUID | FK to marketplace_transactions |
| reviewer_id | UUID | FK to user_profiles (who left feedback) |
| reviewee_id | UUID | FK to user_profiles (who received feedback) |
| role | feedback_role | buyer or seller |
| rating | SMALLINT | 1-5 star rating |
| comment | TEXT | Optional feedback comment |
| is_positive | BOOLEAN | Generated: rating >= 4 |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint:** (transaction_id, reviewer_id) - one feedback per user per transaction

**Helper functions:**
- `leave_feedback(transaction_id, user_id, rating, comment)` - Leave feedback for completed transaction
- `get_user_feedback(user_id, role, limit, offset)` - Get paginated feedback for user
- `get_user_reputation(user_id)` - Get aggregated reputation stats
- `can_leave_feedback(transaction_id, user_id)` - Check if user can leave feedback

### seller_reputation_stats (Materialized View)
Aggregated reputation statistics for marketplace users.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | FK to user_profiles |
| seller_feedback_count | BIGINT | Total feedback received as seller |
| seller_rating | NUMERIC | Average seller rating |
| seller_five_star_count | BIGINT | Count of 5-star seller ratings |
| seller_positive_count | BIGINT | Count of positive (4-5 star) ratings |
| seller_negative_count | BIGINT | Count of negative (1-2 star) ratings |
| buyer_feedback_count | BIGINT | Total feedback received as buyer |
| buyer_rating | NUMERIC | Average buyer rating |
| total_feedback_count | BIGINT | Total feedback count |
| overall_rating | NUMERIC | Combined average rating |
| trust_level | trust_level | Calculated trust tier |
| total_sales | BIGINT | From user_marketplace_settings |
| total_purchases | BIGINT | From user_marketplace_settings |
| calculated_at | TIMESTAMPTZ | When stats were calculated |

**Refresh function:** `refresh_seller_reputation()` - Refresh materialized view

### saved_searches
User's saved marketplace search criteria with alert preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| name | VARCHAR(100) | Search name (auto-generated or custom) |
| filters | JSONB | Saved filter criteria |
| alerts_enabled | BOOLEAN | Whether alerts are on |
| alert_frequency | alert_frequency | instant, daily, weekly |
| alert_email | BOOLEAN | Send email notifications |
| status | alert_status | active, paused, expired |
| last_run_at | TIMESTAMPTZ | Last time search was executed |
| last_match_at | TIMESTAMPTZ | Last time a match was found |
| match_count | INTEGER | Total matches found |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Constraints:**
- Max 25 saved searches per user (enforced by trigger)

**Helper functions:**
- `upsert_saved_search(user_id, name, filters, frequency)` - Create or update saved search
- `find_matching_saved_searches(listing)` - Find searches matching a new listing

### wishlist_alerts
Price/availability alerts for games on user's wishlist.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| game_id | UUID | FK to games |
| max_price_cents | INTEGER | Maximum price threshold |
| accepted_conditions | game_condition[] | Acceptable conditions |
| local_only | BOOLEAN | Only local listings |
| max_distance_miles | INTEGER | Max distance for local |
| alerts_enabled | BOOLEAN | Whether alerts are on |
| status | alert_status | active, paused, expired |
| last_notified_at | TIMESTAMPTZ | Last notification sent |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint:** (user_id, game_id)

**Helper functions:**
- `upsert_wishlist_alert(user_id, game_id, max_price, conditions)` - Create or update alert
- `find_matching_wishlist_alerts(listing)` - Find alerts matching a new listing

### alert_notifications
Tracks sent notifications to avoid duplicates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_profiles |
| saved_search_id | UUID | FK to saved_searches (nullable) |
| wishlist_alert_id | UUID | FK to wishlist_alerts (nullable) |
| listing_id | UUID | FK to marketplace_listings |
| notification_type | VARCHAR(50) | Type of alert sent |
| sent_at | TIMESTAMPTZ | When notification was sent |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Partial unique indexes:**
- (saved_search_id, listing_id) WHERE saved_search_id IS NOT NULL
- (wishlist_alert_id, listing_id) WHERE wishlist_alert_id IS NOT NULL

**RPC function:**
- `get_similar_listings(listing_id, limit)` - Returns similar listings with similarity scores

## Junction Tables

### game_categories
Many-to-many: games ↔ categories

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| category_id | UUID | FK to categories |
| is_primary | BOOLEAN | Primary category for game |
| source | VARCHAR(20) | Origin: bgg, wikidata, wikipedia, ai, manual |

### game_mechanics
Many-to-many: games ↔ mechanics

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| mechanic_id | UUID | FK to mechanics |
| source | VARCHAR(20) | Origin: bgg, wikidata, wikipedia, ai, manual |

### game_themes
Many-to-many: games ↔ themes

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| theme_id | UUID | FK to themes |
| is_primary | BOOLEAN | Primary theme for game |
| source | VARCHAR(20) | Origin: bgg, wikidata, wikipedia, ai, manual |

### game_player_experiences
Many-to-many: games ↔ player_experiences

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| player_experience_id | UUID | FK to player_experiences |
| is_primary | BOOLEAN | Primary experience for game |

### game_designers
Many-to-many: games ↔ designers

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| designer_id | UUID | FK to designers |
| is_primary | BOOLEAN | Primary designer |
| display_order | SMALLINT | Sort order |

### game_publishers
Many-to-many: games ↔ publishers

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| publisher_id | UUID | FK to publishers |
| is_primary | BOOLEAN | Primary publisher |
| display_order | SMALLINT | Sort order |

### game_artists
Many-to-many: games ↔ artists

| Column | Type | Description |
|--------|------|-------------|
| game_id | UUID | FK to games |
| artist_id | UUID | FK to artists |
| is_primary | BOOLEAN | Primary artist |
| display_order | SMALLINT | Sort order |

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
- `marketplace_listings(seller_id)` - Seller's listings
- `marketplace_listings(game_id)` - Listings by game
- `marketplace_listings(status, listing_type, published_at)` - Browse queries (partial on active)
- `marketplace_listings(location_lat, location_lng)` - Location search (partial on active)
- `marketplace_listings(price_cents)` - Price filtering (partial on sell/active)
- `marketplace_listings(fts)` - GIN index for listing search
- `listing_images(listing_id, display_order)` - Image ordering
- `listing_saves(user_id)` - User's watchlist

## Row Level Security (RLS)

All tables have RLS enabled with public read access for:
- Published games (`is_published = true`)
- All categories and mechanics
- Published collections (`is_published = true`)
- All junction tables
- All score sheet configs and fields
- All affiliate links and game images
- Feature flags (read-only)
- Active marketplace listings (`status = 'active'`)

**Marketplace RLS policies:**
- Users can view all active listings + their own draft/cancelled listings
- Users can only CRUD their own listings
- Listing images follow their parent listing's visibility
- Users can only manage their own watchlist saves

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

## Storage Buckets

| Bucket | Public | Size Limit | MIME Types | Purpose |
|--------|--------|------------|------------|---------|
| `game-images` | Yes | 5MB | jpeg, png, webp, gif | Game box art, gallery, rulebook thumbnails |
| `user-avatars` | Yes | 5MB | jpeg, png, webp | User profile images |
| `listing-images` | Yes | 10MB | jpeg, png, webp, gif | Marketplace listing photos |
| `rulebooks` | Yes | 50MB | application/pdf | Uploaded rulebook PDFs |

**Storage path conventions:**
- Game images: `{game_id}/{image_type}/{filename}`
- Rulebook thumbnails: `rulebook-thumbnails/{game_slug}.png`
- Rulebook PDFs: `{game_slug}.pdf`
- User avatars: `{user_id}/{filename}`
- Listing images: `{user_id}/{listing_id}/{filename}`

## Helper Functions

### calculate_distance_miles
Haversine formula for distance between two lat/lng points in miles.
Used for location-based marketplace search.

```sql
SELECT calculate_distance_miles(lat1, lng1, lat2, lng2);
```
