-- Migration: 00016_game_images_rls.sql
-- Description: Add RLS policies for game_images table

-- Enable RLS on game_images if not already enabled
ALTER TABLE game_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view game images (public read)
CREATE POLICY "Public read access for game_images"
ON game_images FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can insert game images
CREATE POLICY "Authenticated users can insert game_images"
ON game_images FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update game images
CREATE POLICY "Authenticated users can update game_images"
ON game_images FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete game images
CREATE POLICY "Authenticated users can delete game_images"
ON game_images FOR DELETE
TO authenticated
USING (true);
