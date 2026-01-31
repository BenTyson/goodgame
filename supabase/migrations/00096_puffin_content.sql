-- Puffin AI content storage and sync cursor tracking
--
-- Adds columns to games table for storing Puffin-generated AI content
-- Creates sync_cursors table for cursor-based feed pagination

-- Add Puffin content columns to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS puffin_content JSONB,
ADD COLUMN IF NOT EXISTS puffin_content_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS puffin_content_completeness JSONB;

COMMENT ON COLUMN games.puffin_content IS 'Full Puffin AI-generated content blob (22 fields: tagline, description, quickStart, strategyTips, etc.)';
COMMENT ON COLUMN games.puffin_content_updated_at IS 'When Puffin content was last synced from the feed';
COMMENT ON COLUMN games.puffin_content_completeness IS 'Puffin completeness metadata: fieldCount, totalFields, missingFields, isComplete, subtype';

-- Index for querying games with content, ordered by freshness
CREATE INDEX IF NOT EXISTS idx_games_puffin_content_updated
ON games (puffin_content_updated_at)
WHERE puffin_content IS NOT NULL;

-- Reusable sync cursor table for cursor-based pagination
CREATE TABLE IF NOT EXISTS sync_cursors (
  key VARCHAR(100) PRIMARY KEY,
  cursor_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

COMMENT ON TABLE sync_cursors IS 'Reusable key/value store for sync cursor persistence across cron runs';
COMMENT ON COLUMN sync_cursors.key IS 'Unique cursor identifier (e.g. puffin_content_feed)';
COMMENT ON COLUMN sync_cursors.cursor_value IS 'ISO timestamp or opaque cursor string';
COMMENT ON COLUMN sync_cursors.metadata IS 'Run stats: last run time, counts, errors';

-- Seed initial cursor for Puffin content feed
INSERT INTO sync_cursors (key, cursor_value, metadata)
VALUES ('puffin_content_feed', '1970-01-01T00:00:00.000Z', '{"note": "initial seed"}')
ON CONFLICT (key) DO NOTHING;
