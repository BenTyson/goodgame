-- Migration: Tables Foundation
-- Game meetup planning with invite/RSVP system
-- Phase 1: Core infrastructure with private tables only

-- Create table status enum
CREATE TYPE table_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create table privacy enum (Phase 1 only supports 'private')
CREATE TYPE table_privacy AS ENUM ('private', 'friends_only', 'public');

-- Create RSVP status enum
CREATE TYPE rsvp_status AS ENUM ('invited', 'attending', 'maybe', 'declined');

-- Add new notification types for tables
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'table_invite';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'table_rsvp';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'table_starting';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'table_cancelled';

-- Create tables table (core meetup data)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Host info
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Game being played (single game in Phase 1)
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  -- Event details
  title VARCHAR(200),
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 180, -- 3 hours default

  -- Location (text in Phase 1, lat/lng in Phase 3)
  location_name VARCHAR(200),
  location_address TEXT,

  -- Settings
  max_players INTEGER,
  privacy table_privacy NOT NULL DEFAULT 'private',
  status table_status NOT NULL DEFAULT 'scheduled',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes for tables
CREATE INDEX idx_tables_host_id ON tables(host_id);
CREATE INDEX idx_tables_game_id ON tables(game_id);
CREATE INDEX idx_tables_scheduled_at ON tables(scheduled_at);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_privacy ON tables(privacy);
CREATE INDEX idx_tables_upcoming ON tables(scheduled_at, status) WHERE status = 'scheduled';

-- Create table_participants table (RSVP tracking)
CREATE TABLE table_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- RSVP status
  rsvp_status rsvp_status NOT NULL DEFAULT 'invited',
  rsvp_updated_at TIMESTAMPTZ,

  -- Who invited them (null if host)
  invited_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),

  -- Role at the table
  is_host BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one RSVP per user per table
  UNIQUE(table_id, user_id)
);

-- Indexes for table_participants
CREATE INDEX idx_table_participants_table_id ON table_participants(table_id);
CREATE INDEX idx_table_participants_user_id ON table_participants(user_id);
CREATE INDEX idx_table_participants_rsvp_status ON table_participants(rsvp_status);
CREATE INDEX idx_table_participants_user_upcoming ON table_participants(user_id, rsvp_status)
  WHERE rsvp_status IN ('attending', 'maybe');

-- Enable Row Level Security
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables

-- Anyone can see public tables (Phase 3)
-- Friends can see friends_only tables (Phase 2)
-- Participants can see private tables
CREATE POLICY "Users can view tables they participate in or host"
  ON tables FOR SELECT
  USING (
    -- You're the host
    auth.uid() = host_id
    OR
    -- You're a participant
    EXISTS (
      SELECT 1 FROM table_participants
      WHERE table_participants.table_id = tables.id
      AND table_participants.user_id = auth.uid()
    )
    OR
    -- It's a public table (Phase 3)
    privacy = 'public'
    OR
    -- It's friends_only and you're friends with the host (Phase 2)
    (
      privacy = 'friends_only' AND
      EXISTS (
        SELECT 1 FROM user_follows f1
        JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
        WHERE f1.follower_id = auth.uid() AND f1.following_id = host_id
      )
    )
  );

-- Hosts can create tables
CREATE POLICY "Users can create tables"
  ON tables FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Hosts can update their tables
CREATE POLICY "Hosts can update their tables"
  ON tables FOR UPDATE
  USING (auth.uid() = host_id);

-- Hosts can delete their tables
CREATE POLICY "Hosts can delete their tables"
  ON tables FOR DELETE
  USING (auth.uid() = host_id);

-- RLS Policies for table_participants

-- Users can see participants of tables they can see
CREATE POLICY "Users can view participants of accessible tables"
  ON table_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_participants.table_id
      AND (
        auth.uid() = tables.host_id
        OR EXISTS (
          SELECT 1 FROM table_participants tp
          WHERE tp.table_id = tables.id
          AND tp.user_id = auth.uid()
        )
        OR tables.privacy = 'public'
        OR (
          tables.privacy = 'friends_only' AND
          EXISTS (
            SELECT 1 FROM user_follows f1
            JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
            WHERE f1.follower_id = auth.uid() AND f1.following_id = tables.host_id
          )
        )
      )
    )
  );

