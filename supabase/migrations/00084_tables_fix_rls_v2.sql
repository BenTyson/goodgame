-- Migration: Fix Tables RLS v2 - Simpler policies to avoid recursion
-- The issue is that INSERT triggers cause policy checks that recurse

-- Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "Users can view tables they participate in or host" ON tables;
DROP POLICY IF EXISTS "Users can create tables" ON tables;
DROP POLICY IF EXISTS "Hosts can update their tables" ON tables;
DROP POLICY IF EXISTS "Hosts can delete their tables" ON tables;

DROP POLICY IF EXISTS "Users can view participants of their tables" ON table_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible tables" ON table_participants;
DROP POLICY IF EXISTS "Hosts can add participants" ON table_participants;
DROP POLICY IF EXISTS "Users can update their own RSVP" ON table_participants;
DROP POLICY IF EXISTS "Hosts can remove participants or users can leave" ON table_participants;

-- ============================================
-- TABLES policies (simple, no subqueries to table_participants)
-- ============================================

-- SELECT: Users see tables they host, public tables, or friends-only from friends
-- Note: Participant visibility handled by joining in queries, not RLS
CREATE POLICY "tables_select_policy"
  ON tables FOR SELECT
  USING (
    auth.uid() = host_id
    OR privacy = 'public'
    OR (
      privacy = 'friends_only' AND
      EXISTS (
        SELECT 1 FROM user_follows f1
        JOIN user_follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
        WHERE f1.follower_id = auth.uid() AND f1.following_id = host_id
      )
    )
  );

-- INSERT: Users can create their own tables
CREATE POLICY "tables_insert_policy"
  ON tables FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- UPDATE: Only hosts can update
CREATE POLICY "tables_update_policy"
  ON tables FOR UPDATE
  USING (auth.uid() = host_id);

-- DELETE: Only hosts can delete
CREATE POLICY "tables_delete_policy"
  ON tables FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================
-- TABLE_PARTICIPANTS policies (simple, direct checks only)
-- ============================================

-- SELECT: See your own participation or co-participants
CREATE POLICY "table_participants_select_policy"
  ON table_participants FOR SELECT
  USING (
    -- You're this participant
    user_id = auth.uid()
    OR
    -- You're a co-participant (same table)
    EXISTS (
      SELECT 1 FROM table_participants tp2
      WHERE tp2.table_id = table_participants.table_id
      AND tp2.user_id = auth.uid()
    )
  );

-- INSERT: Allow authenticated users to insert
-- Authorization is handled at application layer
CREATE POLICY "table_participants_insert_policy"
  ON table_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users update own RSVP, hosts update any participant in their tables
CREATE POLICY "table_participants_update_policy"
  ON table_participants FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_participants.table_id
      AND t.host_id = auth.uid()
    )
  );

-- DELETE: Users can leave, hosts can remove
CREATE POLICY "table_participants_delete_policy"
  ON table_participants FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_participants.table_id
      AND t.host_id = auth.uid()
    )
  );

-- ============================================
-- Make participants visible to hosts via a function
-- ============================================

-- Function to check if user can view a table (for use in application code)
CREATE OR REPLACE FUNCTION can_view_table(p_table_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tables t
    WHERE t.id = p_table_id
    AND (
      t.host_id = p_user_id
      OR t.privacy = 'public'
      OR EXISTS (
        SELECT 1 FROM table_participants tp
        WHERE tp.table_id = t.id AND tp.user_id = p_user_id
      )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION can_view_table(UUID, UUID) TO authenticated;
