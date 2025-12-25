-- =====================================================
-- GOOD GAME - BGG Top 20 Games (missing from database)
-- Migration: 00025_bgg_top20_games.sql
-- Date: 2025-12-24
-- =====================================================

-- Insert 19 games from BGG Top 20 (Terraforming Mars already exists)
INSERT INTO games (
  slug, name, tagline, description,
  player_count_min, player_count_max, player_count_best,
  play_time_min, play_time_max, min_age, weight,
  year_published, designers, publisher,
  bgg_id,
  has_rules, has_score_sheet, has_setup_guide, has_reference,
  box_image_url, thumbnail_url,
  is_published, is_featured
) VALUES

-- #1 Brass: Birmingham
(
  'brass-birmingham', 'Brass: Birmingham', 'Build networks and grow industries during the Industrial Revolution',
  'Brass: Birmingham is an economic strategy game spanning the canal and rail eras of the Industrial Revolution. Players develop industries and build networks to score victory points through network expansion and market manipulation.',
  2, 4, ARRAY[3, 4],
  60, 120, 14, 3.9,
  2018, ARRAY['Gavan Brown', 'Matt Tolman', 'Martin Wallace'], 'Roxley',
  224517,
  false, false, false, false,
  'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__imagepage/img/OF0MsxDYfnIe8Q1Xuc0Wt0O_8D4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3490053.jpg',
  'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__thumb/img/giNUMut4HAl-zWyQkGG0YchmuLI=/fit-in/200x150/filters:strip_icc()/pic3490053.jpg',
  true, true
),

-- #2 Pandemic Legacy: Season 1
(
  'pandemic-legacy-season-1', 'Pandemic Legacy: Season 1', 'A campaign game where diseases mutate and the world changes forever',
  'Pandemic Legacy: Season 1 is a cooperative campaign game where players work as disease-fighting specialists across 12-24 sessions. The game introduces new rules and components as you play, creating a unique narrative experience.',
  2, 4, ARRAY[4],
  60, 60, 13, 2.8,
  2015, ARRAY['Rob Daviau', 'Matt Leacock'], 'Z-Man Games',
  161936,
  false, false, false, false,
  'https://cf.geekdo-images.com/-Qer2BBPG7qGGDu6KcVDIw__imagepage/img/lxBV5bL5lA79yIHmE2lYZBzGpRs=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2452831.png',
  'https://cf.geekdo-images.com/-Qer2BBPG7qGGDu6KcVDIw__thumb/img/Wxe36yaTzpiIVhEefHOYzFv7Ucc=/fit-in/200x150/filters:strip_icc()/pic2452831.png',
  true, true
),

-- #3 Ark Nova
(
  'ark-nova', 'Ark Nova', 'Plan and build a modern zoo to support conservation projects',
  'Ark Nova is a strategic card-driven game where players design zoos using five action cards. Accommodate animals and support worldwide conservation efforts with 255 cards featuring animals, specialists, enclosures, and projects.',
  1, 4, ARRAY[2],
  90, 150, 14, 3.8,
  2021, ARRAY['Mathias Wigge'], 'Feuerland Spiele',
  342942,
  false, false, false, false,
  'https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__imagepage/img/KBV9u1Qxf5AzWt6xGOmQC4R7mIo=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6293412.jpg',
  'https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__thumb/img/IRqrT7kOqPQilogauyQkOnLx-HU=/fit-in/200x150/filters:strip_icc()/pic6293412.jpg',
  true, true
),

-- #4 Gloomhaven
(
  'gloomhaven', 'Gloomhaven', 'A tactical combat game in a persistent fantasy world',
  'Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives. Players take on the role of wandering adventurers with unique skills and reasons for traveling to this dark corner of the world.',
  1, 4, ARRAY[3],
  60, 120, 14, 3.9,
  2017, ARRAY['Isaac Childres'], 'Cephalofair Games',
  174430,
  false, false, false, false,
  'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__imagepage/img/LZ7KIpYMPc8xY1Zq4Dn9Q4Y2_6E=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2437871.jpg',
  'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/0IdBRA_G-ZdrNaxI4Z1LPQMZD0I=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg',
  true, true
),

