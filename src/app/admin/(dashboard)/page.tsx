import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getQueueStats } from '@/lib/bgg'
import { getGenerationStats } from '@/lib/ai'
import {
  CheckCircle2,
  FileEdit,
  Clock,
  ArrowRight,
  Database,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Zap,
  Package
} from 'lucide-react'

async function getGameStats() {
  const supabase = createAdminClient()

  // Get total counts by status
  const { data: games } = await supabase
    .from('games')
    .select('is_published, content_status')

  if (!games) return null

  const published = games.filter(g => g.is_published).length
  const draft = games.filter(g => !g.is_published && g.content_status === 'draft').length
  const pending = games.filter(g => !g.is_published && g.content_status === 'none').length
  const total = games.length

  return { published, draft, pending, total }
}

async function getRecentGames() {
  const supabase = createAdminClient()

  const { data: games } = await supabase
    .from('games')
    .select('id, name, slug, content_status, is_published, created_at, box_image_url, thumbnail_url')
    .order('created_at', { ascending: false })
    .limit(10)

  return games || []
}

export default async function AdminDashboard() {
  const [gameStats, queueStats, generationStats, recentGames] = await Promise.all([
    getGameStats(),
    getQueueStats(),
    getGenerationStats(),
    getRecentGames(),
  ])

  const totalGames = gameStats?.total || 0
  const publishedPercent = totalGames > 0 ? Math.round(((gameStats?.published || 0) / totalGames) * 100) : 0

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

      {/* Stats Grid - Clean monochromatic design */}
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
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${publishedPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                <p className="text-3xl font-bold mt-1">{gameStats?.draft || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready for review</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <FileEdit className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Queue</p>
                <p className="text-3xl font-bold mt-1">{queueStats.pending}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending imports</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Generations</p>
                <p className="text-3xl font-bold mt-1">{generationStats.successfulGenerations}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${generationStats.totalCost.toFixed(2)} total cost
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status - Simplified */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Import Queue</CardTitle>
              </div>
              <Link href="/admin/queue">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View Queue
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{queueStats.pending}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{queueStats.importing}</p>
                <p className="text-xs text-muted-foreground mt-0.5">In Progress</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{queueStats.imported}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Complete</p>
              </div>
            </div>
            {queueStats.failed > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{queueStats.failed} failed imports</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">AI Generation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{generationStats.totalGenerations}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{generationStats.successfulGenerations}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Success</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{(generationStats.totalTokens / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tokens</p>
              </div>
            </div>
            {generationStats.failedGenerations > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{generationStats.failedGenerations} failed generations</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <Badge
                    variant={game.is_published ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {game.is_published ? 'Published' : game.content_status || 'No content'}
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
