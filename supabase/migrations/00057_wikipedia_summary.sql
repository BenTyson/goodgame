-- =====================================================
-- WIKIPEDIA SUMMARY STORAGE
-- =====================================================
-- Add columns to store AI-summarized Wikipedia content for use
-- in content generation (rules, setup, reference guides)

-- AI-summarized Wikipedia article content (stored as JSON with structured data)
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_summary JSONB;

-- Track when Wikipedia summary was last fetched
ALTER TABLE games ADD COLUMN IF NOT EXISTS wikipedia_fetched_at TIMESTAMPTZ;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN games.wikipedia_summary IS 'AI-summarized Wikipedia article content for content generation context (JSON with summary, themes, mechanics, reception, awards)';
COMMENT ON COLUMN games.wikipedia_fetched_at IS 'Timestamp when Wikipedia summary was last fetched and processed';
