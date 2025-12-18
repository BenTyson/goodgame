-- =====================================================
-- GOOD GAME - Seed Data
-- =====================================================

-- =====================================================
-- CATEGORIES
-- =====================================================
INSERT INTO categories (slug, name, description, icon, display_order, is_primary) VALUES
  ('strategy', 'Strategy', 'Games that emphasize strategic thinking and planning', 'brain', 1, true),
  ('family', 'Family', 'Games suitable for the whole family', 'users', 2, true),
  ('party', 'Party', 'Social games for larger groups', 'party-popper', 3, true),
  ('cooperative', 'Cooperative', 'Games where players work together', 'handshake', 4, true),
  ('two-player', 'Two-Player', 'Games designed for two players', 'user-2', 5, true),
  ('abstract', 'Abstract', 'Strategy games with minimal theme', 'shapes', 6, false),
  ('thematic', 'Thematic', 'Games with strong narrative themes', 'book-open', 7, false),
  ('economic', 'Economic', 'Games focused on resource management and trading', 'coins', 8, false),
  ('deck-building', 'Deck Building', 'Games where you build your deck during play', 'layers', 9, false),
  ('campaign', 'Campaign', 'Games with persistent storylines', 'map', 10, false);

-- =====================================================
-- MECHANICS
-- =====================================================
INSERT INTO mechanics (slug, name, description) VALUES
  ('worker-placement', 'Worker Placement', 'Place workers to take actions or claim resources'),
  ('deck-building', 'Deck Building', 'Build and improve your deck during gameplay'),
  ('area-control', 'Area Control', 'Control regions on a map to score points'),
  ('tile-placement', 'Tile Placement', 'Place tiles to build a map or pattern'),
  ('hand-management', 'Hand Management', 'Manage cards in your hand for optimal play'),
  ('set-collection', 'Set Collection', 'Collect sets of items for points'),
  ('drafting', 'Drafting', 'Select cards or items from a shared pool'),
  ('dice-rolling', 'Dice Rolling', 'Roll dice to determine outcomes'),
  ('engine-building', 'Engine Building', 'Build a system that generates resources or points'),
  ('trading', 'Trading', 'Trade resources with other players'),
  ('auction', 'Auction/Bidding', 'Bid on items or actions'),
  ('pattern-building', 'Pattern Building', 'Create specific patterns for scoring'),
  ('route-building', 'Route Building', 'Build routes or networks on a map'),
  ('variable-player-powers', 'Variable Player Powers', 'Each player has unique abilities'),
  ('hidden-roles', 'Hidden Roles', 'Players have secret identities or objectives'),
  ('cooperative', 'Cooperative Play', 'Players work together against the game'),
  ('push-your-luck', 'Push Your Luck', 'Risk management for greater rewards'),
  ('resource-management', 'Resource Management', 'Manage limited resources efficiently'),
  ('action-points', 'Action Points', 'Spend points to take actions'),
  ('modular-board', 'Modular Board', 'Game board changes each playthrough');

-- =====================================================
-- COLLECTIONS
-- =====================================================
INSERT INTO collections (slug, name, description, short_description, display_order, is_featured, is_published) VALUES
  ('gateway-games', 'Gateway Games', 'Perfect games for introducing new players to the hobby. Easy to learn, quick to play, and universally enjoyable.', 'Great games for beginners', 1, true, true),
  ('under-30-minutes', 'Quick Games', 'Games that play in 30 minutes or less. Perfect for lunch breaks or when you want a quick gaming fix.', 'Fast-playing favorites', 2, true, true),
  ('best-at-2-players', 'Best at Two', 'Games that shine with exactly two players. Perfect for couples or head-to-head competition.', 'Two-player favorites', 3, true, true),
  ('complex-strategy', 'Complex Strategy', 'For experienced gamers who want deep strategic challenges. These games reward repeated plays.', 'Deep strategy games', 4, false, true);

-- =====================================================
-- PILOT GAME: CATAN
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'catan',
  'Catan',
  'Trade, build, settle - the classic gateway game',
  'In Catan, players try to be the first to reach 10 victory points by building settlements, cities, and roads, and by collecting development cards. On each turn, the dice determine which resources the island produces. Players trade resources with each other and use them to build their civilizations.',
  3, 4, ARRAY[4],
  60, 120, 10, 2.3,
  1995, ARRAY['Klaus Teuber'], 'Catan Studio',
  13, 'B00U26V4VQ',
  true, true, true, true,
  true, true
);

