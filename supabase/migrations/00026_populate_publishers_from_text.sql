-- =====================================================
-- Populate Publishers from Text Field
-- =====================================================
-- The original migration (00022) extracted publishers from bgg_raw_data,
-- but many games have null bgg_raw_data. This migration extracts
-- publishers from the publisher text column instead.

-- =====================================================
-- 1. INSERT PUBLISHERS FROM TEXT FIELD
-- =====================================================

-- Extract unique publishers from the publisher text column
INSERT INTO publishers (slug, name)
SELECT DISTINCT
  slugify(publisher),
  publisher
FROM games
WHERE publisher IS NOT NULL
  AND publisher != ''
  AND NOT EXISTS (
    SELECT 1 FROM publishers p WHERE p.name = games.publisher
  )
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. LINK GAMES TO PUBLISHERS
-- =====================================================

-- Link games to their publishers (primary publisher from text field)
INSERT INTO game_publishers (game_id, publisher_id, is_primary, display_order)
SELECT
  g.id,
  p.id,
  TRUE,
  0
FROM games g
JOIN publishers p ON p.name = g.publisher
WHERE g.publisher IS NOT NULL
  AND g.publisher != ''
  AND NOT EXISTS (
    SELECT 1 FROM game_publishers gp
    WHERE gp.game_id = g.id AND gp.publisher_id = p.id
  )
ON CONFLICT (game_id, publisher_id) DO NOTHING;

-- =====================================================
-- 3. VERIFY (run manually)
-- =====================================================

-- SELECT COUNT(*) as publisher_count FROM publishers;
-- SELECT COUNT(*) as link_count FROM game_publishers;
-- SELECT p.name, COUNT(gp.game_id) as game_count
-- FROM publishers p
-- LEFT JOIN game_publishers gp ON gp.publisher_id = p.id
-- GROUP BY p.id, p.name
-- ORDER BY game_count DESC;
