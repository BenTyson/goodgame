-- =====================================================
-- WIKIDATA GAME ENRICHMENT FIELDS
-- =====================================================
-- Add columns to store Wikidata-sourced game data
-- These supplement BGG data with CC-licensed content

-- Wikidata entity ID (Q-number)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikidata_id VARCHAR(20);

-- Wikidata/Wikimedia Commons image (CC-licensed, safe for public display)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikidata_image_url VARCHAR(500);

-- Official game website (from Wikidata P856)
ALTER TABLE games ADD COLUMN IF NOT EXISTS official_website VARCHAR(500);

-- Track when Wikidata enrichment was last performed
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikidata_last_synced TIMESTAMPTZ;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_games_wikidata_id ON games(wikidata_id) WHERE wikidata_id IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN games.wikidata_id IS 'Wikidata entity Q-number (e.g., Q12345)';
COMMENT ON COLUMN games.wikidata_image_url IS 'Image URL from Wikimedia Commons (CC-licensed)';
COMMENT ON COLUMN games.official_website IS 'Official game/publisher website from Wikidata';
COMMENT ON COLUMN games.wikidata_last_synced IS 'Timestamp of last Wikidata enrichment';
