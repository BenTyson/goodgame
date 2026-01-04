-- Migration: Wikipedia Enrichment
-- Adds columns for enhanced Wikipedia data extraction during BGG import

-- Structured infobox data from Wikipedia
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_infobox JSONB;
COMMENT ON COLUMN games.wikipedia_infobox IS 'Structured data extracted from Wikipedia infobox template (designer, publisher, players, etc.)';

-- Search confidence tracking (for debugging/monitoring)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_search_confidence VARCHAR(10);
COMMENT ON COLUMN games.wikipedia_search_confidence IS 'Confidence level of Wikipedia article match: high, medium, or low';

-- Origins/History section content
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_origins TEXT;
COMMENT ON COLUMN games.wikipedia_origins IS 'Origins/History section extracted from Wikipedia article';

-- Reception section content
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_reception TEXT;
COMMENT ON COLUMN games.wikipedia_reception IS 'Reception/Reviews section extracted from Wikipedia article';

-- Index for querying infobox data
CREATE INDEX IF NOT EXISTS idx_games_wikipedia_infobox
ON games USING GIN (wikipedia_infobox);

-- Add check constraint for valid confidence values
ALTER TABLE games ADD CONSTRAINT check_wikipedia_search_confidence
CHECK (wikipedia_search_confidence IS NULL OR wikipedia_search_confidence IN ('high', 'medium', 'low'));
