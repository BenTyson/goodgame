import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, ExternalLink, Users, Clock, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { mockGames } from '@/data/mock-games'

interface RulesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: RulesPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = mockGames.find((g) => g.slug === slug)

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
  return mockGames
    .filter((game) => game.has_rules)
    .map((game) => ({
      slug: game.slug,
    }))
}

// Placeholder rules content - in production this would come from MDX files
const rulesContent: Record<string, {
  quickStart: string[]
  overview: string
  setup: string[]
  turnStructure: { title: string; description: string }[]
  scoring: { category: string; points: string }[]
  tips: string[]
}> = {
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
}

// Default content for games without specific rules
const defaultRulesContent = {
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
  const game = mockGames.find((g) => g.slug === slug)

  if (!game) {
    notFound()
  }

  if (!game.has_rules) {
    notFound()
  }

  const content = rulesContent[game.slug] || defaultRulesContent

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

          {/* Setup */}
          <div>
            <h2 className="text-xl font-bold mb-3">Setup</h2>
            <ol className="space-y-2">
              {content.setup.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

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
                      {phase.title}
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

          {/* Scoring */}
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
                    {content.scoring.map((item, i) => (
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
  )
}
