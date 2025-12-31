-- Migration: Add 'seed' to data_source enum
-- For games imported from seed-games.json (factual data extraction)

-- Add 'seed' value to the enum
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'seed';

-- Comment
COMMENT ON TYPE data_source IS 'Origin of game data: legacy_bgg, wikidata, rulebook, publisher, community, manual, seed';
