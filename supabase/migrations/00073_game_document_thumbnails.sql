-- Add thumbnail_url column to game_documents table
-- Stores the URL of the generated PDF first-page thumbnail

ALTER TABLE game_documents ADD COLUMN thumbnail_url TEXT;

COMMENT ON COLUMN game_documents.thumbnail_url IS 'URL of the generated PDF first-page thumbnail image';
