-- =====================================================
-- PROCESSING LOCK FOR GAME FAMILIES
-- Prevents concurrent processing of the same family
-- =====================================================

-- Add lock columns to game_families
ALTER TABLE game_families
  ADD COLUMN IF NOT EXISTS vecna_processing_lock TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vecna_processing_lock_by TEXT;

COMMENT ON COLUMN game_families.vecna_processing_lock IS 'Timestamp when processing lock was acquired';
COMMENT ON COLUMN game_families.vecna_processing_lock_by IS 'Identifier of the process holding the lock';

-- =====================================================
-- ACQUIRE LOCK FUNCTION
-- Attempts to acquire a processing lock for a family.
-- Lock expires after 30 minutes (safety net for crashed processes).
-- Returns TRUE if lock acquired, FALSE if already locked.
-- =====================================================
CREATE OR REPLACE FUNCTION acquire_family_processing_lock(
  p_family_id UUID,
  p_lock_holder TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  -- Try to acquire lock (only if not locked or lock expired)
  UPDATE game_families
  SET
    vecna_processing_lock = NOW(),
    vecna_processing_lock_by = p_lock_holder
  WHERE id = p_family_id
    AND (vecna_processing_lock IS NULL
         OR vecna_processing_lock < NOW() - INTERVAL '30 minutes')
  RETURNING TRUE INTO v_locked;

  RETURN COALESCE(v_locked, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RELEASE LOCK FUNCTION
-- Releases the processing lock for a family.
-- =====================================================
CREATE OR REPLACE FUNCTION release_family_processing_lock(
  p_family_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE game_families
  SET vecna_processing_lock = NULL, vecna_processing_lock_by = NULL
  WHERE id = p_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION acquire_family_processing_lock(UUID, TEXT) IS 'Acquire processing lock for a family. Returns TRUE if successful.';
COMMENT ON FUNCTION release_family_processing_lock(UUID) IS 'Release processing lock for a family.';
