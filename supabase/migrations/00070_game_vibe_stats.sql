-- Migration: Game Vibe Stats Materialized View
-- Creates pre-computed aggregates for game ratings (vibes)
-- Only includes ratings from users with public profiles/shelves

-- Create materialized view for game rating statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS game_vibe_stats AS
SELECT
  g.id as game_id,
  COUNT(ug.rating) as vibe_count,
  ROUND(AVG(ug.rating)::numeric, 2) as average_vibe,
  ROUND(STDDEV_POP(ug.rating)::numeric, 2) as vibe_stddev,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ug.rating) as median_vibe,
  MODE() WITHIN GROUP (ORDER BY ug.rating) as mode_vibe,
  -- Distribution counts (1-10)
  COUNT(*) FILTER (WHERE ug.rating = 1) as count_1,
  COUNT(*) FILTER (WHERE ug.rating = 2) as count_2,
  COUNT(*) FILTER (WHERE ug.rating = 3) as count_3,
  COUNT(*) FILTER (WHERE ug.rating = 4) as count_4,
  COUNT(*) FILTER (WHERE ug.rating = 5) as count_5,
  COUNT(*) FILTER (WHERE ug.rating = 6) as count_6,
  COUNT(*) FILTER (WHERE ug.rating = 7) as count_7,
  COUNT(*) FILTER (WHERE ug.rating = 8) as count_8,
  COUNT(*) FILTER (WHERE ug.rating = 9) as count_9,
  COUNT(*) FILTER (WHERE ug.rating = 10) as count_10,
  -- Count of vibes with thoughts (reviews)
  COUNT(*) FILTER (WHERE ug.rating IS NOT NULL AND ug.review IS NOT NULL) as vibes_with_thoughts
FROM games g
LEFT JOIN user_games ug ON ug.game_id = g.id AND ug.rating IS NOT NULL
LEFT JOIN user_profiles up ON up.id = ug.user_id
WHERE (up.profile_visibility = 'public' AND up.shelf_visibility = 'public') OR ug.game_id IS NULL
GROUP BY g.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_vibe_stats_game_id ON game_vibe_stats(game_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_game_vibe_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_vibe_stats;
END;
$$;

-- Grant permissions
GRANT SELECT ON game_vibe_stats TO authenticated;
GRANT SELECT ON game_vibe_stats TO anon;

-- Comment for documentation
COMMENT ON MATERIALIZED VIEW game_vibe_stats IS 'Pre-computed rating statistics per game. Refresh with SELECT refresh_game_vibe_stats()';
