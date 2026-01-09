-- Add rulebook thumbnail URL column to games table
-- Stores a generated preview image of the first page of the rulebook PDF

ALTER TABLE games
ADD COLUMN IF NOT EXISTS rulebook_thumbnail_url TEXT;

COMMENT ON COLUMN games.rulebook_thumbnail_url IS 'URL to a PNG thumbnail of the first page of the rulebook PDF, stored in Supabase storage';
