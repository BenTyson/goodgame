-- Migration: 00075_awards_bgg_id_support.sql
-- Description: Allow game_awards to store awards for games not yet imported
-- Games are identified by BGG ID until imported, then linked to game_id

-- Make game_id nullable to support pending awards
ALTER TABLE game_awards
  ALTER COLUMN game_id DROP NOT NULL;

-- Add columns for identifying unimported games
ALTER TABLE game_awards
  ADD COLUMN bgg_id INTEGER,
  ADD COLUMN game_name VARCHAR(255),
  ADD COLUMN wikidata_game_id VARCHAR(50);

-- Index for BGG ID lookups (used when linking on import)
CREATE INDEX idx_game_awards_bgg_id ON game_awards(bgg_id) WHERE bgg_id IS NOT NULL;

-- Must have either game_id (imported) OR bgg_id (pending)
ALTER TABLE game_awards
  ADD CONSTRAINT game_awards_game_reference_check
  CHECK (game_id IS NOT NULL OR bgg_id IS NOT NULL);

-- Drop the old unique constraint
ALTER TABLE game_awards
  DROP CONSTRAINT IF EXISTS game_awards_game_id_award_id_category_id_year_key;

-- Create new unique constraint that handles both cases:
-- 1. For imported games: unique on (game_id, award_id, category_id, year)
-- 2. For pending games: unique on (bgg_id, award_id, category_id, year)
-- Using COALESCE to handle nulls in the unique index
CREATE UNIQUE INDEX game_awards_unique_idx ON game_awards(
  COALESCE(game_id::text, ''),
  COALESCE(bgg_id, 0),
  award_id,
  COALESCE(category_id::text, ''),
  year
);

-- Comment for documentation
COMMENT ON COLUMN game_awards.bgg_id IS 'BGG ID for games not yet imported. Cleared when game_id is set.';
COMMENT ON COLUMN game_awards.game_name IS 'Game name from Wikidata for display when game not imported.';
COMMENT ON COLUMN game_awards.wikidata_game_id IS 'Wikidata Q-ID for reference and deduplication.';
