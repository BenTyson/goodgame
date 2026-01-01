import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, ExternalLink, Users, Clock, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getGameBySlug, getAllGameSlugs } from '@/lib/supabase/queries'
import { HowToJsonLd, BreadcrumbJsonLd } from '@/lib/seo'

interface RulesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: RulesPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: `How to Play ${game.name}`,
    description: `Learn how to play ${game.name} with our quick rules summary. Easy-to-follow guide covering setup, turn structure, and scoring.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Type for AI-generated content
interface AIRulesContent {
  quickStart: string[]
  overview: string
  coreRules?: { title: string; points: string[] }[]
  turnStructure: { phase?: string; title?: string; description: string }[]
  scoring?: { category: string; points: string }[]
  endGame?: string // Legacy field
  endGameConditions?: string[]
  winCondition?: string
  tips: string[]
}

// Type for legacy hardcoded content
interface LegacyRulesContent {
  quickStart: string[]
  overview: string
  setup: string[]
  turnStructure: { title: string; description: string }[]
  scoring: { category: string; points: string }[]
  tips: string[]
}

type RulesContent = AIRulesContent | LegacyRulesContent

// Helper to check if content is AI-generated format
function isAIContent(content: RulesContent): content is AIRulesContent {
  return 'coreRules' in content || 'endGame' in content || 'endGameConditions' in content
}

// Placeholder rules content - in production this would come from MDX files
const rulesContent: Record<string, LegacyRulesContent> = {
  catan: {
    quickStart: [
      'Roll dice to produce resources based on your settlements',
      'Trade resources with other players or the bank',
      'Build roads, settlements, and cities to earn victory points',
      'First player to 10 victory points wins!',
    ],
    overview:
      'Catan is a strategy game where players collect resources to build settlements, cities, and roads while trying to reach 10 victory points. The game features trading, resource management, and strategic placement on a modular hex board.',
    setup: [
      'Arrange the hex tiles to form the island (or use the beginner setup)',
      'Place number tokens on each land hex',
      'Each player places 2 settlements and 2 roads',
      'Collect starting resources based on your second settlement position',
    ],
    turnStructure: [
      {
        title: 'Roll for Production',
        description:
          'Roll 2 dice. All players with settlements adjacent to hexes showing that number collect resources.',
      },
      {
        title: 'Trade',
        description:
          'Trade resources with other players (any ratio) or with the bank (4:1, or better with ports).',
      },
      {
        title: 'Build',
        description:
          'Spend resources to build roads (brick+wood), settlements (brick+wood+wheat+sheep), cities (3 ore+2 wheat), or development cards (ore+wheat+sheep).',
      },
    ],
    scoring: [
      { category: 'Settlement', points: '1 VP each' },
      { category: 'City', points: '2 VP each' },
      { category: 'Longest Road (5+)', points: '2 VP' },
      { category: 'Largest Army (3+ knights)', points: '2 VP' },
      { category: 'Victory Point Cards', points: '1 VP each' },
    ],
    tips: [
      'Secure access to all 5 resources early',
      'Build toward ports for better trading ratios',
      'Watch what others are collecting to block or trade strategically',
      "Don't neglect development cards - they can swing the game",
    ],
  },
  wingspan: {
    quickStart: [
      'Take one of 4 actions on your turn: Play a bird, Gain food, Lay eggs, or Draw cards',
      'Birds give you powers when you activate their habitat row',
      'Score points from birds, eggs, cached food, tucked cards, and bonus cards',
      'After 4 rounds, highest score wins!',
    ],
    overview:
      'Wingspan is an engine-building game where players attract birds to their wildlife preserves. Each bird played extends a chain of powerful combinations in one of three habitats: forest, grassland, or wetland.',
    setup: [
      'Each player gets a player mat, 8 action cubes, and 5 food tokens',
      'Draw 5 bird cards and keep any number (discard the rest)',
      'Keep 5 food tokens minus the number of bird cards kept',
      'Shuffle bonus cards and deal 2 to each player (keep 1)',
    ],
    turnStructure: [
      {
        title: 'Play a Bird',
        description:
          'Pay the food cost and egg cost (1 egg per bird already in that row), then place the bird in a matching habitat.',
      },
      {
        title: 'Gain Food',
        description:
          'Take food from the birdfeeder based on the leftmost exposed slot in your forest row. Activate forest bird powers from right to left.',
      },
      {
        title: 'Lay Eggs',
        description:
          'Lay eggs on your birds based on the leftmost exposed slot in your grassland row. Activate grassland bird powers from right to left.',
      },
      {
        title: 'Draw Bird Cards',
        description:
          'Draw cards based on the leftmost exposed slot in your wetland row. Activate wetland bird powers from right to left.',
      },
    ],
    scoring: [
      { category: 'Bird point values', points: 'Face value' },
      { category: 'Bonus cards', points: 'As printed' },
      { category: 'End-of-round goals', points: '1st: 5, 2nd: 3, 3rd: 2' },
      { category: 'Eggs on birds', points: '1 VP each' },
      { category: 'Cached food', points: '1 VP each' },
      { category: 'Tucked cards', points: '1 VP each' },
    ],
    tips: [
      'Early game: focus on food production in the forest',
      'Build your egg engine in the grassland before end-of-round goals need eggs',
      'Look for bird powers that combo well together',
      "Don't forget your bonus card objective!",
    ],
  },
  'ticket-to-ride': {
    quickStart: [
      'Draw train cards to collect sets of colors',
      'Claim routes by playing matching colored cards',
      'Complete destination tickets for bonus points',
      'When someone has 2 or fewer trains, game ends after one final round!',
    ],
    overview:
      'Ticket to Ride is a cross-country train adventure where players collect cards to claim railway routes connecting cities across North America. Longer routes are worth more points, and completing destination tickets earns big bonuses.',
    setup: [
      'Place the board in the center of the table',
      'Each player takes 45 train cars and a scoring marker (placed on start)',
      'Shuffle train cards, deal 4 to each player, place 5 face-up',
      'Deal 3 destination tickets to each player (keep at least 2)',
    ],
    turnStructure: [
      {
        title: 'Option 1: Draw Train Cards',
        description:
          'Draw 2 cards from face-up cards or deck. If you take a face-up locomotive, you can only take 1 card that turn.',
      },
      {
        title: 'Option 2: Claim a Route',
        description:
          'Play cards matching a route\'s color and length to claim it. Place your trains on the route and score points immediately.',
      },
      {
        title: 'Option 3: Draw Destination Tickets',
        description:
          'Draw 3 destination tickets and keep at least 1. Completed tickets add points; incomplete tickets subtract points at game end.',
      },
    ],
    scoring: [
      { category: '1-car route', points: '1 point' },
      { category: '2-car route', points: '2 points' },
      { category: '3-car route', points: '4 points' },
      { category: '4-car route', points: '7 points' },
      { category: '5-car route', points: '10 points' },
      { category: '6-car route', points: '15 points' },
      { category: 'Longest continuous path', points: '10 points' },
      { category: 'Completed destination tickets', points: 'Ticket value' },
      { category: 'Incomplete destination tickets', points: '-Ticket value' },
    ],
    tips: [
      'Keep your destination tickets secret until game end',
      'Longer routes give disproportionately more points per card',
      'Watch for bottleneck routes that opponents might also need',
      'Locomotives are powerful but cost your whole draw action when face-up',
    ],
  },
  azul: {
    quickStart: [
      'Take all tiles of one color from a factory or center',
      'Place tiles in a pattern line on your board',
      'At round end, completed lines move one tile to your wall and score',
      'Game ends when someone completes a horizontal row!',
    ],
    overview:
      'Azul challenges players to draft colorful tiles and carefully place them on their player boards to create beautiful patterns. The catch: tiles you can\'t place go to your floor line and cost you points!',
    setup: [
      'Each player takes a player board and places their score marker on 0',
      'Place factory displays in center (5 for 2P, 7 for 3P, 9 for 4P)',
      'Fill each factory with 4 random tiles from the bag',
      'Place the starting player marker (1 tile) in the center area',
    ],
    turnStructure: [
      {
        title: 'Factory Offer Phase',
        description:
          'Take ALL tiles of ONE color from either a factory display or the center. Remaining factory tiles go to center. Place taken tiles in one pattern line.',
      },
      {
        title: 'Pattern Line Rules',
        description:
          'Each line holds one color only. Excess tiles that don\'t fit go to your floor line (negative points). Cannot place a color that\'s already on your wall in that row.',
      },
      {
        title: 'Wall-Tiling Phase',
        description:
          'At round end: move rightmost tile from each COMPLETE pattern line to matching wall space. Score points based on adjacent tiles. Discard remaining tiles from completed lines.',
      },
    ],
    scoring: [
      { category: 'Isolated tile placed', points: '1 point' },
      { category: 'Each adjacent tile (horizontal)', points: '+1 point' },
      { category: 'Each adjacent tile (vertical)', points: '+1 point' },
      { category: 'Complete horizontal row', points: '+2 bonus' },
      { category: 'Complete vertical column', points: '+7 bonus' },
      { category: 'All 5 of one color', points: '+10 bonus' },
      { category: 'Floor line penalties', points: '-1, -1, -2, -2, -2, -3, -3' },
    ],
    tips: [
      'Plan ahead - the tile color determines which column it can go in',
      'Watch what opponents are collecting to avoid giving them free tiles',
      'Floor line penalties can devastate your score - be careful!',
      'Try to create clusters of adjacent tiles for big point combos',
    ],
  },
  codenames: {
    quickStart: [
      'Spymaster gives a one-word clue and number to help team find their agents',
      'Team discusses and touches cards one at a time to guess',
      'Hit your agents to score, hit assassin to instantly lose',
      'First team to find all their agents wins!',
    ],
    overview:
      'Codenames is a word association party game where two teams compete to identify their agents from a grid of codename words. Spymasters give creative one-word clues to guide their teammates while avoiding the assassin.',
    setup: [
      'Divide into two teams (red and blue), each picks a spymaster',
      'Lay out 25 word cards in a 5x5 grid',
      'Place key card in stand so only spymasters can see it',
      'Key card shows which words belong to each team and the assassin',
    ],
    turnStructure: [
      {
        title: 'Spymaster Gives Clue',
        description:
          'Give exactly one word followed by a number (how many cards relate to that word). Cannot use words on the board, rhymes, or gestures.',
      },
      {
        title: 'Team Guesses',
        description:
          'Team discusses and touches cards one at a time. Must guess at least once. May guess up to the clue number plus one (for previous clues).',
      },
      {
        title: 'Reveal Result',
        description:
          'Cover the touched card with the matching agent card. Wrong team\'s agent: turn ends and helps opponent. Bystander: turn ends. Assassin: instant loss!',
      },
    ],
    scoring: [
      { category: 'Starting team agents', points: '9 to find' },
      { category: 'Second team agents', points: '8 to find' },
      { category: 'Bystanders', points: '7 neutral cards' },
      { category: 'Assassin', points: '1 instant-loss card' },
    ],
    tips: [
      'Spymasters: stay poker-faced during team discussions',
      'Multi-word clues are risky but can catch you up quickly',
      'A "zero" clue means "none of our words relate to this"',
      'If unsure, pass after your required guess to avoid the assassin',
    ],
  },
  'terraforming-mars': {
    quickStart: [
      'Play project cards and use standard projects to terraform Mars',
      'Raise temperature, oxygen, and place oceans to increase your Terraform Rating',
      'Your TR is both your income AND your victory points',
      'Game ends when Mars is fully terraformed!',
    ],
    overview:
      'Terraforming Mars is a heavy strategy game where corporations compete to make Mars habitable. Players buy and play cards representing technologies, infrastructure, and environmental modifications while managing six resource types.',
    setup: [
      'Each player takes a player board and chooses a corporation',
      'Set starting resources according to your corporation',
      'Draw 10 project cards, pay 3M€ each for cards you keep',
      'Place global parameter markers at starting positions',
    ],
    turnStructure: [
      {
        title: 'Action Phase (Take 1-2 Actions)',
        description:
          'Take 1 or 2 actions per turn: play a card, use a standard project, claim a milestone, fund an award, use a card action, or convert plants/heat. Pass when done for the generation.',
      },
      {
        title: 'Production Phase',
        description:
          'After all players pass: move energy to heat, gain M€ equal to TR + M€ production, gain all other resources equal to their production.',
      },
      {
        title: 'Research Phase',
        description:
          'Draw 4 cards, keep any (pay 3M€ each). Advance the generation marker.',
      },
    ],
    scoring: [
      { category: 'Terraform Rating', points: '1 VP per TR' },
      { category: 'Greenery tiles', points: '1 VP each' },
      { category: 'City tiles', points: '1 VP per adjacent greenery' },
      { category: 'VP on cards', points: 'As printed' },
      { category: 'Milestones claimed', points: '5 VP each' },
      { category: 'Awards won (1st/2nd)', points: '5 VP / 2 VP' },
    ],
    tips: [
      'Early game: focus on economy and production',
      'Don\'t ignore milestones - they\'re limited and valuable',
      'Tags matter! Build synergies with your corporation',
      'Greeneries next to your cities maximize end-game points',
    ],
  },
  splendor: {
    quickStart: [
      'Take gem tokens or reserve a card on your turn',
      'Use gems to purchase development cards',
      'Cards give permanent gem bonuses for future purchases',
      'First to 15 points wins!',
    ],
    overview:
      'Splendor is an elegant engine-building game where players collect gem tokens to purchase development cards. Each card provides permanent gem bonuses, making future purchases cheaper. Attract nobles by building the right combinations to reach 15 prestige points.',
    setup: [
      'Shuffle each development card deck separately (Level 1, 2, 3)',
      'Reveal 4 cards from each level in a row',
      'Place gem tokens based on player count (7/5/4 for 4/3/2 players)',
      'Reveal nobles equal to players + 1',
    ],
    turnStructure: [
      {
        title: 'Take Gems',
        description:
          'Take 3 different gem tokens, OR take 2 of the same color (if 4+ available). Maximum 10 gems in hand.',
      },
      {
        title: 'Reserve a Card',
        description:
          'Take a face-up card or top of any deck into your hand (max 3 reserved). Gain 1 gold joker token.',
      },
      {
        title: 'Purchase a Card',
        description:
          'Pay the gem cost (reduced by your card bonuses) to buy a face-up card or reserved card. Place it in front of you.',
      },
    ],
    scoring: [
      { category: 'Level 1 cards', points: '0-1 VP each' },
      { category: 'Level 2 cards', points: '1-3 VP each' },
      { category: 'Level 3 cards', points: '3-5 VP each' },
      { category: 'Nobles', points: '3 VP each' },
    ],
    tips: [
      'Focus on one or two colors early to build engine quickly',
      'Watch what opponents are collecting to deny key cards',
      'Gold tokens are powerful - reserve strategically',
      'Nobles come free - plan your purchases to attract them',
    ],
  },
  pandemic: {
    quickStart: [
      'Work as a team to cure 4 diseases before outbreaks overwhelm the world',
      'Use your unique role ability to maximum effect',
      'Trade cards and meet at research stations to find cures',
      'Cure all 4 diseases to win - too many outbreaks means game over!',
    ],
    overview:
      'Pandemic is a cooperative game where players are disease-fighting specialists working to save humanity. Travel the world treating infections, sharing knowledge, and racing to discover cures before diseases spread out of control.',
    setup: [
      'Place research station in Atlanta, all pawns start there',
      'Shuffle and deal player cards (varies by player count)',
      'Infect 9 cities from infection deck (3 cities with 3, 3, 1 cubes)',
      'Add epidemic cards to player deck based on difficulty',
    ],
    turnStructure: [
      {
        title: 'Take 4 Actions',
        description:
          'Drive/ferry to adjacent city, fly to card city, charter flight from current city, or shuttle between research stations. Also: treat disease, share knowledge, discover cure, build station.',
      },
      {
        title: 'Draw 2 Player Cards',
        description:
          'Draw cards to your hand (max 7). Epidemic cards cause immediate outbreak in new city and intensify infection deck.',
      },
      {
        title: 'Infect Cities',
        description:
          'Draw infection cards equal to infection rate. Add 1 disease cube to each city drawn. 4th cube triggers outbreak!',
      },
    ],
    scoring: [
      { category: 'Win condition', points: 'Cure all 4 diseases' },
      { category: 'Lose: Outbreaks', points: '8 outbreaks = game over' },
      { category: 'Lose: Cubes', points: 'Run out of any color = game over' },
      { category: 'Lose: Cards', points: 'No player cards left = game over' },
    ],
    tips: [
      'Communicate constantly - plan several turns ahead',
      'Treat disease clusters before they outbreak',
      'Use role abilities! Medic and Researcher are powerful',
      'Don\'t neglect any disease - all 4 must be cured to win',
    ],
  },
  carcassonne: {
    quickStart: [
      'Draw a tile and add it to the map',
      'Optionally place one of your meeples on the tile',
      'Score completed roads, cities, and monasteries',
      'Most points at game end wins!',
    ],
    overview:
      'Carcassonne is a tile-laying game where players build the medieval French countryside. Draw tiles depicting roads, cities, monasteries, and fields, then place them to extend the landscape. Deploy your followers strategically to score points.',
    setup: [
      'Place the starting tile face-up in the center',
      'Shuffle all other tiles face-down in stacks',
      'Each player takes 7 meeples in their color',
      'Determine starting player randomly',
    ],
    turnStructure: [
      {
        title: 'Draw and Place Tile',
        description:
          'Draw a tile and place it adjacent to existing tiles. Roads must connect to roads, cities to cities, fields to fields.',
      },
      {
        title: 'Place a Meeple (Optional)',
        description:
          'Place one meeple on a feature of the tile you just placed: road (thief), city (knight), monastery (monk), or field (farmer). Cannot join features with opponent\'s meeple.',
      },
      {
        title: 'Score Completed Features',
        description:
          'When a road, city, or monastery is completed, score it immediately and return meeples. Fields score at game end only.',
      },
    ],
    scoring: [
      { category: 'Completed road', points: '1 per tile' },
      { category: 'Completed city', points: '2 per tile + 2 per pennant' },
      { category: 'Completed monastery', points: '9 points (center + 8 surrounding)' },
      { category: 'Incomplete features', points: '1 per tile at game end' },
      { category: 'Fields', points: '3 per completed city touching field' },
    ],
    tips: [
      'Don\'t commit all meeples early - keep options open',
      'Fields are powerful but lock meeples until game end',
      'Sometimes blocking opponents is worth more than building',
      'Try to sneak meeples into opponents\' features by connecting',
    ],
  },
  '7-wonders': {
    quickStart: [
      'Draft cards over 3 ages - pick one, pass the rest',
      'Build structures or wonder stages with resources',
      'Military conflicts happen at end of each age',
      'Most victory points after Age III wins!',
    ],
    overview:
      '7 Wonders is a card drafting game where players lead ancient civilizations. Over three ages, simultaneously draft cards to build your city, construct wonder stages, and amass victory points through multiple paths: military, science, commerce, and more.',
    setup: [
      'Each player receives a wonder board (random or draft)',
      'Separate cards by age (I, II, III) and shuffle each',
      'Deal 7 Age I cards to each player',
      'Place 3 coins on each wonder board',
    ],
    turnStructure: [
      {
        title: 'Choose Card',
        description:
          'Simultaneously, each player selects one card from their hand and places it face-down.',
      },
      {
        title: 'Reveal and Resolve',
        description:
          'All players reveal chosen cards simultaneously. Build the structure (pay resource cost), build wonder stage (tuck card), or discard for 3 coins.',
      },
      {
        title: 'Pass Remaining Cards',
        description:
          'Pass remaining hand to neighbor (left in Ages I/III, right in Age II). Repeat until 6 cards played, discard the 7th.',
      },
    ],
    scoring: [
      { category: 'Military tokens', points: 'Sum of all tokens (+/-)' },
      { category: 'Treasury', points: '1 VP per 3 coins' },
      { category: 'Wonder stages', points: 'As printed (2-7 VP)' },
      { category: 'Blue buildings', points: '2-8 VP each' },
      { category: 'Yellow buildings', points: 'Various bonuses' },
      { category: 'Green (science)', points: 'Sets + matching symbols²' },
      { category: 'Purple (guilds)', points: 'Based on neighbors/self' },
    ],
    tips: [
      'Science is powerful but risky - need sets and matches',
      'Watch what neighbors need - deny key resources',
      'Military: stay slightly ahead, don\'t over-invest',
      'Free building chains (symbol matching) save resources',
    ],
  },
  dominion: {
    quickStart: [
      'Start with a deck of 10 cards (7 Copper, 3 Estate)',
      'Each turn: draw 5 cards, play actions, buy cards',
      'New cards go to your discard pile, then get shuffled in',
      'Game ends when 3 piles empty - most VP wins!',
    ],
    overview:
      'Dominion is the original deck-building game. All players start with identical 10-card decks and buy new cards from a shared supply to improve their decks. Actions chain together, treasures fund purchases, and victory cards win the game.',
    setup: [
      'Each player starts with 7 Copper and 3 Estate cards, shuffled',
      'Set out the basic cards: Copper, Silver, Gold, Estate, Duchy, Province, Curse',
      'Choose 10 Kingdom card piles (random or selected)',
      'Set out Kingdom cards with appropriate quantities',
    ],
    turnStructure: [
      {
        title: 'Action Phase',
        description:
          'Play one Action card from your hand (unless you have +Actions). Resolve its effects completely. +Actions lets you play more Action cards.',
      },
      {
        title: 'Buy Phase',
        description:
          'Play all Treasure cards from your hand. You have 1 Buy (unless you have +Buys). Spend your coins to buy cards costing up to that amount.',
      },
      {
        title: 'Cleanup Phase',
        description:
          'Put all cards in play and remaining hand into your discard pile. Draw 5 new cards. If deck is empty, shuffle discard to form new deck.',
      },
    ],
    scoring: [
      { category: 'Estate', points: '1 VP each' },
      { category: 'Duchy', points: '3 VP each' },
      { category: 'Province', points: '6 VP each' },
      { category: 'Curse', points: '-1 VP each' },
      { category: 'Kingdom VP cards', points: 'As printed' },
    ],
    tips: [
      'Buy money early, Victory cards late',
      'Thin your deck - trashing Copper and Estate makes it stronger',
      "Watch the Province pile - don't get caught unprepared",
      'Actions that give +Cards and +Actions keep your turn going',
    ],
  },
  'king-of-tokyo': {
    quickStart: [
      'Roll 6 dice up to 3 times, keeping what you want',
      'Deal damage, heal, gain energy, or score victory points',
      'Enter Tokyo to deal damage to everyone, but you can\'t heal inside',
      'First to 20 VP wins, or last monster standing!',
    ],
    overview:
      'King of Tokyo is a fast-paced dice game where giant monsters battle to become King of Tokyo. Roll dice for attacks, healing, energy, and points. Enter Tokyo to attack all rivals at once, but beware—you become everyone\'s target.',
    setup: [
      'Each player chooses a monster and takes matching figure and board',
      'Set your life to 10 and victory points to 0',
      'Shuffle power cards and reveal 3 face-up',
      'Place Tokyo board in center—no one starts inside',
    ],
    turnStructure: [
      {
        title: 'Roll Dice (up to 3 times)',
        description:
          'Roll all 6 dice. Keep any you want and reroll the rest up to 2 more times. Final results are resolved.',
      },
      {
        title: 'Resolve Dice',
        description:
          'Claws = deal damage. Hearts = heal (not in Tokyo). Lightning = gain energy. Numbers = 3 matching = that many VP, +1 per extra.',
      },
      {
        title: 'Buy Power Cards',
        description:
          'Spend energy to buy face-up power cards or pay 2 energy to sweep all 3 and reveal new ones.',
      },
    ],
    scoring: [
      { category: '3 of a kind (1s)', points: '1 VP' },
      { category: '3 of a kind (2s)', points: '2 VP' },
      { category: '3 of a kind (3s)', points: '3 VP' },
      { category: 'Extra matching die', points: '+1 VP each' },
      { category: 'Enter Tokyo', points: '1 VP' },
      { category: 'Start turn in Tokyo', points: '2 VP' },
    ],
    tips: [
      'Know when to yield Tokyo—low health means get out',
      'Energy is powerful but don\'t hoard it forever',
      'Target weak monsters to eliminate competition',
      'Some power cards are game-changing—prioritize key ones',
    ],
  },
  'sushi-go': {
    quickStart: [
      'Pick one card from your hand and pass the rest',
      'Reveal chosen cards simultaneously',
      'Score different sushi for different point values',
      'After 3 rounds, highest score wins!',
    ],
    overview:
      'Sushi Go! is a lightning-fast card drafting game with adorable art. Pick cards to build the best sushi combinations, from maki rolls for majority bonuses to puddings that score at game end. Quick to learn, endlessly replayable.',
    setup: [
      'Shuffle all cards together',
      'Deal cards based on player count (10/9/8/7 for 2/3/4/5 players)',
      'Keep score with pen and paper or app',
      'Play 3 rounds total',
    ],
    turnStructure: [
      {
        title: 'Pick a Card',
        description:
          'Simultaneously, everyone picks one card from their hand and places it face-down in front of them.',
      },
      {
        title: 'Reveal Cards',
        description:
          'All players flip their chosen card face-up. Cards stay in front of you for scoring at round end.',
      },
      {
        title: 'Pass Hands',
        description:
          'Pass remaining cards to the player on your left. Take the hand from your right. Repeat until all cards played.',
      },
    ],
    scoring: [
      { category: 'Tempura (pair)', points: '5 VP per pair' },
      { category: 'Sashimi (3 of a kind)', points: '10 VP per set' },
      { category: 'Dumpling', points: '1/3/6/10/15 for 1-5+' },
      { category: 'Maki Rolls', points: 'Most: 6 VP, 2nd: 3 VP' },
      { category: 'Nigiri', points: '1/2/3 VP (egg/salmon/squid)' },
      { category: 'Wasabi + Nigiri', points: 'Triple the nigiri!' },
      { category: 'Pudding (game end)', points: 'Most: +6, Least: -6' },
    ],
    tips: [
      'Pudding matters! Don\'t get stuck with the least',
      'Wasabi is worthless without nigiri to put on it',
      'Watch what others collect to deny sets or compete for maki',
      'Chopsticks let you grab 2 cards in one turn—powerful!',
    ],
  },
  'love-letter': {
    quickStart: [
      'Draw a card, play a card, use its power',
      'Eliminate other players or have highest card when deck runs out',
      'Win tokens of affection to win the game',
      'Just 16 cards—pure deduction!',
    ],
    overview:
      'Love Letter is a micro game of risk and deduction. With only 16 cards, players draw and play to eliminate rivals while protecting their own hand. The highest-numbered card still in play wins the round. Simple rules, deep bluffing.',
    setup: [
      'Shuffle all 16 cards',
      'Remove top card face-down (hidden from all players)',
      'In 2-player game, also remove 3 cards face-up',
      'Deal 1 card to each player—this is your starting hand',
    ],
    turnStructure: [
      {
        title: 'Draw a Card',
        description:
          'Draw the top card of the deck. You now have 2 cards in hand.',
      },
      {
        title: 'Play a Card',
        description:
          'Choose one of your 2 cards to play face-up in front of you. Resolve its power.',
      },
      {
        title: 'Apply Card Effect',
        description:
          'Guard: guess opponent\'s card. Priest: look at hand. Baron: compare, lower eliminated. Prince: discard hand. King: swap hands. Countess: must play if with King/Prince. Princess: if played/discarded, eliminated.',
      },
    ],
    scoring: [
      { category: 'Guard (1) x5', points: 'Guess hand, eliminate if correct' },
      { category: 'Priest (2) x2', points: 'Look at opponent\'s hand' },
      { category: 'Baron (3) x2', points: 'Compare hands, lower loses' },
      { category: 'Handmaid (4) x2', points: 'Protected until your next turn' },
      { category: 'Prince (5) x2', points: 'Force player to discard hand' },
      { category: 'King (6) x1', points: 'Trade hands with opponent' },
      { category: 'Countess (7) x1', points: 'Must play if with King/Prince' },
      { category: 'Princess (8) x1', points: 'If discarded, eliminated' },
    ],
    tips: [
      'Track what\'s been played to narrow down possibilities',
      'Guards are most common—save them for good guesses',
      'Handmaid protects you but wastes a turn',
      'The Princess is safest early, most dangerous late',
    ],
  },
  'the-crew': {
    quickStart: [
      'Complete missions by winning tricks with specific cards',
      'Follow standard trick-taking rules (follow suit, highest wins)',
      'Communication is limited—use one card clue per round',
      'Complete all missions to win the scenario!',
    ],
    overview:
      'The Crew is a cooperative trick-taking game where players work together to complete missions—specific cards that must be won by specific players. Communication is severely limited, making each hand a puzzle to solve together.',
    setup: [
      'Deal all 40 cards evenly to players',
      'Check mission book for current mission\'s task cards',
      'Distribute task cards as described in mission',
      'Commander (4 of rockets) goes first',
    ],
    turnStructure: [
      {
        title: 'Lead a Card',
        description:
          'The trick leader plays any card from their hand. Rockets are trump (always win if played).',
      },
      {
        title: 'Follow Suit',
        description:
          'Other players must follow the led suit if possible. If not, may play any card including trump.',
      },
      {
        title: 'Win the Trick',
        description:
          'Highest card of led suit wins (or highest trump). Winner takes trick and leads next. Check if any tasks were completed.',
      },
    ],
    scoring: [
      { category: 'Complete all tasks', points: 'Mission success!' },
      { category: 'Fail any task', points: 'Mission failed—retry' },
      { category: 'Communication', points: '1 clue per person (card + token)' },
      { category: 'Task tokens', points: 'Order constraints (1st, 2nd, etc.)' },
    ],
    tips: [
      'Play long suits early to let teammates void suits',
      'Your communication token is precious—time it well',
      'Sometimes the task holder should NOT win their task early',
      'Watch for impossible missions—better to fail fast',
    ],
  },
  cascadia: {
    quickStart: [
      'Draft a habitat tile and wildlife token pair each turn',
      'Place tiles to expand your ecosystem',
      'Place wildlife to score patterns specific to each animal',
      'Highest combined score wins!',
    ],
    overview:
      'Cascadia is a puzzly tile-laying game about creating ecosystems. Draft paired tiles and tokens to build your landscape, then score points for matching habitats and wildlife patterns. Relaxing yet strategic, with gorgeous Pacific Northwest theming.',
    setup: [
      'Create 4 face-up tile + token pairs in the center',
      'Give each player a starting habitat tile',
      'Place wildlife scoring cards (one per animal type)',
      'Each player gets 3 nature tokens',
    ],
    turnStructure: [
      {
        title: 'Select Tile + Token',
        description:
          'Choose one tile-token pair from the center. May spend a nature token to take any tile with any token instead.',
      },
      {
        title: 'Place Tile',
        description:
          'Add the tile adjacent to your existing tiles. Habitats don\'t need to match, but matching creates corridors for bonuses.',
      },
      {
        title: 'Place Wildlife (Optional)',
        description:
          'Place your wildlife token on a matching habitat symbol. Each tile can hold one wildlife token. Cannot move once placed.',
      },
    ],
    scoring: [
      { category: 'Wildlife patterns', points: 'Per wildlife scoring card' },
      { category: 'Largest habitat corridor', points: 'Bonus per habitat type' },
      { category: 'Nature tokens remaining', points: '1 VP each' },
      { category: 'Bonus tiles (mountains)', points: 'As printed' },
    ],
    tips: [
      'Check wildlife scoring cards carefully—each game uses different ones',
      'Build large habitat corridors for significant bonuses',
      'Nature tokens give flexibility—don\'t spend carelessly',
      'Plan for multiple animals, not just one',
    ],
  },
}

// Default content for games without specific rules
const defaultRulesContent: LegacyRulesContent = {
  quickStart: [
    'Content coming soon!',
    'Check back for the full rules summary',
  ],
  overview: 'Full rules summary coming soon. Check the official rulebook for now.',
  setup: ['See official rulebook'],
  turnStructure: [
    { title: 'Coming Soon', description: 'Full turn structure will be added shortly.' },
  ],
  scoring: [{ category: 'See rulebook', points: '-' }],
  tips: ['Check the official rulebook for strategy tips'],
}

export default async function RulesPage({ params }: RulesPageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game || !game.has_rules) {
    notFound()
  }

  // Prefer database content, fall back to hardcoded content
  const content: RulesContent = (game.rules_content as unknown as RulesContent) || rulesContent[game.slug] || defaultRulesContent
  const isAI = isAIContent(content)

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Games', href: '/games' },
    { name: game.name, href: `/games/${game.slug}` },
    { name: 'Rules', href: `/games/${game.slug}/rules` },
  ]

  // Generate HowTo steps from content (handle both formats)
  const howToSteps = isAI
    ? [
        ...(content as AIRulesContent).turnStructure.map((step) => ({
          name: step.phase || step.title || 'Step',
          text: step.description,
        })),
        ...((content as AIRulesContent).endGame ? [{ name: 'End Game', text: (content as AIRulesContent).endGame! }] : []),
      ]
    : [
        { name: 'Setup', text: (content as LegacyRulesContent).setup.join(' ') },
        ...(content as LegacyRulesContent).turnStructure.map((step) => ({
          name: step.title || 'Step',
          text: step.description,
        })),
        { name: 'Scoring', text: (content as LegacyRulesContent).scoring.map((s) => `${s.category}: ${s.points}`).join('. ') },
      ]

  return (
    <>
      <HowToJsonLd game={game} steps={howToSteps} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container py-8 md:py-12">
        {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-muted-foreground">
          <Link href="/games" className="hover:text-foreground">
            Games
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/games/${game.slug}`} className="hover:text-foreground">
            {game.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Rules</span>
        </nav>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/games/${game.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              How to Play {game.name}
            </h1>
            <p className="text-muted-foreground">{game.tagline}</p>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Badge variant="secondary" className="gap-1.5 py-1.5">
          <Users className="h-4 w-4" />
          {game.player_count_min}-{game.player_count_max} Players
        </Badge>
        {game.play_time_min && (
          <Badge variant="secondary" className="gap-1.5 py-1.5">
            <Clock className="h-4 w-4" />
            {game.play_time_min}-{game.play_time_max} min
          </Badge>
        )}
        {game.weight && (
          <Badge variant="secondary" className="gap-1.5 py-1.5">
            <Target className="h-4 w-4" />
            Complexity: {game.weight.toFixed(1)}/5
          </Badge>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Start */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Quick Start (TL;DR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.quickStart.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Overview */}
          <div>
            <h2 className="text-xl font-bold mb-3">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              {content.overview}
            </p>
          </div>

          <Separator />

          {/* Setup (legacy) or Core Rules (AI) */}
          {isAI && (content as AIRulesContent).coreRules ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Core Rules</h2>
              <div className="space-y-4">
                {(content as AIRulesContent).coreRules!.map((rule, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{rule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {rule.points.map((point, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="text-primary">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-3">Setup</h2>
              <ol className="space-y-2">
                {(content as LegacyRulesContent).setup.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Separator />

          {/* Turn Structure */}
          <div>
            <h2 className="text-xl font-bold mb-4">Turn Structure</h2>
            <div className="space-y-4">
              {content.turnStructure.map((phase, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm">
                        {i + 1}
                      </span>
                      {'phase' in phase ? phase.phase : phase.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Scoring - both AI and legacy have this */}
          {(isAI ? (content as AIRulesContent).scoring : (content as LegacyRulesContent).scoring) && (
            <div>
              <h2 className="text-xl font-bold mb-4">Scoring</h2>
              <Card>
                <CardContent className="pt-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Category</th>
                        <th className="text-right py-2 font-medium">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isAI
                        ? (content as AIRulesContent).scoring
                        : (content as LegacyRulesContent).scoring
                      )?.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 text-muted-foreground">
                            {item.category}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {item.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* End Game - AI content only */}
          {isAI && ((content as AIRulesContent).endGame || (content as AIRulesContent).endGameConditions) && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-bold mb-4">End Game & Winning</h2>
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {/* New format with conditions list */}
                    {(content as AIRulesContent).endGameConditions && (
                      <div>
                        <h4 className="font-medium mb-2">Game Ends When:</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          {(content as AIRulesContent).endGameConditions!.map((condition, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-primary">•</span>
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(content as AIRulesContent).winCondition && (
                      <div>
                        <h4 className="font-medium mb-2">Winner:</h4>
                        <p className="text-muted-foreground">
                          {(content as AIRulesContent).winCondition}
                        </p>
                      </div>
                    )}
                    {/* Legacy format */}
                    {!(content as AIRulesContent).endGameConditions && (content as AIRulesContent).endGame && (
                      <p className="text-muted-foreground">
                        {(content as AIRulesContent).endGame}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {content.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Related links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">More Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {game.has_score_sheet && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/games/${game.slug}/score-sheet`}>
                    Score Sheet
                  </Link>
                </Button>
              )}
              {game.has_setup_guide && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/games/${game.slug}/setup`}>
                    Setup Guide
                  </Link>
                </Button>
              )}
              {game.has_reference && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/games/${game.slug}/reference`}>
                    Quick Reference
                  </Link>
                </Button>
              )}
              {game.bgg_id && (
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official Rules (BGG)
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Buy card */}
          {game.amazon_asin && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Don&apos;t have {game.name} yet?
                </p>
                <Button className="w-full" asChild>
                  <a
                    href={`https://www.amazon.com/dp/${game.amazon_asin}?tag=goodgame-20`}
                    target="_blank"
                    rel="noopener sponsored"
                  >
                    Buy on Amazon
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
