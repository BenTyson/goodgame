-- Migration: 00024_add_awards_and_reorder.sql
-- Description: Add more board game awards and reorder to show American awards first
-- Date: 2025-12-24

-- ============================================================================
-- ADD NEW AWARDS
-- ============================================================================

-- American Tabletop Awards (USA, ~2019)
INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order, is_active) VALUES
('american-tabletop', 'American Tabletop Awards', 'ATTA', 'USA', 'American Tabletop Awards Committee',
 'Annual awards given by a committee of US-based tabletop media professionals. Recognizes games in categories from casual to complex.',
 'https://americantabletopawards.com', 2019, 10, true);

-- Origins Awards (USA, 1975)
INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order, is_active) VALUES
('origins-awards', 'Origins Awards', 'Origins', 'USA', 'Academy of Adventure Gaming Arts & Design',
 'One of the longest-running awards in tabletop gaming, presented by GAMA at the Origins Game Fair. Honors excellence across board games, card games, and RPGs.',
 'https://www.originsawards.net', 1975, 11, true);

-- Mensa Select (USA, 1990)
INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order, is_active) VALUES
('mensa-select', 'Mensa Select', 'Mensa', 'USA', 'American Mensa',
 'Annual award given to five games that are original, challenging, and well-designed. Winners receive the coveted Mensa Select seal.',
 'https://www.mensamindgames.com', 1990, 12, true);

-- Deutscher Spiele Preis (Germany, 1990)
INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order, is_active) VALUES
('deutscher-spiele-preis', 'Deutscher Spiele Preis', 'DSP', 'Germany', 'German Game Industry',
 'German Game Prize voted by gamers, game clubs, and industry professionals. Often recognizes heavier games than Spiel des Jahres.',
 'https://www.deutscherspielepreis.de', 1990, 20, true);

-- International Gamers Award (International, 1999)
INSERT INTO awards (slug, name, short_name, country, organization, description, website_url, established_year, display_order, is_active) VALUES
('international-gamers-award', 'International Gamers Award', 'IGA', 'International', 'International Gamers Awards Committee',
 'Recognizes excellence in strategy gaming, voted on by a jury of international game enthusiasts. Categories include General Strategy and Multi-Player.',
 'https://www.internationalgamersawards.net', 1999, 21, true);

-- ============================================================================
-- ADD CATEGORIES FOR NEW AWARDS
-- ============================================================================

-- American Tabletop Awards categories
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'early-gamers', 'Early Gamers', 'Best game for young/new players', 1
FROM awards WHERE slug = 'american-tabletop';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'casual', 'Casual Games', 'Best casual/light game', 2
FROM awards WHERE slug = 'american-tabletop';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'strategy', 'Strategy Games', 'Best strategy game', 3
FROM awards WHERE slug = 'american-tabletop';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'complex', 'Complex Games', 'Best complex/heavy game', 4
FROM awards WHERE slug = 'american-tabletop';

-- Origins Awards categories (main board game ones)
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'board-game', 'Board Game of the Year', 'Best overall board game', 1
FROM awards WHERE slug = 'origins-awards';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'card-game', 'Card Game of the Year', 'Best card game', 2
FROM awards WHERE slug = 'origins-awards';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'family-game', 'Family Game of the Year', 'Best family game', 3
FROM awards WHERE slug = 'origins-awards';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'party-game', 'Party Game of the Year', 'Best party game', 4
FROM awards WHERE slug = 'origins-awards';

-- Mensa Select - single category (5 winners per year)
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'mensa-select', 'Mensa Select Winner', 'Selected as one of five best games of the year', 1
FROM awards WHERE slug = 'mensa-select';

-- Deutscher Spiele Preis - single main category
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'game-of-the-year', 'Game of the Year', 'Best game as voted by German gamers', 1
FROM awards WHERE slug = 'deutscher-spiele-preis';

-- International Gamers Award categories
INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'general-strategy-multi', 'General Strategy (Multi-Player)', 'Best multi-player strategy game', 1
FROM awards WHERE slug = 'international-gamers-award';

INSERT INTO award_categories (award_id, slug, name, description, display_order)
SELECT id, 'general-strategy-two', 'General Strategy (2-Player)', 'Best two-player strategy game', 2
FROM awards WHERE slug = 'international-gamers-award';

-- ============================================================================
-- REORDER AWARDS: American first, then International
-- ============================================================================

-- American Awards (display_order 1-10)
UPDATE awards SET display_order = 1 WHERE slug = 'golden-geek';
UPDATE awards SET display_order = 2 WHERE slug = 'dice-tower';
UPDATE awards SET display_order = 3 WHERE slug = 'american-tabletop';
UPDATE awards SET display_order = 4 WHERE slug = 'origins-awards';
UPDATE awards SET display_order = 5 WHERE slug = 'mensa-select';

-- German Awards (display_order 11-20)
UPDATE awards SET display_order = 11 WHERE slug = 'spiel-des-jahres';
UPDATE awards SET display_order = 12 WHERE slug = 'kennerspiel-des-jahres';
UPDATE awards SET display_order = 13 WHERE slug = 'kinderspiel-des-jahres';
UPDATE awards SET display_order = 14 WHERE slug = 'deutscher-spiele-preis';

-- Other International Awards (display_order 21+)
UPDATE awards SET display_order = 21 WHERE slug = 'as-dor';
UPDATE awards SET display_order = 22 WHERE slug = 'international-gamers-award';
