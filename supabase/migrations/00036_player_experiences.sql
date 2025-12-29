-- =====================================================
-- PLAYER EXPERIENCES TABLE
-- Classifies how players interact with the game
-- =====================================================

CREATE TABLE player_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_experiences_slug ON player_experiences(slug);
CREATE INDEX idx_player_experiences_display_order ON player_experiences(display_order);

-- Game to Player Experience junction table (many-to-many)
CREATE TABLE game_player_experiences (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_experience_id UUID REFERENCES player_experiences(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (game_id, player_experience_id)
);

-- Indexes for junction table
CREATE INDEX idx_game_player_experiences_game ON game_player_experiences(game_id);
CREATE INDEX idx_game_player_experiences_experience ON game_player_experiences(player_experience_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE player_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_player_experiences ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read player_experiences" ON player_experiences
  FOR SELECT USING (true);

CREATE POLICY "Public can read game_player_experiences" ON game_player_experiences
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================
CREATE TRIGGER update_player_experiences_updated_at
  BEFORE UPDATE ON player_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED PLAYER EXPERIENCES DATA
-- =====================================================
INSERT INTO player_experiences (slug, name, description, icon, display_order) VALUES
  ('competitive', 'Competitive', 'Players compete against each other to win', 'swords', 1),
  ('cooperative', 'Cooperative', 'Players work together against the game', 'users', 2),
  ('team-based', 'Team-Based', 'Players form teams that compete against each other', 'users-round', 3),
  ('solo', 'Solo-Friendly', 'Can be played alone with dedicated solo rules', 'user', 4),
  ('social', 'Social/Party', 'Focused on social interaction and group fun', 'party-popper', 5),
  ('narrative', 'Narrative/Story', 'Strong emphasis on story and character development', 'book-open', 6),
  ('asymmetric', 'Asymmetric', 'Players have different abilities, goals, or starting positions', 'scale', 7),
  ('hidden-roles', 'Hidden Roles', 'Players have secret identities or objectives', 'eye-off', 8);
