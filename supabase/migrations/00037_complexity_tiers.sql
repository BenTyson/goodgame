-- =====================================================
-- COMPLEXITY TIERS TABLE
-- Auto-assigned based on BGG weight (complexity) values
-- =====================================================

CREATE TABLE complexity_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  weight_min DECIMAL(2,1) NOT NULL,
  weight_max DECIMAL(2,1) NOT NULL,
  display_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_complexity_tiers_slug ON complexity_tiers(slug);
CREATE INDEX idx_complexity_tiers_weight ON complexity_tiers(weight_min, weight_max);
CREATE INDEX idx_complexity_tiers_display_order ON complexity_tiers(display_order);

-- Add complexity_tier_id to games table
ALTER TABLE games ADD COLUMN complexity_tier_id UUID REFERENCES complexity_tiers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_games_complexity_tier ON games(complexity_tier_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE complexity_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access (admin writes bypass RLS via service role)
CREATE POLICY "Public can read complexity_tiers" ON complexity_tiers
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================
CREATE TRIGGER update_complexity_tiers_updated_at
  BEFORE UPDATE ON complexity_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED COMPLEXITY TIERS DATA
-- Based on BGG weight ranges
-- =====================================================
INSERT INTO complexity_tiers (slug, name, description, icon, weight_min, weight_max, display_order) VALUES
  ('gateway', 'Gateway', 'Easy to learn games perfect for newcomers to the hobby. Simple rules, quick to teach.', 'door-open', 1.0, 1.8, 1),
  ('family', 'Family', 'Accessible games suitable for mixed groups. Moderate rules complexity with broad appeal.', 'users', 1.8, 2.5, 2),
  ('medium', 'Medium', 'Games with meaningful strategic depth. Requires some experience but rewarding to master.', 'scale', 2.5, 3.2, 3),
  ('heavy', 'Heavy', 'Complex games for dedicated gamers. Significant rules overhead and strategic depth.', 'weight', 3.2, 4.0, 4),
  ('expert', 'Expert', 'The most complex games in the hobby. Demanding rules and deep strategic systems.', 'graduation-cap', 4.0, 5.0, 5);

-- =====================================================
-- HELPER FUNCTION
-- Get complexity tier ID based on weight value
-- =====================================================
CREATE OR REPLACE FUNCTION get_complexity_tier_id(game_weight DECIMAL)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM complexity_tiers
    WHERE game_weight >= weight_min AND game_weight < weight_max
    ORDER BY weight_min
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE EXISTING GAMES
-- Assign complexity tiers to games that have weight values
-- =====================================================
UPDATE games
SET complexity_tier_id = get_complexity_tier_id(weight)
WHERE weight IS NOT NULL AND weight > 0;
