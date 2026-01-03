-- =====================================================
-- WIKIPEDIA INTEGRATION FIELDS
-- =====================================================
-- Add columns to store Wikipedia article URL and Wikidata series info
-- These help with family detection and provide rich context

-- Wikipedia article URL (English)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_url VARCHAR(500);

-- Wikidata series ID (Q-number for the series the game belongs to)
-- Used for auto-creating game families from Wikidata
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikidata_series_id VARCHAR(20);

-- Wikidata series ID on game_families for matching
ALTER TABLE game_families ADD COLUMN IF NOT EXISTS wikidata_series_id VARCHAR(20);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_games_wikidata_series_id ON games(wikidata_series_id)
  WHERE wikidata_series_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_families_wikidata_series_id ON game_families(wikidata_series_id)
  WHERE wikidata_series_id IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN games.wikipedia_url IS 'English Wikipedia article URL for the game';
COMMENT ON COLUMN games.wikidata_series_id IS 'Wikidata Q-number for the game series (P179 property)';
COMMENT ON COLUMN game_families.wikidata_series_id IS 'Wikidata Q-number for the series, used for matching during import';
