-- =====================================================
-- RULEBOOK PIPELINE & BOARD NOMADS COMPLEXITY SCORE
-- Phase 2 of Legal Data Sourcing Strategy
-- =====================================================

-- Add rulebook and BNCS fields to games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS rulebook_url TEXT,
  ADD COLUMN IF NOT EXISTS rulebook_source TEXT, -- 'publisher', 'bgg_files', 'manual'
  ADD COLUMN IF NOT EXISTS rulebook_parsed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bncs_score DECIMAL(2,1) CHECK (bncs_score >= 1 AND bncs_score <= 5),
  ADD COLUMN IF NOT EXISTS bncs_breakdown JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bncs_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS component_list JSONB DEFAULT NULL;

-- BNCS breakdown structure:
-- {
--   "rules_density": 3.2,       -- 1-5 based on rulebook length/complexity
--   "decision_space": 4.1,      -- 1-5 based on choices per turn
--   "learning_curve": 2.5,      -- 1-5 easy to learn = low
--   "strategic_depth": 4.0,     -- 1-5 hard to master = high
--   "component_complexity": 3.0, -- 1-5 based on pieces/boards/cards
--   "reasoning": "Medium rules with high strategic depth..."
-- }

-- Component list structure:
-- {
--   "cards": 120,
--   "dice": 4,
--   "tokens": 50,
--   "boards": 1,
--   "miniatures": 0,
--   "tiles": 24,
--   "other": ["score pad", "rulebook"]
-- }

-- Create index for games with rulebooks
CREATE INDEX IF NOT EXISTS idx_games_rulebook_url ON games(rulebook_url) WHERE rulebook_url IS NOT NULL;

-- Create index for games with BNCS scores
CREATE INDEX IF NOT EXISTS idx_games_bncs_score ON games(bncs_score) WHERE bncs_score IS NOT NULL;

-- Add rulebook_source enum type for consistency
DO $$ BEGIN
  CREATE TYPE rulebook_source AS ENUM (
    'publisher_website',
    'publisher_partnership',
    'bgg_files',
    'user_submitted',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create table to track publisher rulebook URL patterns
CREATE TABLE IF NOT EXISTS publisher_rulebook_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  publisher_name TEXT, -- Fallback if publisher not in our DB
  url_pattern TEXT NOT NULL, -- e.g., 'stonemaiergames.com/games/{game}/rules/'
  pattern_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'search', 'resource_page'
  resource_page_url TEXT, -- For publishers with single resources page
  notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE publisher_rulebook_patterns ENABLE ROW LEVEL SECURITY;

-- Admin-only access for rulebook patterns
CREATE POLICY "Admin can manage rulebook patterns" ON publisher_rulebook_patterns
  FOR ALL USING (true);

-- Seed some known publisher patterns
INSERT INTO publisher_rulebook_patterns (publisher_name, url_pattern, pattern_type, resource_page_url, notes, is_verified) VALUES
  ('Stonemaier Games', 'stonemaiergames.com/games/{game}/rules/', 'direct', 'https://stonemaiergames.com/games/', 'Each game page has rules section', true),
  ('Leder Games', 'ledergames.com', 'resource_page', 'https://ledergames.com/pages/resources', 'Single resources page with all PDFs', true),
  ('CMON', 'cmon-files.s3.amazonaws.com/pdf/', 'direct', NULL, 'S3 bucket with PDFs', true),
  ('Fantasy Flight Games', 'fantasyflightgames.com/en/products/', 'search', NULL, 'Product pages have support sections', true),
  ('Czech Games Edition', 'czechgames.com', 'resource_page', 'https://czechgames.com/en/home/', 'Downloads section on site', true),
  ('Rio Grande Games', 'riograndegames.com', 'resource_page', 'https://riograndegames.com/game-support/', 'Game support page', false),
  ('Z-Man Games', 'zmangames.com', 'search', NULL, 'Product pages have downloads', false),
  ('Pandasaurus Games', 'pandasaurusgames.com', 'search', NULL, 'Individual game pages', false),
  ('Restoration Games', 'restorationgames.com', 'search', NULL, 'Game pages have rules links', false)
ON CONFLICT DO NOTHING;

-- Create table to log rulebook parsing attempts
CREATE TABLE IF NOT EXISTS rulebook_parse_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  rulebook_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'partial'
  page_count INT,
  word_count INT,
  extracted_data JSONB, -- Full extracted content
  error_message TEXT,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rulebook_parse_log_game ON rulebook_parse_log(game_id);
CREATE INDEX IF NOT EXISTS idx_rulebook_parse_log_status ON rulebook_parse_log(status);

-- Enable RLS
ALTER TABLE rulebook_parse_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access for parse logs
CREATE POLICY "Admin can view parse logs" ON rulebook_parse_log
  FOR SELECT USING (true);

-- Add trigger for updated_at on publisher_rulebook_patterns
CREATE TRIGGER update_publisher_rulebook_patterns_updated_at
  BEFORE UPDATE ON publisher_rulebook_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on columns for documentation
COMMENT ON COLUMN games.rulebook_url IS 'URL to the official publisher rulebook PDF';
COMMENT ON COLUMN games.rulebook_source IS 'Where the rulebook URL came from';
COMMENT ON COLUMN games.bncs_score IS 'Board Nomads Complexity Score (1.0-5.0) - AI-generated from rulebook analysis';
COMMENT ON COLUMN games.bncs_breakdown IS 'Multi-dimensional complexity breakdown: rules_density, decision_space, learning_curve, strategic_depth, component_complexity';
COMMENT ON COLUMN games.component_list IS 'Extracted list of game components from rulebook';
