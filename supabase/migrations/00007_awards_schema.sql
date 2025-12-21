-- Migration: 00007_awards_schema.sql
-- Description: Create tables for board game awards tracking
-- Awards: Spiel des Jahres, Kennerspiel des Jahres, Kinderspiel des Jahres,
--         Golden Geek, Dice Tower, As d'Or

-- Awards table (main award organizations)
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  country VARCHAR(50),
  organization VARCHAR(255),
  description TEXT,
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  established_year SMALLINT,
  is_active BOOLEAN DEFAULT true,
  display_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award categories (for awards with multiple categories)
CREATE TABLE award_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order SMALLINT DEFAULT 0,
  UNIQUE(award_id, slug)
);

-- Game awards (links games to awards by year)
CREATE TABLE game_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE,
  category_id UUID REFERENCES award_categories(id) ON DELETE SET NULL,
  year SMALLINT NOT NULL,
  result VARCHAR(20) DEFAULT 'winner',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, award_id, category_id, year)
);

-- Indexes for common queries
CREATE INDEX idx_game_awards_year ON game_awards(year);
CREATE INDEX idx_game_awards_result ON game_awards(result);
CREATE INDEX idx_game_awards_award ON game_awards(award_id);
CREATE INDEX idx_game_awards_game ON game_awards(game_id);
CREATE INDEX idx_award_categories_award ON award_categories(award_id);

-- Enable RLS
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_awards ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Awards are viewable by everyone"
  ON awards FOR SELECT
  USING (true);

CREATE POLICY "Award categories are viewable by everyone"
  ON award_categories FOR SELECT
  USING (true);

CREATE POLICY "Game awards are viewable by everyone"
  ON game_awards FOR SELECT
  USING (true);
