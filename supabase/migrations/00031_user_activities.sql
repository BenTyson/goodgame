-- Migration: User Activities for Activity Feed
-- Stores user activities for social feed display

-- Create activity type enum
CREATE TYPE activity_type AS ENUM (
  'follow',
  'shelf_add',
  'shelf_update',
  'rating',
  'top_games_update'
);

-- Create user_activities table
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,

  -- Polymorphic references (nullable based on activity type)
  target_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,

  -- Denormalized data for fast reads
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient feed queries
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);

-- Composite index for fetching feed (activities from followed users)
CREATE INDEX idx_user_activities_feed ON user_activities(user_id, created_at DESC);

-- Index for game-related activities
CREATE INDEX idx_user_activities_game ON user_activities(game_id) WHERE game_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Anyone can read activities (visibility controlled at app level)
CREATE POLICY "Public can read activities"
  ON user_activities FOR SELECT
  USING (true);

-- Users can only insert their own activities
CREATE POLICY "Users can insert own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON user_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE user_activities IS 'User activity feed events for social features';
COMMENT ON COLUMN user_activities.metadata IS 'JSON containing activity-specific data: rating, shelf_status, etc.';
