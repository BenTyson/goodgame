-- Preview Pages for Puffin-Imported Games
-- Enables games to appear publicly after Puffin import, before Vecna processing

-- 1. Content requests table (tracks user interest in games without full content)
CREATE TABLE IF NOT EXISTS content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64),  -- For anonymous deduplication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, ip_hash)
);

-- Index for counting requests per game
CREATE INDEX IF NOT EXISTS idx_content_requests_game_id ON content_requests(game_id);

-- 2. Request counts view (materialized for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS game_request_counts AS
SELECT
  game_id,
  COUNT(*) as request_count,
  MAX(created_at) as last_request_at
FROM content_requests
GROUP BY game_id;

-- Index for sorting by request count
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_request_counts_game_id ON game_request_counts(game_id);
CREATE INDEX IF NOT EXISTS idx_game_request_counts_count ON game_request_counts(request_count DESC);

-- 3. Games table addition - preview visibility flag
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_preview_visible BOOLEAN DEFAULT FALSE;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_games_preview_visible ON games(is_preview_visible) WHERE is_preview_visible = TRUE;

-- 4. Backfill: Make enriched games preview-visible
-- Games that have been through Puffin enrichment (beyond 'imported' state) can be shown as previews
UPDATE games
SET is_preview_visible = true
WHERE is_published = false
AND vecna_state IN (
  'enriched',
  'rulebook_missing',
  'rulebook_ready',
  'parsing',
  'parsed',
  'taxonomy_assigned',
  'generating',
  'generated'
);

-- 5. Update search function to include preview games
-- The search_games function filters games for public search
CREATE OR REPLACE FUNCTION search_games(search_query TEXT)
RETURNS SETOF games AS $$
  SELECT * FROM games
  WHERE fts @@ plainto_tsquery('english', search_query)
  AND (is_published = TRUE OR is_preview_visible = TRUE)
  AND (is_promo IS NULL OR is_promo = FALSE)
  ORDER BY is_published DESC, ts_rank(fts, plainto_tsquery('english', search_query)) DESC;
$$ LANGUAGE SQL STABLE;

-- 6. RLS policies for content_requests
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can read request counts (for displaying on game pages)
CREATE POLICY "Anyone can read requests"
  ON content_requests
  FOR SELECT
  USING (true);

-- Anyone can insert requests (will be deduplicated by unique constraints)
CREATE POLICY "Anyone can insert requests"
  ON content_requests
  FOR INSERT
  WITH CHECK (true);

-- Only allow users to delete their own requests
CREATE POLICY "Users can delete own requests"
  ON content_requests
  FOR DELETE
  USING (user_id = auth.uid());

-- 7. Function to refresh the materialized view (to be called periodically or after inserts)
CREATE OR REPLACE FUNCTION refresh_game_request_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_request_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role for background refresh
GRANT EXECUTE ON FUNCTION refresh_game_request_counts() TO service_role;

-- 8. Function to get request count for a single game (real-time, not from materialized view)
CREATE OR REPLACE FUNCTION get_game_request_count(target_game_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM content_requests
  WHERE game_id = target_game_id;
$$ LANGUAGE SQL STABLE;

-- Grant execute to all users
GRANT EXECUTE ON FUNCTION get_game_request_count(UUID) TO authenticated, anon;
