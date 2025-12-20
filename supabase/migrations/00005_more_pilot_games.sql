-- =====================================================
-- GOOD GAME - Additional Pilot Games (Splendor, Pandemic, Carcassonne, 7 Wonders)
-- =====================================================

-- Insert 4 more pilot games (upsert to handle re-runs)
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
-- Splendor
(
  'splendor', 'Splendor', 'Collect gems, build your engine, become a Renaissance merchant',
  'Splendor is a game of chip-collecting and card development. Players collect gems to purchase development cards, which provide permanent gem bonuses and victory points.',
  2, 4, ARRAY[3],
  30, 30, 10, 1.8,
  2014, ARRAY['Marc André'], 'Space Cowboys',
  148228, 'B00IZEUFIA',
  true, true, true, true,
  'https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__imagepage/img/LpVsS2neJuYSfOP3WlOAsyM2kfE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1904079.jpg',
  'https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__thumb/img/ly4mi6S_zfYGcMYUxyzPLSS8YUw=/fit-in/200x150/filters:strip_icc()/pic1904079.jpg',
  true, true
),
-- Pandemic
(
  'pandemic', 'Pandemic', 'Work together to save humanity from deadly diseases',
  'In Pandemic, players work as a team of specialists to treat infections around the world and find cures for four diseases before they overwhelm humanity.',
  2, 4, ARRAY[4],
  45, 60, 8, 2.4,
  2008, ARRAY['Matt Leacock'], 'Z-Man Games',
  30549, 'B00A2HD40E',
  true, false, true, true,
  'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu-2Ljb_ml5n-S8uIbE6ehGFc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg',
  'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__thumb/img/I-BiYn8Dz-0GcegEBe5UtVxPhrs=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg',
  true, true
),
-- Carcassonne
(
  'carcassonne', 'Carcassonne', 'Build the medieval French countryside tile by tile',
  'Carcassonne is a tile-placement game where players draw and place tiles with roads, cities, fields, and monasteries, then deploy their followers to score points.',
  2, 5, ARRAY[2],
  30, 45, 7, 1.9,
  2000, ARRAY['Klaus-Jürgen Wrede'], 'Hans im Glück',
  822, 'B00NX627HW',
  true, true, true, true,
  'https://cf.geekdo-images.com/Z3upN53-fsVPUDimN9SpOA__imagepage/img/MNsNl2LUNGHuRkwgE9vLSscrZlY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2337577.jpg',
  'https://cf.geekdo-images.com/Z3upN53-fsVPUDimN9SpOA__thumb/img/oO7tAnn0idL4f8egbBaxYBYCOgE=/fit-in/200x150/filters:strip_icc()/pic2337577.jpg',
  true, false
),
-- 7 Wonders
(
  '7-wonders', '7 Wonders', 'Draft cards to build an ancient civilization',
  '7 Wonders is a card drafting game where players develop their civilizations by drafting cards over three ages, building structures and wonders to earn victory points.',
  2, 7, ARRAY[4, 5],
  30, 30, 10, 2.3,
  2010, ARRAY['Antoine Bauza'], 'Repos Production',
  68448, 'B0043KJW5M',
  true, true, true, true,
  'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__imagepage/img/8DpJVR4GE8L8mpq5vxCD5K5b0sE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic860217.jpg',
  'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__thumb/img/SrcPnNAhHYV-0In9H4ixfew6plQ=/fit-in/200x150/filters:strip_icc()/pic860217.jpg',
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
-- Splendor: Strategy (primary), Family
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'splendor' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'splendor' AND c.slug = 'family'
-- Pandemic: Cooperative (primary), Strategy
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'pandemic' AND c.slug = 'cooperative'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'pandemic' AND c.slug = 'strategy'
-- Carcassonne: Family (primary), Strategy
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'carcassonne' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'carcassonne' AND c.slug = 'strategy'
-- 7 Wonders: Strategy (primary), Family
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = '7-wonders' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = '7-wonders' AND c.slug = 'family'
ON CONFLICT (game_id, category_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

-- Delete existing images for these games then re-insert
DELETE FROM game_images WHERE game_id IN (SELECT id FROM games WHERE slug IN ('splendor', 'pandemic', 'carcassonne', '7-wonders'));

-- Insert game images
INSERT INTO game_images (game_id, url, alt_text, caption, image_type, display_order, width, height, is_primary)
-- Splendor images
SELECT g.id,
  'https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__imagepage/img/LpVsS2neJuYSfOP3WlOAsyM2kfE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1904079.jpg',
  'Splendor box cover', 'Gem-collecting Renaissance merchant game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'splendor'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/w3-mL0oPSvjwKjepBAxHhQ__imagepage/img/T8LwjILc_8E4d7dfG1lxmVwOZME=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2012891.jpg',
  'Splendor gameplay', 'Gem tokens and development cards on the table', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'splendor'
-- Pandemic images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu-2Ljb_ml5n-S8uIbE6ehGFc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg',
  'Pandemic box cover', 'Cooperative disease-fighting game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'pandemic'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/k2_PoT9B3s2VeEZ1u96F1g__imagepage/img/8iP_ohlCAP3FJYPn7Xkfz9b3IY4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534149.jpg',
  'Pandemic game board', 'World map with disease cubes spreading', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'pandemic'
-- Carcassonne images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/Z3upN53-fsVPUDimN9SpOA__imagepage/img/MNsNl2LUNGHuRkwgE9vLSscrZlY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2337577.jpg',
  'Carcassonne box cover', 'Classic tile-laying game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'carcassonne'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/o4p6f88SGE899BTNMzTvGQ__imagepage/img/DYfFu4Pl2WlQVHY6IrGV-jWBq0k=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2337578.jpg',
  'Carcassonne gameplay', 'Tiles forming the French countryside', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'carcassonne'
-- 7 Wonders images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__imagepage/img/8DpJVR4GE8L8mpq5vxCD5K5b0sE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic860217.jpg',
  '7 Wonders box cover', 'Card drafting civilization game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = '7-wonders'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/i9pJ_aOEgitXSoLsgPwTvQ__imagepage/img/8Ys0hyXBfD7Y3O3JnJvnSUxqDzw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic860218.jpg',
  '7 Wonders cards', 'Age cards showing ancient structures', 'components', 1, 900, 600, false
FROM games g WHERE g.slug = '7-wonders';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order)
-- Gateway Games: add Splendor, Pandemic, Carcassonne
SELECT c.id, g.id, 5 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'splendor'
UNION ALL
SELECT c.id, g.id, 6 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'pandemic'
UNION ALL
SELECT c.id, g.id, 7 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'carcassonne'
-- Quick Games: add Splendor, Carcassonne, 7 Wonders
UNION ALL
SELECT c.id, g.id, 3 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'splendor'
UNION ALL
SELECT c.id, g.id, 4 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'carcassonne'
UNION ALL
SELECT c.id, g.id, 5 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = '7-wonders'
-- Best at 2: add Carcassonne, Splendor
UNION ALL
SELECT c.id, g.id, 3 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'carcassonne'
UNION ALL
SELECT c.id, g.id, 4 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'splendor'
-- Engine Builders: add Splendor
UNION ALL
SELECT c.id, g.id, 3 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'splendor'
ON CONFLICT (collection_id, game_id) DO UPDATE SET display_order = EXCLUDED.display_order;
