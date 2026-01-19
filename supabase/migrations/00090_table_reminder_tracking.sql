-- Migration: Table Reminder Tracking
-- Track when reminder notifications have been sent

-- Add reminder tracking to tables
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding tables needing reminders
CREATE INDEX IF NOT EXISTS idx_tables_upcoming_no_reminder
  ON tables(scheduled_at)
  WHERE status = 'scheduled' AND reminder_sent_at IS NULL;

-- Function to get tables needing reminders (starting within next hour)
CREATE OR REPLACE FUNCTION get_tables_needing_reminders(
  p_minutes_ahead INTEGER DEFAULT 60
)
RETURNS TABLE (
  table_id UUID,
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  game_name TEXT,
  host_id UUID,
  host_display_name TEXT,
  participant_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS table_id,
    t.title,
    t.scheduled_at,
    g.name AS game_name,
    t.host_id,
    COALESCE(up.display_name, up.username) AS host_display_name,
    ARRAY_AGG(DISTINCT tp.user_id) FILTER (WHERE tp.rsvp_status IN ('attending', 'maybe', 'invited')) AS participant_ids
  FROM tables t
  JOIN games g ON g.id = t.game_id
  JOIN user_profiles up ON up.id = t.host_id
  LEFT JOIN table_participants tp ON tp.table_id = t.id
  WHERE
    t.status = 'scheduled'
    AND t.reminder_sent_at IS NULL
    AND t.scheduled_at > NOW()
    AND t.scheduled_at <= NOW() + (p_minutes_ahead || ' minutes')::INTERVAL
  GROUP BY t.id, t.title, t.scheduled_at, g.name, t.host_id, up.display_name, up.username;
END;
$$;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_table_reminder_sent(p_table_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tables
  SET reminder_sent_at = NOW()
  WHERE id = p_table_id;

  RETURN FOUND;
END;
$$;

-- Grant execute to service role (for cron)
GRANT EXECUTE ON FUNCTION get_tables_needing_reminders TO service_role;
GRANT EXECUTE ON FUNCTION mark_table_reminder_sent TO service_role;

COMMENT ON COLUMN tables.reminder_sent_at IS 'Timestamp when the 1-hour reminder notification was sent';
