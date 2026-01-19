-- Migration: Table Recaps
-- Add recap/summary functionality for completed tables

-- Add actual attendance tracking to participants
ALTER TABLE table_participants
  ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMPTZ DEFAULT NULL;

-- Create table_recaps table
CREATE TABLE IF NOT EXISTS table_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  host_notes TEXT,
  highlights TEXT,
  play_count INTEGER DEFAULT 1,
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  would_play_again BOOLEAN DEFAULT TRUE,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT table_recaps_table_id_unique UNIQUE (table_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_recaps_table_id ON table_recaps(table_id);
CREATE INDEX IF NOT EXISTS idx_table_participants_attended ON table_participants(attended) WHERE attended IS NOT NULL;

-- RLS policies for table_recaps
ALTER TABLE table_recaps ENABLE ROW LEVEL SECURITY;

-- Anyone can view recaps for tables they can see
CREATE POLICY "table_recaps_select" ON table_recaps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_recaps.table_id
      AND (
        t.privacy = 'public'
        OR t.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM table_participants tp
          WHERE tp.table_id = t.id
          AND tp.user_id = auth.uid()
        )
      )
    )
  );

-- Only host can create/update recaps
CREATE POLICY "table_recaps_insert" ON table_recaps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_recaps.table_id
      AND t.host_id = auth.uid()
    )
  );

CREATE POLICY "table_recaps_update" ON table_recaps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_recaps.table_id
      AND t.host_id = auth.uid()
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_table_recap_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_table_recap_timestamp ON table_recaps;
CREATE TRIGGER trigger_update_table_recap_timestamp
  BEFORE UPDATE ON table_recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_table_recap_timestamp();

-- Function to mark table as completed with recap
CREATE OR REPLACE FUNCTION complete_table_with_recap(
  p_table_id UUID,
  p_host_notes TEXT DEFAULT NULL,
  p_highlights TEXT DEFAULT NULL,
  p_experience_rating INTEGER DEFAULT NULL,
  p_would_play_again BOOLEAN DEFAULT TRUE,
  p_attendee_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_host_id UUID;
  v_recap_id UUID;
  v_attendee_count INTEGER;
BEGIN
  -- Get table host and verify ownership
  SELECT host_id INTO v_host_id FROM tables WHERE id = p_table_id;

  IF v_host_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Table not found');
  END IF;

  IF v_host_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the host can complete a table');
  END IF;

  -- Update table status to completed
  UPDATE tables
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_table_id;

  -- Mark attendance for participants
  UPDATE table_participants
  SET
    attended = (user_id = ANY(p_attendee_ids) OR user_id = v_host_id),
    attendance_marked_at = NOW()
  WHERE table_id = p_table_id;

  -- Count attendees
  SELECT COUNT(*) INTO v_attendee_count
  FROM table_participants
  WHERE table_id = p_table_id AND attended = TRUE;

  -- Create or update recap
  INSERT INTO table_recaps (
    table_id, host_notes, highlights, experience_rating, would_play_again
  ) VALUES (
    p_table_id, p_host_notes, p_highlights, p_experience_rating, p_would_play_again
  )
  ON CONFLICT (table_id) DO UPDATE SET
    host_notes = EXCLUDED.host_notes,
    highlights = EXCLUDED.highlights,
    experience_rating = EXCLUDED.experience_rating,
    would_play_again = EXCLUDED.would_play_again,
    updated_at = NOW()
  RETURNING id INTO v_recap_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'recap_id', v_recap_id,
    'attendee_count', v_attendee_count
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION complete_table_with_recap TO authenticated;

COMMENT ON TABLE table_recaps IS 'Recap/summary data for completed tables';
COMMENT ON COLUMN table_participants.attended IS 'Whether the participant actually attended (marked after table completion)';