-- #5 Dune: Imperium
(
  'dune-imperium', 'Dune: Imperium', 'Influence, intrigue, and combat in the universe of Dune',
  'Dune: Imperium combines deck-building with worker placement in the universe of Dune. Lead your Great House by managing agents and cards to gain political favor and military strength.',
  1, 4, ARRAY[3, 4],
  60, 120, 14, 3.1,
  2020, ARRAY['Paul Dennen'], 'Dire Wolf',
  316554,
  false, false, false, false,
  'https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__imagepage/img/mxPNkKQy1AHa6JB-rQ4_dWrBaeE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5666597.jpg',
  'https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__thumb/img/3_xJ0tO5L62bUp2oRfjeVS0DHX0=/fit-in/200x150/filters:strip_icc()/pic5666597.jpg',
  true, true
),

-- #6 Twilight Imperium: Fourth Edition
(
  'twilight-imperium-4', 'Twilight Imperium: Fourth Edition', 'Compete for galactic domination through military might and political maneuvering',
  'Twilight Imperium is an epic game of galactic conquest where players take on roles of seventeen factions vying for galactic domination through military might, political maneuvering, and economic bargaining.',
  3, 6, ARRAY[6],
  240, 480, 14, 4.3,
  2017, ARRAY['Dane Beltrami', 'Corey Konieczka', 'Christian T. Petersen'], 'Fantasy Flight Games',
  233078,
  false, false, false, false,
  'https://cf.geekdo-images.com/op8VpR53P56JJkz8XY0tMw__imagepage/img/Xq9NG-yVkiCl4FZ2tD1F4FdKRko=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3727516.jpg',
  'https://cf.geekdo-images.com/op8VpR53P56JJkz8XY0tMw__thumb/img/d2yTU6v4KKhxqDwW2TtWAMqE_e4=/fit-in/200x150/filters:strip_icc()/pic3727516.jpg',
  true, false
),

-- #7 Dune: Imperium – Uprising
(
  'dune-imperium-uprising', 'Dune: Imperium – Uprising', 'Deploy agents and engage in strategic battles for control of Arrakis',
  'Dune: Imperium – Uprising is a standalone expansion that expands the blend of deck-building and worker placement. Features a new six-player team mode, spies, contracts, and sandworm mechanics.',
  1, 6, ARRAY[4],
  60, 120, 13, 3.5,
  2023, ARRAY['Paul Dennen'], 'Dire Wolf',
  397598,
  false, false, false, false,
  'https://cf.geekdo-images.com/vFxyF3YntOqpQvFh0RQILw__imagepage/img/JGzTi8IMlMQz3A4tRxhDK4p8k_Q=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7311634.png',
  'https://cf.geekdo-images.com/vFxyF3YntOqpQvFh0RQILw__thumb/img/C4OXL1Y2sWcN7b0E68-sLH6VXjg=/fit-in/200x150/filters:strip_icc()/pic7311634.png',
  true, false
),

-- #8 War of the Ring: Second Edition
(
  'war-of-the-ring', 'War of the Ring: Second Edition', 'The Fellowship and Free Peoples clash with Sauron over Middle-earth',
  'War of the Ring is an epic board game based on The Lord of the Rings. One player controls the Free Peoples while another commands Shadow Armies. Victory can be achieved militarily or through the Ring quest.',
  2, 4, ARRAY[2],
  150, 240, 13, 4.2,
  2011, ARRAY['Roberto Di Meglio', 'Marco Maggi', 'Francesco Nepitello'], 'Ares Games',
  115746,
  false, false, false, false,
  'https://cf.geekdo-images.com/ImPgGag98W6gpV1KV812aA__imagepage/img/ZHAFxwwPAmpSqOjPb98GZV7ldEM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1215633.jpg',
  'https://cf.geekdo-images.com/ImPgGag98W6gpV1KV812aA__thumb/img/3TU0S4E-c8K4bxqPc6fCd2a3mkY=/fit-in/200x150/filters:strip_icc()/pic1215633.jpg',
  true, false
),

