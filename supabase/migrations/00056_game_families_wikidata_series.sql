-- =====================================================
-- GAME FAMILIES WIKIDATA SERIES ID
-- =====================================================
-- Add Wikidata series ID to game_families for matching during import

-- Wikidata series ID on game_families for matching
ALTER TABLE game_families ADD COLUMN IF NOT EXISTS wikidata_series_id VARCHAR(20);

-- Unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_families_wikidata_series_id ON game_families(wikidata_series_id)
  WHERE wikidata_series_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN game_families.wikidata_series_id IS 'Wikidata Q-number for the series, used for matching during import';
