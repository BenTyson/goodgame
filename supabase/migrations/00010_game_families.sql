-- Migration: 00010_game_families.sql
-- Description: Add game families and relations for expansions, sequels, spin-offs

-- Game families (e.g., "Ticket to Ride", "Pandemic", "Catan")
CREATE TABLE IF NOT EXISTS game_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bgg_family_id INTEGER,
  hero_image_url VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game relationships (expansion_of, sequel_to, etc.)
CREATE TABLE IF NOT EXISTS game_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  target_game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  relation_type VARCHAR(30) NOT NULL,
  -- Types: expansion_of, base_game_of, sequel_to, prequel_to,
  --        reimplementation_of, spin_off_of, standalone_in_series
  notes TEXT,
  display_order SMALLINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_game_id, target_game_id, relation_type)
);

-- Link games to families
ALTER TABLE games ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES game_families(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_families_slug ON game_families(slug);
CREATE INDEX IF NOT EXISTS idx_game_relations_source ON game_relations(source_game_id);
CREATE INDEX IF NOT EXISTS idx_game_relations_target ON game_relations(target_game_id);
CREATE INDEX IF NOT EXISTS idx_game_relations_type ON game_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_games_family ON games(family_id);

-- Enable RLS
ALTER TABLE game_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_relations ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Game families are viewable by everyone"
  ON game_families FOR SELECT
  USING (true);

CREATE POLICY "Game relations are viewable by everyone"
  ON game_relations FOR SELECT
  USING (true);

-- Updated_at trigger for game_families
CREATE TRIGGER update_game_families_updated_at
  BEFORE UPDATE ON game_families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE game_families IS 'Groups related games (e.g., all Ticket to Ride variants)';
COMMENT ON TABLE game_relations IS 'Tracks relationships between games (expansions, sequels, etc.)';
COMMENT ON COLUMN game_relations.relation_type IS 'expansion_of, base_game_of, sequel_to, prequel_to, reimplementation_of, spin_off_of, standalone_in_series';
