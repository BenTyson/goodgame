-- Migration: 00027_game_keytags.sql
-- Description: Add keytag columns for homepage collections

-- Add keytag boolean columns to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_top_rated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_staff_pick BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden_gem BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_new_release BOOLEAN DEFAULT FALSE;

-- Add indexes for efficient querying of keytags
CREATE INDEX IF NOT EXISTS idx_games_trending ON games(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_top_rated ON games(is_top_rated) WHERE is_top_rated = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_staff_pick ON games(is_staff_pick) WHERE is_staff_pick = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_hidden_gem ON games(is_hidden_gem) WHERE is_hidden_gem = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_new_release ON games(is_new_release) WHERE is_new_release = TRUE;

-- Add comment explaining the keytags
COMMENT ON COLUMN games.is_trending IS 'Featured in Trending Now section';
COMMENT ON COLUMN games.is_top_rated IS 'Featured in Top Rated section';
COMMENT ON COLUMN games.is_staff_pick IS 'Featured as Staff Pick';
COMMENT ON COLUMN games.is_hidden_gem IS 'Featured as Hidden Gem';
COMMENT ON COLUMN games.is_new_release IS 'Featured as New Release';
