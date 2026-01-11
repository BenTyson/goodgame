-- Migration: Vibe Functions
-- Database functions for efficient vibe queries

-- Type for vibe stats response
CREATE TYPE vibe_stats AS (
  game_id uuid,
  vibe_count bigint,
  average_vibe numeric,
  vibe_stddev numeric,
  median_vibe double precision,
  mode_vibe integer,
  distribution jsonb,
  vibes_with_thoughts bigint
);

-- Function: Get vibe stats for a game
-- Falls back to live calculation if materialized view is stale
CREATE OR REPLACE FUNCTION get_game_vibe_stats(p_game_id uuid)
RETURNS vibe_stats
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result vibe_stats;
BEGIN
  SELECT
    gvs.game_id,
    gvs.vibe_count,
    gvs.average_vibe,
    gvs.vibe_stddev,
    gvs.median_vibe,
    gvs.mode_vibe,
    jsonb_build_object(
      '1', gvs.count_1,
      '2', gvs.count_2,
      '3', gvs.count_3,
      '4', gvs.count_4,
      '5', gvs.count_5,
      '6', gvs.count_6,
      '7', gvs.count_7,
      '8', gvs.count_8,
      '9', gvs.count_9,
      '10', gvs.count_10
    ),
    gvs.vibes_with_thoughts
  INTO result
  FROM game_vibe_stats gvs
  WHERE gvs.game_id = p_game_id;

  -- If no stats found, return empty stats
  IF result.game_id IS NULL THEN
    result.game_id := p_game_id;
    result.vibe_count := 0;
    result.average_vibe := NULL;
    result.vibe_stddev := NULL;
    result.median_vibe := NULL;
    result.mode_vibe := NULL;
    result.distribution := '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0}'::jsonb;
    result.vibes_with_thoughts := 0;
  END IF;

  RETURN result;
END;
$$;

-- Function: Get friends' vibes for a game
-- Returns vibes from users the current user follows
CREATE OR REPLACE FUNCTION get_friends_vibes(p_user_id uuid, p_game_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  rating integer,
  review text,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  custom_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ug.id,
    ug.user_id,
    ug.rating,
    ug.review,
    ug.created_at,
    up.username,
    up.display_name,
    up.avatar_url,
    up.custom_avatar_url
  FROM user_games ug
  INNER JOIN user_follows uf ON uf.following_id = ug.user_id
  INNER JOIN user_profiles up ON up.id = ug.user_id
  WHERE uf.follower_id = p_user_id
    AND ug.game_id = p_game_id
    AND ug.rating IS NOT NULL
    AND up.profile_visibility = 'public'
    AND up.shelf_visibility = 'public'
  ORDER BY ug.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_game_vibe_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_vibe_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_friends_vibes(uuid, uuid) TO authenticated;
