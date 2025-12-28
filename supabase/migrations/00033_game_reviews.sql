-- Migration: Game Reviews
-- Add review capability to user_games (shelf items)
-- Reviews are public-facing, distinct from private notes

-- Add review columns to user_games table
ALTER TABLE user_games ADD COLUMN review TEXT;
ALTER TABLE user_games ADD COLUMN review_updated_at TIMESTAMPTZ;

-- Index for efficient querying of reviews by game
-- Only index rows that have reviews (partial index)
CREATE INDEX idx_user_games_has_review ON user_games(game_id) WHERE review IS NOT NULL;

-- Index for ordering reviews by date
CREATE INDEX idx_user_games_review_date ON user_games(review_updated_at DESC) WHERE review IS NOT NULL;

-- Comments
COMMENT ON COLUMN user_games.review IS 'Public review text for the game (distinct from private notes)';
COMMENT ON COLUMN user_games.review_updated_at IS 'When the review was last updated';
