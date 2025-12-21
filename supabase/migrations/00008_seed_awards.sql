-- Migration: 00008_seed_awards.sql
-- Description: Seed board game awards and link existing games to their awards
-- Data covers 2015-2024

-- ============================================================================
-- AWARDS
-- ============================================================================

INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order) VALUES
-- Tier 1: German Awards (most prestigious)
('spiel-des-jahres', 'Spiel des Jahres', 'SdJ', 'Germany', 'Spiel des Jahres e.V.',
 'The most prestigious board game award in the world. Recognizes excellence in game design for family-friendly games.',
 'https://www.spiel-des-jahres.de', 1978, 1),

('kennerspiel-des-jahres', 'Kennerspiel des Jahres', 'KdJ', 'Germany', 'Spiel des Jahres e.V.',
 'Expert Game of the Year. Recognizes outstanding games for more experienced players.',
 'https://www.spiel-des-jahres.de', 2011, 2),

('kinderspiel-des-jahres', 'Kinderspiel des Jahres', 'KindSdJ', 'Germany', 'Spiel des Jahres e.V.',
 'Children''s Game of the Year. Recognizes outstanding games designed for children.',
 'https://www.spiel-des-jahres.de', 1989, 3),

-- Tier 2: International Awards
('golden-geek', 'Golden Geek Awards', 'Golden Geek', 'USA', 'BoardGameGeek',
 'Annual awards voted on by the BoardGameGeek community, recognizing excellence across multiple categories.',
 'https://boardgamegeek.com/goldengeek', 2006, 4),

('dice-tower', 'Dice Tower Awards', 'Dice Tower', 'USA', 'The Dice Tower',
 'Annual awards from The Dice Tower, one of the most influential board game media outlets.',
 'https://www.dicetower.com', 2007, 5),

('as-dor', 'As d''Or', 'As d''Or', 'France', 'Festival International des Jeux',
 'France''s most prestigious board game award, presented annually at the Festival International des Jeux in Cannes.',
 'https://www.festivaldesjeux-cannes.com', 1988, 6);

-- ============================================================================
-- AWARD CATEGORIES
-- ============================================================================

-- Spiel des Jahres has a single main category
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'game-of-the-year', 'Game of the Year', 'Best family-friendly game of the year', 1
FROM awards WHERE slug = 'spiel-des-jahres';

-- Kennerspiel has a single main category
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'expert-game', 'Expert Game of the Year', 'Best game for experienced players', 1
FROM awards WHERE slug = 'kennerspiel-des-jahres';

-- Kinderspiel has a single main category
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'childrens-game', 'Children''s Game of the Year', 'Best game for children', 1
FROM awards WHERE slug = 'kinderspiel-des-jahres';

-- Golden Geek categories (main ones)
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'board-game-of-the-year', 'Board Game of the Year', 'Overall best board game', 1
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'light-game', 'Light Game', 'Best light/gateway game', 2
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'medium-game', 'Medium Weight Game', 'Best medium complexity game', 3
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'heavy-game', 'Heavy Game', 'Best heavy/complex game', 4
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'strategy-game', 'Strategy Game', 'Best strategy game', 5
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'family-game', 'Family Game', 'Best family game', 6
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'party-game', 'Party Game', 'Best party game', 7
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'cooperative-game', 'Cooperative Game', 'Best cooperative game', 8
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'solo-game', 'Solo Game', 'Best solo game', 9
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'two-player', 'Two-Player Game', 'Best two-player game', 10
FROM awards WHERE slug = 'golden-geek';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'card-game', 'Card Game', 'Best card game', 11
FROM awards WHERE slug = 'golden-geek';

-- Dice Tower categories
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'game-of-the-year', 'Game of the Year', 'Overall best game', 1
FROM awards WHERE slug = 'dice-tower';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'small-publisher', 'Small Publisher Game', 'Best game from a small publisher', 2
FROM awards WHERE slug = 'dice-tower';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'cooperative', 'Cooperative Game', 'Best cooperative game', 3
FROM awards WHERE slug = 'dice-tower';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'strategy', 'Strategy Game', 'Best strategy game', 4
FROM awards WHERE slug = 'dice-tower';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'family', 'Family Game', 'Best family game', 5
FROM awards WHERE slug = 'dice-tower';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'party', 'Party Game', 'Best party game', 6
FROM awards WHERE slug = 'dice-tower';

