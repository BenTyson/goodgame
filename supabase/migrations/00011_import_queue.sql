-- Migration: 00011_import_queue.sql
-- Description: Queue system for importing games from BoardGameGeek

CREATE TABLE IF NOT EXISTS import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255),

  -- Source tracking
  source VARCHAR(50) NOT NULL, -- 'bgg_top500', 'award_winner', 'manual', 'family_member'
  source_detail TEXT, -- e.g., "SdJ 2023 Winner", "Rank #42"

  -- Priority and status
  priority SMALLINT DEFAULT 3, -- 1=highest, 5=lowest
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: pending, importing, imported, failed, skipped

  -- BGG metadata (populated on import attempt)
  bgg_rank INTEGER,
  bgg_rating DECIMAL(4,2),
  year_published SMALLINT,

  -- Result tracking
  imported_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_import_queue_status ON import_queue(status);
CREATE INDEX IF NOT EXISTS idx_import_queue_priority ON import_queue(priority);
CREATE INDEX IF NOT EXISTS idx_import_queue_bgg_id ON import_queue(bgg_id);
CREATE INDEX IF NOT EXISTS idx_import_queue_source ON import_queue(source);

-- Enable RLS (admin-only access, but we'll handle via API auth)
ALTER TABLE import_queue ENABLE ROW LEVEL SECURITY;

-- Allow public read for now (admin UI will use anon key with additional auth check)
CREATE POLICY "Import queue is viewable by everyone"
  ON import_queue FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_import_queue_updated_at
  BEFORE UPDATE ON import_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE import_queue IS 'Queue of BGG games to import';
COMMENT ON COLUMN import_queue.source IS 'Where this game came from: bgg_top500, award_winner, manual, family_member';
COMMENT ON COLUMN import_queue.status IS 'pending, importing, imported, failed, skipped';
COMMENT ON COLUMN import_queue.priority IS '1=highest priority, 5=lowest';
