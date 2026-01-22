-- =====================================================
-- ENHANCED WIKIPEDIA STORAGE
-- Store full article text and additional sections for richer content generation
-- =====================================================

-- Full article text for future prompt improvements
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS wikipedia_full_text TEXT;

COMMENT ON COLUMN games.wikipedia_full_text IS 'Full Wikipedia article text for comprehensive context in content generation';

-- Additional valuable sections
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS wikipedia_variants TEXT,
  ADD COLUMN IF NOT EXISTS wikipedia_strategy TEXT,
  ADD COLUMN IF NOT EXISTS wikipedia_components TEXT,
  ADD COLUMN IF NOT EXISTS wikipedia_expansions_section TEXT;

COMMENT ON COLUMN games.wikipedia_variants IS 'Variants/house rules section from Wikipedia';
COMMENT ON COLUMN games.wikipedia_strategy IS 'Strategy section from Wikipedia (rare but valuable)';
COMMENT ON COLUMN games.wikipedia_components IS 'Components section from Wikipedia';
COMMENT ON COLUMN games.wikipedia_expansions_section IS 'Expansions/editions section from Wikipedia';

-- All sections as JSONB for flexible access
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS wikipedia_all_sections JSONB;

COMMENT ON COLUMN games.wikipedia_all_sections IS 'All Wikipedia sections as JSONB: {sectionName: content}';

-- Publisher marketing description (from BGG or publisher site)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS publisher_description TEXT,
  ADD COLUMN IF NOT EXISTS publisher_description_source TEXT;

COMMENT ON COLUMN games.publisher_description IS 'Marketing description from publisher or BGG';
COMMENT ON COLUMN games.publisher_description_source IS 'Source of publisher description: bgg, publisher_site, manual';

-- Lead section (intro paragraphs before first heading)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS wikipedia_lead TEXT;

COMMENT ON COLUMN games.wikipedia_lead IS 'Lead/intro section of Wikipedia article (paragraphs before first heading)';

-- =====================================================
-- INDEX for full-text search on descriptions
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_games_publisher_description_gin
  ON games USING gin(to_tsvector('english', COALESCE(publisher_description, '')));
