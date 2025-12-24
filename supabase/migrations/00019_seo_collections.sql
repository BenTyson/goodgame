-- Migration: 00019_seo_collections.sql
-- Description: Add high-value SEO collection pages
-- Date: 2025-12-23

-- =====================================================
-- NEW COLLECTIONS FOR SEO
-- =====================================================

-- 1. Best Family Board Games (huge search volume)
INSERT INTO collections (slug, name, description, short_description, is_published, is_featured, display_order, meta_title, meta_description)
VALUES (
  'best-family-board-games',
  'Best Family Board Games',
  'The perfect games for family game night. These titles are easy to learn, engaging for all ages, and create memorable moments around the table. From classic trading in Catan to peaceful tile-laying in Cascadia, these games bring families together.',
  'Easy-to-learn games perfect for family game night with players of all ages.',
  true,
  true,
  1,
  'Best Family Board Games 2025 | Board Nomads',
  'Discover the best family board games for game night. Easy to learn, fun for all ages. Includes Ticket to Ride, Catan, Azul, and more top picks.'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Best Card Games (high search volume)
INSERT INTO collections (slug, name, description, short_description, is_published, is_featured, display_order, meta_title, meta_description)
VALUES (
  'best-card-games',
  'Best Card Games',
  'Card games offer incredible depth in a portable package. From the deck-building revolution of Dominion to the quick-playing charm of Sushi Go!, these card games deliver strategic gameplay without a massive setup. Perfect for travel or a quick game night.',
  'Strategic card games from quick fillers to deep deck-builders.',
  true,
  true,
  2,
  'Best Card Games 2025 | Board Nomads',
  'The best card games for every occasion. Deck-builders, drafting games, and trick-taking classics. Includes Dominion, 7 Wonders, and more.'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Best Cooperative Board Games (good search volume)
INSERT INTO collections (slug, name, description, short_description, is_published, is_featured, display_order, meta_title, meta_description)
VALUES (
  'best-cooperative-games',
  'Best Cooperative Board Games',
  'Work together or lose together. Cooperative games eliminate competition between players and instead challenge the group to beat the game itself. From saving the world in Pandemic to completing missions in The Crew, these games build teamwork and create shared victories.',
  'Games where players work together against the game itself.',
  true,
  true,
  3,
  'Best Cooperative Board Games 2025 | Board Nomads',
  'Top cooperative board games where you work together to win. Beat the game as a team. Includes Pandemic, The Crew, and more co-op classics.'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Best Solo Board Games (growing niche)
INSERT INTO collections (slug, name, description, short_description, is_published, is_featured, display_order, meta_title, meta_description)
VALUES (
  'best-solo-board-games',
  'Best Solo Board Games',
  'Great board gaming doesn''t require a group. These games offer satisfying solo experiences with dedicated single-player modes. Build your bird sanctuary in Wingspan, terraform a planet in Terraforming Mars, or create wildlife habitats in Cascadia - all by yourself.',
  'Excellent single-player experiences for solo gaming sessions.',
  true,
  false,
  4,
  'Best Solo Board Games 2025 | Board Nomads',
  'The best board games to play alone. Dedicated solo modes with deep gameplay. Includes Wingspan, Terraforming Mars, and more.'
)
ON CONFLICT (slug) DO NOTHING;

-- 5. Best Party Games (targeting larger groups)
INSERT INTO collections (slug, name, description, short_description, is_published, is_featured, display_order, meta_title, meta_description)
VALUES (
  'best-party-games',
  'Best Party Games',
  'Games that shine with larger groups and create laughter and memorable moments. These titles support 6+ players and focus on social interaction over complex rules. Perfect for parties, holidays, and gatherings where fun trumps strategy.',
  'Social games for larger groups that prioritize fun and laughter.',
  true,
  true,
  5,
  'Best Party Games 2025 | Board Nomads',
  'Top party games for large groups. Easy rules, maximum fun. Perfect for game nights with 6+ players. Includes Codenames and more.'
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- LINK GAMES TO NEW COLLECTIONS
-- =====================================================

-- Best Family Board Games
INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 1
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'ticket-to-ride'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 2
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'catan'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 3
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'azul'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 4
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'cascadia'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 5
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'carcassonne'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 6
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'king-of-tokyo'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 7
FROM collections c, games g
WHERE c.slug = 'best-family-board-games' AND g.slug = 'sushi-go'
ON CONFLICT DO NOTHING;

-- Best Card Games
INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 1
FROM collections c, games g
WHERE c.slug = 'best-card-games' AND g.slug = 'dominion'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 2
FROM collections c, games g
WHERE c.slug = 'best-card-games' AND g.slug = '7-wonders'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 3
FROM collections c, games g
WHERE c.slug = 'best-card-games' AND g.slug = 'the-crew'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 4
FROM collections c, games g
WHERE c.slug = 'best-card-games' AND g.slug = 'sushi-go'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 5
FROM collections c, games g
WHERE c.slug = 'best-card-games' AND g.slug = 'love-letter'
ON CONFLICT DO NOTHING;

-- Best Cooperative Games
INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 1
FROM collections c, games g
WHERE c.slug = 'best-cooperative-games' AND g.slug = 'pandemic'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 2
FROM collections c, games g
WHERE c.slug = 'best-cooperative-games' AND g.slug = 'the-crew'
ON CONFLICT DO NOTHING;

-- Best Solo Board Games
INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 1
FROM collections c, games g
WHERE c.slug = 'best-solo-board-games' AND g.slug = 'wingspan'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 2
FROM collections c, games g
WHERE c.slug = 'best-solo-board-games' AND g.slug = 'terraforming-mars'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 3
FROM collections c, games g
WHERE c.slug = 'best-solo-board-games' AND g.slug = 'cascadia'
ON CONFLICT DO NOTHING;

-- Best Party Games
INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 1
FROM collections c, games g
WHERE c.slug = 'best-party-games' AND g.slug = 'codenames'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 2
FROM collections c, games g
WHERE c.slug = 'best-party-games' AND g.slug = 'king-of-tokyo'
ON CONFLICT DO NOTHING;

INSERT INTO collection_games (collection_id, game_id, display_order)
SELECT c.id, g.id, 3
FROM collections c, games g
WHERE c.slug = 'best-party-games' AND g.slug = 'love-letter'
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE EXISTING COLLECTIONS WITH BETTER SEO
-- =====================================================

UPDATE collections
SET
  meta_title = 'Best Gateway Board Games for Beginners 2025 | Board Nomads',
  meta_description = 'The best gateway board games to start your collection. Perfect for beginners and introducing new players to the hobby.'
WHERE slug = 'gateway-games';

UPDATE collections
SET
  meta_title = 'Best Quick Board Games Under 30 Minutes 2025 | Board Nomads',
  meta_description = 'Fast-playing board games under 30 minutes. Perfect for lunch breaks, fillers, or when time is short.'
WHERE slug = 'under-30-minutes';

UPDATE collections
SET
  meta_title = 'Best 2 Player Board Games 2025 | Board Nomads',
  meta_description = 'Top board games designed for two players. Perfect for couples, roommates, or head-to-head competition.'
WHERE slug = 'best-at-2-players';
