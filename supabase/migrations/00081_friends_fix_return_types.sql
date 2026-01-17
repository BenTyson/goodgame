-- Migration: Fix Friends Functions Return Types
-- The return types must match the actual column types exactly
-- Must DROP functions first to change return types

DROP FUNCTION IF EXISTS get_mutual_friends(UUID);
DROP FUNCTION IF EXISTS get_friend_suggestions(UUID, INT);
DROP FUNCTION IF EXISTS get_friends_of_friends(UUID, INT);
DROP FUNCTION IF EXISTS get_recently_active_users(UUID, INT);
DROP FUNCTION IF EXISTS search_users(TEXT, UUID, INT);

-- Fix get_mutual_friends - custom_avatar_url should be VARCHAR(500)
CREATE OR REPLACE FUNCTION get_mutual_friends(p_user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url VARCHAR(500),
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  followed_at TIMESTAMPTZ,
  mutual_games_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS friend_id,
    up.username,
    up.display_name,
    up.avatar_url,
    up.custom_avatar_url,
    up.bio,
    up.last_active_at,
    uf1.created_at AS followed_at,
    COALESCE(
      (
        SELECT COUNT(*)::INT
        FROM user_games ug1
        INNER JOIN user_games ug2 ON ug1.game_id = ug2.game_id
        WHERE ug1.user_id = p_user_id
          AND ug2.user_id = up.id
          AND ug1.status IN ('owned', 'played')
          AND ug2.status IN ('owned', 'played')
      ),
      0
    ) AS mutual_games_count
  FROM user_follows uf1
  INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
    AND uf2.following_id = p_user_id
  INNER JOIN user_profiles up ON uf1.following_id = up.id
  WHERE uf1.follower_id = p_user_id
    AND up.profile_visibility = 'public'
  ORDER BY uf1.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fix get_friend_suggestions
CREATE OR REPLACE FUNCTION get_friend_suggestions(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url VARCHAR(500),
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  mutual_games_count INT,
  sample_mutual_games TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_owned_games AS (
    SELECT game_id
    FROM user_games
    WHERE user_id = p_user_id
      AND status IN ('owned', 'played')
  ),
  potential_friends AS (
    SELECT
      ug.user_id AS potential_id,
      COUNT(DISTINCT ug.game_id) AS games_in_common
    FROM user_games ug
    INNER JOIN user_owned_games uog ON ug.game_id = uog.game_id
    INNER JOIN user_profiles up ON ug.user_id = up.id
    WHERE ug.user_id != p_user_id
      AND ug.status IN ('owned', 'played')
      AND up.profile_visibility = 'public'
      AND up.shelf_visibility = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_user_id AND following_id = ug.user_id
      )
    GROUP BY ug.user_id
    HAVING COUNT(DISTINCT ug.game_id) >= 2
    ORDER BY COUNT(DISTINCT ug.game_id) DESC
    LIMIT p_limit
  )
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    up.custom_avatar_url,
    up.bio,
    up.last_active_at,
    pf.games_in_common::INT AS mutual_games_count,
    (
      SELECT ARRAY_AGG(g.name ORDER BY g.name)
      FROM (
        SELECT g.name
        FROM user_games ug
        INNER JOIN user_owned_games uog ON ug.game_id = uog.game_id
        INNER JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = pf.potential_id
          AND ug.status IN ('owned', 'played')
        LIMIT 5
      ) g
    ) AS sample_mutual_games
  FROM potential_friends pf
  INNER JOIN user_profiles up ON pf.potential_id = up.id
  ORDER BY pf.games_in_common DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fix get_friends_of_friends
CREATE OR REPLACE FUNCTION get_friends_of_friends(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url VARCHAR(500),
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  mutual_friend_count INT,
  mutual_friend_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH my_friends AS (
    SELECT uf1.following_id AS friend_id
    FROM user_follows uf1
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = p_user_id
    WHERE uf1.follower_id = p_user_id
  ),
  friends_friends AS (
    SELECT
      uf1.following_id AS potential_friend_id,
      mf.friend_id AS via_friend_id
    FROM my_friends mf
    INNER JOIN user_follows uf1 ON mf.friend_id = uf1.follower_id
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = mf.friend_id
    WHERE uf1.following_id != p_user_id
      AND uf1.following_id NOT IN (SELECT friend_id FROM my_friends)
      AND NOT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_user_id AND following_id = uf1.following_id
      )
  ),
  aggregated AS (
    SELECT
      ff.potential_friend_id,
      COUNT(DISTINCT ff.via_friend_id)::INT AS friend_count,
      ARRAY_AGG(DISTINCT COALESCE(up.display_name, up.username)::TEXT) AS friend_names
    FROM friends_friends ff
    INNER JOIN user_profiles up ON ff.via_friend_id = up.id
    GROUP BY ff.potential_friend_id
  )
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    up.custom_avatar_url,
    up.bio,
    up.last_active_at,
    a.friend_count AS mutual_friend_count,
    a.friend_names[1:3] AS mutual_friend_names
  FROM aggregated a
  INNER JOIN user_profiles up ON a.potential_friend_id = up.id
  WHERE up.profile_visibility = 'public'
  ORDER BY a.friend_count DESC, up.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fix get_recently_active_users
CREATE OR REPLACE FUNCTION get_recently_active_users(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url VARCHAR(500),
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  recent_activity_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH my_follows AS (
    SELECT following_id FROM user_follows WHERE follower_id = p_user_id
  ),
  recent_users AS (
    SELECT
      up.id,
      up.username,
      up.display_name,
      up.avatar_url,
      up.custom_avatar_url,
      up.bio,
      up.last_active_at
    FROM user_profiles up
    WHERE up.id != p_user_id
      AND up.profile_visibility = 'public'
      AND up.last_active_at IS NOT NULL
      AND up.id NOT IN (SELECT following_id FROM my_follows)
    ORDER BY up.last_active_at DESC
    LIMIT p_limit
  )
  SELECT
    ru.id AS user_id,
    ru.username,
    ru.display_name,
    ru.avatar_url,
    ru.custom_avatar_url,
    ru.bio,
    ru.last_active_at,
    (
      SELECT
        CASE ua.activity_type
          WHEN 'rating' THEN 'Rated a game'
          WHEN 'shelf_add' THEN 'Added a game to shelf'
          WHEN 'shelf_update' THEN 'Updated their shelf'
          WHEN 'follow' THEN 'Followed someone'
          WHEN 'review' THEN 'Wrote a review'
          ELSE 'Was active'
        END
      FROM user_activities ua
      WHERE ua.user_id = ru.id
      ORDER BY ua.created_at DESC
      LIMIT 1
    ) AS recent_activity_summary
  FROM recent_users ru
  ORDER BY ru.last_active_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fix search_users
CREATE OR REPLACE FUNCTION search_users(
  p_query TEXT,
  p_current_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url VARCHAR(500),
  bio TEXT,
  is_following BOOLEAN,
  is_friend BOOLEAN
) AS $$
DECLARE
  search_pattern TEXT := '%' || LOWER(p_query) || '%';
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    up.custom_avatar_url,
    up.bio,
    CASE
      WHEN p_current_user_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_current_user_id AND following_id = up.id
      )
    END AS is_following,
    CASE
      WHEN p_current_user_id IS NULL THEN FALSE
      ELSE are_friends(p_current_user_id, up.id)
    END AS is_friend
  FROM user_profiles up
  WHERE up.profile_visibility = 'public'
    AND up.id != COALESCE(p_current_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
      LOWER(up.username) LIKE search_pattern
      OR LOWER(up.display_name) LIKE search_pattern
    )
  ORDER BY
    CASE WHEN LOWER(up.username) = LOWER(p_query) THEN 0 ELSE 1 END,
    CASE WHEN LOWER(up.username) LIKE LOWER(p_query) || '%' THEN 0 ELSE 1 END,
    up.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Ensure grants are still in place
GRANT EXECUTE ON FUNCTION get_mutual_friends(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION are_friends(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_friend_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_friend_suggestions(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends_of_friends(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recently_active_users(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_shelf_comparison(UUID, UUID) TO authenticated, anon;
