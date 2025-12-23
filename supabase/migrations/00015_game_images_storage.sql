-- Migration: 00015_game_images_storage.sql
-- Description: Set up storage bucket for game images

-- Create the storage bucket for game images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-images',
  'game-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public read access for game images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload game images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-images');

-- Policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update game images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game-images');

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete game images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-images');
