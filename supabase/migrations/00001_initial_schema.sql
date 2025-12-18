-- =====================================================
-- GOOD GAME - Initial Database Schema
-- =====================================================

-- =====================================================
-- GAMES TABLE - Core game metadata
-- =====================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,

  -- Player information
  player_count_min SMALLINT NOT NULL DEFAULT 1,
  player_count_max SMALLINT NOT NULL DEFAULT 4,
  player_count_best SMALLINT[],

  -- Time and complexity
  play_time_min SMALLINT,
  play_time_max SMALLINT,
  min_age SMALLINT DEFAULT 8,
  weight DECIMAL(2,1) CHECK (weight >= 1 AND weight <= 5),

  -- Publishing info
  year_published SMALLINT,
  designers TEXT[],
  publisher VARCHAR(255),

  -- External references
  bgg_id INTEGER,
  amazon_asin VARCHAR(20),

  -- Content availability flags
  has_rules BOOLEAN DEFAULT FALSE,
  has_score_sheet BOOLEAN DEFAULT FALSE,
  has_setup_guide BOOLEAN DEFAULT FALSE,
  has_reference BOOLEAN DEFAULT FALSE,

  -- Images
  box_image_url VARCHAR(500),
  hero_image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),

  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for games
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_is_published ON games(is_published);
CREATE INDEX idx_games_is_featured ON games(is_featured);
CREATE INDEX idx_games_weight ON games(weight);
CREATE INDEX idx_games_player_count ON games(player_count_min, player_count_max);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order SMALLINT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MECHANICS TABLE
-- =====================================================
CREATE TABLE mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COLLECTIONS TABLE
-- =====================================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(300),

  hero_image_url VARCHAR(500),
  display_order SMALLINT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,

  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  is_published BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- JUNCTION TABLES
-- =====================================================

-- Games to Categories
CREATE TABLE game_categories (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (game_id, category_id)
);

CREATE INDEX idx_game_categories_game ON game_categories(game_id);
CREATE INDEX idx_game_categories_category ON game_categories(category_id);

-- Games to Mechanics
CREATE TABLE game_mechanics (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  mechanic_id UUID REFERENCES mechanics(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, mechanic_id)
);

CREATE INDEX idx_game_mechanics_game ON game_mechanics(game_id);
CREATE INDEX idx_game_mechanics_mechanic ON game_mechanics(mechanic_id);

-- Collections to Games
CREATE TABLE collection_games (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  display_order SMALLINT DEFAULT 0,
  note TEXT,
  PRIMARY KEY (collection_id, game_id)
);

CREATE INDEX idx_collection_games_collection ON collection_games(collection_id);

-- =====================================================
-- SCORE SHEET CONFIGURATIONS
-- =====================================================
CREATE TABLE score_sheet_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE UNIQUE,

  layout_type VARCHAR(20) NOT NULL DEFAULT 'table',
  player_min SMALLINT NOT NULL DEFAULT 1,
  player_max SMALLINT NOT NULL DEFAULT 6,

  orientation VARCHAR(20) DEFAULT 'portrait',
  show_game_logo BOOLEAN DEFAULT TRUE,
  show_total_row BOOLEAN DEFAULT TRUE,
  color_scheme VARCHAR(20) DEFAULT 'default',

  custom_styles JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SCORE SHEET FIELDS
-- =====================================================
CREATE TABLE score_sheet_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES score_sheet_configs(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) NOT NULL DEFAULT 'number',

  label VARCHAR(100),
  description VARCHAR(255),
  placeholder VARCHAR(50),

  per_player BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  default_value VARCHAR(50),

  calculation_formula TEXT,

  min_value INTEGER,
  max_value INTEGER,

  display_order SMALLINT NOT NULL DEFAULT 0,
  section VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_fields_config ON score_sheet_fields(config_id);

-- =====================================================
-- AFFILIATE LINKS
-- =====================================================
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(100),

  is_primary BOOLEAN DEFAULT FALSE,
  display_order SMALLINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_links_game ON affiliate_links(game_id);

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanics_updated_at BEFORE UPDATE ON mechanics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_score_sheet_configs_updated_at BEFORE UPDATE ON score_sheet_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FULL-TEXT SEARCH
-- =====================================================
ALTER TABLE games ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(designers, ' '), '')), 'D')
  ) STORED;

CREATE INDEX games_fts ON games USING GIN (fts);

-- Search function
CREATE OR REPLACE FUNCTION search_games(search_query TEXT)
RETURNS SETOF games AS $$
  SELECT *
  FROM games
  WHERE fts @@ plainto_tsquery('english', search_query)
  AND is_published = TRUE
  ORDER BY ts_rank(fts, plainto_tsquery('english', search_query)) DESC;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- ROW LEVEL SECURITY (Enable for public access)
-- =====================================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_sheet_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_sheet_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published games" ON games
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Public can read mechanics" ON mechanics
  FOR SELECT USING (true);

CREATE POLICY "Public can read published collections" ON collections
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read game_categories" ON game_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_mechanics" ON game_mechanics
  FOR SELECT USING (true);

CREATE POLICY "Public can read collection_games" ON collection_games
  FOR SELECT USING (true);

CREATE POLICY "Public can read score_sheet_configs" ON score_sheet_configs
  FOR SELECT USING (true);

CREATE POLICY "Public can read score_sheet_fields" ON score_sheet_fields
  FOR SELECT USING (true);

CREATE POLICY "Public can read affiliate_links" ON affiliate_links
  FOR SELECT USING (true);
