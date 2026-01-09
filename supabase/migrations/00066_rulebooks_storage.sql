-- Migration: 00066_rulebooks_storage.sql
-- Description: Set up storage bucket for rulebook PDFs

-- Create the storage bucket for rulebooks
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rulebooks',
  'rulebooks',
  true,
  52428800, -- 50MB limit for rulebook PDFs
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- Policy: Anyone can view rulebooks (public bucket)
CREATE POLICY "Public read access for rulebooks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rulebooks');

-- Policy: Authenticated users can upload rulebooks
CREATE POLICY "Authenticated users can upload rulebooks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rulebooks');

-- Policy: Authenticated users can update rulebooks
CREATE POLICY "Authenticated users can update rulebooks"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'rulebooks');

-- Policy: Authenticated users can delete rulebooks
CREATE POLICY "Authenticated users can delete rulebooks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'rulebooks');
