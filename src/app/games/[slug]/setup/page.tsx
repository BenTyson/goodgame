import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Boxes, ExternalLink, Users, Clock, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupChecklist } from '@/components/setup/SetupChecklist'
import { getGameBySlug, getAllGameSlugs } from '@/lib/supabase/queries'

interface SetupPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: SetupPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: `${game.name} Setup Guide`,
    description: `Step-by-step setup guide for ${game.name}. Visual checklist to get your game ready to play quickly and correctly.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Type for AI-generated content
interface AISetupContent {
  overview: string
  estimatedTime?: string
  beforeYouStart?: string[]
  components: { name: string; quantity: string; description: string }[]
  steps: { step: number; title: string; instruction: string; tip?: string }[]
  playerSetup: { description: string; items: string[] }
  firstPlayer?: string // Legacy field
  firstPlayerRule?: string
  quickTips?: string[] // New field name
  setupTips?: string[] // Legacy field name
  commonMistakes: string[]
}

// Type for legacy hardcoded content
interface LegacySetupContent {
  playerSetup: { title: string; description: string; tip?: string }[]
  boardSetup: { title: string; description: string; tip?: string }[]
  componentChecklist: { name: string; quantity: string }[]
  firstPlayerRule: string
  quickTips: string[]
}

type SetupContent = AISetupContent | LegacySetupContent

// Helper to check if content is AI-generated format
function isAIContent(content: SetupContent): content is AISetupContent {
  return 'steps' in content || 'beforeYouStart' in content
}

// Setup content for each game
const setupContent: Record<string, LegacySetupContent> = {
  catan: {
    playerSetup: [
      {
        title: 'Choose colors',
        description: 'Each player picks a color and takes all pieces of that color: 5 settlements, 4 cities, 15 roads.',
      },
      {
        title: 'Take building costs card',
        description: 'Each player takes a building costs reference card showing what resources are needed.',
      },
    ],
    boardSetup: [
      {
        title: 'Assemble the frame',
        description: 'Connect the 6 blue water frame pieces to create the outer border.',
        tip: 'Make sure the harbor tiles are randomly distributed or use the recommended setup.',
      },
      {
        title: 'Place terrain hexes',
        description: 'Randomly place the 19 terrain hexes inside the frame: 4 forest, 4 pasture, 4 fields, 3 hills, 3 mountains, 1 desert.',
        tip: 'For beginners, use the fixed setup shown in the rulebook.',
      },
      {
        title: 'Place number tokens',
        description: 'Place number tokens on each terrain hex (except desert) in alphabetical order, spiraling inward.',
        tip: 'Red numbers (6 and 8) should not be adjacent to each other.',
      },
      {
        title: 'Place the robber',
        description: 'Put the robber on the desert hex.',
      },
      {
        title: 'Sort resource cards',
        description: 'Sort the resource cards (brick, lumber, wool, grain, ore) into separate piles face up.',
      },
      {
        title: 'Shuffle development cards',
        description: 'Shuffle all development cards and place them face down near the board.',
      },
      {
        title: 'Place special cards',
        description: 'Put "Longest Road" and "Largest Army" cards nearby, ready to be claimed.',
      },
    ],
    componentChecklist: [
      { name: 'Terrain hexes', quantity: '19' },
      { name: 'Sea frame pieces', quantity: '6' },
      { name: 'Number tokens', quantity: '18' },
      { name: 'Resource cards', quantity: '95 (19 each)' },
      { name: 'Development cards', quantity: '25' },
      { name: 'Building costs cards', quantity: '4' },
      { name: 'Settlements (per color)', quantity: '5' },
      { name: 'Cities (per color)', quantity: '4' },
      { name: 'Roads (per color)', quantity: '15' },
      { name: 'Robber', quantity: '1' },
      { name: 'Dice', quantity: '2' },
    ],
    firstPlayerRule: 'The youngest player goes first. Or determine randomly.',
    quickTips: [
      'Place starting settlements at intersections of different resource types',
      'Try to get access to all 5 resources or easy trading routes',
      'Numbers 6 and 8 are rolled most often - prioritize those hexes',
    ],
  },
  wingspan: {
    playerSetup: [
      {
        title: 'Take player mat',
        description: 'Each player takes a player mat showing the three habitats: forest, grassland, and wetland.',
      },
      {
        title: 'Collect action cubes',
        description: 'Each player takes 8 action cubes of their color.',
      },
      {
        title: 'Draw bird cards',
        description: 'Each player draws 5 bird cards from the deck (keep these hidden).',
      },
      {
        title: 'Take starting food',
        description: 'Each player takes 5 food tokens from the supply (any types).',
      },
      {
        title: 'Choose starting resources',
        description: 'Keep any combination of bird cards and food tokens totaling 5. Discard the rest.',
        tip: 'More birds = more options but less food to play them.',
      },
      {
        title: 'Draw bonus cards',
        description: 'Draw 2 bonus cards, keep 1. This will score you extra points at game end.',
      },
    ],
    boardSetup: [
      {
        title: 'Place the goal board',
        description: 'Place the goal board in the center of the table. Choose which side to use (green = less competitive, blue = more competitive).',
      },
      {
        title: 'Set round goals',
        description: 'Shuffle the goal tiles and randomly place one face-up for each of the 4 rounds.',
      },
      {
        title: 'Prepare bird deck',
        description: 'Shuffle all bird cards and place the deck face-down. Draw 3 cards face-up to form the bird tray.',
      },
      {
        title: 'Fill the birdfeeder',
        description: 'Place all 5 food dice in the birdfeeder dice tower and roll them by lifting the top.',
      },
      {
        title: 'Sort food tokens',
        description: 'Place all food tokens in a general supply accessible to all players.',
      },
      {
        title: 'Organize eggs',
        description: 'Place all egg miniatures near the board as a general supply.',
      },
    ],
    componentChecklist: [
      { name: 'Bird cards', quantity: '170' },
      { name: 'Bonus cards', quantity: '26' },
      { name: 'Goal tiles', quantity: '8' },
      { name: 'Player mats', quantity: '5' },
      { name: 'Food dice', quantity: '5' },
      { name: 'Birdfeeder dice tower', quantity: '1' },
      { name: 'Egg miniatures', quantity: '75' },
      { name: 'Food tokens', quantity: '103' },
      { name: 'Action cubes (per player)', quantity: '8' },
      { name: 'Goal board', quantity: '1' },
    ],
    firstPlayerRule: 'The player who most recently went bird watching goes first. Or determine randomly.',
    quickTips: [
      'Balance your starting hand - 2-3 birds and 2-3 food is usually good',
      'Check your bonus card and try to work toward it from the start',
      'Early game: prioritize food production in the forest habitat',
    ],
  },
  'ticket-to-ride': {
    playerSetup: [
      {
        title: 'Choose colors',
        description: 'Each player selects a color and takes all 45 train car pieces of that color.',
      },
      {
        title: 'Take scoring marker',
        description: 'Each player places their scoring marker on the start space of the scoring track.',
      },
      {
        title: 'Deal train cards',
        description: 'Deal 4 train car cards face-down to each player.',
      },
      {
        title: 'Draw destination tickets',
        description: 'Deal 3 destination ticket cards to each player. Keep at least 2 (may keep all 3).',
        tip: 'Check if your destination tickets share common cities for easier completion.',
      },
    ],
    boardSetup: [
      {
        title: 'Unfold the board',
        description: 'Place the board in the center of the table showing the map of the United States.',
      },
      {
        title: 'Prepare train cards',
        description: 'Shuffle the train car cards and place the deck face-down beside the board.',
      },
      {
        title: 'Deal face-up cards',
        description: 'Draw 5 cards from the train deck and place them face-up next to the deck.',
      },
      {
        title: 'Prepare destination tickets',
        description: 'Shuffle the destination ticket cards and place them in a separate face-down pile.',
      },
      {
        title: 'Set up Longest Path bonus',
        description: 'Place the Longest Path bonus card near the board (awarded at game end).',
      },
    ],
    componentChecklist: [
      { name: 'Board map', quantity: '1' },
      { name: 'Train car cards', quantity: '110' },
      { name: 'Destination ticket cards', quantity: '30' },
      { name: 'Plastic trains (per color)', quantity: '45' },
      { name: 'Scoring markers', quantity: '5' },
      { name: 'Longest Path card', quantity: '1' },
    ],
    firstPlayerRule: 'The most experienced traveler goes first. Or determine randomly.',
    quickTips: [
      'Keep destination tickets secret until game end',
      'Locomotives (wild cards) are powerful but count as 1 card when drawn face-up',
      'Longer routes score disproportionately more points',
    ],
  },
  azul: {
    playerSetup: [
      {
        title: 'Take player board',
        description: 'Each player takes a player board and places it in front of them.',
      },
      {
        title: 'Take scoring marker',
        description: 'Each player places their black scoring cube on the 0 space of their score track.',
      },
    ],
    boardSetup: [
      {
        title: 'Place factory displays',
        description: 'Place factory displays in the center based on player count: 2P = 5 factories, 3P = 7 factories, 4P = 9 factories.',
      },
      {
        title: 'Fill the bag',
        description: 'Place all 100 tiles (20 of each color) in the cloth bag and mix thoroughly.',
      },
      {
        title: 'Fill factory displays',
        description: 'Draw 4 tiles from the bag and place them on each factory display.',
      },
      {
        title: 'Place starting player marker',
        description: 'Place the starting player marker (the "1" tile) in the center of the table.',
      },
      {
        title: 'Prepare the box lid',
        description: 'Keep the box lid nearby as a discard area for broken tiles.',
      },
    ],
    componentChecklist: [
      { name: 'Player boards', quantity: '4' },
      { name: 'Factory displays', quantity: '9' },
      { name: 'Tiles', quantity: '100 (20 per color)' },
      { name: 'Scoring markers', quantity: '4' },
      { name: 'Starting player marker', quantity: '1' },
      { name: 'Cloth bag', quantity: '1' },
    ],
    firstPlayerRule: 'The player who most recently visited Portugal goes first. Otherwise, randomly determine.',
    quickTips: [
      'Complete horizontal rows for bonus points',
      'Plan ahead - tiles go to the same column as their pattern line',
      'Watch what opponents are collecting to avoid giving them free tiles',
    ],
  },
  codenames: {
    playerSetup: [
      {
        title: 'Form two teams',
        description: 'Divide players into two teams (red and blue). Teams should be roughly equal.',
      },
      {
        title: 'Choose spymasters',
        description: 'Each team chooses one player to be their spymaster. Spymasters sit on the same side of the table.',
      },
    ],
    boardSetup: [
      {
        title: 'Lay out word cards',
        description: 'Shuffle the word cards and randomly lay out 25 cards in a 5x5 grid.',
      },
      {
        title: 'Draw key card',
        description: 'Spymasters draw a random key card from the deck and place it in the stand so only they can see it.',
        tip: 'The key card shows which words belong to which team, which is the assassin, and which are neutral.',
      },
      {
        title: 'Set out agent cards',
        description: 'Place the agent cards (8 red, 8 blue, 7 neutral, 1 assassin) near the board.',
      },
      {
        title: 'Determine starting team',
        description: 'Check the key card - the border color indicates which team goes first. That team has 9 words to find (other team has 8).',
      },
    ],
    componentChecklist: [
      { name: 'Word cards', quantity: '200+ (double-sided)' },
      { name: 'Key cards', quantity: '40' },
      { name: 'Key card stand', quantity: '1' },
      { name: 'Red agent cards', quantity: '8' },
      { name: 'Blue agent cards', quantity: '8' },
      { name: 'Neutral bystander cards', quantity: '7' },
      { name: 'Assassin card', quantity: '1' },
      { name: 'Timer (optional)', quantity: '1' },
    ],
    firstPlayerRule: 'The team whose color matches the border of the key card goes first (they have 9 words to find).',
    quickTips: [
      'Spymasters: Give one-word clues followed by a number',
      'Field operatives: Discuss before touching a card',
      'Avoid the assassin at all costs - touching it ends the game immediately',
    ],
  },
  'terraforming-mars': {
    playerSetup: [
      {
        title: 'Choose corporation',
        description: 'Deal 2 corporation cards to each player. Choose 1 to play (or use beginner corporations for first game).',
      },
      {
        title: 'Take player board',
        description: 'Each player takes a player board to track their production and resources.',
      },
      {
        title: 'Set starting resources',
        description: 'Follow your corporation card to set starting production and resources. All begin with 1 production of each type unless stated otherwise.',
      },
      {
        title: 'Take player cubes',
        description: 'Each player takes 1 player marker cube to track their Terraform Rating (TR).',
      },
      {
        title: 'Draw project cards',
        description: 'Deal 10 project cards to each player. Choose any to keep, paying 3 MegaCredits each.',
        tip: 'Beginners: keep 4-6 cards that work with your corporation.',
      },
    ],
    boardSetup: [
      {
        title: 'Place the game board',
        description: 'Place the main Mars board in the center of the table.',
      },
      {
        title: 'Set global parameters',
        description: 'Place white cubes on the starting positions: Oxygen at 0%, Temperature at -30°C, and Ocean tiles in the supply area.',
      },
      {
        title: 'Prepare tile stacks',
        description: 'Stack the special tiles (Greenery, City, Ocean) near the board.',
      },
      {
        title: 'Shuffle project cards',
        description: 'Shuffle all project cards and place the deck face-down near the board.',
      },
      {
        title: 'Set up milestones & awards',
        description: 'The 5 milestones and 5 awards are printed on the board. No setup needed.',
      },
      {
        title: 'Sort resource cubes',
        description: 'Organize copper (1), silver (5), and gold (10) cubes in piles for easy access.',
      },
      {
        title: 'Place generation marker',
        description: 'Put the generation marker on generation 1 of the track.',
      },
    ],
    componentChecklist: [
      { name: 'Game board', quantity: '1' },
      { name: 'Player boards', quantity: '5' },
      { name: 'Corporation cards', quantity: '12' },
      { name: 'Project cards', quantity: '208' },
      { name: 'Ocean tiles', quantity: '9' },
      { name: 'Greenery tiles', quantity: '~50' },
      { name: 'City tiles', quantity: '~50' },
      { name: 'Special tiles', quantity: '~10' },
      { name: 'Resource cubes', quantity: '200+' },
      { name: 'Player markers', quantity: '5' },
    ],
    firstPlayerRule: 'The player with the highest Corporate Era corporation number goes first (or choose randomly for beginners).',
    quickTips: [
      'Focus on increasing your Terraform Rating (TR) - it gives income AND victory points',
      'Balance resource production with playing project cards',
      'Don\'t ignore milestones and awards - they can swing the game',
    ],
  },
  splendor: {
    playerSetup: [
      {
        title: 'Choose seating',
        description: 'Players sit around the table. No individual player pieces needed.',
      },
    ],
    boardSetup: [
      {
        title: 'Shuffle development cards',
        description: 'Separate cards by level (Level 1/green backs, Level 2/yellow, Level 3/blue). Shuffle each deck.',
      },
      {
        title: 'Deal face-up cards',
        description: 'Reveal 4 cards from each level in a row. Level 1 at the bottom, Level 3 at top.',
        tip: 'Leave room between rows for remaining decks.',
      },
      {
        title: 'Set out gem tokens',
        description: 'For 4 players: 7 of each gem color. For 3 players: 5 each. For 2 players: 4 each. Always 5 gold tokens.',
      },
      {
        title: 'Reveal noble tiles',
        description: 'Shuffle noble tiles and reveal equal to players + 1 (5 for 4 players, 4 for 3, 3 for 2).',
      },
    ],
    componentChecklist: [
      { name: 'Development cards (Level 1)', quantity: '40' },
      { name: 'Development cards (Level 2)', quantity: '30' },
      { name: 'Development cards (Level 3)', quantity: '20' },
      { name: 'Noble tiles', quantity: '10' },
      { name: 'Emerald tokens (green)', quantity: '7' },
      { name: 'Diamond tokens (white)', quantity: '7' },
      { name: 'Sapphire tokens (blue)', quantity: '7' },
      { name: 'Onyx tokens (black)', quantity: '7' },
      { name: 'Ruby tokens (red)', quantity: '7' },
      { name: 'Gold tokens (joker)', quantity: '5' },
    ],
    firstPlayerRule: 'The youngest player goes first, then play continues clockwise.',
    quickTips: [
      'Cards give permanent gem discounts - build your engine early',
      'Watch what gems opponents are collecting',
      'Gold tokens are wild and valuable for key purchases',
    ],
  },
  pandemic: {
    playerSetup: [
      {
        title: 'Choose roles',
        description: 'Shuffle role cards and deal 1 to each player. Each role has unique abilities.',
        tip: 'For first game, deal 2 roles per player and let them choose.',
      },
      {
        title: 'Take role pawn',
        description: 'Each player takes the pawn matching their role card color.',
      },
      {
        title: 'Deal player cards',
        description: '4 players: 2 cards each. 3 players: 3 cards. 2 players: 4 cards.',
      },
      {
        title: 'Place pawns in Atlanta',
        description: 'All players start at the Atlanta research station.',
      },
    ],
    boardSetup: [
      {
        title: 'Place research station',
        description: 'Place one research station in Atlanta on the game board.',
      },
      {
        title: 'Set infection rate',
        description: 'Place marker on the "2" space of the infection rate track.',
      },
      {
        title: 'Set outbreak marker',
        description: 'Place marker on the "0" space of the outbreak track.',
      },
      {
        title: 'Place cure markers',
        description: 'Place the 4 cure markers (vial side up) near the cure indicators.',
      },
      {
        title: 'Set up infection deck',
        description: 'Shuffle infection cards. Draw and infect 3 cities with 3 cubes, 3 cities with 2 cubes, 3 cities with 1 cube.',
        tip: 'Use matching color cubes for each city.',
      },
      {
        title: 'Add epidemic cards',
        description: 'Divide player draw pile into equal piles (4/5/6 for easy/medium/hard). Add 1 epidemic card to each pile, shuffle each, stack.',
      },
    ],
    componentChecklist: [
      { name: 'Disease cubes (each color)', quantity: '24 x 4 colors' },
      { name: 'Research stations', quantity: '6' },
      { name: 'Infection cards', quantity: '48' },
      { name: 'Player cards', quantity: '59' },
      { name: 'Epidemic cards', quantity: '6' },
      { name: 'Role cards', quantity: '7' },
      { name: 'Cure markers', quantity: '4' },
      { name: 'Player pawns', quantity: '7' },
    ],
    firstPlayerRule: 'The player with the highest city population on a player card goes first.',
    quickTips: [
      'This is cooperative - discuss strategy openly',
      'Prevent outbreaks by treating clusters early',
      'Share knowledge at research stations to find cures faster',
    ],
  },
  carcassonne: {
    playerSetup: [
      {
        title: 'Choose colors',
        description: 'Each player picks a color and takes all 7 meeples of that color.',
      },
      {
        title: 'Keep 1 meeple for scoring',
        description: 'Place 1 meeple on the "0" space of the score track. Use remaining 6 for placement.',
      },
    ],
    boardSetup: [
      {
        title: 'Place starting tile',
        description: 'Find the starting tile (darker back or marked) and place face-up in center of table.',
      },
      {
        title: 'Shuffle remaining tiles',
        description: 'Shuffle all other tiles face-down. Create several stacks for easy access.',
        tip: 'River expansion tiles should be placed first if included.',
      },
      {
        title: 'Set up scoring track',
        description: 'Place the scoreboard where all players can reach it.',
      },
    ],
    componentChecklist: [
      { name: 'Land tiles', quantity: '72 (including start)' },
      { name: 'Meeples per player', quantity: '7' },
      { name: 'Scoring track', quantity: '1' },
      { name: 'Rule summary cards', quantity: '5' },
    ],
    firstPlayerRule: 'The youngest player goes first, then play continues clockwise.',
    quickTips: [
      'Save some meeples - you can\'t place if you have none',
      'Fields lock meeples until game end but score big',
      'Complete features quickly to get meeples back',
    ],
  },
  '7-wonders': {
    playerSetup: [
      {
        title: 'Deal wonder boards',
        description: 'Shuffle and deal 1 wonder board to each player, or let players choose.',
        tip: 'A/B sides have different powers. Use A side for first game.',
      },
      {
        title: 'Take coins',
        description: 'Each player takes 3 coins (value 1) from the bank.',
      },
      {
        title: 'Note your neighbors',
        description: 'Players to your immediate left and right are your neighbors for trading and military.',
      },
    ],
    boardSetup: [
      {
        title: 'Separate cards by age',
        description: 'Sort cards into Age I, II, and III piles (check card backs).',
      },
      {
        title: 'Adjust for player count',
        description: 'Some cards have player count symbols. Remove cards requiring more players than you have.',
      },
      {
        title: 'Prepare Guild cards (Age III)',
        description: 'Shuffle purple Guild cards. Add players + 2 to Age III deck (7 for 5 players, etc.).',
      },
      {
        title: 'Shuffle each age deck',
        description: 'Shuffle Age I, II, and III separately. Set II and III aside.',
      },
      {
        title: 'Deal Age I cards',
        description: 'Deal 7 Age I cards to each player.',
      },
      {
        title: 'Set up conflict tokens',
        description: 'Place -1 tokens nearby. Separate +1, +3, +5 tokens by age.',
      },
    ],
    componentChecklist: [
      { name: 'Wonder boards', quantity: '7' },
      { name: 'Age I cards', quantity: '49' },
      { name: 'Age II cards', quantity: '49' },
      { name: 'Age III cards', quantity: '50' },
      { name: 'Guild cards (purple)', quantity: '10' },
      { name: 'Conflict tokens', quantity: '46' },
      { name: 'Coins (value 1)', quantity: '46' },
      { name: 'Coins (value 3)', quantity: '24' },
    ],
    firstPlayerRule: 'The player who most recently visited an ancient monument goes first (or choose randomly).',
    quickTips: [
      'Resources from neighbors cost 2 coins each',
      'Build chains - some cards let you build later cards free',
      'Watch military - losing costs -1 each age',
    ],
  },
  dominion: {
    playerSetup: [
      {
        title: 'Take starting cards',
        description: 'Each player takes 7 Copper cards and 3 Estate cards.',
      },
      {
        title: 'Shuffle your deck',
        description: 'Shuffle your 10 cards and place them face-down as your draw deck.',
      },
      {
        title: 'Draw starting hand',
        description: 'Draw 5 cards from your deck to form your starting hand.',
      },
    ],
    boardSetup: [
      {
        title: 'Set out Treasure cards',
        description: 'Place Copper (60), Silver (40), and Gold (30) in separate piles.',
        tip: 'Return unused starting Coppers to the pile.',
      },
      {
        title: 'Set out Victory cards',
        description: 'For 2 players: 8 of each. For 3-4 players: 12 of each Estate, Duchy, Province.',
      },
      {
        title: 'Set out Curse cards',
        description: 'Use 10 Curses per player beyond the first (10/20/30 for 2/3/4 players).',
      },
      {
        title: 'Choose 10 Kingdom cards',
        description: 'Randomly select 10 different Kingdom card piles for this game.',
        tip: 'Use recommended sets for your first games.',
      },
      {
        title: 'Set Kingdom pile quantities',
        description: '10 copies of each Kingdom card (12 for Victory Kingdom cards).',
      },
      {
        title: 'Create play area',
        description: 'Each player needs space for draw deck, discard pile, and cards in play.',
      },
    ],
    componentChecklist: [
      { name: 'Copper cards', quantity: '60' },
      { name: 'Silver cards', quantity: '40' },
      { name: 'Gold cards', quantity: '30' },
      { name: 'Estate cards', quantity: '24' },
      { name: 'Duchy cards', quantity: '12' },
      { name: 'Province cards', quantity: '12' },
      { name: 'Curse cards', quantity: '30' },
      { name: 'Kingdom card sets', quantity: '25 different' },
      { name: 'Trash pile card', quantity: '1' },
    ],
    firstPlayerRule: 'The player who most recently shuffled a deck of cards goes first (or choose randomly).',
    quickTips: [
      'Action, Buy, Cleanup - remember the turn phases',
      'Treasure cards go in your deck, not in the supply permanently',
      'Trashing is powerful - smaller decks are faster',
    ],
  },
  'king-of-tokyo': {
    playerSetup: [
      {
        title: 'Choose a monster',
        description: 'Each player picks a monster and takes the matching figure and monster board.',
      },
      {
        title: 'Set dials',
        description: 'Set your life dial to 10 hearts and your victory point dial to 0.',
      },
    ],
    boardSetup: [
      {
        title: 'Place Tokyo board',
        description: 'Put the Tokyo board in the center. No one starts in Tokyo.',
        tip: 'With 5-6 players, use both Tokyo City and Tokyo Bay spaces.',
      },
      {
        title: 'Shuffle Power cards',
        description: 'Shuffle all Power cards and place the deck face-down.',
      },
      {
        title: 'Reveal 3 Power cards',
        description: 'Draw and reveal 3 Power cards face-up next to the deck.',
      },
      {
        title: 'Prepare energy cubes',
        description: 'Place all green energy cubes in a supply pile.',
      },
      {
        title: 'Get dice ready',
        description: 'Place all 6 black dice where all players can reach them.',
        tip: 'Green dice are from expansions - don\'t use in base game.',
      },
    ],
    componentChecklist: [
      { name: 'Monster figures', quantity: '6' },
      { name: 'Monster boards', quantity: '6' },
      { name: 'Tokyo board', quantity: '1' },
      { name: 'Black dice', quantity: '6' },
      { name: 'Green dice (expansion)', quantity: '2' },
      { name: 'Power cards', quantity: '66' },
      { name: 'Energy cubes', quantity: '50+' },
    ],
    firstPlayerRule: 'The player who most recently saw a monster movie goes first.',
    quickTips: [
      'In Tokyo, you deal damage to ALL other players',
      'You cannot heal while in Tokyo',
      'Yield when low on health - discretion is valor',
    ],
  },
  'sushi-go': {
    playerSetup: [
      {
        title: 'Determine player count',
        description: 'Sushi Go! plays 2-5 players. Card deal varies by count.',
      },
    ],
    boardSetup: [
      {
        title: 'Shuffle all cards',
        description: 'Combine and shuffle all 108 cards into one deck.',
      },
      {
        title: 'Deal cards',
        description: '2 players: 10 cards each. 3 players: 9 cards. 4 players: 8 cards. 5 players: 7 cards.',
        tip: 'Remaining cards are not used this round.',
      },
      {
        title: 'Prepare scoring',
        description: 'Get paper and pencil ready for scoring, or use an app.',
      },
    ],
    componentChecklist: [
      { name: 'Tempura cards', quantity: '14' },
      { name: 'Sashimi cards', quantity: '14' },
      { name: 'Dumpling cards', quantity: '14' },
      { name: 'Maki Roll cards (1/2/3)', quantity: '12/8/6' },
      { name: 'Nigiri cards (egg/salmon/squid)', quantity: '5/10/5' },
      { name: 'Wasabi cards', quantity: '6' },
      { name: 'Chopsticks cards', quantity: '4' },
      { name: 'Pudding cards', quantity: '10' },
    ],
    firstPlayerRule: 'All players act simultaneously - no turn order needed!',
    quickTips: [
      'Keep puddings for end-game scoring',
      'Wasabi triples the next nigiri played on it',
      'Watch what opponents need to deny their sets',
    ],
  },
  'love-letter': {
    playerSetup: [
      {
        title: 'Determine player count',
        description: 'Love Letter plays 2-6 players. Gameplay adjusts slightly for 2 players.',
      },
      {
        title: 'Take reference cards (optional)',
        description: 'Each player may take a card reference guide if available.',
      },
    ],
    boardSetup: [
      {
        title: 'Shuffle the deck',
        description: 'Shuffle all 16 cards thoroughly.',
      },
      {
        title: 'Remove hidden card',
        description: 'Take the top card and set it aside face-down. This card is out of the round.',
        tip: 'This hidden card creates uncertainty about what\'s in play.',
      },
      {
        title: '2-player variant',
        description: 'With 2 players only: also remove 3 cards face-up from the deck.',
      },
      {
        title: 'Deal starting hands',
        description: 'Deal 1 card to each player. This is your starting hand.',
      },
      {
        title: 'Prepare tokens',
        description: 'Place tokens of affection (red cubes) in the center.',
        tip: 'Win tokens = 7 (2 players), 5 (3), 4 (4), 3 (5-6).',
      },
    ],
    componentChecklist: [
      { name: 'Guard cards (1)', quantity: '5' },
      { name: 'Priest cards (2)', quantity: '2' },
      { name: 'Baron cards (3)', quantity: '2' },
      { name: 'Handmaid cards (4)', quantity: '2' },
      { name: 'Prince cards (5)', quantity: '2' },
      { name: 'King card (6)', quantity: '1' },
      { name: 'Countess card (7)', quantity: '1' },
      { name: 'Princess card (8)', quantity: '1' },
      { name: 'Tokens of affection', quantity: '13' },
      { name: 'Reference cards', quantity: '4' },
    ],
    firstPlayerRule: 'The player who most recently went on a date goes first.',
    quickTips: [
      'Track which cards have been played',
      'The Princess is worth 8 points but risky to hold',
      'Handmaid gives you a safe turn but reveals weakness',
    ],
  },
  'the-crew': {
    playerSetup: [
      {
        title: 'Open mission book',
        description: 'Choose your current mission. Start with Mission 1 for first-time players.',
      },
      {
        title: 'Understand communication limits',
        description: 'Each player gets ONE communication token for the entire mission.',
        tip: 'Communication is very limited - plan carefully!',
      },
    ],
    boardSetup: [
      {
        title: 'Separate card types',
        description: 'There are 4 colored suits (1-9) and rockets (1-4 trump).',
      },
      {
        title: 'Deal all cards',
        description: 'Shuffle and deal ALL 40 cards evenly to players.',
        tip: '3 players: 13/13/14 cards. 4 players: 10 each. 5 players: 8 each.',
      },
      {
        title: 'Identify Commander',
        description: 'Whoever has the 4 of rockets is the Commander and leads the first trick.',
      },
      {
        title: 'Draw task cards',
        description: 'Check the mission for how many task cards to draw and how to distribute.',
      },
      {
        title: 'Set up task tokens (if needed)',
        description: 'Some missions use numbered tokens (1-5) or omega tokens for task order.',
      },
    ],
    componentChecklist: [
      { name: 'Large cards (color suits 1-9)', quantity: '36' },
      { name: 'Large cards (rockets 1-4)', quantity: '4' },
      { name: 'Task cards', quantity: '36' },
      { name: 'Communication tokens', quantity: '5' },
      { name: 'Task tokens (numbered)', quantity: '5' },
      { name: 'Task token (omega)', quantity: '1' },
      { name: 'Distress signal token', quantity: '1' },
      { name: 'Mission logbook', quantity: '1' },
    ],
    firstPlayerRule: 'The Commander (holder of the 4 of rockets) leads the first trick.',
    quickTips: [
      'Rockets are trump and always win if played',
      'Communication: place 1 card face-up with token showing highest/lowest/only',
      'Discuss strategy before dealing, not during play',
    ],
  },
  cascadia: {
    playerSetup: [
      {
        title: 'Take starting tile',
        description: 'Each player takes 1 random starting habitat tile and places it in front of them.',
      },
      {
        title: 'Take nature tokens',
        description: 'Each player takes 3 nature tokens (pine cones).',
        tip: 'Nature tokens let you break the normal drafting rules.',
      },
    ],
    boardSetup: [
      {
        title: 'Shuffle habitat tiles',
        description: 'Shuffle all habitat tiles face-down and stack them.',
      },
      {
        title: 'Create tile display',
        description: 'Reveal 4 tiles in a row - these are available for drafting.',
      },
      {
        title: 'Prepare wildlife tokens',
        description: 'Place all wildlife tokens in the cloth bag and mix.',
      },
      {
        title: 'Create token display',
        description: 'Draw 4 tokens and place one below each tile to form pairs.',
      },
      {
        title: 'Choose scoring cards',
        description: 'Pick one scoring card for each wildlife type (A, B, C, or D sets).',
        tip: 'Use all A cards for your first game.',
      },
      {
        title: 'Set aside nature token supply',
        description: 'Place remaining nature tokens where all can reach.',
      },
    ],
    componentChecklist: [
      { name: 'Habitat tiles', quantity: '85' },
      { name: 'Wildlife tokens (5 types)', quantity: '100' },
      { name: 'Nature tokens', quantity: '25' },
      { name: 'Wildlife scoring cards', quantity: '20' },
      { name: 'Starting habitat tiles', quantity: '5' },
      { name: 'Cloth bag', quantity: '1' },
      { name: 'Scoring pad', quantity: '1' },
    ],
    firstPlayerRule: 'The player who most recently took a hike in nature goes first.',
    quickTips: [
      'Study the scoring cards carefully before starting',
      'Nature tokens give flexibility - use them wisely',
      'Habitat corridors score big bonuses at game end',
    ],
  },
}

// Default setup content
const defaultSetupContent: LegacySetupContent = {
  playerSetup: [
    { title: 'Choose colors', description: 'Each player selects their color and takes matching pieces.' },
    { title: 'Deal starting cards', description: 'See rulebook for player-specific setup.' },
  ],
  boardSetup: [
    { title: 'Set up game board', description: 'Follow rulebook instructions for board configuration.' },
  ],
  componentChecklist: [
    { name: 'See rulebook for full component list', quantity: '-' },
  ],
  firstPlayerRule: 'Determine the starting player according to the rulebook.',
  quickTips: ['Refer to the official rulebook for detailed setup instructions.'],
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game || !game.has_setup_guide) {
    notFound()
  }

  // Prefer database content, fall back to hardcoded content
  const content: SetupContent = (game.setup_content as unknown as SetupContent) || setupContent[game.slug] || defaultSetupContent
  const isAI = isAIContent(content)

  // Get component list based on content type
  const componentList = isAI
    ? (content as AISetupContent).components.map(c => ({ name: c.name, quantity: c.quantity }))
    : (content as LegacySetupContent).componentChecklist

  // Get tips based on content type
  const tips = isAI
    ? (content as AISetupContent).commonMistakes
    : (content as LegacySetupContent).quickTips

  // Get first player rule (handle both old and new field names)
  const firstPlayerRule = isAI
    ? ((content as AISetupContent).firstPlayerRule || (content as AISetupContent).firstPlayer)
    : (content as LegacySetupContent).firstPlayerRule

  // Get setup tips (AI content only) - can be in either quickTips or setupTips field
  const setupTips = isAI
    ? ((content as AISetupContent).quickTips || (content as AISetupContent).setupTips)
    : undefined

  return (
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
          <span className="text-foreground">Setup</span>
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
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {game.name} Setup Guide
            </h1>
            <p className="text-muted-foreground">
              {isAI ? (content as AISetupContent).overview : 'Step-by-step checklist to get playing quickly'}
            </p>
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
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Content - Before You Start */}
          {isAI && (content as AISetupContent).beforeYouStart && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Before You Start</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(content as AISetupContent).beforeYouStart!.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Setup Steps */}
          {isAI ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Setup Steps</h2>
              <div className="space-y-4">
                {(content as AISetupContent).steps.map((step, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {step.step}
                        </span>
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.instruction}</p>
                      {step.tip && (
                        <p className="text-sm text-primary mt-2">💡 {step.tip}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Player Setup */}
              {(content as AISetupContent).playerSetup && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Player Setup</h2>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        {(content as AISetupContent).playerSetup.description}
                      </p>
                      <ul className="space-y-1">
                        {(content as AISetupContent).playerSetup.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* First Player */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">First Player</h2>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{firstPlayerRule}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Legacy content - Interactive Setup Checklists */
            <SetupChecklist
              playerSetup={(content as LegacySetupContent).playerSetup}
              boardSetup={(content as LegacySetupContent).boardSetup}
              firstPlayerRule={(content as LegacySetupContent).firstPlayerRule}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Component Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Component Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {componentList.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Setup Tips - AI content only */}
          {setupTips && setupTips.length > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Setup Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {setupTips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-600">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips / Common Mistakes */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">{isAI ? 'Common Mistakes' : 'Quick Tips'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tips.map((tip, i) => (
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
              {game.has_rules && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/games/${game.slug}/rules`}>
                    Rules Summary
                  </Link>
                </Button>
              )}
              {game.has_score_sheet && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/games/${game.slug}/score-sheet`}>
                    Score Sheet
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
  )
}