-- #10 Star Wars: Rebellion
(
  'star-wars-rebellion', 'Star Wars: Rebellion', 'Strike from your hidden base or find and destroy it as the Empire',
  'Star Wars: Rebellion is an asymmetric strategy game where players control either the Galactic Empire or Rebel Alliance. The Empire commands vast military forces seeking the Rebel base, while Rebels must inspire a galactic uprising.',
  2, 4, ARRAY[2],
  180, 240, 14, 3.8,
  2016, ARRAY['Corey Konieczka'], 'Fantasy Flight Games',
  187645,
  false, false, false, false,
  'https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__imagepage/img/LCX4sqJQsJjfYQNQ2vfxZ8hA4AU=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4325841.jpg',
  'https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__thumb/img/Nq94Q85X9MlE1p_ux_v7P2jL8cU=/fit-in/200x150/filters:strip_icc()/pic4325841.jpg',
  true, false
),

-- #11 Spirit Island
(
  'spirit-island', 'Spirit Island', 'Island spirits use elemental powers to defend against colonial invaders',
  'Spirit Island is a cooperative game where players embody island spirits using elemental powers to defend their home from colonial invaders. Features simultaneous power card selection and energy management.',
  1, 4, ARRAY[2],
  90, 120, 13, 4.1,
  2017, ARRAY['R. Eric Reuss'], 'Greater Than Games',
  162886,
  false, false, false, false,
  'https://cf.geekdo-images.com/kjCm4ZvPjIZxS-mYgSPy1g__imagepage/img/QlPcO_1xGWXvPH3RGZqs0vGNMUM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7013651.jpg',
  'https://cf.geekdo-images.com/kjCm4ZvPjIZxS-mYgSPy1g__thumb/img/ExoST-d1omXW-MlsU06CUbgmVr4=/fit-in/200x150/filters:strip_icc()/pic7013651.jpg',
  true, true
),

-- #12 Gloomhaven: Jaws of the Lion
(
  'gloomhaven-jaws-of-the-lion', 'Gloomhaven: Jaws of the Lion', 'A standalone prequel with streamlined rules for new players',
  'Gloomhaven: Jaws of the Lion is a standalone prequel featuring four new characters. The 25-scenario campaign includes tutorial scenarios and simplified gameplay, designed for accessibility while maintaining tactical depth.',
  1, 4, ARRAY[2],
  30, 120, 14, 3.6,
  2020, ARRAY['Isaac Childres'], 'Cephalofair Games',
  291457,
  false, false, false, false,
  'https://cf.geekdo-images.com/l4-hVdEYvNZ7hRLIPSZV2g__imagepage/img/qTjfkdMjO6u7GWRR6OLHa_AHKBI=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5055631.jpg',
  'https://cf.geekdo-images.com/l4-hVdEYvNZ7hRLIPSZV2g__thumb/img/xdnZqNSPe0p8CQzVlrXB0pz8QzQ=/fit-in/200x150/filters:strip_icc()/pic5055631.jpg',
  true, true
),

-- #13 Gaia Project
(
  'gaia-project', 'Gaia Project', 'Expand, research, and settle the galaxy with one of 14 alien species',
  'Gaia Project is a space colonization game where players develop factions across seven planetary types. Improve skills in terraforming, navigation, AI, and research while competing on a modular board.',
  1, 4, ARRAY[3, 4],
  60, 150, 12, 4.4,
  2017, ARRAY['Jens Drögemüller', 'Helge Ostertag'], 'Feuerland Spiele',
  220308,
  false, false, false, false,
  'https://cf.geekdo-images.com/hGWFm3hbMlCDsfCsauOQ4g__imagepage/img/r6E8VTD4qOXp8P3i4YcOWLIeaHg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5375625.png',
  'https://cf.geekdo-images.com/hGWFm3hbMlCDsfCsauOQ4g__thumb/img/9wC3L4_LqG6Gi2bEMd1eiKt-f0I=/fit-in/200x150/filters:strip_icc()/pic5375625.png',
  true, false
),

-- #14 Twilight Struggle
(
  'twilight-struggle', 'Twilight Struggle', 'A two-player simulation of the Cold War global conflict',
  'Twilight Struggle is a two-player game simulating the forty-five year dance of intrigue between the Soviet Union and the United States. Players compete for influence using cards depicting historical events.',
  2, 2, ARRAY[2],
  120, 180, 13, 3.6,
  2005, ARRAY['Ananda Gupta', 'Jason Matthews'], 'GMT Games',
  12333,
  false, false, false, false,
  'https://cf.geekdo-images.com/pNCiUUphnoeWOYfsWq0kng__imagepage/img/LUVW5yA_NdVmNeqJYLnvxKq1n3M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3530661.jpg',
  'https://cf.geekdo-images.com/pNCiUUphnoeWOYfsWq0kng__thumb/img/xv2PoTe10blzW1qghxnFUtjqZEA=/fit-in/200x150/filters:strip_icc()/pic3530661.jpg',
  true, false
),

