-- Migration: Add function to get friends' upcoming tables
-- Shows tables from friends that you haven't been invited to yet

CREATE OR REPLACE FUNCTION get_friends_upcoming_tables(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  table_id UUID,
  title VARCHAR(200),
  scheduled_at TIMESTAMPTZ,
  location_name VARCHAR(200),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  status table_status,
  privacy table_privacy,
  host_id UUID,
  host_username VARCHAR(50),
  host_display_name VARCHAR(100),
  host_avatar_url TEXT,
  host_custom_avatar_url VARCHAR(500),
  game_id UUID,
  game_name VARCHAR(200),
  game_slug VARCHAR(200),
  game_thumbnail_url TEXT,
  participant_count BIGINT,
  attending_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH user_friends AS (
    -- Get mutual friends (both follow each other)
    SELECT f1.following_id AS friend_id
    FROM user_follows f1
    JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    WHERE f1.follower_id = p_user_id
  )
  SELECT
    t.id AS table_id,
    t.title,
    t.scheduled_at,
    t.location_name,
    t.location_lat,
    t.location_lng,
    t.status,
    t.privacy,
    t.host_id,
    h.username AS host_username,
    h.display_name AS host_display_name,
    h.avatar_url AS host_avatar_url,
    h.custom_avatar_url AS host_custom_avatar_url,
    g.id AS game_id,
    g.name AS game_name,
    g.slug AS game_slug,
    g.thumbnail_url AS game_thumbnail_url,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id) AS participant_count,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id AND rsvp_status = 'attending') AS attending_count
  FROM tables t
  JOIN user_profiles h ON h.id = t.host_id
  JOIN games g ON g.id = t.game_id
  WHERE t.status = 'scheduled'
    AND t.scheduled_at >= NOW()
    -- Host must be a friend
    AND t.host_id IN (SELECT friend_id FROM user_friends)
    -- Table must be visible (friends_only or public)
    AND t.privacy IN ('friends_only', 'public')
    -- User is not already a participant
    AND NOT EXISTS (
      SELECT 1 FROM table_participants tp
      WHERE tp.table_id = t.id
      AND tp.user_id = p_user_id
    )
  ORDER BY t.scheduled_at ASC
  LIMIT p_limit;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_friends_upcoming_tables(UUID, INTEGER) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_friends_upcoming_tables IS 'Get upcoming tables from friends that user can see but is not already participating in';
