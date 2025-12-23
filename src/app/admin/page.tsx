import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getQueueStats } from '@/lib/bgg'
import { getGenerationStats } from '@/lib/ai'

async function getGameStats() {
  const supabase = await createClient()

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
  const supabase = await createClient()

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Content pipeline overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published Games</CardDescription>
            <CardTitle className="text-3xl">{gameStats?.published || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Live on the site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft Games</CardDescription>
            <CardTitle className="text-3xl">{gameStats?.draft || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ready for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Import Queue</CardDescription>
            <CardTitle className="text-3xl">{queueStats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Pending BGG imports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Generation Cost</CardDescription>
            <CardTitle className="text-3xl">${generationStats.totalCost.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {generationStats.successfulGenerations} successful generations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Queue Status</CardTitle>
            <CardDescription>BGG game import pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{queueStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Importing</span>
                <span className="font-medium">{queueStats.importing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Imported</span>
                <span className="font-medium">{queueStats.imported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed</span>
                <span className="font-medium text-destructive">{queueStats.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Generation</CardTitle>
            <CardDescription>AI content pipeline stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Generations</span>
                <span className="font-medium">{generationStats.totalGenerations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Successful</span>
                <span className="font-medium text-green-600">{generationStats.successfulGenerations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed</span>
                <span className="font-medium text-destructive">{generationStats.failedGenerations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tokens</span>
                <span className="font-medium">{generationStats.totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
          <CardDescription>Latest games in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{game.name}</p>
                  <p className="text-xs text-muted-foreground">{game.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      game.is_published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : game.content_status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {game.is_published ? 'Published' : game.content_status || 'No content'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