-- #15 The Castles of Burgundy
(
  'castles-of-burgundy', 'The Castles of Burgundy', 'Plan, trade, and build your Burgundian estate to prosperity',
  'The Castles of Burgundy is a strategic dice-placement game where players develop princedoms in medieval France through settlement placement, trade, and resource management across five game phases.',
  2, 4, ARRAY[2],
  30, 90, 12, 3.0,
  2011, ARRAY['Stefan Feld'], 'Ravensburger',
  84876,
  false, false, false, false,
  'https://cf.geekdo-images.com/5CFwjd8zTcGYVUnkXh04hw__imagepage/img/EGF8wMuQRTbqNWe3BSIZkqt_k_M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6601622.jpg',
  'https://cf.geekdo-images.com/5CFwjd8zTcGYVUnkXh04hw__thumb/img/m5cZQcKcEdiF1r6E6e1Lvtzx5BY=/fit-in/200x150/filters:strip_icc()/pic6601622.jpg',
  true, true
),

-- #16 Through the Ages: A New Story of Civilization
(
  'through-the-ages', 'Through the Ages: A New Story of Civilization', 'Forge your own path through history and build a civilization',
  'Through the Ages is a civilization building game where players manage resources, discover technologies, build wonders, and maintain military strength across three historical ages from antiquity to modern era.',
  2, 4, ARRAY[3],
  120, 120, 14, 4.4,
  2015, ARRAY['Vlaada Chvátil'], 'Czech Games Edition',
  182028,
  false, false, false, false,
  'https://cf.geekdo-images.com/fVwPntkJKgaEo0rIC0RwpA__imagepage/img/2G5HHJxJzEVNE-8k26OqHZP4bnA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2663291.jpg',
  'https://cf.geekdo-images.com/fVwPntkJKgaEo0rIC0RwpA__thumb/img/CMagJHjDJMhQCdQc4pFIGKH3pMI=/fit-in/200x150/filters:strip_icc()/pic2663291.jpg',
  true, false
),

-- #17 Great Western Trail
(
  'great-western-trail', 'Great Western Trail', 'Herd cattle from Texas to Kansas City in the American frontier',
  'Great Western Trail is a strategic game where players act as ranchers repeatedly herding cattle from Texas to Kansas City. Manage your herd, build buildings along the trail, and hire cowboys and engineers.',
  2, 4, ARRAY[3],
  75, 150, 12, 3.7,
  2016, ARRAY['Alexander Pfister'], 'eggertspiele',
  193738,
  false, false, false, false,
  'https://cf.geekdo-images.com/u1l0gH7sb_vnvDvoO_QHqA__imagepage/img/CvMbx5lP4MVMD-XgJohZfz7nj-4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5765558.jpg',
  'https://cf.geekdo-images.com/u1l0gH7sb_vnvDvoO_QHqA__thumb/img/VYz8N4dCXSC5aWBxnp4oL8FQ6A8=/fit-in/200x150/filters:strip_icc()/pic5765558.jpg',
  true, false
),

-- #18 Frosthaven
(
  'frosthaven', 'Frosthaven', 'Adventure in the frozen north and build up your outpost',
  'Frosthaven is a standalone campaign with 100 scenarios, 16 new characters, and player-driven village expansion. Features tactical combat and crafting systems in an epic frozen wilderness setting.',
  1, 4, ARRAY[3],
  90, 180, 14, 4.4,
  2022, ARRAY['Isaac Childres'], 'Cephalofair Games',
  295770,
  false, false, false, false,
  'https://cf.geekdo-images.com/iEBr5o8AbJi9V9cgQcYROQ__imagepage/img/Z1RwuanPxYT-IfkPBb6hCGt8rD4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6177719.jpg',
  'https://cf.geekdo-images.com/iEBr5o8AbJi9V9cgQcYROQ__thumb/img/iRoPMKQNHUkuqhCjpGNP_QBJE6I=/fit-in/200x150/filters:strip_icc()/pic6177719.jpg',
  true, false
),

