-- Migration: Add game_recommendation notification type
-- Allows users to recommend games to their friends

-- Add game_recommendation to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'game_recommendation';

-- Create index on game_id for faster recommendation lookups
CREATE INDEX IF NOT EXISTS idx_user_notifications_game_id
  ON user_notifications(game_id)
  WHERE game_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN user_notifications.metadata IS 'JSONB metadata for notification details. For game_recommendation: {message: string}';
