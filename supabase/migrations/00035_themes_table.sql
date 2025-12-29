-- =====================================================
-- THEMES TABLE (Setting/Flavor/World)
-- Separates thematic elements from gameplay categories
-- =====================================================

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order SMALLINT DEFAULT 0,

  -- BGG Alias System
  bgg_id INTEGER,
  bgg_name VARCHAR(255),  -- Original BGG name for reference

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_display_order ON themes(display_order);
CREATE INDEX idx_themes_bgg_id ON themes(bgg_id);

-- Game to Theme junction table (many-to-many)
CREATE TABLE game_themes (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (game_id, theme_id)
);

-- Indexes for junction table
CREATE INDEX idx_game_themes_game ON game_themes(game_id);
CREATE INDEX idx_game_themes_theme ON game_themes(theme_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_themes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read themes" ON themes
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_themes" ON game_themes
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================
CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED THEMES DATA
-- =====================================================
INSERT INTO themes (slug, name, description, icon, display_order) VALUES
  ('fantasy', 'Fantasy', 'Magic, dragons, elves, and medieval adventures', 'wand', 1),
  ('sci-fi', 'Science Fiction', 'Space exploration, technology, and the future', 'rocket', 2),
  ('historical', 'Historical', 'Real-world history, civilizations, and eras', 'landmark', 3),
  ('horror', 'Horror', 'Scary themes, monsters, survival, and the supernatural', 'skull', 4),
  ('nature', 'Nature & Animals', 'Wildlife, environment, farming, and the natural world', 'leaf', 5),
  ('mythology', 'Mythology', 'Gods, legends, ancient myths, and folklore', 'crown', 6),
  ('mystery', 'Mystery & Crime', 'Detective work, solving puzzles, and intrigue', 'search', 7),
  ('war', 'War & Conflict', 'Military strategy, battles, and combat', 'swords', 8),
  ('economic', 'Economic & Trade', 'Business, markets, trading, and commerce', 'coins', 9),
  ('pirates', 'Pirates & Nautical', 'Seafaring adventures, pirates, and ocean exploration', 'anchor', 10),
  ('medieval', 'Medieval', 'Knights, castles, feudal societies, and the Middle Ages', 'castle', 11),
  ('post-apocalyptic', 'Post-Apocalyptic', 'Survival in a world after catastrophe', 'flame', 12),
  ('abstract', 'Abstract', 'Pure strategy without strong theme, minimal narrative', 'shapes', 13),
  ('humor', 'Humor & Party', 'Comedic themes, silly gameplay, party atmosphere', 'smile', 14),
  ('steampunk', 'Steampunk', 'Victorian-era technology, clockwork, and alternate history', 'cog', 15);