-- Catan categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'strategy'
FROM games g, categories c
WHERE g.slug = 'catan' AND c.slug IN ('strategy', 'family');

-- Catan mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'catan' AND m.slug IN ('trading', 'dice-rolling', 'route-building', 'modular-board');

-- Catan score sheet config
INSERT INTO score_sheet_configs (game_id, layout_type, player_min, player_max, orientation)
SELECT id, 'table', 3, 4, 'portrait' FROM games WHERE slug = 'catan';

-- Catan score sheet fields
INSERT INTO score_sheet_fields (config_id, name, label, field_type, per_player, display_order, section)
SELECT
  c.id,
  f.name,
  f.label,
  'number',
  true,
  f.ord,
  'scoring'
FROM score_sheet_configs c
JOIN games g ON c.game_id = g.id
CROSS JOIN (VALUES
  ('settlements', 'Settlements (1 pt each)', 1),
  ('cities', 'Cities (2 pts each)', 2),
  ('longest_road', 'Longest Road (2 pts)', 3),
  ('largest_army', 'Largest Army (2 pts)', 4),
  ('victory_point_cards', 'VP Cards', 5),
  ('total', 'TOTAL', 6)
) AS f(name, label, ord)
WHERE g.slug = 'catan';

-- Catan affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B00U26V4VQ?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'catan';

-- Add Catan to collections
INSERT INTO collection_games (collection_id, game_id, display_order, note)
SELECT c.id, g.id, 1, 'The classic gateway game'
FROM collections c, games g
WHERE c.slug = 'gateway-games' AND g.slug = 'catan';

-- =====================================================
-- PILOT GAME: WINGSPAN
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'wingspan',
  'Wingspan',
  'A competitive bird-collection engine-building game',
  'Wingspan is a relaxing, award-winning strategy card game about birds for 1-5 players. Each bird you play extends a chain of powerful combinations in one of your three habitats. Your goal is to discover and attract the best birds to your network of wildlife preserves.',
  1, 5, ARRAY[3, 4],
  40, 70, 10, 2.4,
  2019, ARRAY['Elizabeth Hargrave'], 'Stonemaier Games',
  266192, 'B07YQ641NQ',
  true, true, true, true,
  true, true
);

-- Wingspan categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'strategy'
FROM games g, categories c
WHERE g.slug = 'wingspan' AND c.slug IN ('strategy', 'family');

-- Wingspan mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'wingspan' AND m.slug IN ('engine-building', 'hand-management', 'set-collection', 'dice-rolling');

-- Wingspan score sheet config
INSERT INTO score_sheet_configs (game_id, layout_type, player_min, player_max, orientation)
SELECT id, 'table', 1, 5, 'portrait' FROM games WHERE slug = 'wingspan';

-- Wingspan score sheet fields
INSERT INTO score_sheet_fields (config_id, name, label, field_type, per_player, display_order, section)
SELECT
  c.id,
  f.name,
  f.label,
  'number',
  true,
  f.ord,
  'scoring'
FROM score_sheet_configs c
JOIN games g ON c.game_id = g.id
CROSS JOIN (VALUES
  ('birds', 'Bird Points', 1),
  ('bonus_cards', 'Bonus Cards', 2),
  ('end_of_round', 'End-of-Round Goals', 3),
  ('eggs', 'Eggs', 4),
  ('food_on_cards', 'Cached Food', 5),
  ('tucked_cards', 'Tucked Cards', 6),
  ('total', 'TOTAL', 7)
) AS f(name, label, ord)
WHERE g.slug = 'wingspan';

-- Wingspan affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B07YQ641NQ?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'wingspan';

-- =====================================================
-- PILOT GAME: TICKET TO RIDE
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'ticket-to-ride',
  'Ticket to Ride',
  'Build train routes across America',
  'Ticket to Ride is a cross-country train adventure where players collect cards of various types of train cars and use them to claim railway routes on a map. The longer the routes, the more points they earn.',
  2, 5, ARRAY[4],
  30, 60, 8, 1.8,
  2004, ARRAY['Alan R. Moon'], 'Days of Wonder',
  9209, 'B0002TV2LU',
  true, true, true, true,
  true, true
);

-- Ticket to Ride categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'family'
FROM games g, categories c
WHERE g.slug = 'ticket-to-ride' AND c.slug IN ('family', 'strategy');

