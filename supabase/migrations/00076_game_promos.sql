-- =====================================================
-- PROMOS & EXTRAS SYSTEM
-- Add support for promotional items linked to parent games
-- =====================================================

-- Add promo flag and parent reference
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS parent_game_id UUID REFERENCES games(id) ON DELETE SET NULL;

-- Create indexes for efficient promo queries
CREATE INDEX IF NOT EXISTS idx_games_is_promo ON games(is_promo);
CREATE INDEX IF NOT EXISTS idx_games_parent_game ON games(parent_game_id);

-- Add descriptive comments
COMMENT ON COLUMN games.is_promo IS
  'True for promotional items. Promos bypass Vecna and auto-publish.';
COMMENT ON COLUMN games.parent_game_id IS
  'Direct reference to parent game for promos. Enables efficient lookups.';

-- =====================================================
-- UPDATE SEARCH FUNCTION
-- Exclude promos from search results
-- =====================================================

CREATE OR REPLACE FUNCTION search_games(search_query TEXT)
RETURNS SETOF games AS $$
  SELECT *
  FROM games
  WHERE fts @@ plainto_tsquery('english', search_query)
  AND is_published = TRUE
  AND (is_promo = FALSE OR is_promo IS NULL)
  ORDER BY ts_rank(fts, plainto_tsquery('english', search_query)) DESC;
$$ LANGUAGE SQL STABLE;
