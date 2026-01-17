-- Migration: Friends System Grants
-- Grant execute permissions on friend functions to anon and authenticated roles

-- Grant permissions to authenticated users (logged in)
GRANT EXECUTE ON FUNCTION get_mutual_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION are_friends(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_suggestions(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends_of_friends(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recently_active_users(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shelf_comparison(UUID, UUID) TO authenticated;

-- Grant to anon as well for public profile viewing
GRANT EXECUTE ON FUNCTION get_mutual_friends(UUID) TO anon;
GRANT EXECUTE ON FUNCTION are_friends(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_friend_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_shelf_comparison(UUID, UUID) TO anon;
