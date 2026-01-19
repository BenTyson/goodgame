-- Migration: Table Comments
-- Discussion thread within tables

-- Create table_comments table
CREATE TABLE table_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- For reply threads (optional, Phase 2 of comments)
  parent_id UUID REFERENCES table_comments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_table_comments_table_id ON table_comments(table_id);
CREATE INDEX idx_table_comments_user_id ON table_comments(user_id);
CREATE INDEX idx_table_comments_created_at ON table_comments(table_id, created_at DESC);

-- Enable RLS
ALTER TABLE table_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view comments on tables they can see
CREATE POLICY "Users can view comments on accessible tables"
  ON table_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_comments.table_id
      AND (
        -- Public table
        t.privacy = 'public'
        OR
        -- Host
        t.host_id = auth.uid()
        OR
        -- Participant
        EXISTS (
          SELECT 1 FROM table_participants tp
          WHERE tp.table_id = t.id
          AND tp.user_id = auth.uid()
        )
        OR
        -- Friends only and is friend
        (
          t.privacy = 'friends_only' AND
          EXISTS (
            SELECT 1 FROM user_follows f1
            JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
            WHERE f1.follower_id = auth.uid() AND f1.following_id = t.host_id
          )
        )
      )
    )
  );

-- Participants can create comments
CREATE POLICY "Participants can create comments"
  ON table_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM table_participants tp
      WHERE tp.table_id = table_comments.table_id
      AND tp.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON table_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments, hosts can delete any comment
CREATE POLICY "Users can delete own comments or hosts can delete any"
  ON table_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_comments.table_id
      AND t.host_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE TRIGGER update_table_comments_updated_at
  BEFORE UPDATE ON table_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE table_comments IS 'Discussion comments within game tables';
COMMENT ON COLUMN table_comments.parent_id IS 'For threaded replies (optional future feature)';
