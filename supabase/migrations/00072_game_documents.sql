-- Migration: Add game_documents table for supplementary PDFs
-- Supports: Gameplay Guide, Glossary, Icon Overview, Setup Guide, FAQ, Misc

-- Create document type enum
CREATE TYPE document_type AS ENUM (
  'gameplay_guide',
  'glossary',
  'icon_overview',
  'setup_guide',
  'faq',
  'misc'
);

-- Create game_documents table
CREATE TABLE IF NOT EXISTS game_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  storage_path text,
  file_size bigint,
  page_count integer,
  display_order integer DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_storage_path UNIQUE(storage_path)
);

-- Indexes
CREATE INDEX idx_game_documents_game_id ON game_documents(game_id);
CREATE INDEX idx_game_documents_type ON game_documents(document_type);

-- Enable RLS
ALTER TABLE game_documents ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view game documents"
  ON game_documents FOR SELECT
  USING (true);

-- Authenticated users can manage (admin check in API)
CREATE POLICY "Authenticated users can manage game documents"
  ON game_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE game_documents IS 'Supplementary documents for games (guides, glossaries, FAQs, etc.)';
COMMENT ON COLUMN game_documents.document_type IS 'Type of supplementary document';
COMMENT ON COLUMN game_documents.storage_path IS 'Path in rulebooks bucket (null for external URLs)';
