-- Add source tracking to taxonomy junction tables
-- Source values: 'bgg', 'wikidata', 'wikipedia', 'ai', 'manual'

-- Add source column to game_categories
ALTER TABLE game_categories
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add source column to game_mechanics
ALTER TABLE game_mechanics
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add source column to game_themes
ALTER TABLE game_themes
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add comments for documentation
COMMENT ON COLUMN game_categories.source IS 'Origin of this category assignment: bgg, wikidata, wikipedia, ai, manual';
COMMENT ON COLUMN game_mechanics.source IS 'Origin of this mechanic assignment: bgg, wikidata, wikipedia, ai, manual';
COMMENT ON COLUMN game_themes.source IS 'Origin of this theme assignment: bgg, wikidata, wikipedia, ai, manual';
