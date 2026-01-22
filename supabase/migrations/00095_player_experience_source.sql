-- Add source tracking to game_player_experiences junction table
-- Source values: 'bgg', 'wikidata', 'wikipedia', 'ai', 'manual'
-- This was missed in migration 00061 which added source to the other taxonomy tables

-- Add source column to game_player_experiences
ALTER TABLE game_player_experiences
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Backfill existing records as 'legacy' to distinguish from explicit 'manual' assignments
UPDATE game_player_experiences SET source = 'legacy' WHERE source = 'manual' OR source IS NULL;

-- Now set the default to 'manual' for new records
ALTER TABLE game_player_experiences ALTER COLUMN source SET DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN game_player_experiences.source IS 'Origin of this experience assignment: bgg, wikidata, wikipedia, ai, manual, legacy';
