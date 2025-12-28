-- Migration: User Notifications System
-- Stores notifications for users (e.g., new followers)

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'new_follower',
  'rating'
);

-- Create user_notifications table
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,

  -- Reference to the user who triggered the notification
  actor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Optional game reference (for future rating notifications)
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,

  -- Notification state
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Denormalized data for fast reads
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_user_notifications_created ON user_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Allow inserts (will be controlled via trigger/function)
CREATE POLICY "Allow notification inserts"
  ON user_notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create a follow notification
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify yourself
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO user_notifications (user_id, notification_type, actor_id)
    VALUES (NEW.following_id, 'new_follower', NEW.follower_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create notification on follow
CREATE TRIGGER on_user_follow_create_notification
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Comments
COMMENT ON TABLE user_notifications IS 'User notifications for social events';
COMMENT ON COLUMN user_notifications.actor_id IS 'The user who triggered this notification';
