-- Migration: 00020_user_profiles_and_shelf.sql
-- Description: User profiles and game shelf/collection tracking
-- Date: 2025-12-24

-- =====================================================
-- USER PROFILES TABLE
-- Links Supabase auth.users to app-specific user data
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),

  -- Role management ('user' or 'admin')
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Privacy settings
  shelf_visibility VARCHAR(20) DEFAULT 'private' CHECK (shelf_visibility IN ('private', 'public')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role lookups
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_profiles IS 'Extended user profile data linked to Supabase auth';
COMMENT ON COLUMN user_profiles.role IS 'User role: user or admin';
COMMENT ON COLUMN user_profiles.shelf_visibility IS 'Whether shelf is visible to others: private or public';

-- =====================================================
-- SHELF STATUS TYPE
-- =====================================================
CREATE TYPE shelf_status AS ENUM (
  'owned',
  'want_to_buy',
  'want_to_play',
  'previously_owned',
  'wishlist'
);

-- =====================================================
-- USER GAME SHELF TABLE
-- Tracks games in user's personal collection
-- =====================================================
CREATE TABLE user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Shelf data
  status shelf_status NOT NULL DEFAULT 'owned',
  rating SMALLINT CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,

  -- Optional: when they acquired it
  acquired_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one entry per game
  UNIQUE(user_id, game_id)
);

-- Indexes
CREATE INDEX idx_user_games_user ON user_games(user_id);
CREATE INDEX idx_user_games_game ON user_games(game_id);
CREATE INDEX idx_user_games_status ON user_games(status);
CREATE INDEX idx_user_games_rating ON user_games(rating);

-- Trigger for updated_at
CREATE TRIGGER update_user_games_updated_at
  BEFORE UPDATE ON user_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_games IS 'User game shelf/collection tracking';
COMMENT ON COLUMN user_games.status IS 'Shelf status: owned, want_to_buy, want_to_play, previously_owned, wishlist';
COMMENT ON COLUMN user_games.rating IS 'User rating 1-10';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- User profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User games: only owner can CRUD their shelf
CREATE POLICY "Users can view own games"
  ON user_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON user_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
  ON user_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
  ON user_games FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: Auto-create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user_profile automatically when auth.users record is created';
