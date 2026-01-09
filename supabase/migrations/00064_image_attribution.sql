-- =====================================================
-- IMAGE ATTRIBUTION - Track source and licensing for game images
-- =====================================================

-- Source type enum
CREATE TYPE image_source AS ENUM (
  'publisher',      -- Official publisher images (with permission or fair use)
  'wikimedia',      -- Wikimedia Commons (CC licensed)
  'bgg',            -- BoardGameGeek (development only)
  'user_upload',    -- User-submitted images
  'press_kit',      -- Official press kit / media kit
  'promotional'     -- Promotional materials
);

-- Add attribution columns to game_images
ALTER TABLE game_images
  ADD COLUMN source image_source,
  ADD COLUMN source_url TEXT,
  ADD COLUMN attribution TEXT,
  ADD COLUMN license TEXT;  -- e.g., 'CC BY-SA 4.0', 'Used with permission', 'Fair use'

-- Add comments for documentation
COMMENT ON COLUMN game_images.source IS 'Where the image originated from';
COMMENT ON COLUMN game_images.source_url IS 'URL to the original source page';
COMMENT ON COLUMN game_images.attribution IS 'Copyright/attribution text to display';
COMMENT ON COLUMN game_images.license IS 'License type (CC BY-SA 4.0, Used with permission, etc.)';

-- Index for filtering by source
CREATE INDEX idx_game_images_source ON game_images(source);
