-- =====================================================
-- GAME IMAGES TABLE - Gallery images for each game
-- =====================================================

CREATE TABLE game_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Image details
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  caption VARCHAR(500),

  -- Image type: 'cover', 'hero', 'gallery', 'setup', 'gameplay', 'components'
  image_type VARCHAR(20) NOT NULL DEFAULT 'gallery',

  -- Ordering
  display_order SMALLINT NOT NULL DEFAULT 0,

  -- Metadata (for Supabase Storage)
  storage_path VARCHAR(500),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_game_images_game ON game_images(game_id);
CREATE INDEX idx_game_images_type ON game_images(image_type);
CREATE INDEX idx_game_images_order ON game_images(game_id, display_order);

-- Ensure only one primary image per game per type
CREATE UNIQUE INDEX idx_game_images_primary
  ON game_images(game_id, image_type)
  WHERE is_primary = TRUE;

-- Update trigger
CREATE TRIGGER update_game_images_updated_at BEFORE UPDATE ON game_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE game_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read game_images" ON game_images
  FOR SELECT USING (true);

-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP
-- Run this in the Supabase Dashboard SQL Editor
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('game-images', 'game-images', true);

-- CREATE POLICY "Public read access for game images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'game-images');

-- CREATE POLICY "Authenticated users can upload game images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'game-images' AND auth.role() = 'authenticated');
