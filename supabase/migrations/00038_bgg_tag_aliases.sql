-- =====================================================
-- BGG TAG ALIASES TABLE
-- Maps BGG category/mechanic IDs to our internal tags
-- Enables robust import matching beyond name-based lookups
-- =====================================================

CREATE TABLE bgg_tag_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- BGG source info
  bgg_id INTEGER NOT NULL,
  bgg_name VARCHAR(255) NOT NULL,
  bgg_type VARCHAR(50) NOT NULL,  -- 'category', 'mechanic', 'family'

  -- Our target tag
  target_type VARCHAR(50) NOT NULL,  -- 'category', 'mechanic', 'theme', 'player_experience'
  target_id UUID NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each BGG tag can only map to one internal tag per type
  UNIQUE(bgg_id, bgg_type, target_type)
);

-- Indexes for efficient lookups during import
CREATE INDEX idx_bgg_aliases_bgg_lookup ON bgg_tag_aliases(bgg_id, bgg_type);
CREATE INDEX idx_bgg_aliases_target ON bgg_tag_aliases(target_type, target_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE bgg_tag_aliases ENABLE ROW LEVEL SECURITY;

-- Public read access (admin writes bypass RLS via service role)
CREATE POLICY "Public can read bgg_tag_aliases" ON bgg_tag_aliases
  FOR SELECT USING (true);

-- =====================================================
-- SEED INITIAL ALIASES
-- Map common BGG categories to our taxonomy
-- BGG IDs from: https://boardgamegeek.com/browse/boardgamecategory
-- =====================================================

-- First, get the IDs for our existing tags
-- Categories
DO $$
DECLARE
  v_strategy_id UUID;
  v_family_id UUID;
  v_party_id UUID;
  v_thematic_id UUID;
  v_card_id UUID;
  v_cooperative_id UUID;
  v_word_id UUID;
  v_dice_id UUID;
  -- Themes
  v_fantasy_id UUID;
  v_scifi_id UUID;
  v_historical_id UUID;
  v_horror_id UUID;
  v_nature_id UUID;
  v_mystery_id UUID;
  v_war_id UUID;
  v_economic_id UUID;
  v_pirates_id UUID;
  v_medieval_id UUID;
  v_abstract_id UUID;
  v_humor_id UUID;
  v_mythology_id UUID;
  -- Player Experiences
  v_competitive_id UUID;
  v_coop_exp_id UUID;
  v_team_id UUID;
  v_solo_id UUID;
  v_social_id UUID;
  v_narrative_id UUID;
  v_asymmetric_id UUID;
  v_hidden_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO v_strategy_id FROM categories WHERE slug = 'strategy';
  SELECT id INTO v_family_id FROM categories WHERE slug = 'family-games';
  SELECT id INTO v_party_id FROM categories WHERE slug = 'party-games';
  SELECT id INTO v_thematic_id FROM categories WHERE slug = 'thematic';
  SELECT id INTO v_card_id FROM categories WHERE slug = 'card-games';
  SELECT id INTO v_cooperative_id FROM categories WHERE slug = 'cooperative';
  SELECT id INTO v_word_id FROM categories WHERE slug = 'word-games';
  SELECT id INTO v_dice_id FROM categories WHERE slug = 'dice-games';

  -- Get theme IDs
  SELECT id INTO v_fantasy_id FROM themes WHERE slug = 'fantasy';
  SELECT id INTO v_scifi_id FROM themes WHERE slug = 'sci-fi';
  SELECT id INTO v_historical_id FROM themes WHERE slug = 'historical';
  SELECT id INTO v_horror_id FROM themes WHERE slug = 'horror';
  SELECT id INTO v_nature_id FROM themes WHERE slug = 'nature';
  SELECT id INTO v_mystery_id FROM themes WHERE slug = 'mystery';
  SELECT id INTO v_war_id FROM themes WHERE slug = 'war';
  SELECT id INTO v_economic_id FROM themes WHERE slug = 'economic';
  SELECT id INTO v_pirates_id FROM themes WHERE slug = 'pirates';
  SELECT id INTO v_medieval_id FROM themes WHERE slug = 'medieval';
  SELECT id INTO v_abstract_id FROM themes WHERE slug = 'abstract';
  SELECT id INTO v_humor_id FROM themes WHERE slug = 'humor';
  SELECT id INTO v_mythology_id FROM themes WHERE slug = 'mythology';

  -- Get player experience IDs
  SELECT id INTO v_competitive_id FROM player_experiences WHERE slug = 'competitive';
  SELECT id INTO v_coop_exp_id FROM player_experiences WHERE slug = 'cooperative';
  SELECT id INTO v_team_id FROM player_experiences WHERE slug = 'team-based';
  SELECT id INTO v_solo_id FROM player_experiences WHERE slug = 'solo';
  SELECT id INTO v_social_id FROM player_experiences WHERE slug = 'social';
  SELECT id INTO v_narrative_id FROM player_experiences WHERE slug = 'narrative';
  SELECT id INTO v_asymmetric_id FROM player_experiences WHERE slug = 'asymmetric';
  SELECT id INTO v_hidden_id FROM player_experiences WHERE slug = 'hidden-roles';

  -- Insert BGG Category -> Our Category aliases
  -- BGG Category IDs from boardgamegeek.com
  IF v_strategy_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1009, 'Abstract Strategy', 'category', 'category', v_strategy_id),
      (1021, 'Economic', 'category', 'category', v_strategy_id),
      (1029, 'City Building', 'category', 'category', v_strategy_id),
      (1086, 'Territory Building', 'category', 'category', v_strategy_id);
  END IF;

  IF v_family_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1089, 'Animals', 'category', 'category', v_family_id),
      (1041, 'Children''s Game', 'category', 'category', v_family_id);
  END IF;

  IF v_party_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1030, 'Party Game', 'category', 'category', v_party_id);
  END IF;

  IF v_thematic_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1022, 'Adventure', 'category', 'category', v_thematic_id),
      (1024, 'Horror', 'category', 'category', v_thematic_id),
      (1010, 'Fantasy', 'category', 'category', v_thematic_id),
      (1016, 'Science Fiction', 'category', 'category', v_thematic_id),
      (1020, 'Exploration', 'category', 'category', v_thematic_id);
  END IF;

  IF v_card_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1002, 'Card Game', 'category', 'category', v_card_id);
  END IF;

  IF v_cooperative_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1039, 'Deduction', 'category', 'category', v_cooperative_id);
  END IF;

  IF v_word_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1025, 'Word Game', 'category', 'category', v_word_id),
      (1027, 'Trivia', 'category', 'category', v_word_id);
  END IF;

  IF v_dice_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1017, 'Dice', 'category', 'category', v_dice_id);
  END IF;

  -- Insert BGG Category -> Theme aliases
  IF v_fantasy_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1010, 'Fantasy', 'category', 'theme', v_fantasy_id),
      (1052, 'Arabian', 'category', 'theme', v_fantasy_id);
  END IF;

  IF v_scifi_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1016, 'Science Fiction', 'category', 'theme', v_scifi_id),
      (1113, 'Space Exploration', 'category', 'theme', v_scifi_id);
  END IF;

  IF v_historical_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1050, 'Ancient', 'category', 'theme', v_historical_id),
      (1067, 'Age of Reason', 'category', 'theme', v_historical_id),
      (1075, 'American Revolutionary War', 'category', 'theme', v_historical_id),
      (1091, 'American West', 'category', 'theme', v_historical_id),
      (1015, 'Civilization', 'category', 'theme', v_historical_id),
      (1069, 'Modern Warfare', 'category', 'theme', v_historical_id),
      (1051, 'Napoleonic', 'category', 'theme', v_historical_id),
      (1001, 'Political', 'category', 'theme', v_historical_id),
      (1070, 'Renaissance', 'category', 'theme', v_historical_id);
  END IF;

  IF v_horror_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1024, 'Horror', 'category', 'theme', v_horror_id),
      (1108, 'Zombies', 'category', 'theme', v_horror_id);
  END IF;

  IF v_nature_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1089, 'Animals', 'category', 'theme', v_nature_id),
      (1013, 'Farming', 'category', 'theme', v_nature_id),
      (1084, 'Environmental', 'category', 'theme', v_nature_id);
  END IF;

  IF v_mystery_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1039, 'Deduction', 'category', 'theme', v_mystery_id),
      (1040, 'Murder/Mystery', 'category', 'theme', v_mystery_id),
      (1081, 'Spies/Secret Agents', 'category', 'theme', v_mystery_id);
  END IF;

  IF v_war_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1019, 'Wargame', 'category', 'theme', v_war_id),
      (1046, 'Fighting', 'category', 'theme', v_war_id),
      (1074, 'American Civil War', 'category', 'theme', v_war_id),
      (1065, 'World War I', 'category', 'theme', v_war_id),
      (1049, 'World War II', 'category', 'theme', v_war_id);
  END IF;

  IF v_economic_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1021, 'Economic', 'category', 'theme', v_economic_id),
      (1088, 'Industry / Manufacturing', 'category', 'theme', v_economic_id),
      (1026, 'Negotiation', 'category', 'theme', v_economic_id);
  END IF;

  IF v_pirates_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1090, 'Pirates', 'category', 'theme', v_pirates_id),
      (1008, 'Nautical', 'category', 'theme', v_pirates_id);
  END IF;

  IF v_medieval_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1035, 'Medieval', 'category', 'theme', v_medieval_id),
      (1029, 'City Building', 'category', 'theme', v_medieval_id);
  END IF;

  IF v_abstract_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1009, 'Abstract Strategy', 'category', 'theme', v_abstract_id),
      (1028, 'Puzzle', 'category', 'theme', v_abstract_id);
  END IF;

  IF v_humor_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1079, 'Humor', 'category', 'theme', v_humor_id),
      (1030, 'Party Game', 'category', 'theme', v_humor_id),
      (1116, 'Comic Book / Strip', 'category', 'theme', v_humor_id);
  END IF;

  IF v_mythology_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1082, 'Mythology', 'category', 'theme', v_mythology_id);
  END IF;

  -- Insert BGG Category -> Player Experience aliases
  IF v_competitive_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1031, 'Racing', 'category', 'player_experience', v_competitive_id),
      (1046, 'Fighting', 'category', 'player_experience', v_competitive_id);
  END IF;

  IF v_coop_exp_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1032, 'Action / Dexterity', 'category', 'player_experience', v_coop_exp_id);
  END IF;

  IF v_solo_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1120, 'Print & Play', 'category', 'player_experience', v_solo_id);
  END IF;

  IF v_social_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1030, 'Party Game', 'category', 'player_experience', v_social_id),
      (1079, 'Humor', 'category', 'player_experience', v_social_id);
  END IF;

  IF v_narrative_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1022, 'Adventure', 'category', 'player_experience', v_narrative_id),
      (1020, 'Exploration', 'category', 'player_experience', v_narrative_id);
  END IF;

  IF v_hidden_id IS NOT NULL THEN
    INSERT INTO bgg_tag_aliases (bgg_id, bgg_name, bgg_type, target_type, target_id) VALUES
      (1023, 'Bluffing', 'category', 'player_experience', v_hidden_id),
      (1039, 'Deduction', 'category', 'player_experience', v_hidden_id),
      (1081, 'Spies/Secret Agents', 'category', 'player_experience', v_hidden_id);
  END IF;

END $$;
