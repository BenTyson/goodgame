import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  FileEdit,
  ArrowRight,
  ChevronRight,
  Cog,
  Package,
  BookOpen,
  Wand2,
  Sparkles,
} from 'lucide-react'

async function getGameStats() {
  const supabase = createAdminClient()

  // Get game counts with content fields
  const { data: games } = await supabase
    .from('games')
    .select('is_published, content_status, crunch_score, rulebook_url, rules_content, puffin_content')

  if (!games) return null

  const published = games.filter(g => g.is_published).length
  const draft = games.filter(g => g.content_status === 'draft').length
  const review = games.filter(g => g.content_status === 'review').length
  const needsContent = games.filter(g => !g.is_published && (!g.content_status || g.content_status === 'none')).length
  const total = games.length

  // Content pipeline stats
  const withCrunchScore = games.filter(g => g.crunch_score != null).length
  const withRulebook = games.filter(g => g.rulebook_url).length
  const withRulesContent = games.filter(g => g.rules_content).length
  const withPuffinContent = games.filter(g => g.puffin_content != null).length

  return {
    published,
    draft,
    review,
    needsContent,
    total,
    withCrunchScore,
    withRulebook,
    withRulesContent,
    withPuffinContent,
  }
}

async function getRecentGames() {
  const supabase = createAdminClient()

  const { data: games } = await supabase
    .from('games')
    .select('id, name, slug, content_status, is_published, created_at, box_image_url, thumbnail_url, crunch_score')
    .order('created_at', { ascending: false })
    .limit(10)

  return games || []
}

export default async function AdminDashboard() {
  const [gameStats, recentGames] = await Promise.all([
    getGameStats(),
    getRecentGames(),
  ])

  const totalGames = gameStats?.total || 0
  const publishedPercent = totalGames > 0 ? Math.round(((gameStats?.published || 0) / totalGames) * 100) : 0
  const contentPercent = totalGames > 0 ? Math.round(((gameStats?.withRulesContent || 0) / totalGames) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Content pipeline overview</p>
        </div>
        <Link href="/admin/games">
          <Button size="sm">
            View All Games
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-3xl font-bold mt-1">{gameStats?.published || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {publishedPercent}% of {totalGames} games
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${publishedPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Review</p>
                <p className="text-3xl font-bold mt-1">{(gameStats?.draft || 0) + (gameStats?.review || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready for review</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileEdit className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Content</p>
                <p className="text-3xl font-bold mt-1">{gameStats?.needsContent || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting setup</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Have Rulebook</p>
                <p className="text-3xl font-bold mt-1">{gameStats?.withRulebook || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready for content</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Pipeline */}
      <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Content Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{gameStats?.withRulebook || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Have Rulebook</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{gameStats?.withRulesContent || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Have Content</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <div className="flex items-center justify-center gap-1">
                  <Cog className="h-4 w-4 text-amber-500" />
                  <p className="text-2xl font-bold">{gameStats?.withCrunchScore || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Crunch Score</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <p className="text-2xl font-bold">{gameStats?.withPuffinContent || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">AI Content</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${contentPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {contentPercent}% of games have generated content
            </p>
          </CardContent>
        </Card>

      {/* Recent Games - Cleaner list */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Recent Games</CardTitle>
            </div>
            <Link href="/admin/games">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y">
            {recentGames.map((game) => (
              <Link
                key={game.id}
                href={`/admin/games/${game.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-6 px-6 transition-colors group first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0 overflow-hidden">
                    {game.box_image_url || game.thumbnail_url ? (
                      <Image
                        src={game.box_image_url || game.thumbnail_url || ''}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      game.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {game.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {game.created_at ? new Date(game.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {game.crunch_score != null && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Cog className="h-3 w-3" />
                      {Number(game.crunch_score).toFixed(1)}
                    </div>
                  )}
                  <Badge
                    variant={game.is_published ? 'default' : 'outline'}
                    className={`text-xs ${game.is_published ? 'bg-green-600' : ''}`}
                  >
                    {game.is_published ? 'Published' : game.content_status === 'draft' ? 'Draft' : game.content_status === 'review' ? 'Review' : 'Setup'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {recentGames.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No games in the system yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
