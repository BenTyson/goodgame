-- Migration: Wikipedia Tier 1 Fields
-- Adds columns for enhanced Wikipedia data extraction:
-- - Images from articles
-- - External links (rulebook, official site)
-- - Structured awards
-- - Gameplay section content

-- Wikipedia images array (from article, not just infobox)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_images JSONB;
COMMENT ON COLUMN games.wikipedia_images IS 'Array of images from Wikipedia article with URLs, dimensions, and licenses';

-- Categorized external links (rulebook, official, publisher, store)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_external_links JSONB;
COMMENT ON COLUMN games.wikipedia_external_links IS 'Categorized external links from Wikipedia (rulebook, official, publisher, store, video, review)';

-- Structured awards data
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_awards JSONB;
COMMENT ON COLUMN games.wikipedia_awards IS 'Parsed awards from Wikipedia (name, year, winner/nominated/finalist)';

-- Gameplay section content (for AI content generation)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_gameplay TEXT;
COMMENT ON COLUMN games.wikipedia_gameplay IS 'Gameplay section extracted from Wikipedia article';

-- Index for querying images
CREATE INDEX IF NOT EXISTS idx_games_wikipedia_images
ON games USING GIN (wikipedia_images);

-- Index for querying awards
CREATE INDEX IF NOT EXISTS idx_games_wikipedia_awards
ON games USING GIN (wikipedia_awards);

-- Index for querying external links by type
CREATE INDEX IF NOT EXISTS idx_games_wikipedia_external_links
ON games USING GIN (wikipedia_external_links);
