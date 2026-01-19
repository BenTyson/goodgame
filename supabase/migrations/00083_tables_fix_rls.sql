-- Migration: Fix Tables RLS Infinite Recursion
-- The original policies had circular dependencies between tables and table_participants

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view tables they participate in or host" ON tables;
DROP POLICY IF EXISTS "Users can view participants of accessible tables" ON table_participants;
DROP POLICY IF EXISTS "Hosts can add participants" ON table_participants;

-- Simplified tables SELECT policy - avoid referencing table_participants
CREATE POLICY "Users can view tables they participate in or host"
  ON tables FOR SELECT
  USING (
    -- You're the host
    auth.uid() = host_id
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
    OR
    -- You're a participant (check directly without policy recursion)
    id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid()
    )
  );

-- Simplified table_participants SELECT policy - don't reference tables policy
CREATE POLICY "Users can view participants of their tables"
  ON table_participants FOR SELECT
  USING (
    -- You're a participant of this table
    user_id = auth.uid()
    OR
    -- You're also a participant of this table (can see co-participants)
    table_id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid()
    )
    OR
    -- You're the host of this table
    table_id IN (
      SELECT id FROM tables WHERE host_id = auth.uid()
    )
  );

-- Simplified INSERT policy for table_participants
CREATE POLICY "Hosts can add participants"
  ON table_participants FOR INSERT
  WITH CHECK (
    -- You're the host of the table
    table_id IN (
      SELECT id FROM tables WHERE host_id = auth.uid()
    )
    OR
    -- You're adding yourself (for request-to-join in Phase 3)
    user_id = auth.uid()
  );
