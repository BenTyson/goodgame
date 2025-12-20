-- =====================================================
-- GOOD GAME - Seed Pilot Games Data
-- =====================================================

-- Insert 6 pilot games (upsert to handle re-runs)
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id, amazon_asin,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  box_image_url, thumbnail_url,
  is_published, is_featured
) VALUES
-- Catan
(
  'catan', 'Catan', 'Trade, build, settle - the classic gateway game',
  'In Catan, players try to be the first to reach 10 victory points by building settlements, cities, and roads.',
  3, 4, ARRAY[4],
  60, 120, 10, 2.3,
  1995, ARRAY['Klaus Teuber'], 'Catan Studio',
  13, 'B00U26V4VQ',
  true, true, true, true,
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Qc0M0k3jLKBVPZKzL0Tc7nIg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg',
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Uun_le9bXWPnidcA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
  true, true
),
-- Wingspan
(
  'wingspan', 'Wingspan', 'A competitive bird-collection engine-building game',
  'Wingspan is a relaxing, award-winning strategy card game about birds for 1-5 players.',
  1, 5, ARRAY[3, 4],
  40, 70, 10, 2.4,
  2019, ARRAY['Elizabeth Hargrave'], 'Stonemaier Games',
  266192, 'B07YQ641NQ',
  true, true, true, true,
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/aVgLcuZWXhG8HqCgMOWCndnnvHQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/St0BHEH0q28P9WNdskXNCdkR8mc=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
  true, true
),
-- Ticket to Ride
(
  'ticket-to-ride', 'Ticket to Ride', 'Build train routes across America',
  'Ticket to Ride is a cross-country train adventure where players collect cards and claim railway routes.',
  2, 5, ARRAY[4],
  30, 60, 8, 1.8,
  2004, ARRAY['Alan R. Moon'], 'Days of Wonder',
  9209, 'B0002TV2LU',
  true, true, true, true,
  'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__imagepage/img/NnUE_-xGDfhxjnzw33IYJELfDiQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg',
  'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/PlvAhEVdqT--X3R2mi2Wrc8Wqbw=/fit-in/200x150/filters:strip_icc()/pic38668.jpg',
  true, true
),
-- Azul
(
  'azul', 'Azul', 'Tile-drafting with beautiful patterns',
  'In Azul, players take turns drafting colored tiles to their player board.',
  2, 4, ARRAY[2, 3],
  30, 45, 8, 1.8,
  2017, ARRAY['Michael Kiesling'], 'Plan B Games',
  230802, 'B077MZ2MPW',
  true, true, true, true,
  'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__imagepage/img/l-0qMHo1gYFUJZ3_eEk37xvXGV4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6973671.png',
  'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__thumb/img/oZ1tT6BWKNzbhZ4OZ8wT7MBZUWI=/fit-in/200x150/filters:strip_icc()/pic6973671.png',
  true, false
),
-- Codenames
(
  'codenames', 'Codenames', 'Give clever clues to find your team''s agents',
  'Two rival spymasters know the secret identities of 25 agents. Their teammates know the agents only by their codenames.',
  2, 8, ARRAY[6, 8],
  15, 30, 14, 1.3,
  2015, ARRAY['Vlaada Chvátil'], 'Czech Games Edition',
  178900, 'B014Q1XX9S',
  true, false, true, true,
  'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__imagepage/img/3l_Go8bjaJPbbJQPWD_C-nNAqJA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2582929.jpg',
  'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__thumb/img/UJbCOmNDgKkuUTBGP9pxZOLsNMI=/fit-in/200x150/filters:strip_icc()/pic2582929.jpg',
  true, true
),
-- Terraforming Mars
(
  'terraforming-mars', 'Terraforming Mars', 'Compete to make Mars habitable',
  'In Terraforming Mars, players take on the role of corporations working to terraform the planet Mars.',
  1, 5, ARRAY[3, 4],
  120, 180, 12, 3.3,
  2016, ARRAY['Jacob Fryxelius'], 'Stronghold Games',
  167791, 'B01GSYA4K2',
  true, true, true, true,
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/09uYjk2ZK_SuhhK8NN1mVqvAcYw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg',
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/R7XVdTCYEJwQnBxGRgbwEn7CVXQ=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg',
  true, true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  player_count_min = EXCLUDED.player_count_min,
  player_count_max = EXCLUDED.player_count_max,
  player_count_best = EXCLUDED.player_count_best,
  play_time_min = EXCLUDED.play_time_min,
  play_time_max = EXCLUDED.play_time_max,
  min_age = EXCLUDED.min_age,
  weight = EXCLUDED.weight,
  year_published = EXCLUDED.year_published,
  designers = EXCLUDED.designers,
  publisher = EXCLUDED.publisher,
  bgg_id = EXCLUDED.bgg_id,
  amazon_asin = EXCLUDED.amazon_asin,
  has_rules = EXCLUDED.has_rules,
  has_score_sheet = EXCLUDED.has_score_sheet,
  has_setup_guide = EXCLUDED.has_setup_guide,
  has_reference = EXCLUDED.has_reference,
  box_image_url = EXCLUDED.box_image_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured;

-- Link games to categories (upsert)
INSERT INTO game_categories (game_id, category_id, is_primary)
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'catan' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false
FROM games g, categories c
WHERE g.slug = 'catan' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'wingspan' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false
FROM games g, categories c
WHERE g.slug = 'wingspan' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'ticket-to-ride' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false
FROM games g, categories c
WHERE g.slug = 'ticket-to-ride' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'azul' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false
FROM games g, categories c
WHERE g.slug = 'azul' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'codenames' AND c.slug = 'party'
UNION ALL
SELECT g.id, c.id, false
FROM games g, categories c
WHERE g.slug = 'codenames' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, true
FROM games g, categories c
WHERE g.slug = 'terraforming-mars' AND c.slug = 'strategy'
ON CONFLICT (game_id, category_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

-- Delete existing game images for these games then re-insert
DELETE FROM game_images WHERE game_id IN (SELECT id FROM games WHERE slug IN ('catan', 'wingspan', 'ticket-to-ride', 'azul', 'codenames', 'terraforming-mars'));

-- Insert game images
INSERT INTO game_images (game_id, url, alt_text, caption, image_type, display_order, width, height, is_primary)
-- Catan images
SELECT g.id,
  'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Qc0M0k3jLKBVPZKzL0Tc7nIg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg',
  'Catan box cover', 'The classic gateway game that started it all', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'catan'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/0wuxXJxdU8EsT6e0BDXHFQ__imagepage/img/xRz77b7-iV0KDwL5UZ2VdnMVlUo=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7466612.jpg',
  'Catan game in progress', 'A typical game setup with the hexagonal board', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'catan'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/0SEhPLLfPwmzLpHvkhQdag__imagepage/img/EYwOoCZiJqk1xKmZZcPYkVUawR0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7466613.jpg',
  'Catan components', 'Resource cards, development cards, and player pieces', 'components', 2, 900, 600, false
FROM games g WHERE g.slug = 'catan'
-- Wingspan images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/aVgLcuZWXhG8HqCgMOWCndnnvHQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
  'Wingspan box cover', 'Award-winning bird-collection game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'wingspan'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/P6Ni6oy2TV7Zo3bIqDZNpA__imagepage/img/WUjfcuMSV8NzVYNWMVL_3hWPcfc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4489504.jpg',
  'Wingspan game components', 'Beautiful bird cards and custom dice tower', 'components', 1, 900, 600, false
FROM games g WHERE g.slug = 'wingspan'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/MRDHCg4x-t5vYEUIPApdCw__imagepage/img/9KDTr7glOvGu0k1YQTgcTI0qXdQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4764866.jpg',
  'Wingspan gameplay', 'Player board with birds in three habitats', 'gameplay', 2, 900, 600, false
FROM games g WHERE g.slug = 'wingspan'
-- Ticket to Ride images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__imagepage/img/NnUE_-xGDfhxjnzw33IYJELfDiQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg',
  'Ticket to Ride box cover', 'The original USA map edition', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'ticket-to-ride'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/QZ1ityHWB2FMJg87g-Ew8g__imagepage/img/2PJGI2_Y2MWPDvVb3OKXz6K_sPE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic588836.jpg',
  'Ticket to Ride game board', 'Full game board with train routes', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'ticket-to-ride'
-- Azul images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__imagepage/img/l-0qMHo1gYFUJZ3_eEk37xvXGV4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6973671.png',
  'Azul box cover', 'Beautiful Portuguese tile-laying game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'azul'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/TLqvjU5HvJLxbe9Z8MGNyA__imagepage/img/-fOZffJ2NZTI4B7rO8bSUHo0z1o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3991629.jpg',
  'Azul tiles', 'Colorful Azul tiles ready for drafting', 'components', 1, 900, 600, false
FROM games g WHERE g.slug = 'azul'
-- Codenames images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__imagepage/img/3l_Go8bjaJPbbJQPWD_C-nNAqJA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2582929.jpg',
  'Codenames box cover', 'The ultimate party word game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'codenames'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/sQ1hCFpwK_4ECXQ2g0D5gg__imagepage/img/5e_wJwVB2H3YKmCqQBRV1ZwWH1s=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2990543.jpg',
  'Codenames gameplay', 'Word grid with spymaster key card', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'codenames'
-- Terraforming Mars images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/09uYjk2ZK_SuhhK8NN1mVqvAcYw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg',
  'Terraforming Mars box cover', 'The definitive Mars colonization game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'terraforming-mars'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/rCjAF3h6z1n_qG4gPPJEeQ__imagepage/img/sI5EWJ4h4fkQvxpAFeFzHHmN4pg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3791227.jpg',
  'Terraforming Mars board', 'The Mars board with hexagonal tiles', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'terraforming-mars'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/0S_oOJxmN4-nwFv9KdIhsg__imagepage/img/_FJJUi5c3YTn5KbU8wIhNqTxG5o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3791226.jpg',
  'Terraforming Mars cards', 'Project cards that drive your corporation', 'components', 2, 900, 600, false
FROM games g WHERE g.slug = 'terraforming-mars';

-- Insert collections (upsert)
INSERT INTO collections (
  slug, name, description, short_description,
  display_order, is_featured, is_published,
  meta_title, meta_description
) VALUES
(
  'gateway-games', 'Gateway Games',
  'Perfect games for introducing new players to the hobby. These titles feature approachable rules, reasonable play times, and engaging gameplay that hooks people on modern board games.',
  'Perfect for introducing new players to board games',
  1, true, true,
  'Gateway Board Games - Best Games for Beginners',
  'Discover the best gateway board games perfect for introducing new players to the hobby. Easy to learn, fun to play.'
),
(
  'under-30-minutes', 'Quick Games',
  'Games that play in 30 minutes or less. Perfect for lunch breaks, warm-up games, or when you want fast-paced fun without a lengthy time commitment.',
  'Games that play in 30 minutes or less',
  2, true, true,
  'Quick Board Games Under 30 Minutes',
  'Find board games that play in 30 minutes or less. Perfect for quick gaming sessions.'
),
(
  'best-at-2-players', 'Best at Two Players',
  'Games that shine with exactly two players. Whether you''re looking for head-to-head competition or cooperative adventures, these games are ideal for couples, friends, or parent-child game nights.',
  'Games that shine with exactly two players',
  3, true, true,
  'Best 2 Player Board Games',
  'Discover the best board games for two players. Perfect for couples and head-to-head gaming.'
),
(
  'engine-builders', 'Engine Builders',
  'Games where you build up systems that generate resources, actions, or points over time. The satisfaction of watching your engine come together is what makes these games so rewarding.',
  'Build systems that generate resources and points',
  4, false, true,
  'Best Engine Building Board Games',
  'Explore the best engine building board games where you create powerful combos and systems.'
),
(
  'heavy-strategy', 'Heavy Strategy',
  'Complex games for experienced players who want deep strategic decisions. These games reward planning, adaptation, and mastery over multiple plays.',
  'Complex games for experienced players',
  5, false, true,
  'Heavy Strategy Board Games',
  'Find complex strategy board games for experienced players seeking deep gameplay.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description;

-- Link collections to games
INSERT INTO collection_games (collection_id, game_id, display_order)
-- Gateway Games
SELECT c.id, g.id, 1 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'catan'
UNION ALL
SELECT c.id, g.id, 2 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'ticket-to-ride'
UNION ALL
SELECT c.id, g.id, 3 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'azul'
UNION ALL
SELECT c.id, g.id, 4 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'codenames'
-- Quick Games
UNION ALL
SELECT c.id, g.id, 1 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'azul'
UNION ALL
SELECT c.id, g.id, 2 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'codenames'
-- Best at 2 Players
UNION ALL
SELECT c.id, g.id, 1 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'azul'
UNION ALL
SELECT c.id, g.id, 2 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'ticket-to-ride'
-- Engine Builders
UNION ALL
SELECT c.id, g.id, 1 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'wingspan'
UNION ALL
SELECT c.id, g.id, 2 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'terraforming-mars'
-- Heavy Strategy
UNION ALL
SELECT c.id, g.id, 1 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'terraforming-mars'
ON CONFLICT (collection_id, game_id) DO UPDATE SET display_order = EXCLUDED.display_order;
