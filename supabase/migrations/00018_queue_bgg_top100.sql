-- Migration: 00018_queue_bgg_top100.sql
-- Description: Queue BGG Top 100 games for import (excluding games already in database)
-- Date: 2024-12-23

-- Insert Top 100 games into import queue
-- Using ON CONFLICT to skip duplicates (games already in queue or already imported)
INSERT INTO import_queue (bgg_id, name, source, source_detail, priority, bgg_rank)
VALUES
  -- Top 10 (Priority 1 - Highest)
  (224517, 'Brass: Birmingham', 'bgg_top100', 'Rank #1', 1, 1),
  (161936, 'Pandemic Legacy: Season 1', 'bgg_top100', 'Rank #2', 1, 2),
  (342942, 'Ark Nova', 'bgg_top100', 'Rank #3', 1, 3),
  (174430, 'Gloomhaven', 'bgg_top100', 'Rank #4', 1, 4),
  (316554, 'Dune: Imperium', 'bgg_top100', 'Rank #5', 1, 5),
  (233078, 'Twilight Imperium: Fourth Edition', 'bgg_top100', 'Rank #6', 1, 6),
  (397598, 'Dune: Imperium – Uprising', 'bgg_top100', 'Rank #7', 1, 7),
  (115746, 'War of the Ring: Second Edition', 'bgg_top100', 'Rank #8', 1, 8),
  -- 167791 Terraforming Mars (#9) - SKIP: already in database
  (187645, 'Star Wars: Rebellion', 'bgg_top100', 'Rank #10', 1, 10),

  -- 11-25 (Priority 1)
  (162886, 'Spirit Island', 'bgg_top100', 'Rank #11', 1, 11),
  (291457, 'Gloomhaven: Jaws of the Lion', 'bgg_top100', 'Rank #12', 1, 12),
  (220308, 'Gaia Project', 'bgg_top100', 'Rank #13', 1, 13),
  (12333, 'Twilight Struggle', 'bgg_top100', 'Rank #14', 1, 14),
  (84876, 'The Castles of Burgundy', 'bgg_top100', 'Rank #15', 1, 15),
  (182028, 'Through the Ages: A New Story of Civilization', 'bgg_top100', 'Rank #16', 1, 16),
  (193738, 'Great Western Trail', 'bgg_top100', 'Rank #17', 1, 17),
  (295770, 'Frosthaven', 'bgg_top100', 'Rank #18', 1, 18),
  (246900, 'Eclipse: Second Dawn for the Galaxy', 'bgg_top100', 'Rank #19', 1, 19),
  (28720, 'Brass: Lancashire', 'bgg_top100', 'Rank #20', 1, 20),
  (173346, '7 Wonders Duel', 'bgg_top100', 'Rank #21', 1, 21),
  (169786, 'Scythe', 'bgg_top100', 'Rank #22', 1, 22),
  (167355, 'Nemesis', 'bgg_top100', 'Rank #23', 1, 23),
  (418059, 'SETI: Search for Extraterrestrial Intelligence', 'bgg_top100', 'Rank #24', 1, 24),
  (177736, 'A Feast for Odin', 'bgg_top100', 'Rank #25', 1, 25),

  -- 26-50 (Priority 2)
  (266507, 'Clank! Legacy: Acquisitions Incorporated', 'bgg_top100', 'Rank #26', 2, 26),
  (338960, 'Slay the Spire: The Board Game', 'bgg_top100', 'Rank #27', 2, 27),
  (124361, 'Concordia', 'bgg_top100', 'Rank #28', 2, 28),
  (421006, 'The Lord of the Rings: Duel for Middle-earth', 'bgg_top100', 'Rank #29', 2, 29),
  (312484, 'Lost Ruins of Arnak', 'bgg_top100', 'Rank #30', 2, 30),
  (341169, 'Great Western Trail: Second Edition', 'bgg_top100', 'Rank #31', 2, 31),
  (205637, 'Arkham Horror: The Card Game', 'bgg_top100', 'Rank #32', 2, 32),
  (237182, 'Root', 'bgg_top100', 'Rank #33', 2, 33),
  (373106, 'Sky Team', 'bgg_top100', 'Rank #34', 2, 34),
  (120677, 'Terra Mystica', 'bgg_top100', 'Rank #35', 2, 35),
  (192135, 'Too Many Bones', 'bgg_top100', 'Rank #36', 2, 36),
  (164928, 'Orléans', 'bgg_top100', 'Rank #37', 2, 37),
  -- 266192 Wingspan (#38) - SKIP: already in database
  (96848, 'Mage Knight Board Game', 'bgg_top100', 'Rank #39', 2, 39),
  (251247, 'Barrage', 'bgg_top100', 'Rank #40', 2, 40),
  (321608, 'Hegemony: Lead Your Class to Victory', 'bgg_top100', 'Rank #41', 2, 41),
  (199792, 'Everdell', 'bgg_top100', 'Rank #42', 2, 42),
  (324856, 'The Crew: Mission Deep Sea', 'bgg_top100', 'Rank #43', 2, 43),
  (183394, 'Viticulture Essential Edition', 'bgg_top100', 'Rank #44', 2, 44),
  (521, 'Crokinole', 'bgg_top100', 'Rank #45', 2, 45),
  (366013, 'Heat: Pedal to the Metal', 'bgg_top100', 'Rank #46', 2, 46),
  (284378, 'Kanban EV', 'bgg_top100', 'Rank #47', 2, 47),
  (285774, 'Marvel Champions: The Card Game', 'bgg_top100', 'Rank #48', 2, 48),
  (247763, 'Underwater Cities', 'bgg_top100', 'Rank #49', 2, 49),
  (175914, 'Food Chain Magnate', 'bgg_top100', 'Rank #50', 2, 50),

  -- 51-75 (Priority 2)
  (256960, 'Pax Pamir: Second Edition', 'bgg_top100', 'Rank #51', 2, 51),
  (253344, 'Cthulhu: Death May Die', 'bgg_top100', 'Rank #52', 2, 52),
  (3076, 'Puerto Rico', 'bgg_top100', 'Rank #53', 2, 53),
  (383179, 'Age of Innovation', 'bgg_top100', 'Rank #54', 2, 54),
  (184267, 'On Mars', 'bgg_top100', 'Rank #55', 2, 55),
  -- 295947 Cascadia (#56) - SKIP: already in database
  (314040, 'Pandemic Legacy: Season 0', 'bgg_top100', 'Rank #57', 2, 57),
  (365717, 'Clank!: Catacombs', 'bgg_top100', 'Rank #58', 2, 58),
  (102794, 'Caverna: The Cave Farmers', 'bgg_top100', 'Rank #59', 2, 59),
  (185343, 'Anachrony', 'bgg_top100', 'Rank #60', 2, 60),
  (170216, 'Blood Rage', 'bgg_top100', 'Rank #61', 2, 61),
  (31260, 'Agricola', 'bgg_top100', 'Rank #62', 2, 62),
  (251661, 'Oathsworn: Into the Deepwood', 'bgg_top100', 'Rank #63', 2, 63),
  (414317, 'Harmonies', 'bgg_top100', 'Rank #64', 2, 64),
  (390092, 'Ticket to Ride Legacy: Legends of the West', 'bgg_top100', 'Rank #65', 2, 65),
  (161533, 'Lisboa', 'bgg_top100', 'Rank #66', 2, 66),
  (182874, 'Grand Austria Hotel', 'bgg_top100', 'Rank #67', 2, 67),
  (231733, 'Obsession', 'bgg_top100', 'Rank #68', 2, 68),
  (255984, 'Sleeping Gods', 'bgg_top100', 'Rank #69', 2, 69),
  (221107, 'Pandemic Legacy: Season 2', 'bgg_top100', 'Rank #70', 2, 70),
  (205059, 'Mansions of Madness: Second Edition', 'bgg_top100', 'Rank #71', 2, 71),
  (126163, 'Tzolk''in: The Mayan Calendar', 'bgg_top100', 'Rank #72', 2, 72),
  (2651, 'Power Grid', 'bgg_top100', 'Rank #73', 2, 73),
  (216132, 'Clans of Caledonia', 'bgg_top100', 'Rank #74', 2, 74),
  (240980, 'Blood on the Clocktower', 'bgg_top100', 'Rank #75', 2, 75),

  -- 76-100 (Priority 3)
  (244521, 'The Quacks of Quedlinburg', 'bgg_top100', 'Rank #76', 3, 76),
  (371942, 'The White Castle', 'bgg_top100', 'Rank #77', 3, 77),
  (266810, 'Paladins of the West Kingdom', 'bgg_top100', 'Rank #78', 3, 78),
  (35677, 'Le Havre', 'bgg_top100', 'Rank #79', 3, 79),
  (125153, 'The Gallerist', 'bgg_top100', 'Rank #80', 3, 80),
  (124742, 'Android: Netrunner', 'bgg_top100', 'Rank #81', 3, 81),
  (164153, 'Star Wars: Imperial Assault', 'bgg_top100', 'Rank #82', 3, 82),
  (200680, 'Agricola (Revised Edition)', 'bgg_top100', 'Rank #83', 3, 83),
  (380607, 'Great Western Trail: New Zealand', 'bgg_top100', 'Rank #84', 3, 84),
  (276025, 'Maracaibo', 'bgg_top100', 'Rank #85', 3, 85),
  (209010, 'Mechs vs. Minions', 'bgg_top100', 'Rank #86', 3, 86),
  (55690, 'Kingdom Death: Monster', 'bgg_top100', 'Rank #87', 3, 87),
  -- 284083 The Crew (#88) - SKIP: already in database
  (322289, 'Darwin''s Journey', 'bgg_top100', 'Rank #89', 3, 89),
  (28143, 'Race for the Galaxy', 'bgg_top100', 'Rank #90', 3, 90),
  (332772, 'Revive', 'bgg_top100', 'Rank #91', 3, 91),
  (337627, 'Voidfall', 'bgg_top100', 'Rank #92', 3, 92),
  (157354, 'Five Tribes', 'bgg_top100', 'Rank #93', 3, 93),
  -- 230802 Azul (#94) - SKIP: already in database
  (366161, 'Wingspan Asia', 'bgg_top100', 'Rank #95', 3, 95),
  (201808, 'Clank!: A Deck-Building Adventure', 'bgg_top100', 'Rank #96', 3, 96),
  (159675, 'Fields of Arle', 'bgg_top100', 'Rank #97', 3, 97),
  (72125, 'Eclipse', 'bgg_top100', 'Rank #98', 3, 98),
  (277659, 'Final Girl', 'bgg_top100', 'Rank #99', 3, 99),
  (93, 'El Grande', 'bgg_top100', 'Rank #100', 3, 100)
ON CONFLICT (bgg_id) DO NOTHING;

-- Log the results
DO $$
DECLARE
  queue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO queue_count FROM import_queue WHERE source = 'bgg_top100';
  RAISE NOTICE 'BGG Top 100 queue: % games added', queue_count;
END $$;
