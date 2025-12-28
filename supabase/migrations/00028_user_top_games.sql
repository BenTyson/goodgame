-- Migration: 00028_user_top_games.sql
-- Description: Add user top games ranking table

-- Create user_top_games table for Top 10 favorites
CREATE TABLE user_top_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one entry per game
  UNIQUE(user_id, game_id),
  -- Each user can only have one game per position
  UNIQUE(user_id, position)
);

-- Index for efficient user lookups
CREATE INDEX idx_user_top_games_user ON user_top_games(user_id);

-- RLS Policies
ALTER TABLE user_top_games ENABLE ROW LEVEL SECURITY;

-- Anyone can read top games (follows profile visibility in app logic)
CREATE POLICY "Public can read top games"
  ON user_top_games FOR SELECT
  USING (true);

-- Users can only insert their own rankings
CREATE POLICY "Users can insert own top games"
  ON user_top_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rankings
CREATE POLICY "Users can update own top games"
  ON user_top_games FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own rankings
CREATE POLICY "Users can delete own top games"
  ON user_top_games FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE user_top_games IS 'User curated Top 10 all-time favorite games';
COMMENT ON COLUMN user_top_games.position IS 'Rank position 1-10 (1 is favorite)';
