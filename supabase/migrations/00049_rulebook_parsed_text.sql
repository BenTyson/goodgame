-- =====================================================
-- RULEBOOK PARSED TEXT STORAGE
-- Store the extracted text from rulebook PDFs for reprocessing
-- =====================================================

-- Add parsed_text column to rulebook_parse_log
-- This stores the raw extracted text from the PDF
ALTER TABLE rulebook_parse_log
  ADD COLUMN IF NOT EXISTS parsed_text TEXT;

-- Add index for finding logs with text
CREATE INDEX IF NOT EXISTS idx_rulebook_parse_log_has_text
  ON rulebook_parse_log(game_id)
  WHERE parsed_text IS NOT NULL;

-- Also add a reference column on games table to the latest successful parse
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS latest_parse_log_id UUID REFERENCES rulebook_parse_log(id);

-- Comment on columns
COMMENT ON COLUMN rulebook_parse_log.parsed_text IS 'Raw text extracted from the rulebook PDF';
COMMENT ON COLUMN games.latest_parse_log_id IS 'Reference to the most recent successful rulebook parse';