-- Hosts and users with invite permission can add participants
CREATE POLICY "Hosts can add participants"
  ON table_participants FOR INSERT
  WITH CHECK (
    -- You're the host of the table
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_participants.table_id
      AND tables.host_id = auth.uid()
    )
    OR
    -- You're being added as a participant (for request-to-join in Phase 3)
    table_participants.user_id = auth.uid()
  );

-- Users can update their own RSVP
CREATE POLICY "Users can update their own RSVP"
  ON table_participants FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    -- Host can update participant status
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_participants.table_id
      AND tables.host_id = auth.uid()
    )
  );

-- Hosts can remove participants, users can remove themselves
CREATE POLICY "Hosts can remove participants or users can leave"
  ON table_participants FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_participants.table_id
      AND tables.host_id = auth.uid()
    )
  );

-- Function to automatically add host as participant when table is created
CREATE OR REPLACE FUNCTION add_host_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO table_participants (table_id, user_id, rsvp_status, is_host, rsvp_updated_at)
  VALUES (NEW.id, NEW.host_id, 'attending', TRUE, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add host as participant
CREATE TRIGGER on_table_create_add_host
  AFTER INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION add_host_as_participant();

-- Function to create table invite notification
CREATE OR REPLACE FUNCTION create_table_invite_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify the host being added as initial participant
  IF NOT NEW.is_host THEN
    INSERT INTO user_notifications (user_id, notification_type, actor_id, metadata)
    VALUES (
      NEW.user_id,
      'table_invite',
      COALESCE(NEW.invited_by, (SELECT host_id FROM tables WHERE id = NEW.table_id)),
      jsonb_build_object(
        'table_id', NEW.table_id,
        'table_title', (SELECT COALESCE(title, g.name) FROM tables t JOIN games g ON t.game_id = g.id WHERE t.id = NEW.table_id),
        'game_name', (SELECT g.name FROM tables t JOIN games g ON t.game_id = g.id WHERE t.id = NEW.table_id),
        'scheduled_at', (SELECT scheduled_at FROM tables WHERE id = NEW.table_id)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification on invite
CREATE TRIGGER on_table_participant_invite_notification
  AFTER INSERT ON table_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_table_invite_notification();

-- Function to notify host of RSVP changes
CREATE OR REPLACE FUNCTION create_table_rsvp_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_host_id UUID;
BEGIN
  -- Only notify on status changes (not initial invite)
  IF OLD.rsvp_status = NEW.rsvp_status THEN
    RETURN NEW;
  END IF;

  -- Don't notify about invited -> other (that's handled by the user's action)
  IF OLD.rsvp_status = 'invited' THEN
    -- Get the host
    SELECT host_id INTO v_host_id FROM tables WHERE id = NEW.table_id;

    -- Don't notify host about their own RSVP
    IF NEW.user_id != v_host_id THEN
      INSERT INTO user_notifications (user_id, notification_type, actor_id, metadata)
      VALUES (
        v_host_id,
        'table_rsvp',
        NEW.user_id,
        jsonb_build_object(
          'table_id', NEW.table_id,
          'table_title', (SELECT COALESCE(title, g.name) FROM tables t JOIN games g ON t.game_id = g.id WHERE t.id = NEW.table_id),
          'rsvp_status', NEW.rsvp_status,
          'game_name', (SELECT g.name FROM tables t JOIN games g ON t.game_id = g.id WHERE t.id = NEW.table_id)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify host of RSVP changes
CREATE TRIGGER on_table_rsvp_change_notification
  AFTER UPDATE ON table_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_table_rsvp_notification();

-- Function to notify participants when table is cancelled
CREATE OR REPLACE FUNCTION notify_table_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Notify all participants except host
    INSERT INTO user_notifications (user_id, notification_type, actor_id, metadata)
    SELECT
      tp.user_id,
      'table_cancelled',
      NEW.host_id,
      jsonb_build_object(
        'table_id', NEW.id,
        'table_title', COALESCE(NEW.title, g.name),
        'game_name', g.name,
        'scheduled_at', NEW.scheduled_at
      )
    FROM table_participants tp
    JOIN games g ON g.id = NEW.game_id
    WHERE tp.table_id = NEW.id
    AND tp.user_id != NEW.host_id
    AND tp.rsvp_status IN ('attending', 'maybe');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify on cancellation
CREATE TRIGGER on_table_cancelled_notification
  AFTER UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_cancelled();

-- Update timestamp trigger for tables
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get user's upcoming tables
CREATE OR REPLACE FUNCTION get_user_upcoming_tables(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  table_id UUID,
  title VARCHAR(200),
  scheduled_at TIMESTAMPTZ,
  location_name VARCHAR(200),
  status table_status,
  privacy table_privacy,
  host_id UUID,
  host_username VARCHAR(50),
  host_display_name VARCHAR(100),
  host_avatar_url TEXT,
  host_custom_avatar_url VARCHAR(500),
  game_id UUID,
  game_name VARCHAR(200),
  game_slug VARCHAR(200),
  game_thumbnail_url TEXT,
  user_rsvp_status rsvp_status,
  participant_count BIGINT,
  attending_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id AS table_id,
    t.title,
    t.scheduled_at,
    t.location_name,
    t.status,
    t.privacy,
    t.host_id,
    h.username AS host_username,
    h.display_name AS host_display_name,
    h.avatar_url AS host_avatar_url,
    h.custom_avatar_url AS host_custom_avatar_url,
    g.id AS game_id,
    g.name AS game_name,
    g.slug AS game_slug,
    g.thumbnail_url AS game_thumbnail_url,
    tp.rsvp_status AS user_rsvp_status,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id) AS participant_count,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id AND rsvp_status = 'attending') AS attending_count
  FROM tables t
  JOIN user_profiles h ON h.id = t.host_id
  JOIN games g ON g.id = t.game_id
  JOIN table_participants tp ON tp.table_id = t.id AND tp.user_id = p_user_id
  WHERE t.status = 'scheduled'
  AND t.scheduled_at >= NOW()
  ORDER BY t.scheduled_at ASC
  LIMIT p_limit;
$$;

-- Helper function to get user's past tables
CREATE OR REPLACE FUNCTION get_user_past_tables(p_user_id UUID, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  table_id UUID,
  title VARCHAR(200),
  scheduled_at TIMESTAMPTZ,
  location_name VARCHAR(200),
  status table_status,
  privacy table_privacy,
  host_id UUID,
  host_username VARCHAR(50),
  host_display_name VARCHAR(100),
  host_avatar_url TEXT,
  host_custom_avatar_url VARCHAR(500),
  game_id UUID,
  game_name VARCHAR(200),
  game_slug VARCHAR(200),
  game_thumbnail_url TEXT,
  user_rsvp_status rsvp_status,
  participant_count BIGINT,
  attending_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id AS table_id,
    t.title,
    t.scheduled_at,
    t.location_name,
    t.status,
    t.privacy,
    t.host_id,
    h.username AS host_username,
    h.display_name AS host_display_name,
    h.avatar_url AS host_avatar_url,
    h.custom_avatar_url AS host_custom_avatar_url,
    g.id AS game_id,
    g.name AS game_name,
    g.slug AS game_slug,
    g.thumbnail_url AS game_thumbnail_url,
    tp.rsvp_status AS user_rsvp_status,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id) AS participant_count,
    (SELECT COUNT(*) FROM table_participants WHERE table_id = t.id AND rsvp_status = 'attending') AS attending_count
  FROM tables t
  JOIN user_profiles h ON h.id = t.host_id
  JOIN games g ON g.id = t.game_id
  JOIN table_participants tp ON tp.table_id = t.id AND tp.user_id = p_user_id
  WHERE t.status IN ('completed', 'cancelled') OR t.scheduled_at < NOW()
  ORDER BY t.scheduled_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_upcoming_tables(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_past_tables(UUID, INTEGER, INTEGER) TO authenticated;

-- Comments
COMMENT ON TABLE tables IS 'Game meetup events hosted by users';
COMMENT ON TABLE table_participants IS 'Participants and their RSVP status for tables';
COMMENT ON COLUMN tables.privacy IS 'Phase 1: private only. Phase 2: adds friends_only. Phase 3: adds public.';
COMMENT ON COLUMN tables.duration_minutes IS 'Expected duration in minutes, default 3 hours';