-- Ticket to Ride mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'ticket-to-ride' AND m.slug IN ('route-building', 'set-collection', 'hand-management');

-- Ticket to Ride affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B0002TV2LU?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'ticket-to-ride';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order, note)
SELECT c.id, g.id, 2, 'Perfect for families'
FROM collections c, games g
WHERE c.slug = 'gateway-games' AND g.slug = 'ticket-to-ride';

-- =====================================================
-- PILOT GAME: AZUL
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'azul',
  'Azul',
  'Tile-drafting with beautiful patterns',
  'In Azul, players take turns drafting colored tiles from suppliers to their player board. Later in the round, players score points based on how they placed their tiles to decorate the palace.',
  2, 4, ARRAY[2, 3],
  30, 45, 8, 1.8,
  2017, ARRAY['Michael Kiesling'], 'Plan B Games',
  230802, 'B077MZ2MPW',
  true, true, true, true,
  true, true
);

-- Azul categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'abstract'
FROM games g, categories c
WHERE g.slug = 'azul' AND c.slug IN ('abstract', 'family', 'strategy');

-- Azul mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'azul' AND m.slug IN ('drafting', 'pattern-building', 'tile-placement');

-- Azul affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B077MZ2MPW?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'azul';

-- =====================================================
-- PILOT GAME: CODENAMES
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'codenames',
  'Codenames',
  'Give clever clues to find your team''s agents',
  'Two rival spymasters know the secret identities of 25 agents. Their teammates know the agents only by their codenames. Spymasters take turns giving one-word clues that can point to multiple words on the board.',
  2, 8, ARRAY[6, 8],
  15, 30, 14, 1.3,
  2015, ARRAY['Vlaada Chvátil'], 'Czech Games Edition',
  178900, 'B014Q1XX9S',
  true, false, true, true,
  true, true
);

-- Codenames categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'party'
FROM games g, categories c
WHERE g.slug = 'codenames' AND c.slug IN ('party', 'family');

-- Codenames mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'codenames' AND m.slug IN ('hidden-roles', 'push-your-luck');

-- Codenames affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B014Q1XX9S?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'codenames';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order, note)
SELECT c.id, g.id, 1, 'The ultimate party game'
FROM collections c, games g
WHERE c.slug = 'under-30-minutes' AND g.slug = 'codenames';

-- =====================================================
-- PILOT GAME: 7 WONDERS
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  '7-wonders',
  '7 Wonders',
  'Draft cards to build an ancient civilization',
  'You are the leader of one of the 7 great cities of the Ancient World. Gather resources, develop commercial routes, and affirm your military supremacy. Build your city and erect an architectural wonder which will transcend future times.',
  2, 7, ARRAY[4, 5],
  30, 45, 10, 2.3,
  2010, ARRAY['Antoine Bauza'], 'Repos Production',
  68448, 'B004UBAX6K',
  true, true, true, true,
  true, false
);

-- 7 Wonders categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'strategy'
FROM games g, categories c
WHERE g.slug = '7-wonders' AND c.slug IN ('strategy', 'family');

-- 7 Wonders mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = '7-wonders' AND m.slug IN ('drafting', 'set-collection', 'hand-management', 'variable-player-powers');

-- 7 Wonders affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B004UBAX6K?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = '7-wonders';

-- =====================================================
-- PILOT GAME: SPLENDOR
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'splendor',
  'Splendor',
  'Collect gems to build your merchant empire',
  'As a wealthy Renaissance merchant, acquire mines and transportation, hire artisans and woo the nobility. Create the most fantastic jewelry to become the best-known merchant of them all.',
  2, 4, ARRAY[3],
  30, 45, 10, 1.8,
  2014, ARRAY['Marc André'], 'Space Cowboys',
  148228, 'B00IZEUFIA',
  true, true, true, true,
  true, false
);

-- Splendor categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'strategy'
FROM games g, categories c
WHERE g.slug = 'splendor' AND c.slug IN ('strategy', 'family');

-- Splendor mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'splendor' AND m.slug IN ('set-collection', 'engine-building');

-- Splendor affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B00IZEUFIA?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'splendor';

