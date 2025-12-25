-- Migration: 00023_user_profile_enhancements.sql
-- Description: Enhanced user profile fields with username, bio, social links, and visibility
-- Date: 2025-12-24

-- =====================================================
-- ADD NEW PROFILE COLUMNS
-- =====================================================

-- Unique username for profile URLs (/u/[username])
ALTER TABLE user_profiles
  ADD COLUMN username VARCHAR(20) UNIQUE;

-- Bio text (limited to 500 chars at application level)
ALTER TABLE user_profiles
  ADD COLUMN bio TEXT;

-- Optional location
ALTER TABLE user_profiles
  ADD COLUMN location VARCHAR(100);

-- Social links as JSONB (bgg_username, twitter_handle, etc.)
ALTER TABLE user_profiles
  ADD COLUMN social_links JSONB DEFAULT '{}';

-- Profile visibility (separate from shelf_visibility)
ALTER TABLE user_profiles
  ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public'
    CHECK (profile_visibility IN ('public', 'private'));

-- =====================================================
-- USERNAME CONSTRAINTS
-- =====================================================

-- Username format: lowercase, alphanumeric + underscores, 3-20 chars
ALTER TABLE user_profiles
  ADD CONSTRAINT username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

-- Index for fast username lookups (partial index, only non-null)
CREATE UNIQUE INDEX idx_user_profiles_username
  ON user_profiles(username)
  WHERE username IS NOT NULL;

-- =====================================================
-- UPDATE RLS POLICIES FOR PUBLIC PROFILES
-- =====================================================

-- Drop old view policy (we need to allow public viewing)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- New policy: Users can view public profiles OR their own profile
CREATE POLICY "Users can view public profiles or own profile"
  ON user_profiles FOR SELECT
  USING (
    profile_visibility = 'public'
    OR auth.uid() = id
  );

-- Drop old shelf view policy
DROP POLICY IF EXISTS "Users can view own games" ON user_games;

-- New policy: Users can view their own games OR public shelves (when profile is also public)
CREATE POLICY "Users can view own games or public shelves"
  ON user_games FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_games.user_id
        AND user_profiles.profile_visibility = 'public'
        AND user_profiles.shelf_visibility = 'public'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN user_profiles.username IS 'Unique URL-safe username (lowercase, alphanumeric + underscores, 3-20 chars)';
COMMENT ON COLUMN user_profiles.bio IS 'User bio text, max 500 characters (enforced at app level)';
COMMENT ON COLUMN user_profiles.location IS 'Optional location string';
COMMENT ON COLUMN user_profiles.social_links IS 'JSONB object with social links: {bgg_username, twitter_handle, instagram_handle, discord_username, website_url}';
COMMENT ON COLUMN user_profiles.profile_visibility IS 'Profile visibility: public (default) or private';
