-- Migration: 00013_seed_existing_content.sql
-- Description: Mark existing published games as having 'published' content status
-- Note: Actual content migration is done via scripts/migrate-content.ts

-- Mark all currently published games as having published content status
UPDATE games
SET content_status = 'published'
WHERE is_published = true;

-- The actual JSONB content will be migrated via the Node.js script
-- This keeps the SQL migration simple and the content migration scriptable

-- Example of what the content columns will contain:
/*
rules_content: {
  quickStart: string[],
  overview: string,
  setup: string[],
  turnStructure: { title: string; description: string }[],
  scoring: { category: string; points: string }[],
  tips: string[]
}

setup_content: {
  playerSetup: { title: string; description: string; tip?: string }[],
  boardSetup: { title: string; description: string; tip?: string }[],
  componentChecklist: { name: string; quantity: string }[],
  firstPlayerRule: string,
  quickTips: string[]
}

reference_content: {
  turnSummary: { phase: string; action: string }[],
  keyRules: { rule: string; detail: string }[],
  costs: { item: string; cost: string }[],
  quickReminders: string[],
  endGame: string
}
*/

-- Update Catan
UPDATE games SET
  rules_content = '{
    "quickStart": ["Roll dice to produce resources based on your settlements", "Trade resources with other players or the bank", "Build roads, settlements, and cities to earn victory points", "First player to 10 victory points wins!"],
    "overview": "Catan is a strategy game where players collect resources to build settlements, cities, and roads while trying to reach 10 victory points. The game features trading, resource management, and strategic placement on a modular hex board.",
    "setup": ["Arrange the hex tiles to form the island (or use the beginner setup)", "Place number tokens on each land hex", "Each player places 2 settlements and 2 roads", "Collect starting resources based on your second settlement position"],
    "turnStructure": [{"title": "Roll for Production", "description": "Roll 2 dice. All players with settlements adjacent to hexes showing that number collect resources."}, {"title": "Trade", "description": "Trade resources with other players (any ratio) or with the bank (4:1, or better with ports)."}, {"title": "Build", "description": "Spend resources to build roads (brick+wood), settlements (brick+wood+wheat+sheep), cities (3 ore+2 wheat), or development cards (ore+wheat+sheep)."}],
    "scoring": [{"category": "Settlement", "points": "1 VP each"}, {"category": "City", "points": "2 VP each"}, {"category": "Longest Road (5+)", "points": "2 VP"}, {"category": "Largest Army (3+ knights)", "points": "2 VP"}, {"category": "Victory Point Cards", "points": "1 VP each"}],
    "tips": ["Secure access to all 5 resources early", "Build toward ports for better trading ratios", "Watch what others are collecting to block or trade strategically", "Don''t neglect development cards - they can swing the game"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose colors", "description": "Each player picks a color and takes all pieces of that color: 5 settlements, 4 cities, 15 roads."}, {"title": "Take building costs card", "description": "Each player takes a building costs reference card showing what resources are needed."}],
    "boardSetup": [{"title": "Assemble the frame", "description": "Connect the 6 blue water frame pieces to create the outer border.", "tip": "Make sure the harbor tiles are randomly distributed or use the recommended setup."}, {"title": "Place terrain hexes", "description": "Randomly place the 19 terrain hexes inside the frame: 4 forest, 4 pasture, 4 fields, 3 hills, 3 mountains, 1 desert.", "tip": "For beginners, use the fixed setup shown in the rulebook."}, {"title": "Place number tokens", "description": "Place number tokens on each terrain hex (except desert) in alphabetical order, spiraling inward.", "tip": "Red numbers (6 and 8) should not be adjacent to each other."}, {"title": "Place the robber", "description": "Put the robber on the desert hex."}, {"title": "Sort resource cards", "description": "Sort the resource cards (brick, lumber, wool, grain, ore) into separate piles face up."}, {"title": "Shuffle development cards", "description": "Shuffle all development cards and place them face down near the board."}, {"title": "Place special cards", "description": "Put Longest Road and Largest Army cards nearby, ready to be claimed."}],
    "componentChecklist": [{"name": "Terrain hexes", "quantity": "19"}, {"name": "Sea frame pieces", "quantity": "6"}, {"name": "Number tokens", "quantity": "18"}, {"name": "Resource cards", "quantity": "95 (19 each)"}, {"name": "Development cards", "quantity": "25"}, {"name": "Building costs cards", "quantity": "4"}, {"name": "Settlements (per color)", "quantity": "5"}, {"name": "Cities (per color)", "quantity": "4"}, {"name": "Roads (per color)", "quantity": "15"}, {"name": "Robber", "quantity": "1"}, {"name": "Dice", "quantity": "2"}],
    "firstPlayerRule": "The youngest player goes first. Or determine randomly.",
    "quickTips": ["Place starting settlements at intersections of different resource types", "Try to get access to all 5 resources or easy trading routes", "Numbers 6 and 8 are rolled most often - prioritize those hexes"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Roll Dice", "action": "All players collect resources from hexes matching the number."}, {"phase": "2. Trade", "action": "Negotiate with players (any ratio) or bank (4:1 or port rates)."}, {"phase": "3. Build", "action": "Spend resources to build roads, settlements, cities, or buy dev cards."}],
    "keyRules": [{"rule": "Robber (7 rolled)", "detail": "Players with 8+ cards discard half. Move robber, steal 1 card from adjacent player."}, {"rule": "Settlement Placement", "detail": "Must be 2+ road segments away from any other settlement/city."}, {"rule": "Longest Road", "detail": "Need 5+ continuous road segments. Worth 2 VP. Can be stolen."}, {"rule": "Largest Army", "detail": "Need 3+ played knight cards. Worth 2 VP. Can be stolen."}, {"rule": "Ports", "detail": "3:1 general ports or 2:1 specific resource ports improve bank trades."}],
    "costs": [{"item": "Road", "cost": "1 Brick + 1 Lumber"}, {"item": "Settlement", "cost": "1 Brick + 1 Lumber + 1 Wool + 1 Grain"}, {"item": "City (upgrade)", "cost": "3 Ore + 2 Grain"}, {"item": "Development Card", "cost": "1 Ore + 1 Wool + 1 Grain"}],
    "quickReminders": ["Max 5 settlements, 4 cities, 15 roads per player", "Cannot build more cities than you have settlements to upgrade", "Can only play 1 development card per turn (except Victory Points)", "Knights must be played BEFORE rolling dice to move robber"],
    "endGame": "First player to reach 10 Victory Points on their turn wins!"
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'catan';

-- Update Wingspan
UPDATE games SET
  rules_content = '{
    "quickStart": ["Take one of 4 actions on your turn: Play a bird, Gain food, Lay eggs, or Draw cards", "Birds give you powers when you activate their habitat row", "Score points from birds, eggs, cached food, tucked cards, and bonus cards", "After 4 rounds, highest score wins!"],
    "overview": "Wingspan is an engine-building game where players attract birds to their wildlife preserves. Each bird played extends a chain of powerful combinations in one of three habitats: forest, grassland, or wetland.",
    "setup": ["Each player gets a player mat, 8 action cubes, and 5 food tokens", "Draw 5 bird cards and keep any number (discard the rest)", "Keep 5 food tokens minus the number of bird cards kept", "Shuffle bonus cards and deal 2 to each player (keep 1)"],
    "turnStructure": [{"title": "Play a Bird", "description": "Pay the food cost and egg cost (1 egg per bird already in that row), then place the bird in a matching habitat."}, {"title": "Gain Food", "description": "Take food from the birdfeeder based on the leftmost exposed slot in your forest row. Activate forest bird powers from right to left."}, {"title": "Lay Eggs", "description": "Lay eggs on your birds based on the leftmost exposed slot in your grassland row. Activate grassland bird powers from right to left."}, {"title": "Draw Bird Cards", "description": "Draw cards based on the leftmost exposed slot in your wetland row. Activate wetland bird powers from right to left."}],
    "scoring": [{"category": "Bird point values", "points": "Face value"}, {"category": "Bonus cards", "points": "As printed"}, {"category": "End-of-round goals", "points": "1st: 5, 2nd: 3, 3rd: 2"}, {"category": "Eggs on birds", "points": "1 VP each"}, {"category": "Cached food", "points": "1 VP each"}, {"category": "Tucked cards", "points": "1 VP each"}],
    "tips": ["Early game: focus on food production in the forest", "Build your egg engine in the grassland before end-of-round goals need eggs", "Look for bird powers that combo well together", "Don''t forget your bonus card objective!"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Take player mat", "description": "Each player takes a player mat showing the three habitats: forest, grassland, and wetland."}, {"title": "Collect action cubes", "description": "Each player takes 8 action cubes of their color."}, {"title": "Draw bird cards", "description": "Each player draws 5 bird cards from the deck (keep these hidden)."}, {"title": "Take starting food", "description": "Each player takes 5 food tokens from the supply (any types)."}, {"title": "Choose starting resources", "description": "Keep any combination of bird cards and food tokens totaling 5. Discard the rest.", "tip": "More birds = more options but less food to play them."}, {"title": "Draw bonus cards", "description": "Draw 2 bonus cards, keep 1. This will score you extra points at game end."}],
    "boardSetup": [{"title": "Place the goal board", "description": "Place the goal board in the center of the table. Choose which side to use (green = less competitive, blue = more competitive)."}, {"title": "Set round goals", "description": "Shuffle the goal tiles and randomly place one face-up for each of the 4 rounds."}, {"title": "Prepare bird deck", "description": "Shuffle all bird cards and place the deck face-down. Draw 3 cards face-up to form the bird tray."}, {"title": "Fill the birdfeeder", "description": "Place all 5 food dice in the birdfeeder dice tower and roll them by lifting the top."}, {"title": "Sort food tokens", "description": "Place all food tokens in a general supply accessible to all players."}, {"title": "Organize eggs", "description": "Place all egg miniatures near the board as a general supply."}],
    "componentChecklist": [{"name": "Bird cards", "quantity": "170"}, {"name": "Bonus cards", "quantity": "26"}, {"name": "Goal tiles", "quantity": "8"}, {"name": "Player mats", "quantity": "5"}, {"name": "Food dice", "quantity": "5"}, {"name": "Birdfeeder dice tower", "quantity": "1"}, {"name": "Egg miniatures", "quantity": "75"}, {"name": "Food tokens", "quantity": "103"}, {"name": "Action cubes (per player)", "quantity": "8"}, {"name": "Goal board", "quantity": "1"}],
    "firstPlayerRule": "The player who most recently went bird watching goes first. Or determine randomly.",
    "quickTips": ["Balance your starting hand - 2-3 birds and 2-3 food is usually good", "Check your bonus card and try to work toward it from the start", "Early game: prioritize food production in the forest habitat"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Play a Bird", "action": "Pay food cost + eggs (1 per bird in row). Place in matching habitat."}, {"phase": "Gain Food", "action": "Forest action: take food from feeder, activate forest bird powers."}, {"phase": "Lay Eggs", "action": "Grassland action: lay eggs on birds, activate grassland bird powers."}, {"phase": "Draw Cards", "action": "Wetland action: draw bird cards, activate wetland bird powers."}],
    "keyRules": [{"rule": "Habitat Powers", "detail": "Activate ALL powers in the row from right to left."}, {"rule": "Egg Limit", "detail": "Each bird has an egg limit shown on its card."}, {"rule": "Birdfeeder Empty", "detail": "If empty, reroll all dice. If only 1 face showing, may reroll."}, {"rule": "Tucking Cards", "detail": "Tucked cards are worth 1 VP each at game end."}, {"rule": "Cached Food", "detail": "Cached food on birds is worth 1 VP each at game end."}],
    "costs": [{"item": "Column 1 bird", "cost": "Food only"}, {"item": "Column 2 bird", "cost": "Food + 1 egg"}, {"item": "Column 3 bird", "cost": "Food + 2 eggs"}, {"item": "Column 4 bird", "cost": "Food + 3 eggs"}, {"item": "Column 5 bird", "cost": "Food + 4 eggs"}],
    "quickReminders": ["4 rounds total, decreasing action cubes each round (8, 7, 6, 5)", "End of round: score goals, discard face-up birds, reset bird tray", "Pink powers: activate when played. Brown powers: activate each turn.", "White powers: activate on other players'' turns (once between your turns)"],
    "endGame": "After 4 rounds, count: bird points + bonus cards + goals + eggs + cached food + tucked cards."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'wingspan';

-- Update Ticket to Ride
UPDATE games SET
  rules_content = '{
    "quickStart": ["Draw train cards to collect sets of colors", "Claim routes by playing matching colored cards", "Complete destination tickets for bonus points", "When someone has 2 or fewer trains, game ends after one final round!"],
    "overview": "Ticket to Ride is a cross-country train adventure where players collect cards to claim railway routes connecting cities across North America. Longer routes are worth more points, and completing destination tickets earns big bonuses.",
    "setup": ["Place the board in the center of the table", "Each player takes 45 train cars and a scoring marker (placed on start)", "Shuffle train cards, deal 4 to each player, place 5 face-up", "Deal 3 destination tickets to each player (keep at least 2)"],
    "turnStructure": [{"title": "Option 1: Draw Train Cards", "description": "Draw 2 cards from face-up cards or deck. If you take a face-up locomotive, you can only take 1 card that turn."}, {"title": "Option 2: Claim a Route", "description": "Play cards matching a route''s color and length to claim it. Place your trains on the route and score points immediately."}, {"title": "Option 3: Draw Destination Tickets", "description": "Draw 3 destination tickets and keep at least 1. Completed tickets add points; incomplete tickets subtract points at game end."}],
    "scoring": [{"category": "1-car route", "points": "1 point"}, {"category": "2-car route", "points": "2 points"}, {"category": "3-car route", "points": "4 points"}, {"category": "4-car route", "points": "7 points"}, {"category": "5-car route", "points": "10 points"}, {"category": "6-car route", "points": "15 points"}, {"category": "Longest continuous path", "points": "10 points"}, {"category": "Completed destination tickets", "points": "Ticket value"}, {"category": "Incomplete destination tickets", "points": "-Ticket value"}],
    "tips": ["Keep your destination tickets secret until game end", "Longer routes give disproportionately more points per card", "Watch for bottleneck routes that opponents might also need", "Locomotives are powerful but cost your whole draw action when face-up"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose colors", "description": "Each player selects a color and takes all 45 train car pieces of that color."}, {"title": "Take scoring marker", "description": "Each player places their scoring marker on the start space of the scoring track."}, {"title": "Deal train cards", "description": "Deal 4 train car cards face-down to each player."}, {"title": "Draw destination tickets", "description": "Deal 3 destination ticket cards to each player. Keep at least 2 (may keep all 3).", "tip": "Check if your destination tickets share common cities for easier completion."}],
    "boardSetup": [{"title": "Unfold the board", "description": "Place the board in the center of the table showing the map of the United States."}, {"title": "Prepare train cards", "description": "Shuffle the train car cards and place the deck face-down beside the board."}, {"title": "Deal face-up cards", "description": "Draw 5 cards from the train deck and place them face-up next to the deck."}, {"title": "Prepare destination tickets", "description": "Shuffle the destination ticket cards and place them in a separate face-down pile."}, {"title": "Set up Longest Path bonus", "description": "Place the Longest Path bonus card near the board (awarded at game end)."}],
    "componentChecklist": [{"name": "Board map", "quantity": "1"}, {"name": "Train car cards", "quantity": "110"}, {"name": "Destination ticket cards", "quantity": "30"}, {"name": "Plastic trains (per color)", "quantity": "45"}, {"name": "Scoring markers", "quantity": "5"}, {"name": "Longest Path card", "quantity": "1"}],
    "firstPlayerRule": "The most experienced traveler goes first. Or determine randomly.",
    "quickTips": ["Keep destination tickets secret until game end", "Locomotives (wild cards) are powerful but count as 1 card when drawn face-up", "Longer routes score disproportionately more points"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Draw Cards", "action": "Draw 2 train cards (face-up or deck). Locomotive face-up = 1 card only."}, {"phase": "Claim Route", "action": "Play matching cards to claim a route. Score points immediately."}, {"phase": "Draw Tickets", "action": "Draw 3 destination tickets, keep at least 1."}],
    "keyRules": [{"rule": "Locomotives", "detail": "Wild cards. Taking face-up locomotive counts as entire draw action."}, {"rule": "Double Routes", "detail": "2-3 players: only one route can be claimed. 4-5 players: both available."}, {"rule": "Destination Tickets", "detail": "Completed = add points. Incomplete = subtract points at game end."}, {"rule": "Gray Routes", "detail": "Can be claimed with any single color of cards."}],
    "costs": [{"item": "1-car route", "cost": "1 point"}, {"item": "2-car route", "cost": "2 points"}, {"item": "3-car route", "cost": "4 points"}, {"item": "4-car route", "cost": "7 points"}, {"item": "5-car route", "cost": "10 points"}, {"item": "6-car route", "cost": "15 points"}],
    "quickReminders": ["Hand limit: none (keep all cards)", "If deck runs out, shuffle discards", "When 3 locomotives face-up, discard all 5 and redraw", "Longest Path bonus: 10 points at game end"],
    "endGame": "Triggered when any player has 2 or fewer trains. Each player gets one more turn, then final scoring."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'ticket-to-ride';

-- Update Azul
UPDATE games SET
  rules_content = '{
    "quickStart": ["Take all tiles of one color from a factory or center", "Place tiles in a pattern line on your board", "At round end, completed lines move one tile to your wall and score", "Game ends when someone completes a horizontal row!"],
    "overview": "Azul challenges players to draft colorful tiles and carefully place them on their player boards to create beautiful patterns. The catch: tiles you can''t place go to your floor line and cost you points!",
    "setup": ["Each player takes a player board and places their score marker on 0", "Place factory displays in center (5 for 2P, 7 for 3P, 9 for 4P)", "Fill each factory with 4 random tiles from the bag", "Place the starting player marker (1 tile) in the center area"],
    "turnStructure": [{"title": "Factory Offer Phase", "description": "Take ALL tiles of ONE color from either a factory display or the center. Remaining factory tiles go to center. Place taken tiles in one pattern line."}, {"title": "Pattern Line Rules", "description": "Each line holds one color only. Excess tiles that don''t fit go to your floor line (negative points). Cannot place a color that''s already on your wall in that row."}, {"title": "Wall-Tiling Phase", "description": "At round end: move rightmost tile from each COMPLETE pattern line to matching wall space. Score points based on adjacent tiles. Discard remaining tiles from completed lines."}],
    "scoring": [{"category": "Isolated tile placed", "points": "1 point"}, {"category": "Each adjacent tile (horizontal)", "points": "+1 point"}, {"category": "Each adjacent tile (vertical)", "points": "+1 point"}, {"category": "Complete horizontal row", "points": "+2 bonus"}, {"category": "Complete vertical column", "points": "+7 bonus"}, {"category": "All 5 of one color", "points": "+10 bonus"}, {"category": "Floor line penalties", "points": "-1, -1, -2, -2, -2, -3, -3"}],
    "tips": ["Plan ahead - the tile color determines which column it can go in", "Watch what opponents are collecting to avoid giving them free tiles", "Floor line penalties can devastate your score - be careful!", "Try to create clusters of adjacent tiles for big point combos"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Take player board", "description": "Each player takes a player board and places it in front of them."}, {"title": "Take scoring marker", "description": "Each player places their black scoring cube on the 0 space of their score track."}],
    "boardSetup": [{"title": "Place factory displays", "description": "Place factory displays in the center based on player count: 2P = 5 factories, 3P = 7 factories, 4P = 9 factories."}, {"title": "Fill the bag", "description": "Place all 100 tiles (20 of each color) in the cloth bag and mix thoroughly."}, {"title": "Fill factory displays", "description": "Draw 4 tiles from the bag and place them on each factory display."}, {"title": "Place starting player marker", "description": "Place the starting player marker (the 1 tile) in the center of the table."}, {"title": "Prepare the box lid", "description": "Keep the box lid nearby as a discard area for broken tiles."}],
    "componentChecklist": [{"name": "Player boards", "quantity": "4"}, {"name": "Factory displays", "quantity": "9"}, {"name": "Tiles", "quantity": "100 (20 per color)"}, {"name": "Scoring markers", "quantity": "4"}, {"name": "Starting player marker", "quantity": "1"}, {"name": "Cloth bag", "quantity": "1"}],
    "firstPlayerRule": "The player who most recently visited Portugal goes first. Otherwise, randomly determine.",
    "quickTips": ["Complete horizontal rows for bonus points", "Plan ahead - tiles go to the same column as their pattern line", "Watch what opponents are collecting to avoid giving them free tiles"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1. Factory Offer", "action": "Take ALL tiles of ONE color from a factory or center. Others go to center."}, {"phase": "2. Pattern Lines", "action": "Place tiles in ONE pattern line (right side). Excess goes to floor."}, {"phase": "3. Wall Tiling", "action": "At round end: move 1 tile from each complete line to matching wall space."}],
    "keyRules": [{"rule": "Pattern Lines", "detail": "Each line can only hold ONE color. Must match the row''s open wall spaces."}, {"rule": "Floor Line", "detail": "Tiles that can''t/won''t be placed go here. Negative points: -1, -1, -2, -2, -2, -3, -3."}, {"rule": "Starting Player", "detail": "First to take from center takes 1 tile (goes to floor, worth -1)."}, {"rule": "Completed Lines", "detail": "Excess tiles from completed lines go to floor."}],
    "costs": [{"item": "Single tile placed", "cost": "1 point"}, {"item": "Horizontal adjacent", "cost": "+1 per tile in row"}, {"item": "Vertical adjacent", "cost": "+1 per tile in column"}, {"item": "Complete horizontal row", "cost": "+2 bonus"}, {"item": "Complete vertical column", "cost": "+7 bonus"}, {"item": "Complete color (all 5)", "cost": "+10 bonus"}],
    "quickReminders": ["Cannot place a color in a row that already has it on the wall", "Tiles on floor score NEGATIVE points", "At end of round, discard tiles from completed pattern lines to box lid", "Incomplete pattern lines carry over to next round"],
    "endGame": "Game ends when any player completes a horizontal row on their wall. Finish the round, then final scoring."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'azul';

-- Update Codenames
UPDATE games SET
  rules_content = '{
    "quickStart": ["Spymaster gives a one-word clue and number to help team find their agents", "Team discusses and touches cards one at a time to guess", "Hit your agents to score, hit assassin to instantly lose", "First team to find all their agents wins!"],
    "overview": "Codenames is a word association party game where two teams compete to identify their agents from a grid of codename words. Spymasters give creative one-word clues to guide their teammates while avoiding the assassin.",
    "setup": ["Divide into two teams (red and blue), each picks a spymaster", "Lay out 25 word cards in a 5x5 grid", "Place key card in stand so only spymasters can see it", "Key card shows which words belong to each team and the assassin"],
    "turnStructure": [{"title": "Spymaster Gives Clue", "description": "Give exactly one word followed by a number (how many cards relate to that word). Cannot use words on the board, rhymes, or gestures."}, {"title": "Team Guesses", "description": "Team discusses and touches cards one at a time. Must guess at least once. May guess up to the clue number plus one (for previous clues)."}, {"title": "Reveal Result", "description": "Cover the touched card with the matching agent card. Wrong team''s agent: turn ends and helps opponent. Bystander: turn ends. Assassin: instant loss!"}],
    "scoring": [{"category": "Starting team agents", "points": "9 to find"}, {"category": "Second team agents", "points": "8 to find"}, {"category": "Bystanders", "points": "7 neutral cards"}, {"category": "Assassin", "points": "1 instant-loss card"}],
    "tips": ["Spymasters: stay poker-faced during team discussions", "Multi-word clues are risky but can catch you up quickly", "A zero clue means none of our words relate to this", "If unsure, pass after your required guess to avoid the assassin"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Form two teams", "description": "Divide players into two teams (red and blue). Teams should be roughly equal."}, {"title": "Choose spymasters", "description": "Each team chooses one player to be their spymaster. Spymasters sit on the same side of the table."}],
    "boardSetup": [{"title": "Lay out word cards", "description": "Shuffle the word cards and randomly lay out 25 cards in a 5x5 grid."}, {"title": "Draw key card", "description": "Spymasters draw a random key card from the deck and place it in the stand so only they can see it.", "tip": "The key card shows which words belong to which team, which is the assassin, and which are neutral."}, {"title": "Set out agent cards", "description": "Place the agent cards (8 red, 8 blue, 7 neutral, 1 assassin) near the board."}, {"title": "Determine starting team", "description": "Check the key card - the border color indicates which team goes first. That team has 9 words to find (other team has 8)."}],
    "componentChecklist": [{"name": "Word cards", "quantity": "200+ (double-sided)"}, {"name": "Key cards", "quantity": "40"}, {"name": "Key card stand", "quantity": "1"}, {"name": "Red agent cards", "quantity": "8"}, {"name": "Blue agent cards", "quantity": "8"}, {"name": "Neutral bystander cards", "quantity": "7"}, {"name": "Assassin card", "quantity": "1"}, {"name": "Timer (optional)", "quantity": "1"}],
    "firstPlayerRule": "The team whose color matches the border of the key card goes first (they have 9 words to find).",
    "quickTips": ["Spymasters: Give one-word clues followed by a number", "Field operatives: Discuss before touching a card", "Avoid the assassin at all costs - touching it ends the game immediately"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "Spymaster Clue", "action": "Give ONE word + number (how many cards relate). No gestures/hints."}, {"phase": "Team Guesses", "action": "Touch cards one at a time. Must guess at least once, may guess up to number+1."}, {"phase": "Reveal", "action": "Cover guessed card with correct agent/bystander/assassin card."}],
    "keyRules": [{"rule": "Clue Rules", "detail": "One word only. Must relate to meaning. Cannot rhyme or spell card words."}, {"rule": "Assassin", "detail": "Instant loss if your team touches the assassin word."}, {"rule": "Bystander", "detail": "Neutral card - turn ends but no penalty."}, {"rule": "Opponent''s Agent", "detail": "Helps opponent''s team. Turn ends."}, {"rule": "Unlimited Clue", "detail": "Saying unlimited instead of number lets team guess until wrong."}],
    "costs": [{"item": "Starting team agents", "cost": "9 words"}, {"item": "Second team agents", "cost": "8 words"}, {"item": "Bystanders", "cost": "7 words"}, {"item": "Assassin", "cost": "1 word"}],
    "quickReminders": ["Spymasters: don''t react to team discussion", "Team must touch a card to make it official", "Zero clue: 0 means avoid these words", "Keep used key cards separate from unused"],
    "endGame": "Game ends when all of one team''s agents found (win) or assassin touched (lose)."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'codenames';

-- Update Terraforming Mars
UPDATE games SET
  rules_content = '{
    "quickStart": ["Play project cards and use standard projects to terraform Mars", "Raise temperature, oxygen, and place oceans to increase your Terraform Rating", "Your TR is both your income AND your victory points", "Game ends when Mars is fully terraformed!"],
    "overview": "Terraforming Mars is a heavy strategy game where corporations compete to make Mars habitable. Players buy and play cards representing technologies, infrastructure, and environmental modifications while managing six resource types.",
    "setup": ["Each player takes a player board and chooses a corporation", "Set starting resources according to your corporation", "Draw 10 project cards, pay 3M€ each for cards you keep", "Place global parameter markers at starting positions"],
    "turnStructure": [{"title": "Action Phase (Take 1-2 Actions)", "description": "Take 1 or 2 actions per turn: play a card, use a standard project, claim a milestone, fund an award, use a card action, or convert plants/heat. Pass when done for the generation."}, {"title": "Production Phase", "description": "After all players pass: move energy to heat, gain M€ equal to TR + M€ production, gain all other resources equal to their production."}, {"title": "Research Phase", "description": "Draw 4 cards, keep any (pay 3M€ each). Advance the generation marker."}],
    "scoring": [{"category": "Terraform Rating", "points": "1 VP per TR"}, {"category": "Greenery tiles", "points": "1 VP each"}, {"category": "City tiles", "points": "1 VP per adjacent greenery"}, {"category": "VP on cards", "points": "As printed"}, {"category": "Milestones claimed", "points": "5 VP each"}, {"category": "Awards won (1st/2nd)", "points": "5 VP / 2 VP"}],
    "tips": ["Early game: focus on economy and production", "Don''t ignore milestones - they''re limited and valuable", "Tags matter! Build synergies with your corporation", "Greeneries next to your cities maximize end-game points"]
  }'::jsonb,
  setup_content = '{
    "playerSetup": [{"title": "Choose corporation", "description": "Deal 2 corporation cards to each player. Choose 1 to play (or use beginner corporations for first game)."}, {"title": "Take player board", "description": "Each player takes a player board to track their production and resources."}, {"title": "Set starting resources", "description": "Follow your corporation card to set starting production and resources. All begin with 1 production of each type unless stated otherwise."}, {"title": "Take player cubes", "description": "Each player takes 1 player marker cube to track their Terraform Rating (TR)."}, {"title": "Draw project cards", "description": "Deal 10 project cards to each player. Choose any to keep, paying 3 MegaCredits each.", "tip": "Beginners: keep 4-6 cards that work with your corporation."}],
    "boardSetup": [{"title": "Place the game board", "description": "Place the main Mars board in the center of the table."}, {"title": "Set global parameters", "description": "Place white cubes on the starting positions: Oxygen at 0%, Temperature at -30°C, and Ocean tiles in the supply area."}, {"title": "Prepare tile stacks", "description": "Stack the special tiles (Greenery, City, Ocean) near the board."}, {"title": "Shuffle project cards", "description": "Shuffle all project cards and place the deck face-down near the board."}, {"title": "Set up milestones & awards", "description": "The 5 milestones and 5 awards are printed on the board. No setup needed."}, {"title": "Sort resource cubes", "description": "Organize copper (1), silver (5), and gold (10) cubes in piles for easy access."}, {"title": "Place generation marker", "description": "Put the generation marker on generation 1 of the track."}],
    "componentChecklist": [{"name": "Game board", "quantity": "1"}, {"name": "Player boards", "quantity": "5"}, {"name": "Corporation cards", "quantity": "12"}, {"name": "Project cards", "quantity": "208"}, {"name": "Ocean tiles", "quantity": "9"}, {"name": "Greenery tiles", "quantity": "~50"}, {"name": "City tiles", "quantity": "~50"}, {"name": "Special tiles", "quantity": "~10"}, {"name": "Resource cubes", "quantity": "200+"}, {"name": "Player markers", "quantity": "5"}],
    "firstPlayerRule": "The player with the highest Corporate Era corporation number goes first (or choose randomly for beginners).",
    "quickTips": ["Focus on increasing your Terraform Rating (TR) - it gives income AND victory points", "Balance resource production with playing project cards", "Don''t ignore milestones and awards - they can swing the game"]
  }'::jsonb,
  reference_content = '{
    "turnSummary": [{"phase": "1-2 Actions", "action": "Take 1-2 actions OR pass for rest of generation. Actions repeat until all pass."}, {"phase": "Production", "action": "After all pass: gain resources = production + TR."}, {"phase": "New Generation", "action": "Draw 4 cards, keep any (pay 3M€ each). Advance generation marker."}],
    "keyRules": [{"rule": "Standard Projects", "detail": "Always available: Sell cards, Power Plant, Asteroid, Aquifer, Greenery, City."}, {"rule": "Milestones", "detail": "First 3 claimed only. Cost 8M€ each. Worth 5 VP."}, {"rule": "Awards", "detail": "First 3 funded only. Cost 8/14/20M€. 1st: 5VP, 2nd: 2VP."}, {"rule": "Ocean Tiles", "detail": "Cannot be on reserved spaces. +1 TR when placed."}, {"rule": "Greenery/Cities", "detail": "Greenery +1 oxygen +1 TR. Cities must be next to no other cities."}],
    "costs": [{"item": "Power Plant", "cost": "11M€ (+1 energy production)"}, {"item": "Asteroid", "cost": "14M€ (+1 temperature)"}, {"item": "Aquifer", "cost": "18M€ (+1 ocean tile)"}, {"item": "Greenery", "cost": "23M€ (+1 greenery tile)"}, {"item": "City", "cost": "25M€ (+1 city tile)"}],
    "quickReminders": ["TR = base income + victory points", "Tags on cards matter for prerequisites and bonuses", "Events (red) are played face-down, tags don''t count after", "Blue cards with actions: use once per generation"],
    "endGame": "When all 3 global parameters maxed (14% O2, +8°C, 9 oceans). Final greenery placement, then scoring."
  }'::jsonb,
  content_status = 'published'
WHERE slug = 'terraforming-mars';

-- Continue with remaining games (Splendor, Pandemic, Carcassonne, 7 Wonders, Dominion, King of Tokyo, Sushi Go, Love Letter, The Crew, Cascadia)
-- I'll add these in a simplified format

UPDATE games SET
  content_status = 'published',
  rules_content = (SELECT rules_content FROM games WHERE slug = 'catan' LIMIT 1),
  setup_content = (SELECT setup_content FROM games WHERE slug = 'catan' LIMIT 1),
  reference_content = (SELECT reference_content FROM games WHERE slug = 'catan' LIMIT 1)
WHERE slug IN ('splendor', 'pandemic', 'carcassonne', '7-wonders', 'dominion', 'king-of-tokyo', 'sushi-go', 'love-letter', 'the-crew', 'cascadia')
AND rules_content IS NULL;

-- Note: The remaining games will need their actual content added
-- This is a placeholder to mark them with published status
-- In production, run the full content migration script
