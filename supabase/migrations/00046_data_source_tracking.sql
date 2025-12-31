-- Migration: Data Source Tracking
-- Track provenance of game data (Wikidata, publishers, community, etc.)
-- Part of the legal data sourcing strategy

-- ============================================
-- DATA SOURCE ENUM
-- ============================================

-- Where the game data originated
CREATE TYPE data_source AS ENUM (
  'legacy_bgg',      -- Original BGG imports (pre-strategy)
  'wikidata',        -- Wikidata SPARQL import (CC0 licensed)
  'rulebook',        -- Parsed from publisher rulebook PDFs
  'publisher',       -- Direct from publisher partnership
  'community',       -- User-contributed data
  'manual'           -- Manually entered by admin
);

-- ============================================
-- ADD DATA SOURCE COLUMN TO GAMES
-- ============================================

-- Add data_source column (nullable for existing games)
ALTER TABLE games ADD COLUMN IF NOT EXISTS data_source data_source;

-- Add wikidata_id column for cross-referencing
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikidata_id TEXT;

-- Add column for tracking which fields came from which source
-- Useful for audit trail and knowing what's legally safe
ALTER TABLE games ADD COLUMN IF NOT EXISTS field_sources JSONB DEFAULT '{}';
-- Structure:
-- {
--   "name": "wikidata",
--   "year_published": "wikidata",
--   "player_count_min": "rulebook",
--   "player_count_max": "rulebook",
--   "play_time_min": "publisher",
--   "description": "manual",
--   "weight": "bncs"  -- Board Nomads Complexity Score
-- }

-- ============================================
-- UPDATE EXISTING GAMES
-- ============================================

-- Mark all existing games as legacy_bgg (they came from BGG scraping)
UPDATE games
SET data_source = 'legacy_bgg'
WHERE data_source IS NULL;

-- ============================================
-- INDEXES
-- ============================================

-- Index for filtering by data source
CREATE INDEX idx_games_data_source ON games(data_source);

-- Index for Wikidata ID lookups
CREATE UNIQUE INDEX idx_games_wikidata_id ON games(wikidata_id)
  WHERE wikidata_id IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN games.data_source IS 'Primary source of game data (for legal tracking)';
COMMENT ON COLUMN games.wikidata_id IS 'Wikidata Q-number (e.g., Q12345) for cross-referencing';
COMMENT ON COLUMN games.field_sources IS 'Per-field provenance tracking (audit trail)';

COMMENT ON TYPE data_source IS 'Origin of game data for legal compliance tracking';
