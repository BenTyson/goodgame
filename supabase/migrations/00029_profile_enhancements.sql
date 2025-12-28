-- Migration: 00029_profile_enhancements.sql
-- Description: Add header image, custom avatar, and last_active_at to user profiles
-- Date: 2025-12-27

-- =====================================================
-- ADD NEW PROFILE COLUMNS
-- =====================================================

-- Header/banner image URL
ALTER TABLE user_profiles
  ADD COLUMN header_image_url VARCHAR(500);

-- Custom avatar (allows override of OAuth avatar)
ALTER TABLE user_profiles
  ADD COLUMN custom_avatar_url VARCHAR(500);

-- Last activity timestamp
ALTER TABLE user_profiles
  ADD COLUMN last_active_at TIMESTAMPTZ;

-- =====================================================
-- STORAGE BUCKET FOR USER PROFILE IMAGES
-- =====================================================

-- Create bucket for user profile images (headers and avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy: Anyone can view profile images (public bucket)
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-profiles');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own images
CREATE POLICY "Users can update own profile images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own profile images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN user_profiles.header_image_url IS 'Profile header/banner image URL';
COMMENT ON COLUMN user_profiles.custom_avatar_url IS 'Custom avatar URL (overrides OAuth avatar if set)';
COMMENT ON COLUMN user_profiles.last_active_at IS 'Timestamp of last user activity';