-- #19 Eclipse: Second Dawn for the Galaxy
(
  'eclipse-second-dawn', 'Eclipse: Second Dawn for the Galaxy', 'Build an interstellar civilization through exploration and conquest',
  'Eclipse: Second Dawn is a 4X space game where players build interstellar civilizations through exploration, research, conquest, and diplomacy. This revised edition features updated graphics and refined gameplay.',
  2, 6, ARRAY[4, 6],
  60, 200, 14, 3.7,
  2020, ARRAY['Touko Tahkokallio'], 'Lautapelit.fi',
  246900,
  false, false, false, false,
  'https://cf.geekdo-images.com/Oh3kHw6lweg6ru71Q16h2Q__imagepage/img/zb2G44r8fg0aCXQqRyCNBCZaPe4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5235277.jpg',
  'https://cf.geekdo-images.com/Oh3kHw6lweg6ru71Q16h2Q__thumb/img/6PYhLWVD3n3q0C0EEaEtDLLfpN4=/fit-in/200x150/filters:strip_icc()/pic5235277.jpg',
  true, false
),

-- #20 Brass: Lancashire
(
  'brass-lancashire', 'Brass: Lancashire', 'Build industries and networks in Industrial Revolution England',
  'Brass: Lancashire is an economic strategy game set during the Industrial Revolution. Players develop industries and build networks across Lancashire in canal and rail phases, managing resources and scoring victory points.',
  2, 4, ARRAY[4],
  60, 120, 14, 3.9,
  2007, ARRAY['Martin Wallace'], 'Roxley',
  28720,
  false, false, false, false,
  'https://cf.geekdo-images.com/tHVtPzu82mBpeQbbZkV6EA__imagepage/img/e-z8TcMCXe2MNxFpHUsyxkrBfqg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3469216.jpg',
  'https://cf.geekdo-images.com/tHVtPzu82mBpeQbbZkV6EA__thumb/img/E2TRY2hxqjWvTPr0vmcm2cYfVSM=/fit-in/200x150/filters:strip_icc()/pic3469216.jpg',
  true, false
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
  box_image_url = EXCLUDED.box_image_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured;

-- =====================================================
-- LINK GAMES TO CATEGORIES
-- =====================================================

INSERT INTO game_categories (game_id, category_id, is_primary)

-- Brass: Birmingham - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'brass-birmingham' AND c.slug = 'strategy'
UNION ALL

-- Pandemic Legacy - Cooperative (primary), Strategy
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'pandemic-legacy-season-1' AND c.slug = 'cooperative'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'pandemic-legacy-season-1' AND c.slug = 'strategy'
UNION ALL

-- Ark Nova - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'ark-nova' AND c.slug = 'strategy'
UNION ALL

-- Gloomhaven - Strategy (primary), Cooperative
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'gloomhaven' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'gloomhaven' AND c.slug = 'cooperative'
UNION ALL

-- Dune: Imperium - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'dune-imperium' AND c.slug = 'strategy'
UNION ALL

-- Twilight Imperium - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'twilight-imperium-4' AND c.slug = 'strategy'
UNION ALL

-- Dune: Imperium Uprising - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'dune-imperium-uprising' AND c.slug = 'strategy'
UNION ALL

-- War of the Ring - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'war-of-the-ring' AND c.slug = 'strategy'
UNION ALL

-- Star Wars: Rebellion - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'star-wars-rebellion' AND c.slug = 'strategy'
UNION ALL

-- Spirit Island - Cooperative (primary), Strategy
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'spirit-island' AND c.slug = 'cooperative'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'spirit-island' AND c.slug = 'strategy'
UNION ALL

-- Gloomhaven: Jaws of the Lion - Strategy (primary), Cooperative
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'gloomhaven-jaws-of-the-lion' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'gloomhaven-jaws-of-the-lion' AND c.slug = 'cooperative'
UNION ALL

-- Gaia Project - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'gaia-project' AND c.slug = 'strategy'
UNION ALL

-- Twilight Struggle - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'twilight-struggle' AND c.slug = 'strategy'
UNION ALL

-- Castles of Burgundy - Strategy (primary), Family
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'castles-of-burgundy' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'castles-of-burgundy' AND c.slug = 'family'
UNION ALL

-- Through the Ages - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'through-the-ages' AND c.slug = 'strategy'
UNION ALL

-- Great Western Trail - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'great-western-trail' AND c.slug = 'strategy'
UNION ALL

-- Frosthaven - Strategy (primary), Cooperative
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'frosthaven' AND c.slug = 'strategy'
UNION ALL
SELECT g.id, c.id, false FROM games g, categories c WHERE g.slug = 'frosthaven' AND c.slug = 'cooperative'
UNION ALL

-- Eclipse - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'eclipse-second-dawn' AND c.slug = 'strategy'
UNION ALL

-- Brass: Lancashire - Strategy (primary)
SELECT g.id, c.id, true FROM games g, categories c WHERE g.slug = 'brass-lancashire' AND c.slug = 'strategy'

ON CONFLICT (game_id, category_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

-- =====================================================
-- ADD GAMES TO COLLECTIONS
-- =====================================================

INSERT INTO collection_games (collection_id, game_id, display_order)

-- Heavy Strategy collection - add top heavy games
SELECT c.id, g.id, 2 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'brass-birmingham'
UNION ALL
SELECT c.id, g.id, 3 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'gloomhaven'
UNION ALL
SELECT c.id, g.id, 4 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'twilight-imperium-4'
UNION ALL
SELECT c.id, g.id, 5 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'spirit-island'
UNION ALL
SELECT c.id, g.id, 6 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'gaia-project'
UNION ALL
SELECT c.id, g.id, 7 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'through-the-ages'
UNION ALL
SELECT c.id, g.id, 8 FROM collections c, games g WHERE c.slug = 'heavy-strategy' AND g.slug = 'frosthaven'
UNION ALL

-- Best at 2 Players
SELECT c.id, g.id, 5 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'twilight-struggle'
UNION ALL
SELECT c.id, g.id, 6 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'war-of-the-ring'
UNION ALL
SELECT c.id, g.id, 7 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'star-wars-rebellion'
UNION ALL
SELECT c.id, g.id, 8 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'ark-nova'
UNION ALL
SELECT c.id, g.id, 9 FROM collections c, games g WHERE c.slug = 'best-at-2-players' AND g.slug = 'castles-of-burgundy'
UNION ALL

-- Engine Builders
SELECT c.id, g.id, 5 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'ark-nova'
UNION ALL
SELECT c.id, g.id, 6 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'gaia-project'
UNION ALL
SELECT c.id, g.id, 7 FROM collections c, games g WHERE c.slug = 'engine-builders' AND g.slug = 'great-western-trail'

ON CONFLICT (collection_id, game_id) DO UPDATE SET display_order = EXCLUDED.display_order;

-- =====================================================
-- INSERT GAME IMAGES
-- =====================================================

-- Delete existing images for these games first
DELETE FROM game_images WHERE game_id IN (
  SELECT id FROM games WHERE slug IN (
    'brass-birmingham', 'pandemic-legacy-season-1', 'ark-nova', 'gloomhaven',
    'dune-imperium', 'twilight-imperium-4', 'dune-imperium-uprising', 'war-of-the-ring',
    'star-wars-rebellion', 'spirit-island', 'gloomhaven-jaws-of-the-lion', 'gaia-project',
    'twilight-struggle', 'castles-of-burgundy', 'through-the-ages', 'great-western-trail',
    'frosthaven', 'eclipse-second-dawn', 'brass-lancashire'
  )
);

INSERT INTO game_images (game_id, url, alt_text, caption, image_type, display_order, width, height, is_primary)
SELECT g.id,
  'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__imagepage/img/OF0MsxDYfnIe8Q1Xuc0Wt0O_8D4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3490053.jpg',
  'Brass: Birmingham box cover', 'Industrial Revolution economic strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'brass-birmingham'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/-Qer2BBPG7qGGDu6KcVDIw__imagepage/img/lxBV5bL5lA79yIHmE2lYZBzGpRs=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2452831.png',
  'Pandemic Legacy: Season 1 box cover', 'Cooperative campaign game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'pandemic-legacy-season-1'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__imagepage/img/KBV9u1Qxf5AzWt6xGOmQC4R7mIo=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6293412.jpg',
  'Ark Nova box cover', 'Zoo building conservation game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'ark-nova'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__imagepage/img/LZ7KIpYMPc8xY1Zq4Dn9Q4Y2_6E=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2437871.jpg',
  'Gloomhaven box cover', 'Tactical dungeon crawl adventure', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'gloomhaven'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__imagepage/img/mxPNkKQy1AHa6JB-rQ4_dWrBaeE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5666597.jpg',
  'Dune: Imperium box cover', 'Deck-building worker placement', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'dune-imperium'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/op8VpR53P56JJkz8XY0tMw__imagepage/img/Xq9NG-yVkiCl4FZ2tD1F4FdKRko=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3727516.jpg',
  'Twilight Imperium box cover', 'Epic space opera strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'twilight-imperium-4'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/vFxyF3YntOqpQvFh0RQILw__imagepage/img/JGzTi8IMlMQz3A4tRxhDK4p8k_Q=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7311634.png',
  'Dune: Imperium Uprising box cover', 'Standalone Dune expansion', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'dune-imperium-uprising'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/ImPgGag98W6gpV1KV812aA__imagepage/img/ZHAFxwwPAmpSqOjPb98GZV7ldEM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1215633.jpg',
  'War of the Ring box cover', 'Lord of the Rings epic war game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'war-of-the-ring'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__imagepage/img/LCX4sqJQsJjfYQNQ2vfxZ8hA4AU=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4325841.jpg',
  'Star Wars: Rebellion box cover', 'Asymmetric galactic conflict', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'star-wars-rebellion'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/kjCm4ZvPjIZxS-mYgSPy1g__imagepage/img/QlPcO_1xGWXvPH3RGZqs0vGNMUM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7013651.jpg',
  'Spirit Island box cover', 'Cooperative spirit defense game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'spirit-island'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/l4-hVdEYvNZ7hRLIPSZV2g__imagepage/img/qTjfkdMjO6u7GWRR6OLHa_AHKBI=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5055631.jpg',
  'Gloomhaven: Jaws of the Lion box cover', 'Accessible dungeon crawl', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'gloomhaven-jaws-of-the-lion'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/hGWFm3hbMlCDsfCsauOQ4g__imagepage/img/r6E8VTD4qOXp8P3i4YcOWLIeaHg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5375625.png',
  'Gaia Project box cover', 'Space colonization strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'gaia-project'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/pNCiUUphnoeWOYfsWq0kng__imagepage/img/LUVW5yA_NdVmNeqJYLnvxKq1n3M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3530661.jpg',
  'Twilight Struggle box cover', 'Cold War card-driven strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'twilight-struggle'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/5CFwjd8zTcGYVUnkXh04hw__imagepage/img/EGF8wMuQRTbqNWe3BSIZkqt_k_M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6601622.jpg',
  'The Castles of Burgundy box cover', 'Medieval tile-laying strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'castles-of-burgundy'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/fVwPntkJKgaEo0rIC0RwpA__imagepage/img/2G5HHJxJzEVNE-8k26OqHZP4bnA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2663291.jpg',
  'Through the Ages box cover', 'Civilization building card game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'through-the-ages'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/u1l0gH7sb_vnvDvoO_QHqA__imagepage/img/CvMbx5lP4MVMD-XgJohZfz7nj-4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5765558.jpg',
  'Great Western Trail box cover', 'Cattle herding strategy', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'great-western-trail'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/iEBr5o8AbJi9V9cgQcYROQ__imagepage/img/Z1RwuanPxYT-IfkPBb6hCGt8rD4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6177719.jpg',
  'Frosthaven box cover', 'Epic frozen wilderness campaign', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'frosthaven'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/Oh3kHw6lweg6ru71Q16h2Q__imagepage/img/zb2G44r8fg0aCXQqRyCNBCZaPe4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5235277.jpg',
  'Eclipse: Second Dawn box cover', '4X space exploration', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'eclipse-second-dawn'
UNION ALL
SELECT g.id,
  'https://cf.geekdo-images.com/tHVtPzu82mBpeQbbZkV6EA__imagepage/img/e-z8TcMCXe2MNxFpHUsyxkrBfqg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3469216.jpg',
  'Brass: Lancashire box cover', 'Original Industrial Revolution game', 'cover', 0, 900, 600, true
FROM games g WHERE g.slug = 'brass-lancashire';
