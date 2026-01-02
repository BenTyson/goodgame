-- Add flag to track games with unimported related games
-- This helps identify games that have expansions, editions, or family members
-- still pending import from BGG

ALTER TABLE games
ADD COLUMN IF NOT EXISTS has_unimported_relations BOOLEAN DEFAULT FALSE;

-- Index for filtering games that need relation imports
CREATE INDEX IF NOT EXISTS idx_games_has_unimported_relations
ON games(has_unimported_relations)
WHERE has_unimported_relations = TRUE;

COMMENT ON COLUMN games.has_unimported_relations IS
'True if this game has expansions, reimplementations, or family members in BGG data that are not yet imported';
