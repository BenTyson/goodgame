import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tags,
  FolderTree,
  Cog,
  Wand2,
  Users,
  ChevronRight,
  Gamepad2,
  Gauge,
} from 'lucide-react'

async function getTaxonomyStats() {
  const supabase = createAdminClient()

  // Get category count and game links
  const { count: categoryCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })

  const { count: categoryLinksCount } = await supabase
    .from('game_categories')
    .select('*', { count: 'exact', head: true })

  // Get mechanics count and game links
  const { count: mechanicsCount } = await supabase
    .from('mechanics')
    .select('*', { count: 'exact', head: true })

  const { count: mechanicsLinksCount } = await supabase
    .from('game_mechanics')
    .select('*', { count: 'exact', head: true })

  // Get themes count and game links
  const { count: themesCount } = await supabase
    .from('themes')
    .select('*', { count: 'exact', head: true })

  const { count: themesLinksCount } = await supabase
    .from('game_themes')
    .select('*', { count: 'exact', head: true })

  // Get player experiences count and game links
  const { count: experiencesCount } = await supabase
    .from('player_experiences')
    .select('*', { count: 'exact', head: true })

  const { count: experiencesLinksCount } = await supabase
    .from('game_player_experiences')
    .select('*', { count: 'exact', head: true })

  // Get complexity tiers count and game links
  const { count: complexityCount } = await supabase
    .from('complexity_tiers')
    .select('*', { count: 'exact', head: true })

  const { count: complexityLinksCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .not('complexity_tier_id', 'is', null)

  // Get total published games
  const { count: gamesCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  return {
    categories: {
      count: categoryCount || 0,
      gameLinks: categoryLinksCount || 0,
    },
    mechanics: {
      count: mechanicsCount || 0,
      gameLinks: mechanicsLinksCount || 0,
    },
    themes: {
      count: themesCount || 0,
      gameLinks: themesLinksCount || 0,
    },
    experiences: {
      count: experiencesCount || 0,
      gameLinks: experiencesLinksCount || 0,
    },
    complexity: {
      count: complexityCount || 0,
      gameLinks: complexityLinksCount || 0,
    },
    totalGames: gamesCount || 0,
  }
}

export default async function TaxonomyOverviewPage() {
  const stats = await getTaxonomyStats()

  const taxonomyTypes = [
    {
      name: 'Categories',
      description: 'High-level game classifications (Strategy, Family, Party, etc.)',
      href: '/admin/taxonomy/categories',
      icon: FolderTree,
      count: stats.categories.count,
      gameLinks: stats.categories.gameLinks,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      name: 'Mechanics',
      description: 'Gameplay mechanisms (Worker Placement, Deck Building, etc.)',
      href: '/admin/taxonomy/mechanics',
      icon: Cog,
      count: stats.mechanics.count,
      gameLinks: stats.mechanics.gameLinks,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      name: 'Themes',
      description: 'Game settings and worlds (Fantasy, Sci-Fi, Historical, etc.)',
      href: '/admin/taxonomy/themes',
      icon: Wand2,
      count: stats.themes.count,
      gameLinks: stats.themes.gameLinks,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      name: 'Player Experiences',
      description: 'How players interact (Competitive, Cooperative, Solo, etc.)',
      href: '/admin/taxonomy/player-experiences',
      icon: Users,
      count: stats.experiences.count,
      gameLinks: stats.experiences.gameLinks,
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      name: 'Complexity Tiers',
      description: 'Weight-based classifications (Gateway, Family, Medium, Heavy, Expert)',
      href: '/admin/taxonomy/complexity',
      icon: Gauge,
      count: stats.complexity.count,
      gameLinks: stats.complexity.gameLinks,
      color: 'bg-rose-500/10 text-rose-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Tags className="h-8 w-8 text-primary" />
            Taxonomy
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage game classifications, mechanics, and tags
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-3xl font-bold">{stats.totalGames}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
              <Gamepad2 className="h-3.5 w-3.5" />
              published games
            </div>
          </div>
        </div>
      </div>

      {/* Taxonomy Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {taxonomyTypes.map((type) => (
          <Link key={type.name} href={type.href}>
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-lg ${type.color} flex items-center justify-center`}>
                    <type.icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {type.name}
                </CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    {type.count} {type.count === 1 ? 'tag' : 'tags'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {type.gameLinks} game assignments
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  )
}
