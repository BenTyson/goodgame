-- Migration: Vecna Pipeline State
-- Adds processing state tracking for the Vecna automated content pipeline

-- Add Vecna processing state enum
DO $$ BEGIN
  CREATE TYPE vecna_state AS ENUM (
    'imported',           -- BGG data imported
    'enriched',           -- Wikidata + Wikipedia done
    'rulebook_missing',   -- Waiting for manual rulebook URL
    'rulebook_ready',     -- Rulebook URL confirmed
    'parsing',            -- Rulebook being parsed
    'parsed',             -- Rulebook text extracted
    'taxonomy_assigned',  -- Categories/mechanics assigned
    'generating',         -- AI content being generated
    'generated',          -- AI content ready
    'review_pending',     -- Ready for human review
    'published'           -- Live on site
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add Vecna state columns to games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS vecna_state vecna_state DEFAULT 'imported',
  ADD COLUMN IF NOT EXISTS vecna_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vecna_error TEXT;

COMMENT ON COLUMN games.vecna_state IS 'Current state in Vecna processing pipeline';
COMMENT ON COLUMN games.vecna_processed_at IS 'When Vecna last processed this game';
COMMENT ON COLUMN games.vecna_error IS 'Error message if Vecna processing failed';

-- Add family context storage for expansion processing
ALTER TABLE game_families
  ADD COLUMN IF NOT EXISTS family_context JSONB;

COMMENT ON COLUMN game_families.family_context IS 'Base game context for expansion processing (mechanics, theme, setup, rules overview)';

-- Index for filtering by Vecna state
CREATE INDEX IF NOT EXISTS idx_games_vecna_state ON games (vecna_state);

-- Index for finding games needing processing
CREATE INDEX IF NOT EXISTS idx_games_vecna_pending ON games (vecna_state)
  WHERE vecna_state NOT IN ('published', 'review_pending');

-- Backfill existing games with appropriate state
-- Games with is_published = true -> 'published'
-- Games with rules_content IS NOT NULL -> 'generated'
-- Games with successful parse log entry -> 'parsed'
-- Games with rulebook_url IS NOT NULL -> 'rulebook_ready'
-- Games with wikipedia_summary IS NOT NULL -> 'enriched'
-- Everything else -> 'imported'

-- Published games
UPDATE games SET vecna_state = 'published'
WHERE is_published = true AND vecna_state IS NULL;

-- Games with generated content
UPDATE games SET vecna_state = 'generated'
WHERE is_published = false
  AND rules_content IS NOT NULL
  AND vecna_state IS NULL;

-- Games with parsed rulebook (check parse log table for successful parses)
UPDATE games SET vecna_state = 'parsed'
WHERE is_published = false
  AND rules_content IS NULL
  AND vecna_state IS NULL
  AND EXISTS (
    SELECT 1 FROM rulebook_parse_log
    WHERE rulebook_parse_log.game_id = games.id
    AND rulebook_parse_log.status = 'success'
    AND rulebook_parse_log.extracted_data IS NOT NULL
  );

-- Games with rulebook URL ready
UPDATE games SET vecna_state = 'rulebook_ready'
WHERE is_published = false
  AND rules_content IS NULL
  AND rulebook_url IS NOT NULL
  AND vecna_state IS NULL;

-- Games with Wikipedia/Wikidata enrichment
UPDATE games SET vecna_state = 'enriched'
WHERE is_published = false
  AND rules_content IS NULL
  AND rulebook_url IS NULL
  AND (wikipedia_summary IS NOT NULL OR wikidata_id IS NOT NULL)
  AND vecna_state IS NULL;

-- Everything else remains 'imported' (the default)
