-- Migration: Fix Tables RLS v3 - Remove self-referencing policies
-- The table_participants SELECT policy was self-referencing causing recursion

-- Drop existing policies
DROP POLICY IF EXISTS "table_participants_select_policy" ON table_participants;
DROP POLICY IF EXISTS "table_participants_insert_policy" ON table_participants;
DROP POLICY IF EXISTS "table_participants_update_policy" ON table_participants;
DROP POLICY IF EXISTS "table_participants_delete_policy" ON table_participants;
DROP POLICY IF EXISTS "tables_select_policy" ON tables;
DROP POLICY IF EXISTS "tables_insert_policy" ON tables;
DROP POLICY IF EXISTS "tables_update_policy" ON tables;
DROP POLICY IF EXISTS "tables_delete_policy" ON tables;

-- ============================================
-- TABLES policies
-- ============================================

-- SELECT: Simple - you're the host OR it's public OR you're friends with host for friends_only
-- Participant-based access is handled via the participant lookup below
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
-- TABLE_PARTICIPANTS policies - VERY simple to avoid recursion
-- ============================================

-- SELECT: You can see any participant record (public read)
-- The table-level access control is on the tables table
-- If you can see the table, you can see its participants
CREATE POLICY "table_participants_select_policy"
  ON table_participants FOR SELECT
  USING (true);

-- INSERT: Any authenticated user can insert (host adds participants via trigger, invites checked at app layer)
CREATE POLICY "table_participants_insert_policy"
  ON table_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: You can update your own record, or you're the table host
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

-- DELETE: You can remove yourself, or you're the table host
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
-- Update tables SELECT to include participant access
-- ============================================

-- Drop and recreate to add participant-based access
DROP POLICY IF EXISTS "tables_select_policy" ON tables;

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
    OR EXISTS (
      SELECT 1 FROM table_participants tp
      WHERE tp.table_id = tables.id
      AND tp.user_id = auth.uid()
    )
  );
