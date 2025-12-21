-- =====================================================
-- GOOD GAME - Tier 1 Gateway Games (Dominion, King of Tokyo, Sushi Go, Love Letter, The Crew, Cascadia)
-- =====================================================

-- Insert 6 more gateway games (upsert to handle re-runs)
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
-- Dominion
(
  'dominion', 'Dominion', 'Build your deck, expand your kingdom, claim victory',
  'Dominion is the original deck-building game. Players start with identical small decks and acquire new cards to build a more powerful deck, racing to accumulate the most victory points.',
  2, 4, ARRAY[3],
  30, 45, 13, 2.4,
  2008, ARRAY['Donald X. Vaccarino'], 'Rio Grande Games',
  36218, 'B001JQY6K4',
  true, true, true, true,
  'https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__imagepage/img/lx2aBzjhmPThGYCcbceqsKRAG3A=/fit-in/900x600/filters:no_upscale():strip_icc()/pic394356.jpg',
  'https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__thumb/img/Ij0p3JHZlXLR4qhYDfM0VZvpJBU=/fit-in/200x150/filters:strip_icc()/pic394356.jpg',
  true, true
),
-- King of Tokyo
(
  'king-of-tokyo', 'King of Tokyo', 'Become the ultimate monster and rule Tokyo',
  'King of Tokyo is a dice-rolling battle royale where giant monsters fight for control of Tokyo. Roll dice to attack, heal, gain energy, and earn victory points.',
  2, 6, ARRAY[4],
  30, 30, 8, 1.5,
  2011, ARRAY['Richard Garfield'], 'IELLO',
  70323, 'B004U5R5BI',
  true, true, true, true,
  'https://cf.geekdo-images.com/hRzGLnY_LpQrNBhA8Lx3ag__imagepage/img/ThB8T5lK2lnM8QbCMvJLz1bySEM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3043734.jpg',
  'https://cf.geekdo-images.com/hRzGLnY_LpQrNBhA8Lx3ag__thumb/img/Kc_LR9TTgDC37Y_Ka3ziNPRzT60=/fit-in/200x150/filters:strip_icc()/pic3043734.jpg',
  true, false
),
-- Sushi Go
(
  'sushi-go', 'Sushi Go!', 'Draft the tastiest sushi for the highest score',
  'Sushi Go! is a fast-playing card drafting game where players pick and pass hands of sushi cards, trying to collect the best combinations for maximum points.',
  2, 5, ARRAY[4],
  15, 15, 8, 1.2,
  2013, ARRAY['Phil Walker-Harding'], 'Gamewright',
  133473, 'B00J57VU44',
  true, true, true, true,
  'https://cf.geekdo-images.com/Fn3PSMYNtnYvlMySz0UN3Q__imagepage/img/d5oZYAu-1tqB1p8-T3dxu7HVJ0A=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1900075.jpg',
  'https://cf.geekdo-images.com/Fn3PSMYNtnYvlMySz0UN3Q__thumb/img/NnWIgyhFr4gVcHJVmNI5LneU7UM=/fit-in/200x150/filters:strip_icc()/pic1900075.jpg',
  true, false
),
-- Love Letter
(
  'love-letter', 'Love Letter', 'Deliver your letter to the princess through cunning and deduction',
  'Love Letter is a micro card game of risk, deduction, and luck. Players draw and play cards to eliminate rivals and be the last one standing—or hold the highest card when the deck runs out.',
  2, 6, ARRAY[4],
  20, 20, 10, 1.2,
  2012, ARRAY['Seiji Kanai'], 'Z-Man Games',
  129622, 'B00J57VU44',
  true, false, true, true,
  'https://cf.geekdo-images.com/T1ltXwapFUtghS9A7_tf4g__imagepage/img/Z6geB2XI5fj4V8JRkXqRaWsQDw4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1401448.jpg',
  'https://cf.geekdo-images.com/T1ltXwapFUtghS9A7_tf4g__thumb/img/H5d_CX4LbPjeGX4zfMnveCnLGlo=/fit-in/200x150/filters:strip_icc()/pic1401448.jpg',
  true, false
),
-- The Crew
(
  'the-crew', 'The Crew: Quest for Planet Nine', 'A cooperative trick-taking adventure through space',
  'The Crew is a cooperative trick-taking game where players work together to complete missions by winning specific cards. Communication is limited—you can only share one clue per round.',
  2, 5, ARRAY[4],
  20, 20, 10, 2.0,
  2019, ARRAY['Thomas Sing'], 'KOSMOS',
  284083, 'B084GNG34Z',
  true, false, true, true,
  'https://cf.geekdo-images.com/98LnQShydr11OBKS46xY-Q__imagepage/img/b71DgNfpHCnxihNgw_J_yX4UNtg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5687013.jpg',
  'https://cf.geekdo-images.com/98LnQShydr11OBKS46xY-Q__thumb/img/xZsDQ9PoSCGTVCQNPMam_SDqD-I=/fit-in/200x150/filters:strip_icc()/pic5687013.jpg',
  true, false
),
-- Cascadia
(
  'cascadia', 'Cascadia', 'Create the most harmonious Pacific Northwest ecosystem',
  'Cascadia is a puzzly tile-laying and token-drafting game where players build ecosystems featuring wildlife of the Pacific Northwest. Match habitats and score points for wildlife patterns.',
  1, 4, ARRAY[3],
  30, 45, 10, 1.9,
  2021, ARRAY['Randy Flynn'], 'Flatout Games',
  295947, 'B09BK5KMHB',
  true, true, true, true,
  'https://cf.geekdo-images.com/MjeijZfelDnQ8-KmvApS5Q__imagepage/img/0HBi9qP_Z2lv1_JMKvmPbkSozx4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5100691.jpg',
  'https://cf.geekdo-images.com/MjeijZfelDnQ8-KmvApS5Q__thumb/img/J0S8_YKXlbK5j48_H51D9M23KsY=/fit-in/200x150/filters:strip_icc()/pic5100691.jpg',
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
-- Dominion: Strategy (primary), Family
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'dominion' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'dominion' AND c.slug = 'family'
-- King of Tokyo: Family (primary), Party
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'king-of-tokyo' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'king-of-tokyo' AND c.slug = 'party'
-- Sushi Go: Family (primary), Party
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'sushi-go' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'sushi-go' AND c.slug = 'party'
-- Love Letter: Family (primary), Party
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'love-letter' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'love-letter' AND c.slug = 'party'
-- The Crew: Cooperative (primary), Strategy
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'the-crew' AND c.slug = 'cooperative'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'the-crew' AND c.slug = 'strategy'
-- Cascadia: Family (primary), Strategy
UNION ALL
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'cascadia' AND c.slug = 'family'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'cascadia' AND c.slug = 'strategy'
ON CONFLICT (game_id, category_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

-- Delete existing images for these games then re-insert
DELETE FROM game_images WHERE game_id IN (SELECT id FROM games WHERE slug IN ('dominion', 'king-of-tokyo', 'sushi-go', 'love-letter', 'the-crew', 'cascadia'));

-- Insert game images
INSERT INTO game_images (game_id, url, alt_text, caption, image_type, display_order, width, height, is_primary)
-- Dominion images
SELECT g.id,
  'https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__imagepage/img/lx2aBzjhmPThGYCcbceqsKRAG3A=/fit-in/900x600/filters:no_upscale():strip_icc()/pic394356.jpg',
  'Dominion box cover', 'The original deck-building game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'dominion'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/VFWixHKg4JRL3yYt02DTGA__imagepage/img/h0rH3OV1IQV80aN8rYa7pVgB1gY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic652953.jpg',
  'Dominion gameplay', 'Cards spread on table during gameplay', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'dominion'
-- King of Tokyo images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/hRzGLnY_LpQrNBhA8Lx3ag__imagepage/img/ThB8T5lK2lnM8QbCMvJLz1bySEM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3043734.jpg',
  'King of Tokyo box cover', 'Monster battle royale game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'king-of-tokyo'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/cGgNQ8s3n6v4Q0BOkY6CPA__imagepage/img/Fd_1kgIDQBYdm_z9TfVTv9N4a8c=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3876648.jpg',
  'King of Tokyo gameplay', 'Monsters fighting for Tokyo', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'king-of-tokyo'
-- Sushi Go images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/Fn3PSMYNtnYvlMySz0UN3Q__imagepage/img/d5oZYAu-1tqB1p8-T3dxu7HVJ0A=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1900075.jpg',
  'Sushi Go box cover', 'Adorable sushi drafting game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'sushi-go'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/9dEuGi0xlbxZ6jQxFJ4cfw__imagepage/img/g9Cjhj-2qIiMQ3mlc9VtWV6y0iU=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1900078.jpg',
  'Sushi Go cards', 'Cute sushi card illustrations', 'components', 1, 900, 600, false
FROM games g WHERE g.slug = 'sushi-go'
-- Love Letter images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/T1ltXwapFUtghS9A7_tf4g__imagepage/img/Z6geB2XI5fj4V8JRkXqRaWsQDw4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1401448.jpg',
  'Love Letter box cover', 'Micro card game of deduction', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'love-letter'
-- The Crew images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/98LnQShydr11OBKS46xY-Q__imagepage/img/b71DgNfpHCnxihNgw_J_yX4UNtg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5687013.jpg',
  'The Crew box cover', 'Cooperative space mission game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'the-crew'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/5MQ8dVd1nQZP5Fv77m0R8g__imagepage/img/E6O7yJXxJwzfcFY8jjL8OuTpfnU=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5055631.jpg',
  'The Crew cards', 'Mission and trick cards', 'components', 1, 900, 600, false
FROM games g WHERE g.slug = 'the-crew'
-- Cascadia images
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/MjeijZfelDnQ8-KmvApS5Q__imagepage/img/0HBi9qP_Z2lv1_JMKvmPbkSozx4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5100691.jpg',
  'Cascadia box cover', 'Pacific Northwest ecosystem builder', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'cascadia'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/0omTPdUhEfaOChX7BFfQUg__imagepage/img/XiUm9Vs1Y9y1hJhZtqLNhPT4ew0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6100032.jpg',
  'Cascadia gameplay', 'Tiles and wildlife tokens in play', 'gameplay', 1, 900, 600, false
FROM games g WHERE g.slug = 'cascadia';

-- Add to collections
INSERT INTO collection_games (collection_id, game_id, display_order)
-- Gateway Games: add all 6
SELECT c.id, g.id, 8 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'dominion'
UNION ALL
SELECT c.id, g.id, 9 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'king-of-tokyo'
UNION ALL
SELECT c.id, g.id, 10 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'sushi-go'
UNION ALL
SELECT c.id, g.id, 11 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'love-letter'
UNION ALL
SELECT c.id, g.id, 12 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'the-crew'
UNION ALL
SELECT c.id, g.id, 13 FROM collections c, games g WHERE c.slug = 'gateway-games' AND g.slug = 'cascadia'
-- Quick Games (under 30 min): Sushi Go, Love Letter, King of Tokyo
UNION ALL
SELECT c.id, g.id, 6 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'sushi-go'
UNION ALL
SELECT c.id, g.id, 7 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'love-letter'
UNION ALL
SELECT c.id, g.id, 8 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'king-of-tokyo'
UNION ALL
SELECT c.id, g.id, 9 FROM collections c, games g WHERE c.slug = 'under-30-minutes' AND g.slug = 'the-crew'
-- Engine Builders: Dominion
UNION ALL
SELECT c.id, g.id, 4 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'dominion'
ON CONFLICT (collection_id, game_id) DO UPDATE SET display_order = EXCLUDED.display_order;
