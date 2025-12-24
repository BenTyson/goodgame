-- =====================================================
-- Migrate Entity Data from bgg_raw_data
-- =====================================================
-- This migration extracts designers, publishers, artists, and mechanics
-- from the existing bgg_raw_data JSONB column and populates the new
-- normalized tables.

-- =====================================================
-- 1. MIGRATE DESIGNERS
-- =====================================================

-- Extract unique designers from all games' bgg_raw_data
INSERT INTO designers (slug, name)
SELECT DISTINCT
  slugify(designer::text),
  designer::text
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'designers') AS designer
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'designers' IS NOT NULL
  AND jsonb_array_length(g.bgg_raw_data->'designers') > 0
ON CONFLICT (slug) DO NOTHING;

-- Link games to designers with display order
INSERT INTO game_designers (game_id, designer_id, is_primary, display_order)
SELECT
  g.id,
  d.id,
  (ordinality = 1),
  (ordinality - 1)::SMALLINT
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'designers') WITH ORDINALITY AS t(designer, ordinality)
JOIN designers d ON d.name = designer::text
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'designers' IS NOT NULL
ON CONFLICT (game_id, designer_id) DO NOTHING;

-- =====================================================
-- 2. MIGRATE PUBLISHERS
-- =====================================================

-- Extract unique publishers from all games' bgg_raw_data
INSERT INTO publishers (slug, name)
SELECT DISTINCT
  slugify(publisher::text),
  publisher::text
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'publishers') AS publisher
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'publishers' IS NOT NULL
  AND jsonb_array_length(g.bgg_raw_data->'publishers') > 0
ON CONFLICT (slug) DO NOTHING;

-- Link games to publishers with display order
INSERT INTO game_publishers (game_id, publisher_id, is_primary, display_order)
SELECT
  g.id,
  p.id,
  (ordinality = 1),
  (ordinality - 1)::SMALLINT
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'publishers') WITH ORDINALITY AS t(publisher, ordinality)
JOIN publishers p ON p.name = publisher::text
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'publishers' IS NOT NULL
ON CONFLICT (game_id, publisher_id) DO NOTHING;

-- =====================================================
-- 3. MIGRATE ARTISTS
-- =====================================================

-- Extract unique artists from all games' bgg_raw_data
INSERT INTO artists (slug, name)
SELECT DISTINCT
  slugify(artist::text),
  artist::text
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'artists') AS artist
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'artists' IS NOT NULL
  AND jsonb_array_length(g.bgg_raw_data->'artists') > 0
ON CONFLICT (slug) DO NOTHING;

-- Link games to artists with display order
INSERT INTO game_artists (game_id, artist_id, display_order)
SELECT
  g.id,
  a.id,
  (ordinality - 1)::SMALLINT
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'artists') WITH ORDINALITY AS t(artist, ordinality)
JOIN artists a ON a.name = artist::text
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'artists' IS NOT NULL
ON CONFLICT (game_id, artist_id) DO NOTHING;

-- =====================================================
-- 4. MIGRATE MECHANICS
-- =====================================================

-- Extract unique mechanics from all games' bgg_raw_data
-- Using upsert to add mechanics that don't exist yet
INSERT INTO mechanics (slug, name)
SELECT DISTINCT
  slugify(mechanic::text),
  mechanic::text
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'mechanics') AS mechanic
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'mechanics' IS NOT NULL
  AND jsonb_array_length(g.bgg_raw_data->'mechanics') > 0
ON CONFLICT (slug) DO NOTHING;

-- Link games to mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT
  g.id,
  m.id
FROM games g,
  jsonb_array_elements_text(g.bgg_raw_data->'mechanics') AS mechanic
JOIN mechanics m ON m.name = mechanic::text
WHERE g.bgg_raw_data IS NOT NULL
  AND g.bgg_raw_data->'mechanics' IS NOT NULL
ON CONFLICT (game_id, mechanic_id) DO NOTHING;

-- =====================================================
-- 5. UPDATE FULL-TEXT SEARCH
-- =====================================================

-- Drop and recreate the fts column to include designers from the new table
-- (Optional: For now we keep the existing fts which uses the old publisher column)
-- In a future migration, we can enhance this to include data from junction tables

-- =====================================================
-- 6. VERIFY MIGRATION (run manually for debugging)
-- =====================================================

-- Check counts:
-- SELECT 'designers' as entity, COUNT(*) FROM designers
-- UNION ALL
-- SELECT 'publishers', COUNT(*) FROM publishers
-- UNION ALL
-- SELECT 'artists', COUNT(*) FROM artists
-- UNION ALL
-- SELECT 'mechanics', COUNT(*) FROM mechanics
-- UNION ALL
-- SELECT 'game_designers', COUNT(*) FROM game_designers
-- UNION ALL
-- SELECT 'game_publishers', COUNT(*) FROM game_publishers
-- UNION ALL
-- SELECT 'game_artists', COUNT(*) FROM game_artists
-- UNION ALL
-- SELECT 'game_mechanics', COUNT(*) FROM game_mechanics;
