-- Migration: Friends System
-- Mutual follows = friends (both users follow each other)
-- Includes friend queries and last_active_at tracking

-- =====================================================
-- ADD LAST_ACTIVE_AT TO USER_PROFILES
-- =====================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

COMMENT ON COLUMN user_profiles.last_active_at IS 'Timestamp of users last activity (for friend suggestions)';

-- Index for recently active user queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active
  ON user_profiles(last_active_at DESC NULLS LAST)
  WHERE profile_visibility = 'public';

-- =====================================================
-- TRIGGER: Update last_active_at on user_activities insert
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS on_user_activity_update_last_active ON user_activities;

CREATE TRIGGER on_user_activity_update_last_active
  AFTER INSERT ON user_activities
  FOR EACH ROW EXECUTE FUNCTION update_user_last_active();

-- =====================================================
-- FUNCTION: Get Mutual Friends
-- Returns users who both follow each other (mutual follows = friends)
-- =====================================================

CREATE OR REPLACE FUNCTION get_mutual_friends(p_user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url TEXT,
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
  -- User follows them
  INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
    AND uf2.following_id = p_user_id
    -- They follow user back (mutual)
  INNER JOIN user_profiles up ON uf1.following_id = up.id
  WHERE uf1.follower_id = p_user_id
    AND up.profile_visibility = 'public'
  ORDER BY uf1.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_mutual_friends IS 'Returns users who mutually follow each other (friends)';

-- =====================================================
-- FUNCTION: Check if Two Users are Friends
-- =====================================================

CREATE OR REPLACE FUNCTION are_friends(p_user1 UUID, p_user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_follows uf1
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = uf1.follower_id
    WHERE uf1.follower_id = p_user1
      AND uf1.following_id = p_user2
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION are_friends IS 'Returns true if two users mutually follow each other';

-- =====================================================
-- FUNCTION: Get Friend Suggestions Based on Mutual Games
-- Finds users with similar game collections who aren't already friends
-- =====================================================

CREATE OR REPLACE FUNCTION get_friend_suggestions(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url TEXT,
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  mutual_games_count INT,
  sample_mutual_games TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_owned_games AS (
    -- Get current user's owned/played games
    SELECT game_id
    FROM user_games
    WHERE user_id = p_user_id
      AND status IN ('owned', 'played')
  ),
  potential_friends AS (
    -- Find users with overlapping games
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
      -- Not already following them
      AND NOT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_user_id AND following_id = ug.user_id
      )
    GROUP BY ug.user_id
    HAVING COUNT(DISTINCT ug.game_id) >= 2  -- At least 2 games in common
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_friend_suggestions IS 'Returns friend suggestions based on mutual game ownership';

-- =====================================================
-- FUNCTION: Get Friends of Friends
-- Returns friends of your friends who aren't already your friends
-- =====================================================

CREATE OR REPLACE FUNCTION get_friends_of_friends(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url TEXT,
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  mutual_friend_count INT,
  mutual_friend_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH my_friends AS (
    -- Get current user's friends (mutual follows)
    SELECT uf1.following_id AS friend_id
    FROM user_follows uf1
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = p_user_id
    WHERE uf1.follower_id = p_user_id
  ),
  friends_friends AS (
    -- Get friends of my friends
    SELECT
      uf1.following_id AS potential_friend_id,
      mf.friend_id AS via_friend_id
    FROM my_friends mf
    INNER JOIN user_follows uf1 ON mf.friend_id = uf1.follower_id
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = mf.friend_id
    WHERE uf1.following_id != p_user_id
      -- Not already my friend
      AND uf1.following_id NOT IN (SELECT friend_id FROM my_friends)
      -- Not already following
      AND NOT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_user_id AND following_id = uf1.following_id
      )
  ),
  aggregated AS (
    SELECT
      ff.potential_friend_id,
      COUNT(DISTINCT ff.via_friend_id)::INT AS friend_count,
      ARRAY_AGG(DISTINCT COALESCE(up.display_name, up.username)) AS friend_names
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
    a.friend_names[1:3] AS mutual_friend_names  -- First 3 mutual friends
  FROM aggregated a
  INNER JOIN user_profiles up ON a.potential_friend_id = up.id
  WHERE up.profile_visibility = 'public'
  ORDER BY a.friend_count DESC, up.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_friends_of_friends IS 'Returns friends of your friends who are not yet your friends';

-- =====================================================
-- FUNCTION: Get Recently Active Users
-- Returns recently active public users (excluding current user and friends)
-- =====================================================

CREATE OR REPLACE FUNCTION get_recently_active_users(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR(20),
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  custom_avatar_url TEXT,
  bio TEXT,
  last_active_at TIMESTAMPTZ,
  recent_activity_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH my_follows AS (
    -- Users I'm already following
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
      -- Not already following
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_recently_active_users IS 'Returns recently active users for discovery';

-- =====================================================
-- FUNCTION: Get Friend Count
-- Returns count of mutual friends for a user
-- =====================================================

CREATE OR REPLACE FUNCTION get_friend_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT
    FROM user_follows uf1
    INNER JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id
      AND uf2.following_id = p_user_id
    WHERE uf1.follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_friend_count IS 'Returns count of mutual friends (mutual follows)';

-- =====================================================
-- FUNCTION: Get Shelf Comparison
-- Compares game shelves between two users
-- =====================================================

CREATE OR REPLACE FUNCTION get_shelf_comparison(
  p_user1 UUID,
  p_user2 UUID
)
RETURNS TABLE(
  category TEXT,  -- 'both', 'only_user1', 'only_user2'
  game_id UUID,
  game_name TEXT,
  game_slug TEXT,
  box_image_url TEXT,
  thumbnail_url TEXT,
  user1_status TEXT,
  user2_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user1_games AS (
    SELECT
      ug.game_id,
      ug.status::TEXT AS status
    FROM user_games ug
    WHERE ug.user_id = p_user1
  ),
  user2_games AS (
    SELECT
      ug.game_id,
      ug.status::TEXT AS status
    FROM user_games ug
    WHERE ug.user_id = p_user2
  ),
  combined AS (
    -- Games both have
    SELECT
      'both'::TEXT AS cat,
      u1.game_id,
      u1.status AS u1_status,
      u2.status AS u2_status
    FROM user1_games u1
    INNER JOIN user2_games u2 ON u1.game_id = u2.game_id

    UNION ALL

    -- Games only user1 has
    SELECT
      'only_user1'::TEXT AS cat,
      u1.game_id,
      u1.status AS u1_status,
      NULL AS u2_status
    FROM user1_games u1
    WHERE NOT EXISTS (
      SELECT 1 FROM user2_games u2 WHERE u2.game_id = u1.game_id
    )

    UNION ALL

    -- Games only user2 has
    SELECT
      'only_user2'::TEXT AS cat,
      u2.game_id,
      NULL AS u1_status,
      u2.status AS u2_status
    FROM user2_games u2
    WHERE NOT EXISTS (
      SELECT 1 FROM user1_games u1 WHERE u1.game_id = u2.game_id
    )
  )
  SELECT
    c.cat AS category,
    g.id AS game_id,
    g.name AS game_name,
    g.slug AS game_slug,
    g.box_image_url,
    g.thumbnail_url,
    c.u1_status AS user1_status,
    c.u2_status AS user2_status
  FROM combined c
  INNER JOIN games g ON c.game_id = g.id
  WHERE g.is_published = true
  ORDER BY c.cat, g.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_shelf_comparison IS 'Compares game shelves between two users';

-- =====================================================
-- FUNCTION: Search Users
-- Search users by username or display name
-- =====================================================

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
  custom_avatar_url TEXT,
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
    -- Exact username match first
    CASE WHEN LOWER(up.username) = LOWER(p_query) THEN 0 ELSE 1 END,
    -- Then by relevance (username starts with query)
    CASE WHEN LOWER(up.username) LIKE LOWER(p_query) || '%' THEN 0 ELSE 1 END,
    up.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_users IS 'Search users by username or display name with follow status';
