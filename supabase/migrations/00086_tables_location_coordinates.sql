-- Migration: Add location coordinates to tables
-- Enables map-based discovery of tables

-- Add coordinate columns
ALTER TABLE tables ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE tables ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- Add index for spatial queries (basic lat/lng range queries)
-- This index is efficient for bounding box queries
CREATE INDEX IF NOT EXISTS idx_tables_location_coords
  ON tables(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add partial index for discoverable tables with location
CREATE INDEX IF NOT EXISTS idx_tables_discoverable_with_location
  ON tables(status, privacy, scheduled_at, location_lat, location_lng)
  WHERE status = 'scheduled'
    AND privacy IN ('public', 'friends_only')
    AND location_lat IS NOT NULL
    AND location_lng IS NOT NULL;

-- Function to calculate distance between two points (Haversine formula)
-- Returns distance in miles
CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 DECIMAL(10, 8),
  lng1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lng2 DECIMAL(11, 8)
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius_miles CONSTANT DECIMAL := 3959;
  lat1_rad DECIMAL;
  lat2_rad DECIMAL;
  delta_lat DECIMAL;
  delta_lng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert to radians
  lat1_rad := RADIANS(lat1);
  lat2_rad := RADIANS(lat2);
  delta_lat := RADIANS(lat2 - lat1);
  delta_lng := RADIANS(lng2 - lng1);

  -- Haversine formula
  a := SIN(delta_lat / 2) ^ 2 + COS(lat1_rad) * COS(lat2_rad) * SIN(delta_lng / 2) ^ 2;
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));

  RETURN earth_radius_miles * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get nearby public/friends_only tables
CREATE OR REPLACE FUNCTION get_nearby_tables(
  p_lat DECIMAL(10, 8),
  p_lng DECIMAL(11, 8),
  p_radius_miles INTEGER DEFAULT 25,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  table_id UUID,
  title VARCHAR(200),
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  location_name VARCHAR(200),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  max_players INTEGER,
  status table_status,
  privacy table_privacy,
  distance_miles DECIMAL,
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
    -- Get mutual friends (both follow each other) if user is logged in
    SELECT f1.following_id AS friend_id
    FROM user_follows f1
    JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    WHERE f1.follower_id = p_user_id
      AND p_user_id IS NOT NULL
  )
  SELECT
    t.id AS table_id,
    t.title,
    t.description,
    t.scheduled_at,
    t.duration_minutes,
    t.location_name,
    t.location_lat,
    t.location_lng,
    t.max_players,
    t.status,
    t.privacy,
    calculate_distance_miles(p_lat, p_lng, t.location_lat, t.location_lng) AS distance_miles,
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
    AND t.location_lat IS NOT NULL
    AND t.location_lng IS NOT NULL
    -- Privacy filter: public tables OR friends_only tables from friends
    AND (
      t.privacy = 'public'
      OR (
        t.privacy = 'friends_only'
        AND (
          t.host_id IN (SELECT friend_id FROM user_friends)
          OR t.host_id = p_user_id
        )
      )
    )
    -- Bounding box pre-filter for performance (rough estimate: 1 degree ≈ 69 miles at equator)
    AND t.location_lat BETWEEN p_lat - (p_radius_miles::DECIMAL / 69) AND p_lat + (p_radius_miles::DECIMAL / 69)
    AND t.location_lng BETWEEN p_lng - (p_radius_miles::DECIMAL / 69) AND p_lng + (p_radius_miles::DECIMAL / 69)
    -- Exact distance filter
    AND calculate_distance_miles(p_lat, p_lng, t.location_lat, t.location_lng) <= p_radius_miles
  ORDER BY distance_miles ASC, t.scheduled_at ASC
  LIMIT p_limit;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_distance_miles(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_nearby_tables(DECIMAL, DECIMAL, INTEGER, UUID, INTEGER) TO authenticated, anon;

-- Comments
COMMENT ON COLUMN tables.location_lat IS 'Latitude coordinate for map display and proximity search';
COMMENT ON COLUMN tables.location_lng IS 'Longitude coordinate for map display and proximity search';
COMMENT ON FUNCTION calculate_distance_miles IS 'Calculate distance between two lat/lng points using Haversine formula';
COMMENT ON FUNCTION get_nearby_tables IS 'Get public and friends_only tables within radius, sorted by distance';