-- =====================================================
-- PILOT GAME: PANDEMIC
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'pandemic',
  'Pandemic',
  'Work together to save humanity',
  'Four diseases have broken out in the world and it is up to a team of specialists to find cures before it''s too late. Players must work together, using their individual strengths, to cure all four diseases.',
  2, 4, ARRAY[4],
  45, 60, 8, 2.4,
  2008, ARRAY['Matt Leacock'], 'Z-Man Games',
  30549, 'B00A2HD40E',
  true, false, true, true,
  true, false
);

-- Pandemic categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'cooperative'
FROM games g, categories c
WHERE g.slug = 'pandemic' AND c.slug IN ('cooperative', 'strategy', 'family');

-- Pandemic mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'pandemic' AND m.slug IN ('cooperative', 'hand-management', 'variable-player-powers', 'action-points');

-- Pandemic affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B00A2HD40E?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'pandemic';

-- =====================================================
-- PILOT GAME: CARCASSONNE
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'carcassonne',
  'Carcassonne',
  'Build the medieval landscape tile by tile',
  'A tile-placement game where players draw and place tiles with cities, roads, fields, and cloisters, then deploy followers to score points. Simple rules, deep strategy.',
  2, 5, ARRAY[2, 3],
  30, 45, 7, 1.9,
  2000, ARRAY['Klaus-Jürgen Wrede'], 'Z-Man Games',
  822, 'B00NX627HW',
  true, true, true, true,
  true, false
);

-- Carcassonne categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'family'
FROM games g, categories c
WHERE g.slug = 'carcassonne' AND c.slug IN ('family', 'strategy');

-- Carcassonne mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'carcassonne' AND m.slug IN ('tile-placement', 'area-control');

-- Carcassonne affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B00NX627HW?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'carcassonne';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order, note)
SELECT c.id, g.id, 1, 'Perfect for 2 players'
FROM collections c, games g
WHERE c.slug = 'best-at-2-players' AND g.slug = 'carcassonne';

-- =====================================================
-- PILOT GAME: TERRAFORMING MARS
-- =====================================================
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  is_published, is_featured
) VALUES (
  'terraforming-mars',
  'Terraforming Mars',
  'Compete to make Mars habitable',
  'In Terraforming Mars, players take on the role of corporations working to terraform the planet Mars. By raising temperature, oxygen level, and creating oceans, you earn points toward winning.',
  1, 5, ARRAY[3, 4],
  120, 180, 12, 3.3,
  2016, ARRAY['Jacob Fryxelius'], 'Stronghold Games',
  167791, 'B01GSYA4K2',
  true, true, true, true,
  true, true
);

-- Terraforming Mars categories
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, c.slug = 'strategy'
FROM games g, categories c
WHERE g.slug = 'terraforming-mars' AND c.slug IN ('strategy', 'economic', 'thematic');

-- Terraforming Mars mechanics
INSERT INTO game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM games g, mechanics m
WHERE g.slug = 'terraforming-mars' AND m.slug IN ('engine-building', 'hand-management', 'drafting', 'tile-placement', 'variable-player-powers');

-- Terraforming Mars score sheet config
INSERT INTO score_sheet_configs (game_id, layout_type, player_min, player_max, orientation)
SELECT id, 'table', 1, 5, 'landscape' FROM games WHERE slug = 'terraforming-mars';

-- Terraforming Mars score sheet fields
INSERT INTO score_sheet_fields (config_id, name, label, field_type, per_player, display_order, section)
SELECT
  c.id,
  f.name,
  f.label,
  'number',
  true,
  f.ord,
  'scoring'
FROM score_sheet_configs c
JOIN games g ON c.game_id = g.id
CROSS JOIN (VALUES
  ('tr', 'Terraform Rating', 1),
  ('awards', 'Awards', 2),
  ('milestones', 'Milestones', 3),
  ('greeneries', 'Greeneries', 4),
  ('cities', 'Cities', 5),
  ('cards', 'Card Points', 6),
  ('total', 'TOTAL', 7)
) AS f(name, label, ord)
WHERE g.slug = 'terraforming-mars';

-- Terraforming Mars affiliate links
INSERT INTO affiliate_links (game_id, provider, url, label, is_primary)
SELECT id, 'Amazon', 'https://www.amazon.com/dp/B01GSYA4K2?tag=goodgame-20', 'Buy on Amazon', true
FROM games WHERE slug = 'terraforming-mars';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order, note)
SELECT c.id, g.id, 1, 'Deep strategy with engine building'
FROM collections c, games g
WHERE c.slug = 'complex-strategy' AND g.slug = 'terraforming-mars';
