-- Migration: 00014_complete_game_content.sql
-- Description: Add actual content for remaining 10 games that were using placeholder content

-- First, remove the placeholder content that was incorrectly set
UPDATE games SET rules_content = NULL, setup_content = NULL, reference_content = NULL
WHERE slug IN ('splendor', 'pandemic', 'carcassonne', '7-wonders', 'dominion', 'king-of-tokyo', 'sushi-go', 'love-letter', 'the-crew', 'cascadia');

-- Splendor
UPDATE games SET
  rules_content = '{
    "quickStart": ["Take gem tokens or reserve a card on your turn", "Use gems to purchase development cards", "Cards give permanent gem bonuses for future purchases", "First to 15 points wins!"],
    "overview": "Splendor is an elegant engine-building game where players collect gem tokens to purchase development cards. Each card provides permanent gem bonuses, making future purchases cheaper. Attract nobles by building the right combinations to reach 15 prestige points.",
    "setup": ["Shuffle each development card deck separately (Level 1, 2, 3)", "Reveal 4 cards from each level in a row", "Place gem tokens based on player count (7/5/4 for 4/3/2 players)", "Reveal nobles equal to players + 1"],
    "turnStructure": [{"title": "Take Gems", "description": "Take 3 different gem tokens, OR take 2 of the same color (if 4+ available). Maximum 10 gems in hand."}, {"title": "Reserve a Card", "description": "Take a face-up card or top of any deck into your hand (max 3 reserved). Gain 1 gold joker token."}, {"title": "Purchase a Card", "description": "Pay the gem cost (reduced by your card bonuses) to buy a face-up card or reserved card. Place it in front of you."}],
    "scoring": [{"category": "Level 1 cards", "points": "0-1 VP each"}, {"category": "Level 2 cards", "points": "1-3 VP each"}, {"category": "Level 3 cards", "points": "3-5 VP each"}, {"category": "Nobles", "points": "3 VP each"}],
    "tips": ["Focus on one or two colors early to build engine quickly", "Watch what opponents are collecting to deny key cards", "Gold tokens are powerful - reserve strategically", "Nobles come free - plan your purchases to attract them"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose seating", "description": "Players sit around the table. No individual player pieces needed."}],
    "boardSetup": [{"title": "Shuffle development cards", "description": "Separate cards by level (Level 1/green backs, Level 2/yellow, Level 3/blue). Shuffle each deck."}, {"title": "Deal face-up cards", "description": "Reveal 4 cards from each level in a row. Level 1 at the bottom, Level 3 at top.", "tip": "Leave room between rows for remaining decks."}, {"title": "Set out gem tokens", "description": "For 4 players: 7 of each gem color. For 3 players: 5 each. For 2 players: 4 each. Always 5 gold tokens."}, {"title": "Reveal noble tiles", "description": "Shuffle noble tiles and reveal equal to players + 1 (5 for 4 players, 4 for 3, 3 for 2)."}],
    "componentChecklist": [{"name": "Development cards (Level 1)", "quantity": "40"}, {"name": "Development cards (Level 2)", "quantity": "30"}, {"name": "Development cards (Level 3)", "quantity": "20"}, {"name": "Noble tiles", "quantity": "10"}, {"name": "Emerald tokens (green)", "quantity": "7"}, {"name": "Diamond tokens (white)", "quantity": "7"}, {"name": "Sapphire tokens (blue)", "quantity": "7"}, {"name": "Onyx tokens (black)", "quantity": "7"}, {"name": "Ruby tokens (red)", "quantity": "7"}, {"name": "Gold tokens (joker)", "quantity": "5"}],
    "firstPlayerRule": "The youngest player goes first, then play continues clockwise.",
    "quickTips": ["Cards give permanent gem discounts - build your engine early", "Watch what gems opponents are collecting", "Gold tokens are wild and valuable for key purchases"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Option A", "action": "Take 3 different gem tokens"}, {"phase": "Option B", "action": "Take 2 same-color gems (if 4+ available)"}, {"phase": "Option C", "action": "Reserve a card + take 1 gold"}, {"phase": "Option D", "action": "Purchase a card with gems"}, {"phase": "End of turn", "action": "Receive noble visit if qualified"}],
    "keyRules": [{"rule": "Max 10 gems", "detail": "Must return excess gems to supply"}, {"rule": "Max 3 reserved", "detail": "Cannot reserve 4th card"}, {"rule": "Gold is wild", "detail": "Replaces any gem color"}, {"rule": "Noble visits", "detail": "Automatic when you meet bonus requirements"}, {"rule": "Cards = permanent gems", "detail": "Reduce future purchase costs"}],
    "costs": [{"item": "Level 1 cards", "cost": "2-4 gems, 0-1 VP"}, {"item": "Level 2 cards", "cost": "4-6 gems, 1-3 VP"}, {"item": "Level 3 cards", "cost": "6-7 gems, 3-5 VP"}, {"item": "Nobles", "cost": "3 VP each (free when qualified)"}],
    "quickReminders": ["Taking 2 same gems requires 4+ in supply", "Cards reduce cost permanently", "Gold tokens are wild but limited (5 total)", "Nobles come to you - no action needed"],
    "endGame": "First player to 15+ prestige points triggers final round. Highest score after that round wins."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'splendor';

-- Pandemic
UPDATE games SET
  rules_content = '{
    "quickStart": ["Work as a team to cure 4 diseases before outbreaks overwhelm the world", "Use your unique role ability to maximum effect", "Trade cards and meet at research stations to find cures", "Cure all 4 diseases to win - too many outbreaks means game over!"],
    "overview": "Pandemic is a cooperative game where players are disease-fighting specialists working to save humanity. Travel the world treating infections, sharing knowledge, and racing to discover cures before diseases spread out of control.",
    "setup": ["Place research station in Atlanta, all pawns start there", "Shuffle and deal player cards (varies by player count)", "Infect 9 cities from infection deck (3 cities with 3, 3, 1 cubes)", "Add epidemic cards to player deck based on difficulty"],
    "turnStructure": [{"title": "Take 4 Actions", "description": "Drive/ferry to adjacent city, fly to card city, charter flight from current city, or shuttle between research stations. Also: treat disease, share knowledge, discover cure, build station."}, {"title": "Draw 2 Player Cards", "description": "Draw cards to your hand (max 7). Epidemic cards cause immediate outbreak in new city and intensify infection deck."}, {"title": "Infect Cities", "description": "Draw infection cards equal to infection rate. Add 1 disease cube to each city drawn. 4th cube triggers outbreak!"}],
    "scoring": [{"category": "Win condition", "points": "Cure all 4 diseases"}, {"category": "Lose: Outbreaks", "points": "8 outbreaks = game over"}, {"category": "Lose: Cubes", "points": "Run out of any color = game over"}, {"category": "Lose: Cards", "points": "No player cards left = game over"}],
    "tips": ["Communicate constantly - plan several turns ahead", "Treat disease clusters before they outbreak", "Use role abilities! Medic and Researcher are powerful", "Don''t neglect any disease - all 4 must be cured to win"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose roles", "description": "Shuffle role cards and deal 1 to each player. Each role has unique abilities.", "tip": "For first game, deal 2 roles per player and let them choose."}, {"title": "Take role pawn", "description": "Each player takes the pawn matching their role card color."}, {"title": "Deal player cards", "description": "4 players: 2 cards each. 3 players: 3 cards. 2 players: 4 cards."}, {"title": "Place pawns in Atlanta", "description": "All players start at the Atlanta research station."}],
    "boardSetup": [{"title": "Place research station", "description": "Place one research station in Atlanta on the game board."}, {"title": "Set infection rate", "description": "Place marker on the 2 space of the infection rate track."}, {"title": "Set outbreak marker", "description": "Place marker on the 0 space of the outbreak track."}, {"title": "Place cure markers", "description": "Place the 4 cure markers (vial side up) near the cure indicators."}, {"title": "Set up infection deck", "description": "Shuffle infection cards. Draw and infect 3 cities with 3 cubes, 3 cities with 2 cubes, 3 cities with 1 cube.", "tip": "Use matching color cubes for each city."}, {"title": "Add epidemic cards", "description": "Divide player draw pile into equal piles (4/5/6 for easy/medium/hard). Add 1 epidemic card to each pile, shuffle each, stack."}],
    "componentChecklist": [{"name": "Disease cubes (each color)", "quantity": "24 x 4 colors"}, {"name": "Research stations", "quantity": "6"}, {"name": "Infection cards", "quantity": "48"}, {"name": "Player cards", "quantity": "59"}, {"name": "Epidemic cards", "quantity": "6"}, {"name": "Role cards", "quantity": "7"}, {"name": "Cure markers", "quantity": "4"}, {"name": "Player pawns", "quantity": "7"}],
    "firstPlayerRule": "The player with the highest city population on a player card goes first.",
    "quickTips": ["This is cooperative - discuss strategy openly", "Prevent outbreaks by treating clusters early", "Share knowledge at research stations to find cures faster"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Actions (4)", "action": "Move, treat, share, cure, build"}, {"phase": "2. Draw", "action": "Draw 2 player cards (hand limit 7)"}, {"phase": "3. Infect", "action": "Draw infection cards = rate"}],
    "keyRules": [{"rule": "Outbreak", "detail": "4th cube = spread to all connected cities"}, {"rule": "Cure", "detail": "5 matching cards at research station"}, {"rule": "Eradicate", "detail": "Cure + remove all cubes = no new infections"}, {"rule": "Hand limit", "detail": "7 cards max (discard at end of turn)"}, {"rule": "Epidemic", "detail": "Infect new city, shuffle discards on top"}],
    "costs": [{"item": "Move (drive/ferry)", "cost": "1 action"}, {"item": "Move (direct flight)", "cost": "1 action + discard destination card"}, {"item": "Move (charter)", "cost": "1 action + discard current city card"}, {"item": "Treat disease", "cost": "1 action = remove 1 cube (all if cured)"}, {"item": "Build station", "cost": "1 action + current city card"}, {"item": "Share knowledge", "cost": "1 action (same city, that city''s card)"}, {"item": "Discover cure", "cost": "1 action + 5 matching cards at station"}],
    "quickReminders": ["Cooperate! Discuss strategy openly", "8 outbreaks = immediate loss", "Running out of cubes/cards = loss", "Use role abilities every turn"],
    "endGame": "Win: Cure all 4 diseases. Lose: 8 outbreaks, run out of cubes, or player deck empty."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'pandemic';

-- Carcassonne
UPDATE games SET
  rules_content = '{
    "quickStart": ["Draw a tile and add it to the map", "Optionally place one of your meeples on the tile", "Score completed roads, cities, and monasteries", "Most points at game end wins!"],
    "overview": "Carcassonne is a tile-laying game where players build the medieval French countryside. Draw tiles depicting roads, cities, monasteries, and fields, then place them to extend the landscape. Deploy your followers strategically to score points.",
    "setup": ["Place the starting tile face-up in the center", "Shuffle all other tiles face-down in stacks", "Each player takes 7 meeples in their color", "Determine starting player randomly"],
    "turnStructure": [{"title": "Draw and Place Tile", "description": "Draw a tile and place it adjacent to existing tiles. Roads must connect to roads, cities to cities, fields to fields."}, {"title": "Place a Meeple (Optional)", "description": "Place one meeple on a feature of the tile you just placed: road (thief), city (knight), monastery (monk), or field (farmer). Cannot join features with opponent''s meeple."}, {"title": "Score Completed Features", "description": "When a road, city, or monastery is completed, score it immediately and return meeples. Fields score at game end only."}],
    "scoring": [{"category": "Completed road", "points": "1 per tile"}, {"category": "Completed city", "points": "2 per tile + 2 per pennant"}, {"category": "Completed monastery", "points": "9 points (center + 8 surrounding)"}, {"category": "Incomplete features", "points": "1 per tile at game end"}, {"category": "Fields", "points": "3 per completed city touching field"}],
    "tips": ["Don''t commit all meeples early - keep options open", "Fields are powerful but lock meeples until game end", "Sometimes blocking opponents is worth more than building", "Try to sneak meeples into opponents'' features by connecting"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose colors", "description": "Each player picks a color and takes all 7 meeples of that color."}, {"title": "Keep 1 meeple for scoring", "description": "Place 1 meeple on the 0 space of the score track. Use remaining 6 for placement."}],
    "boardSetup": [{"title": "Place starting tile", "description": "Find the starting tile (darker back or marked) and place face-up in center of table."}, {"title": "Shuffle remaining tiles", "description": "Shuffle all other tiles face-down. Create several stacks for easy access.", "tip": "River expansion tiles should be placed first if included."}, {"title": "Set up scoring track", "description": "Place the scoreboard where all players can reach it."}],
    "componentChecklist": [{"name": "Land tiles", "quantity": "72 (including start)"}, {"name": "Meeples per player", "quantity": "7"}, {"name": "Scoring track", "quantity": "1"}, {"name": "Rule summary cards", "quantity": "5"}],
    "firstPlayerRule": "The youngest player goes first, then play continues clockwise.",
    "quickTips": ["Save some meeples - you can''t place if you have none", "Fields lock meeples until game end but score big", "Complete features quickly to get meeples back"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Draw", "action": "Draw and reveal a tile"}, {"phase": "2. Place", "action": "Add tile to the map (edges must match)"}, {"phase": "3. Deploy", "action": "Optionally place 1 meeple on the new tile"}, {"phase": "4. Score", "action": "Score any completed features"}],
    "keyRules": [{"rule": "Matching edges", "detail": "Roads to roads, cities to cities, fields to fields"}, {"rule": "Meeple placement", "detail": "Only on tile just placed, not in occupied features"}, {"rule": "Scoring returns", "detail": "Meeples return after completed features score"}, {"rule": "Fields", "detail": "Meeples stay until game end, score 3 per completed city"}, {"rule": "Majority wins", "detail": "Ties share points equally"}],
    "costs": [{"item": "Road complete", "cost": "1 point per tile"}, {"item": "City complete", "cost": "2 points per tile + 2 per pennant"}, {"item": "Monastery complete", "cost": "9 points (all 8 surrounding + center)"}, {"item": "Incomplete road", "cost": "1 point per tile at game end"}, {"item": "Incomplete city", "cost": "1 point per tile + 1 per pennant at game end"}, {"item": "Fields", "cost": "3 points per completed city touching field"}],
    "quickReminders": ["Save meeples - can''t place if none available", "Fields are powerful but risky (game-long commitment)", "Connect to opponents'' features to share/steal points", "Score track: 50+ = flip meeple to indicate +50"],
    "endGame": "Last tile placed, then score all incomplete features and fields. Highest score wins."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'carcassonne';

-- 7 Wonders
UPDATE games SET
  rules_content = '{
    "quickStart": ["Draft cards over 3 ages - pick one, pass the rest", "Build structures or wonder stages with resources", "Military conflicts happen at end of each age", "Most victory points after Age III wins!"],
    "overview": "7 Wonders is a card drafting game where players lead ancient civilizations. Over three ages, simultaneously draft cards to build your city, construct wonder stages, and amass victory points through multiple paths: military, science, commerce, and more.",
    "setup": ["Each player receives a wonder board (random or draft)", "Separate cards by age (I, II, III) and shuffle each", "Deal 7 Age I cards to each player", "Place 3 coins on each wonder board"],
    "turnStructure": [{"title": "Choose Card", "description": "Simultaneously, each player selects one card from their hand and places it face-down."}, {"title": "Reveal and Resolve", "description": "All players reveal chosen cards simultaneously. Build the structure (pay resource cost), build wonder stage (tuck card), or discard for 3 coins."}, {"title": "Pass Remaining Cards", "description": "Pass remaining hand to neighbor (left in Ages I/III, right in Age II). Repeat until 6 cards played, discard the 7th."}],
    "scoring": [{"category": "Military tokens", "points": "Sum of all tokens (+/-)"}, {"category": "Treasury", "points": "1 VP per 3 coins"}, {"category": "Wonder stages", "points": "As printed (2-7 VP)"}, {"category": "Blue buildings", "points": "2-8 VP each"}, {"category": "Yellow buildings", "points": "Various bonuses"}, {"category": "Green (science)", "points": "Sets + matching symbols²"}, {"category": "Purple (guilds)", "points": "Based on neighbors/self"}],
    "tips": ["Science is powerful but risky - need sets and matches", "Watch what neighbors need - deny key resources", "Military: stay slightly ahead, don''t over-invest", "Free building chains (symbol matching) save resources"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Deal wonder boards", "description": "Shuffle and deal 1 wonder board to each player, or let players choose.", "tip": "A/B sides have different powers. Use A side for first game."}, {"title": "Take coins", "description": "Each player takes 3 coins (value 1) from the bank."}, {"title": "Note your neighbors", "description": "Players to your immediate left and right are your neighbors for trading and military."}],
    "boardSetup": [{"title": "Separate cards by age", "description": "Sort cards into Age I, II, and III piles (check card backs)."}, {"title": "Adjust for player count", "description": "Some cards have player count symbols. Remove cards requiring more players than you have."}, {"title": "Prepare Guild cards (Age III)", "description": "Shuffle purple Guild cards. Add players + 2 to Age III deck (7 for 5 players, etc.)."}, {"title": "Shuffle each age deck", "description": "Shuffle Age I, II, and III separately. Set II and III aside."}, {"title": "Deal Age I cards", "description": "Deal 7 Age I cards to each player."}, {"title": "Set up conflict tokens", "description": "Place -1 tokens nearby. Separate +1, +3, +5 tokens by age."}],
    "componentChecklist": [{"name": "Wonder boards", "quantity": "7"}, {"name": "Age I cards", "quantity": "49"}, {"name": "Age II cards", "quantity": "49"}, {"name": "Age III cards", "quantity": "50"}, {"name": "Guild cards (purple)", "quantity": "10"}, {"name": "Conflict tokens", "quantity": "46"}, {"name": "Coins (value 1)", "quantity": "46"}, {"name": "Coins (value 3)", "quantity": "24"}],
    "firstPlayerRule": "The player who most recently visited an ancient monument goes first (or choose randomly).",
    "quickTips": ["Resources from neighbors cost 2 coins each", "Build chains - some cards let you build later cards free", "Watch military - losing costs -1 each age"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Choose", "action": "Select 1 card from hand simultaneously"}, {"phase": "2. Reveal", "action": "All reveal chosen cards together"}, {"phase": "3. Build", "action": "Pay cost OR build wonder stage OR sell for 3 coins"}, {"phase": "4. Pass", "action": "Pass remaining cards to neighbor"}],
    "keyRules": [{"rule": "Resource trading", "detail": "2 coins per resource from neighbors"}, {"rule": "Chain building", "detail": "Symbol on card = free prerequisite"}, {"rule": "Military", "detail": "Compare shields at end of each age"}, {"rule": "Science scoring", "detail": "Sets of 3 + squares of matching symbols"}, {"rule": "Yellow cards", "detail": "Often provide coins or trading discounts"}],
    "costs": [{"item": "Age I military", "cost": "+1/-1 tokens"}, {"item": "Age II military", "cost": "+3/-1 tokens"}, {"item": "Age III military", "cost": "+5/-1 tokens"}, {"item": "Buy neighbor resource", "cost": "2 coins each"}, {"item": "Discard card", "cost": "Gain 3 coins"}, {"item": "Wonder stage", "cost": "Pay wonder cost, tuck any card"}],
    "quickReminders": ["Pass left in Ages I & III, right in Age II", "Science: set of 3 different = 7 points", "Science: each matching symbol = symbol² points", "Can only build 1 of each card (by name)"],
    "endGame": "After Age III military. Sum all victory points. Most points wins."
  }'::jsonb,
  content_status = 'published'
WHERE slug = '7-wonders';

-- Dominion
UPDATE games SET
  rules_content = '{
    "quickStart": ["Start with a deck of 10 cards (7 Copper, 3 Estate)", "Each turn: draw 5 cards, play actions, buy cards", "New cards go to your discard pile, then get shuffled in", "Game ends when 3 piles empty - most VP wins!"],
    "overview": "Dominion is the original deck-building game. All players start with identical 10-card decks and buy new cards from a shared supply to improve their decks. Actions chain together, treasures fund purchases, and victory cards win the game.",
    "setup": ["Each player starts with 7 Copper and 3 Estate cards, shuffled", "Set out the basic cards: Copper, Silver, Gold, Estate, Duchy, Province, Curse", "Choose 10 Kingdom card piles (random or selected)", "Set out Kingdom cards with appropriate quantities"],
    "turnStructure": [{"title": "Action Phase", "description": "Play one Action card from your hand (unless you have +Actions). Resolve its effects completely. +Actions lets you play more Action cards."}, {"title": "Buy Phase", "description": "Play all Treasure cards from your hand. You have 1 Buy (unless you have +Buys). Spend your coins to buy cards costing up to that amount."}, {"title": "Cleanup Phase", "description": "Put all cards in play and remaining hand into your discard pile. Draw 5 new cards. If deck is empty, shuffle discard to form new deck."}],
    "scoring": [{"category": "Estate", "points": "1 VP each"}, {"category": "Duchy", "points": "3 VP each"}, {"category": "Province", "points": "6 VP each"}, {"category": "Curse", "points": "-1 VP each"}, {"category": "Kingdom VP cards", "points": "As printed"}],
    "tips": ["Buy money early, Victory cards late", "Thin your deck - trashing Copper and Estate makes it stronger", "Watch the Province pile - don''t get caught unprepared", "Actions that give +Cards and +Actions keep your turn going"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Take starting cards", "description": "Each player takes 7 Copper cards and 3 Estate cards."}, {"title": "Shuffle your deck", "description": "Shuffle your 10 cards and place them face-down as your draw deck."}, {"title": "Draw starting hand", "description": "Draw 5 cards from your deck to form your starting hand."}],
    "boardSetup": [{"title": "Set out Treasure cards", "description": "Place Copper (60), Silver (40), and Gold (30) in separate piles.", "tip": "Return unused starting Coppers to the pile."}, {"title": "Set out Victory cards", "description": "For 2 players: 8 of each. For 3-4 players: 12 of each Estate, Duchy, Province."}, {"title": "Set out Curse cards", "description": "Use 10 Curses per player beyond the first (10/20/30 for 2/3/4 players)."}, {"title": "Choose 10 Kingdom cards", "description": "Randomly select 10 different Kingdom card piles for this game.", "tip": "Use recommended sets for your first games."}, {"title": "Set Kingdom pile quantities", "description": "10 copies of each Kingdom card (12 for Victory Kingdom cards)."}, {"title": "Create play area", "description": "Each player needs space for draw deck, discard pile, and cards in play."}],
    "componentChecklist": [{"name": "Copper cards", "quantity": "60"}, {"name": "Silver cards", "quantity": "40"}, {"name": "Gold cards", "quantity": "30"}, {"name": "Estate cards", "quantity": "24"}, {"name": "Duchy cards", "quantity": "12"}, {"name": "Province cards", "quantity": "12"}, {"name": "Curse cards", "quantity": "30"}, {"name": "Kingdom card sets", "quantity": "25 different"}, {"name": "Trash pile card", "quantity": "1"}],
    "firstPlayerRule": "The player who most recently shuffled a deck of cards goes first (or choose randomly).",
    "quickTips": ["Action, Buy, Cleanup - remember the turn phases", "Treasure cards go in your deck, not in the supply permanently", "Trashing is powerful - smaller decks are faster"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Action Phase", "action": "Play 1 Action card (more with +Actions)"}, {"phase": "Buy Phase", "action": "Play Treasures, buy 1 card (more with +Buys)"}, {"phase": "Cleanup", "action": "Discard everything, draw 5 new cards"}],
    "keyRules": [{"rule": "Starting deck", "detail": "7 Copper, 3 Estate = 10 cards"}, {"rule": "+Actions", "detail": "Lets you play additional Action cards"}, {"rule": "+Cards", "detail": "Draw more cards from your deck"}, {"rule": "+Buys", "detail": "Lets you buy multiple cards"}, {"rule": "Trash", "detail": "Remove cards permanently from your deck"}],
    "costs": [{"item": "Copper", "cost": "0 (value 1)"}, {"item": "Silver", "cost": "3 (value 2)"}, {"item": "Gold", "cost": "6 (value 3)"}, {"item": "Estate", "cost": "2 (1 VP)"}, {"item": "Duchy", "cost": "5 (3 VP)"}, {"item": "Province", "cost": "8 (6 VP)"}],
    "quickReminders": ["Bought cards go to discard, not hand", "Shuffle discard when deck is empty", "Victory cards are dead draws mid-game", "Game ends when Provinces or 3 piles empty"],
    "endGame": "Province pile empty OR any 3 supply piles empty. Count all VP in deck."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'dominion';

-- King of Tokyo
UPDATE games SET
  rules_content = '{
    "quickStart": ["Roll 6 dice up to 3 times, keeping what you want", "Deal damage, heal, gain energy, or score victory points", "Enter Tokyo to deal damage to everyone, but you can''t heal inside", "First to 20 VP wins, or last monster standing!"],
    "overview": "King of Tokyo is a fast-paced dice game where giant monsters battle to become King of Tokyo. Roll dice for attacks, healing, energy, and points. Enter Tokyo to attack all rivals at once, but beware—you become everyone''s target.",
    "setup": ["Each player chooses a monster and takes matching figure and board", "Set your life to 10 and victory points to 0", "Shuffle power cards and reveal 3 face-up", "Place Tokyo board in center—no one starts inside"],
    "turnStructure": [{"title": "Roll Dice (up to 3 times)", "description": "Roll all 6 dice. Keep any you want and reroll the rest up to 2 more times. Final results are resolved."}, {"title": "Resolve Dice", "description": "Claws = deal damage. Hearts = heal (not in Tokyo). Lightning = gain energy. Numbers = 3 matching = that many VP, +1 per extra."}, {"title": "Buy Power Cards", "description": "Spend energy to buy face-up power cards or pay 2 energy to sweep all 3 and reveal new ones."}],
    "scoring": [{"category": "3 of a kind (1s)", "points": "1 VP"}, {"category": "3 of a kind (2s)", "points": "2 VP"}, {"category": "3 of a kind (3s)", "points": "3 VP"}, {"category": "Extra matching die", "points": "+1 VP each"}, {"category": "Enter Tokyo", "points": "1 VP"}, {"category": "Start turn in Tokyo", "points": "2 VP"}],
    "tips": ["Know when to yield Tokyo—low health means get out", "Energy is powerful but don''t hoard it forever", "Target weak monsters to eliminate competition", "Some power cards are game-changing—prioritize key ones"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose a monster", "description": "Each player picks a monster and takes the matching figure and monster board."}, {"title": "Set dials", "description": "Set your life dial to 10 hearts and your victory point dial to 0."}],
    "boardSetup": [{"title": "Place Tokyo board", "description": "Put the Tokyo board in the center. No one starts in Tokyo.", "tip": "With 5-6 players, use both Tokyo City and Tokyo Bay spaces."}, {"title": "Shuffle Power cards", "description": "Shuffle all Power cards and place the deck face-down."}, {"title": "Reveal 3 Power cards", "description": "Draw and reveal 3 Power cards face-up next to the deck."}, {"title": "Prepare energy cubes", "description": "Place all green energy cubes in a supply pile."}, {"title": "Get dice ready", "description": "Place all 6 black dice where all players can reach them.", "tip": "Green dice are from expansions - don''t use in base game."}],
    "componentChecklist": [{"name": "Monster figures", "quantity": "6"}, {"name": "Monster boards", "quantity": "6"}, {"name": "Tokyo board", "quantity": "1"}, {"name": "Black dice", "quantity": "6"}, {"name": "Green dice (expansion)", "quantity": "2"}, {"name": "Power cards", "quantity": "66"}, {"name": "Energy cubes", "quantity": "50+"}],
    "firstPlayerRule": "The player who most recently saw a monster movie goes first.",
    "quickTips": ["In Tokyo, you deal damage to ALL other players", "You cannot heal while in Tokyo", "Yield when low on health - discretion is valor"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Roll", "action": "Roll 6 dice, reroll up to 2 more times"}, {"phase": "2. Resolve", "action": "Apply all dice results"}, {"phase": "3. Enter Tokyo", "action": "If empty and you rolled claws, enter"}, {"phase": "4. Buy", "action": "Spend energy on Power cards"}],
    "keyRules": [{"rule": "In Tokyo", "detail": "Attack ALL others, cannot heal, +2 VP per turn"}, {"rule": "Yield", "detail": "When hit while in Tokyo, may leave (attacker enters)"}, {"rule": "Elimination", "detail": "0 health = out of the game"}, {"rule": "Sweep", "detail": "Pay 2 energy to discard all 3 face-up cards, reveal new"}],
    "costs": [{"item": "Claw", "cost": "1 damage per claw"}, {"item": "Heart", "cost": "Heal 1 (not in Tokyo)"}, {"item": "Lightning", "cost": "1 energy per lightning"}, {"item": "3 matching numbers", "cost": "That many VP"}, {"item": "Extra matching die", "cost": "+1 VP each"}],
    "quickReminders": ["First to Tokyo gets 1 VP for entering", "Start of turn in Tokyo = 2 VP", "Cannot heal inside Tokyo", "Power cards stay unless discarded"],
    "endGame": "First to 20 VP wins, OR last monster standing."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'king-of-tokyo';

-- Sushi Go
UPDATE games SET
  rules_content = '{
    "quickStart": ["Pick one card from your hand and pass the rest", "Reveal chosen cards simultaneously", "Score different sushi for different point values", "After 3 rounds, highest score wins!"],
    "overview": "Sushi Go! is a lightning-fast card drafting game with adorable art. Pick cards to build the best sushi combinations, from maki rolls for majority bonuses to puddings that score at game end. Quick to learn, endlessly replayable.",
    "setup": ["Shuffle all cards together", "Deal cards based on player count (10/9/8/7 for 2/3/4/5 players)", "Keep score with pen and paper or app", "Play 3 rounds total"],
    "turnStructure": [{"title": "Pick a Card", "description": "Simultaneously, everyone picks one card from their hand and places it face-down in front of them."}, {"title": "Reveal Cards", "description": "All players flip their chosen card face-up. Cards stay in front of you for scoring at round end."}, {"title": "Pass Hands", "description": "Pass remaining cards to the player on your left. Take the hand from your right. Repeat until all cards played."}],
    "scoring": [{"category": "Tempura (pair)", "points": "5 VP per pair"}, {"category": "Sashimi (3 of a kind)", "points": "10 VP per set"}, {"category": "Dumpling", "points": "1/3/6/10/15 for 1-5+"}, {"category": "Maki Rolls", "points": "Most: 6 VP, 2nd: 3 VP"}, {"category": "Nigiri", "points": "1/2/3 VP (egg/salmon/squid)"}, {"category": "Wasabi + Nigiri", "points": "Triple the nigiri!"}, {"category": "Pudding (game end)", "points": "Most: +6, Least: -6"}],
    "tips": ["Pudding matters! Don''t get stuck with the least", "Wasabi is worthless without nigiri to put on it", "Watch what others collect to deny sets or compete for maki", "Chopsticks let you grab 2 cards in one turn—powerful!"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Determine player count", "description": "Sushi Go! plays 2-5 players. Card deal varies by count."}],
    "boardSetup": [{"title": "Shuffle all cards", "description": "Combine and shuffle all 108 cards into one deck."}, {"title": "Deal cards", "description": "2 players: 10 cards each. 3 players: 9 cards. 4 players: 8 cards. 5 players: 7 cards.", "tip": "Remaining cards are not used this round."}, {"title": "Prepare scoring", "description": "Get paper and pencil ready for scoring, or use an app."}],
    "componentChecklist": [{"name": "Tempura cards", "quantity": "14"}, {"name": "Sashimi cards", "quantity": "14"}, {"name": "Dumpling cards", "quantity": "14"}, {"name": "Maki Roll cards (1/2/3)", "quantity": "12/8/6"}, {"name": "Nigiri cards (egg/salmon/squid)", "quantity": "5/10/5"}, {"name": "Wasabi cards", "quantity": "6"}, {"name": "Chopsticks cards", "quantity": "4"}, {"name": "Pudding cards", "quantity": "10"}],
    "firstPlayerRule": "All players act simultaneously - no turn order needed!",
    "quickTips": ["Keep puddings for end-game scoring", "Wasabi triples the next nigiri played on it", "Watch what opponents need to deny their sets"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Pick", "action": "Choose 1 card from hand, place face-down"}, {"phase": "2. Reveal", "action": "All flip cards simultaneously"}, {"phase": "3. Pass", "action": "Pass remaining hand to the left"}, {"phase": "Repeat", "action": "Continue until all cards played"}],
    "keyRules": [{"rule": "Chopsticks", "detail": "Say Sushi Go! to swap for 2 cards later"}, {"rule": "Wasabi", "detail": "Next nigiri played on it is tripled"}, {"rule": "Pudding", "detail": "Keep until game end, scored after round 3"}, {"rule": "Rounds", "detail": "Play 3 rounds, reshuffle between rounds"}],
    "costs": [{"item": "Tempura", "cost": "5 pts per pair (0 for 1)"}, {"item": "Sashimi", "cost": "10 pts per set of 3 (0 for 1-2)"}, {"item": "Dumplings", "cost": "1/3/6/10/15 for 1-5+"}, {"item": "Maki (most/2nd)", "cost": "6/3 VP"}, {"item": "Nigiri (egg/salmon/squid)", "cost": "1/2/3 VP"}],
    "quickReminders": ["Pudding: most = +6, least = -6 at game end", "Chopsticks: put back in hand after using", "Maki: count icons, not cards", "Wasabi + Squid = 9 points!"],
    "endGame": "After 3 rounds. Score puddings, highest total wins."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'sushi-go';

-- Love Letter
UPDATE games SET
  rules_content = '{
    "quickStart": ["Draw a card, play a card, use its power", "Eliminate other players or have highest card when deck runs out", "Win tokens of affection to win the game", "Just 16 cards—pure deduction!"],
    "overview": "Love Letter is a micro game of risk and deduction. With only 16 cards, players draw and play to eliminate rivals while protecting their own hand. The highest-numbered card still in play wins the round. Simple rules, deep bluffing.",
    "setup": ["Shuffle all 16 cards", "Remove top card face-down (hidden from all players)", "In 2-player game, also remove 3 cards face-up", "Deal 1 card to each player—this is your starting hand"],
    "turnStructure": [{"title": "Draw a Card", "description": "Draw the top card of the deck. You now have 2 cards in hand."}, {"title": "Play a Card", "description": "Choose one of your 2 cards to play face-up in front of you. Resolve its power."}, {"title": "Apply Card Effect", "description": "Guard: guess opponent''s card. Priest: look at hand. Baron: compare, lower eliminated. Prince: discard hand. King: swap hands. Countess: must play if with King/Prince. Princess: if played/discarded, eliminated."}],
    "scoring": [{"category": "Guard (1) x5", "points": "Guess hand, eliminate if correct"}, {"category": "Priest (2) x2", "points": "Look at opponent''s hand"}, {"category": "Baron (3) x2", "points": "Compare hands, lower loses"}, {"category": "Handmaid (4) x2", "points": "Protected until your next turn"}, {"category": "Prince (5) x2", "points": "Force player to discard hand"}, {"category": "King (6) x1", "points": "Trade hands with opponent"}, {"category": "Countess (7) x1", "points": "Must play if with King/Prince"}, {"category": "Princess (8) x1", "points": "If discarded, eliminated"}],
    "tips": ["Track what''s been played to narrow down possibilities", "Guards are most common—save them for good guesses", "Handmaid protects you but wastes a turn", "The Princess is safest early, most dangerous late"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Determine player count", "description": "Love Letter plays 2-6 players. Gameplay adjusts slightly for 2 players."}, {"title": "Take reference cards (optional)", "description": "Each player may take a card reference guide if available."}],
    "boardSetup": [{"title": "Shuffle the deck", "description": "Shuffle all 16 cards thoroughly."}, {"title": "Remove hidden card", "description": "Take the top card and set it aside face-down. This card is out of the round.", "tip": "This hidden card creates uncertainty about what''s in play."}, {"title": "2-player variant", "description": "With 2 players only: also remove 3 cards face-up from the deck."}, {"title": "Deal starting hands", "description": "Deal 1 card to each player. This is your starting hand."}, {"title": "Prepare tokens", "description": "Place tokens of affection (red cubes) in the center.", "tip": "Win tokens = 7 (2 players), 5 (3), 4 (4), 3 (5-6)."}],
    "componentChecklist": [{"name": "Guard cards (1)", "quantity": "5"}, {"name": "Priest cards (2)", "quantity": "2"}, {"name": "Baron cards (3)", "quantity": "2"}, {"name": "Handmaid cards (4)", "quantity": "2"}, {"name": "Prince cards (5)", "quantity": "2"}, {"name": "King card (6)", "quantity": "1"}, {"name": "Countess card (7)", "quantity": "1"}, {"name": "Princess card (8)", "quantity": "1"}, {"name": "Tokens of affection", "quantity": "13"}, {"name": "Reference cards", "quantity": "4"}],
    "firstPlayerRule": "The player who most recently went on a date goes first.",
    "quickTips": ["Track which cards have been played", "The Princess is worth 8 points but risky to hold", "Handmaid gives you a safe turn but reveals weakness"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Draw", "action": "Draw 1 card (now have 2)"}, {"phase": "2. Play", "action": "Play 1 card and resolve its effect"}],
    "keyRules": [{"rule": "Protection", "detail": "Handmaid makes you immune until your next turn"}, {"rule": "Forced play", "detail": "Countess MUST be played if you have King or Prince"}, {"rule": "Princess", "detail": "If discarded for any reason, you are eliminated"}, {"rule": "Compare ties", "detail": "On Baron tie, neither player is eliminated"}],
    "costs": [{"item": "Guard (1)", "cost": "Guess hand, eliminate if correct"}, {"item": "Priest (2)", "cost": "Look at opponent hand"}, {"item": "Baron (3)", "cost": "Compare hands, lower loses"}, {"item": "Handmaid (4)", "cost": "Protection until next turn"}, {"item": "Prince (5)", "cost": "Target discards hand, draws new"}, {"item": "King (6)", "cost": "Trade hands with opponent"}],
    "quickReminders": ["Cannot guess Guard with Guard", "Handmaid protects but announces weakness", "Track played cards to deduce hands", "If deck runs out, highest card wins"],
    "endGame": "One player left OR deck empty (highest card wins round)."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'love-letter';

-- The Crew
UPDATE games SET
  rules_content = '{
    "quickStart": ["Complete missions by winning tricks with specific cards", "Follow standard trick-taking rules (follow suit, highest wins)", "Communication is limited—use one card clue per round", "Complete all missions to win the scenario!"],
    "overview": "The Crew is a cooperative trick-taking game where players work together to complete missions—specific cards that must be won by specific players. Communication is severely limited, making each hand a puzzle to solve together.",
    "setup": ["Deal all 40 cards evenly to players", "Check mission book for current mission''s task cards", "Distribute task cards as described in mission", "Commander (4 of rockets) goes first"],
    "turnStructure": [{"title": "Lead a Card", "description": "The trick leader plays any card from their hand. Rockets are trump (always win if played)."}, {"title": "Follow Suit", "description": "Other players must follow the led suit if possible. If not, may play any card including trump."}, {"title": "Win the Trick", "description": "Highest card of led suit wins (or highest trump). Winner takes trick and leads next. Check if any tasks were completed."}],
    "scoring": [{"category": "Complete all tasks", "points": "Mission success!"}, {"category": "Fail any task", "points": "Mission failed—retry"}, {"category": "Communication", "points": "1 clue per person (card + token)"}, {"category": "Task tokens", "points": "Order constraints (1st, 2nd, etc.)"}],
    "tips": ["Play long suits early to let teammates void suits", "Your communication token is precious—time it well", "Sometimes the task holder should NOT win their task early", "Watch for impossible missions—better to fail fast"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Open mission book", "description": "Choose your current mission. Start with Mission 1 for first-time players."}, {"title": "Understand communication limits", "description": "Each player gets ONE communication token for the entire mission.", "tip": "Communication is very limited - plan carefully!"}],
    "boardSetup": [{"title": "Separate card types", "description": "There are 4 colored suits (1-9) and rockets (1-4 trump)."}, {"title": "Deal all cards", "description": "Shuffle and deal ALL 40 cards evenly to players.", "tip": "3 players: 13/13/14 cards. 4 players: 10 each. 5 players: 8 each."}, {"title": "Identify Commander", "description": "Whoever has the 4 of rockets is the Commander and leads the first trick."}, {"title": "Draw task cards", "description": "Check the mission for how many task cards to draw and how to distribute."}, {"title": "Set up task tokens (if needed)", "description": "Some missions use numbered tokens (1-5) or omega tokens for task order."}],
    "componentChecklist": [{"name": "Large cards (color suits 1-9)", "quantity": "36"}, {"name": "Large cards (rockets 1-4)", "quantity": "4"}, {"name": "Task cards", "quantity": "36"}, {"name": "Communication tokens", "quantity": "5"}, {"name": "Task tokens (numbered)", "quantity": "5"}, {"name": "Task token (omega)", "quantity": "1"}, {"name": "Distress signal token", "quantity": "1"}, {"name": "Mission logbook", "quantity": "1"}],
    "firstPlayerRule": "The Commander (holder of the 4 of rockets) leads the first trick.",
    "quickTips": ["Rockets are trump and always win if played", "Communication: place 1 card face-up with token showing highest/lowest/only", "Discuss strategy before dealing, not during play"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Lead", "action": "Leader plays any card"}, {"phase": "Follow", "action": "Must follow suit if able"}, {"phase": "Win", "action": "Highest card of led suit (or trump) wins"}, {"phase": "Next", "action": "Winner leads next trick"}],
    "keyRules": [{"rule": "Trump", "detail": "Rockets (1-4) always beat non-rockets"}, {"rule": "Follow suit", "detail": "Must play same color if possible"}, {"rule": "Communication", "detail": "1 card face-up + token (highest/lowest/only)"}, {"rule": "Tasks", "detail": "Specific player must win specific card"}],
    "costs": [{"item": "Token on top", "cost": "This is my HIGHEST of this suit"}, {"item": "Token on bottom", "cost": "This is my LOWEST of this suit"}, {"item": "Token in center", "cost": "This is my ONLY card of this suit"}, {"item": "Order token", "cost": "Must complete tasks in this sequence"}],
    "quickReminders": ["Discuss strategy BEFORE dealing", "Once dealt, only communicate via tokens", "Commander (4 of rockets) leads first", "All tasks must succeed for mission success"],
    "endGame": "All tasks completed = win! Any task failed = retry mission."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'the-crew';

-- Cascadia
UPDATE games SET
  rules_content = '{
    "quickStart": ["Draft a habitat tile and wildlife token pair each turn", "Place tiles to expand your ecosystem", "Place wildlife to score patterns specific to each animal", "Highest combined score wins!"],
    "overview": "Cascadia is a puzzly tile-laying game about creating ecosystems. Draft paired tiles and tokens to build your landscape, then score points for matching habitats and wildlife patterns. Relaxing yet strategic, with gorgeous Pacific Northwest theming.",
    "setup": ["Create 4 face-up tile + token pairs in the center", "Give each player a starting habitat tile", "Place wildlife scoring cards (one per animal type)", "Each player gets 3 nature tokens"],
    "turnStructure": [{"title": "Select Tile + Token", "description": "Choose one tile-token pair from the center. May spend a nature token to take any tile with any token instead."}, {"title": "Place Tile", "description": "Add the tile adjacent to your existing tiles. Habitats don''t need to match, but matching creates corridors for bonuses."}, {"title": "Place Wildlife (Optional)", "description": "Place your wildlife token on a matching habitat symbol. Each tile can hold one wildlife token. Cannot move once placed."}],
    "scoring": [{"category": "Wildlife patterns", "points": "Per wildlife scoring card"}, {"category": "Largest habitat corridor", "points": "Bonus per habitat type"}, {"category": "Nature tokens remaining", "points": "1 VP each"}, {"category": "Bonus tiles (mountains)", "points": "As printed"}],
    "tips": ["Check wildlife scoring cards carefully—each game uses different ones", "Build large habitat corridors for significant bonuses", "Nature tokens give flexibility—don''t spend carelessly", "Plan for multiple animals, not just one"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Take starting tile", "description": "Each player takes 1 random starting habitat tile and places it in front of them."}, {"title": "Take nature tokens", "description": "Each player takes 3 nature tokens (pine cones).", "tip": "Nature tokens let you break the normal drafting rules."}],
    "boardSetup": [{"title": "Shuffle habitat tiles", "description": "Shuffle all habitat tiles face-down and stack them."}, {"title": "Create tile display", "description": "Reveal 4 tiles in a row - these are available for drafting."}, {"title": "Prepare wildlife tokens", "description": "Place all wildlife tokens in the cloth bag and mix."}, {"title": "Create token display", "description": "Draw 4 tokens and place one below each tile to form pairs."}, {"title": "Choose scoring cards", "description": "Pick one scoring card for each wildlife type (A, B, C, or D sets).", "tip": "Use all A cards for your first game."}, {"title": "Set aside nature token supply", "description": "Place remaining nature tokens where all can reach."}],
    "componentChecklist": [{"name": "Habitat tiles", "quantity": "85"}, {"name": "Wildlife tokens (5 types)", "quantity": "100"}, {"name": "Nature tokens", "quantity": "25"}, {"name": "Wildlife scoring cards", "quantity": "20"}, {"name": "Starting habitat tiles", "quantity": "5"}, {"name": "Cloth bag", "quantity": "1"}, {"name": "Scoring pad", "quantity": "1"}],
    "firstPlayerRule": "The player who most recently took a hike in nature goes first.",
    "quickTips": ["Study the scoring cards carefully before starting", "Nature tokens give flexibility - use them wisely", "Habitat corridors score big bonuses at game end"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Draft", "action": "Take 1 tile + paired token (or use nature token)"}, {"phase": "2. Place tile", "action": "Add tile adjacent to your ecosystem"}, {"phase": "3. Place wildlife", "action": "Put token on matching habitat (optional)"}, {"phase": "4. Refill", "action": "Draw new tile + token for display"}],
    "keyRules": [{"rule": "Nature tokens", "detail": "Take ANY tile with ANY token"}, {"rule": "Overpopulation", "detail": "4+ same wildlife tokens = refresh all"}, {"rule": "Habitat corridors", "detail": "Largest contiguous habitat scores bonus"}, {"rule": "Wildlife placement", "detail": "Only on spaces showing that animal"}],
    "costs": [{"item": "Nature token", "cost": "Free draft OR earn by completing habitat"}, {"item": "Habitat corridor", "cost": "0/1/2/3/5/8/12/15+ tiles = VP"}, {"item": "Wildlife scoring", "cost": "Per scoring card chosen at setup"}, {"item": "Leftover nature tokens", "cost": "1 VP each"}],
    "quickReminders": ["Check scoring cards - each game is different", "Larger habitats = bigger bonuses", "Wildlife tokens cannot move once placed", "Nature tokens are flexible - save for key moments"],
    "endGame": "All tiles placed (20 turns). Score wildlife + habitats + nature tokens."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'cascadia';