-- As d'Or categories
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'jeu-de-lannee', 'Jeu de l''Année', 'Game of the Year', 1
FROM awards WHERE slug = 'as-dor';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'expert', 'As d''Or Expert', 'Expert Game of the Year', 2
FROM awards WHERE slug = 'as-dor';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'enfant', 'As d''Or Enfant', 'Children''s Game of the Year', 3
FROM awards WHERE slug = 'as-dor';

-- ============================================================================
-- LINK EXISTING GAMES TO THEIR AWARDS
-- ============================================================================

-- Cascadia - Spiel des Jahres 2022
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2022,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'cascadia'
  AND a.slug = 'spiel-des-jahres'
  AND ac.award_id = a.id
  AND ac.slug = 'game-of-the-year';

-- Azul - Spiel des Jahres 2018
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2018,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'azul'
  AND a.slug = 'spiel-des-jahres'
  AND ac.award_id = a.id
  AND ac.slug = 'game-of-the-year';

-- Codenames - Spiel des Jahres 2016
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2016,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'codenames'
  AND a.slug = 'spiel-des-jahres'
  AND ac.award_id = a.id
  AND ac.slug = 'game-of-the-year';

-- Wingspan - Kennerspiel des Jahres 2019
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2019,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'wingspan'
  AND a.slug = 'kennerspiel-des-jahres'
  AND ac.award_id = a.id
  AND ac.slug = 'expert-game';

-- The Crew - Kennerspiel des Jahres 2020
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2020,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'the-crew'
  AND a.slug = 'kennerspiel-des-jahres'
  AND ac.award_id = a.id
  AND ac.slug = 'expert-game';

-- ============================================================================
-- ADDITIONAL GOLDEN GEEK AWARDS FOR EXISTING GAMES
-- ============================================================================

-- Wingspan - Golden Geek Board Game of the Year 2019
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2019,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'wingspan'
  AND a.slug = 'golden-geek'
  AND ac.award_id = a.id
  AND ac.slug = 'board-game-of-the-year';

-- Azul - Golden Geek Family Game 2018
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2018,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'azul'
  AND a.slug = 'golden-geek'
  AND ac.award_id = a.id
  AND ac.slug = 'family-game';

-- The Crew - Golden Geek Cooperative Game 2020
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2020,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'the-crew'
  AND a.slug = 'golden-geek'
  AND ac.award_id = a.id
  AND ac.slug = 'cooperative-game';

-- Codenames - Golden Geek Party Game 2015
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2015,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'codenames'
  AND a.slug = 'golden-geek'
  AND ac.award_id = a.id
  AND ac.slug = 'party-game';

-- Dominion - Golden Geek Strategy Game 2008 (noted for reference, keeping awards from 2015+)
-- Sushi Go - Golden Geek Light Game nominee (various years)

-- ============================================================================
-- DICE TOWER AWARDS FOR EXISTING GAMES
-- ============================================================================

-- Wingspan - Dice Tower Game of the Year 2019
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2019,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'wingspan'
  AND a.slug = 'dice-tower'
  AND ac.award_id = a.id
  AND ac.slug = 'game-of-the-year';

-- The Crew - Dice Tower Game of the Year 2020
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2020,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'the-crew'
  AND a.slug = 'dice-tower'
  AND ac.award_id = a.id
  AND ac.slug = 'game-of-the-year';

-- Codenames - Dice Tower Party Game 2015
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2015,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'codenames'
  AND a.slug = 'dice-tower'
  AND ac.award_id = a.id
  AND ac.slug = 'party';

-- Pandemic (base game won various awards, noting legacy wins)
-- Pandemic Legacy S1 - Dice Tower Game of the Year 2015 (not in DB yet as separate entry)

-- ============================================================================
-- AS D'OR AWARDS FOR EXISTING GAMES
-- ============================================================================

-- Azul - As d'Or Jeu de l'Année 2018
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2018,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'azul'
  AND a.slug = 'as-dor'
  AND ac.award_id = a.id
  AND ac.slug = 'jeu-de-lannee';

-- Wingspan - As d'Or Expert 2019
INSERT INTO game_awards (game_id, award_id, category_id, year, result)
SELECT
  g.id,
  a.id,
  ac.id,
  2019,
  'winner'
FROM games g, awards a, award_categories ac
WHERE g.slug = 'wingspan'
  AND a.slug = 'as-dor'
  AND ac.award_id = a.id
  AND ac.slug = 'expert';
