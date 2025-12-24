-- =====================================================
-- Normalize Designers, Publishers, Artists
-- =====================================================
-- This migration creates proper relational tables for entities
-- that were previously stored as text fields on the games table.

-- =====================================================
-- DESIGNERS TABLE
-- =====================================================
CREATE TABLE designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  photo_url VARCHAR(500),
  website VARCHAR(500),
  bgg_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_designers_slug ON designers(slug);
CREATE INDEX idx_designers_name ON designers(name);
CREATE INDEX idx_designers_bgg_id ON designers(bgg_id);

-- Game to Designer junction table
CREATE TABLE game_designers (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES designers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order SMALLINT DEFAULT 0,
  PRIMARY KEY (game_id, designer_id)
);

CREATE INDEX idx_game_designers_game ON game_designers(game_id);
CREATE INDEX idx_game_designers_designer ON game_designers(designer_id);

-- =====================================================
-- PUBLISHERS TABLE
-- =====================================================
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(500),
  bgg_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publishers_slug ON publishers(slug);
CREATE INDEX idx_publishers_name ON publishers(name);
CREATE INDEX idx_publishers_bgg_id ON publishers(bgg_id);

-- Game to Publisher junction table
CREATE TABLE game_publishers (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  display_order SMALLINT DEFAULT 0,
  PRIMARY KEY (game_id, publisher_id)
);

CREATE INDEX idx_game_publishers_game ON game_publishers(game_id);
CREATE INDEX idx_game_publishers_publisher ON game_publishers(publisher_id);

-- =====================================================
-- ARTISTS TABLE
-- =====================================================
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  website VARCHAR(500),
  bgg_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_bgg_id ON artists(bgg_id);

-- Game to Artist junction table
CREATE TABLE game_artists (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  display_order SMALLINT DEFAULT 0,
  PRIMARY KEY (game_id, artist_id)
);

CREATE INDEX idx_game_artists_game ON game_artists(game_id);
CREATE INDEX idx_game_artists_artist ON game_artists(artist_id);

-- =====================================================
-- ADD BGG_ID TO MECHANICS (for linking during import)
-- =====================================================
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS bgg_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_mechanics_bgg_id ON mechanics(bgg_id);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE TRIGGER update_designers_updated_at BEFORE UPDATE ON designers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_artists ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read designers" ON designers
  FOR SELECT USING (true);

CREATE POLICY "Public can read publishers" ON publishers
  FOR SELECT USING (true);

CREATE POLICY "Public can read artists" ON artists
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_designers" ON game_designers
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_publishers" ON game_publishers
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_artists" ON game_artists
  FOR SELECT USING (true);

-- =====================================================
-- HELPER FUNCTION: Generate slug from name
-- =====================================================
CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
