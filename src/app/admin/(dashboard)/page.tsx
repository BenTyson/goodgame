import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getQueueStats } from '@/lib/bgg'
import { getGenerationStats } from '@/lib/ai'
import {
  CheckCircle2,
  FileEdit,
  Clock,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Database,
  Sparkles,
  AlertCircle,
  Loader2,
  Pencil
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
    .select('id, name, slug, content_status, is_published, created_at')
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Content pipeline overview and quick actions</p>
        </div>
        <Link href="/admin/games">
          <Button>
            View All Games
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium">Published</CardDescription>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gameStats?.published || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedPercent}% of total games
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500/20">
              <div className="h-full bg-green-500" style={{ width: `${publishedPercent}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium">Drafts</CardDescription>
            <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <FileEdit className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gameStats?.draft || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for review
            </p>
            {(gameStats?.draft || 0) > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500" />
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium">In Queue</CardDescription>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queueStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending BGG imports
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium">AI Cost</CardDescription>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${generationStats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {generationStats.successfulGenerations} generations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Import Queue</CardTitle>
            </div>
            <CardDescription>BGG game import pipeline status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold">{queueStats.pending}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                  <span className="text-sm">Importing</span>
                </div>
                <span className="font-semibold">{queueStats.importing}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Imported</span>
                </div>
                <span className="font-semibold">{queueStats.imported}</span>
              </div>
              {queueStats.failed > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="font-semibold text-destructive">{queueStats.failed}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Content Generation</CardTitle>
            </div>
            <CardDescription>AI-powered content creation stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Generations</span>
                </div>
                <span className="font-semibold">{generationStats.totalGenerations}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Successful</span>
                </div>
                <span className="font-semibold text-green-600">{generationStats.successfulGenerations}</span>
              </div>
              {generationStats.failedGenerations > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="font-semibold text-destructive">{generationStats.failedGenerations}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Total Tokens</span>
                </div>
                <span className="font-semibold">{generationStats.totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Latest additions to the system</CardDescription>
          </div>
          <Link href="/admin/games">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {recentGames.map((game) => (
              <Link
                key={game.id}
                href={`/admin/games/${game.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {game.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{game.name}</p>
                    <p className="text-xs text-muted-foreground">{game.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      game.is_published
                        ? 'bg-green-600 text-white dark:bg-green-600'
                        : game.content_status === 'draft'
                        ? 'bg-yellow-500 text-white dark:bg-yellow-600'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {game.is_published ? 'Published' : game.content_status || 'No content'}
                  </span>
                  <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {recentGames.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No games in the system yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
