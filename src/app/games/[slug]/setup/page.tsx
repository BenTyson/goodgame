import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Boxes, ExternalLink, Users, Clock, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupChecklist } from '@/components/setup/SetupChecklist'
import { mockGames } from '@/data/mock-games'

interface SetupPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: SetupPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = mockGames.find((g) => g.slug === slug)

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
  return mockGames
    .filter((game) => game.has_setup_guide)
    .map((game) => ({
      slug: game.slug,
    }))
}

// Setup content for each game
const setupContent: Record<string, {
  playerSetup: { title: string; description: string; tip?: string }[]
  boardSetup: { title: string; description: string; tip?: string }[]
  componentChecklist: { name: string; quantity: string }[]
  firstPlayerRule: string
  quickTips: string[]
}> = {
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
}

// Default setup content
const defaultSetupContent = {
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
  const game = mockGames.find((g) => g.slug === slug)

  if (!game) {
    notFound()
  }

  if (!game.has_setup_guide) {
    notFound()
  }

  const content = setupContent[game.slug] || defaultSetupContent

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
              Step-by-step checklist to get playing quickly
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
          {/* Interactive Setup Checklists */}
          <SetupChecklist
            playerSetup={content.playerSetup}
            boardSetup={content.boardSetup}
            firstPlayerRule={content.firstPlayerRule}
          />
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
                {content.componentChecklist.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {content.quickTips.map((tip, i) => (
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
